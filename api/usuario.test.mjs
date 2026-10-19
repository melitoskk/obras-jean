// Permissões e sessão (UPDATE.md §5). Se `autorizado` escorregar, o mestre de obras vê
// quanto a fase custou; se a sessão não cair, um usuário inativado continua entrando.
// Desde 19/10/2026 as permissões são do PERFIL (ou do usuário), não de um papel fixo.
//
//   docker compose run --rm api node --experimental-sqlite usuario.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db } = await import('./db.js')
const { autorizado, selo, abre, hashSenha, obrasVisiveis, podeObra, podeEditarPost, podeAnexo, podePasta, permissoesDe, normalizar, TODAS, obraDoPedido, exigirObra } = await import('./auth.js')
const { semAdmin } = await import('./rotas/usuario.js')

const id = (r) => Number(r.lastInsertRowid)
const perfil = (nome) => db.prepare('SELECT id FROM perfil WHERE nome = ?').get(nome).id
const usuario = (nome, nomePerfil) =>
  id(db.prepare('INSERT INTO usuario (nome, senha, perfil_id) VALUES (?,?,?)').run(nome, hashSenha('x'), perfil(nomePerfil)))
const linha = (uid) => db.prepare('SELECT id, senha, perfil_id, permissoes FROM usuario WHERE id = ?').get(uid)
const perms = (nomePerfil) => new Set(JSON.parse(db.prepare('SELECT permissoes FROM perfil WHERE nome = ?').get(nomePerfil).permissoes))
const ADMIN = perms('Administrador')
const ESCRITORIO = perms('Escritório')
const CAMPO = perms('Campo')

// 1. Semente: os três papéis de antes viram perfis, e o admin do primeiro run é Administrador.
assert.deepEqual(db.prepare('SELECT nome FROM perfil ORDER BY nome').all().map((p) => p.nome), ['Administrador', 'Campo', 'Escritório'])
assert.deepEqual([...permissoesDe(linha(db.prepare("SELECT id FROM usuario WHERE nome = 'admin'").get().id))], TODAS)

// 2. Administrador pode tudo, inclusive rota que não está na tabela; escritório tudo
// menos usuários e perfis.
assert.ok(autorizado(ADMIN, 'POST', '/api/usuarios'))
assert.ok(autorizado(ADMIN, 'GET', '/api/rota-que-ainda-nao-existe'))
assert.ok(!autorizado(ESCRITORIO, 'GET', '/api/rota-que-ainda-nao-existe'), 'rota nova nasce fechada')
assert.ok(autorizado(ESCRITORIO, 'GET', '/api/obra/1/fluxo'))
assert.ok(autorizado(ESCRITORIO, 'POST', '/api/saidas'))
for (const [m, p] of [['GET', '/api/usuarios'], ['PATCH', '/api/usuarios/2'], ['GET', '/api/perfis'], ['POST', '/api/perfis']]) {
  assert.ok(!autorizado(ESCRITORIO, m, p), `${m} ${p}`)
}

// 3. Campo: diário, galeria e a obra - e nenhuma rota de valor.
for (const [m, p] of [['GET', '/api/obras'], ['GET', '/api/obra/3'], ['POST', '/api/diario'],
  ['PATCH', '/api/diario/9'], ['DELETE', '/api/diario/9'], ['POST', '/api/arquivos'],
  ['DELETE', '/api/arquivos/4'], ['POST', '/api/anexos'], ['GET', '/api/anexo/1-a__f.jpg']]) {
  assert.ok(autorizado(CAMPO, m, p), `${m} ${p}`)
}
for (const [m, p] of [['GET', '/api/obra/3/fluxo'], ['GET', '/api/obra/3/export.csv'], ['GET', '/api/obra/3/visao'],
  ['GET', '/api/orcamentos'], ['GET', '/api/orcamento/1'], ['POST', '/api/saidas'],
  ['POST', '/api/entradas'], ['GET', '/api/fornecedores'], ['GET', '/api/fornecedores/1/extrato'],
  ['GET', '/api/clientes'], ['PATCH', '/api/obras/3'], ['POST', '/api/obras'],
  ['PATCH', '/api/fases/1'], ['GET', '/api/usuarios'], ['GET', '/api/insumos'], ['GET', '/api/relatorios/pagamentos']]) {
  assert.ok(!autorizado(CAMPO, m, p), `${m} ${p}`)
}
// Sem permissão nenhuma só se vê a lista de obras (vazia, sem `todas_obras`).
assert.ok(!autorizado(new Set(), 'POST', '/api/diario'))

// 3b. Perfil montado: quem só lança. Lançar puxa ver valores; não mexe em cadastro, mas
// cria o fornecedor na hora e ensina o preço.
const lancador = new Set(normalizar(['lancar']))
assert.deepEqual([...lancador], ['ver_valores', 'lancar'])
assert.ok(autorizado(lancador, 'POST', '/api/saidas'))
assert.ok(autorizado(lancador, 'POST', '/api/fornecedores'))
assert.ok(autorizado(lancador, 'PUT', '/api/fornecedores/3/vinculos'))
assert.ok(!autorizado(lancador, 'PATCH', '/api/fornecedores/3'))
assert.ok(!autorizado(lancador, 'PUT', '/api/orcamento/1/servicos'))
assert.deepEqual(normalizar(['inventada', 'diario']), ['diario'], 'id fora do catálogo não entra')

// 3c. Permissões próprias valem no lugar das do perfil.
const zeca = usuario('Zeca', 'Campo')
db.prepare('UPDATE usuario SET permissoes = ? WHERE id = ?').run(JSON.stringify(['diario', 'documentos']), zeca)
assert.deepEqual([...permissoesDe(linha(zeca))], ['diario', 'documentos'])

// 4. Sessão: o selo abre enquanto a senha e o ativo não mudam.
const ana = usuario('Ana', 'Campo')
const cookie = selo(linha(ana))
assert.equal(abre(cookie)?.nome, 'Ana')
assert.equal(abre(`${ana}.adulterado`), null)
assert.equal(abre('admin.qualquer'), null) // formato antigo (por nome) não abre
db.prepare('UPDATE usuario SET nome = ? WHERE id = ?').run('Ana Paula', ana)
assert.equal(abre(cookie)?.nome, 'Ana Paula') // renomear não derruba
db.prepare('UPDATE usuario SET senha = ? WHERE id = ?').run(hashSenha('nova'), ana)
assert.equal(abre(cookie), null) // trocar a senha derruba
const novo = selo(linha(ana))
db.prepare('UPDATE usuario SET ativo = 0 WHERE id = ?').run(ana)
assert.equal(abre(novo), null) // inativar derruba
db.prepare('UPDATE usuario SET ativo = 1 WHERE id = ?').run(ana)

// 5. Obras: sem `todas_obras`, só as atribuídas; com ela, todas (null).
const obra = (nome) => id(db.prepare("INSERT INTO obra (nome, criada_em) VALUES (?, '2026-10-03')").run(nome))
const casa = obra('Casa')
const predio = obra('Prédio')
db.prepare('INSERT INTO usuario_obra (usuario_id, obra_id) VALUES (?,?)').run(ana, casa)
const req = { permissoes: CAMPO, usuarioId: ana }
assert.deepEqual([...obrasVisiveis(req)], [casa])
assert.ok(podeObra(req, casa))
assert.ok(podeObra(req, String(casa))) // obra_id do corpo pode vir como texto
assert.ok(!podeObra(req, predio))
const beto = usuario('Beto', 'Escritório')
const escr = { permissoes: ESCRITORIO, usuarioId: beto }
assert.equal(obrasVisiveis(escr), null)
assert.ok(podeObra(escr, predio))

// 5b. Diário (Dúvida 20) e arquivo: o autor edita e exclui; quem tem `editar_de_outros`, qualquer um.
// Autoria pelo ID - renomear o usuário não tira dele os próprios posts.
assert.ok(podeEditarPost(req, { autor_id: req.usuarioId }))
assert.ok(!podeEditarPost(req, { autor_id: beto }))
assert.ok(!podeEditarPost(req, { autor_id: null })) // post antigo sem dono
assert.ok(podeEditarPost(escr, { autor_id: req.usuarioId }))
assert.ok(db.prepare('PRAGMA table_info(arquivo)').all().some((c) => c.name === 'autor_id'))

// 5c. Pasta: Documentos (contrato, cronograma) só com `documentos` (Jean, 19/10/2026).
assert.ok(podePasta(req, 'fotos') && podePasta(req, 'projetos') && podePasta(req, 'dia_a_dia'))
assert.ok(!podePasta(req, 'documentos'))
assert.ok(podePasta(escr, 'documentos'))

// 5d. Anexo (rodada 2, A18): a rota é de todos, mas o arquivo tem dono. O campo abre só
// galeria/diário das obras dele numa pasta que pode ver, ou a capa; nota de saída nunca.
const arq = (obraId, ref, pasta = 'fotos') =>
  db.prepare("INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em) VALUES (?, ?, 'f', ?, '2026-10-03')").run(obraId, pasta, ref)
arq(casa, '1-a__casa.jpg')
arq(predio, '2-b__predio.jpg')
arq(casa, '5-e__contrato.pdf', 'documentos')
db.prepare('UPDATE obra SET foto = ? WHERE id = ?').run('3-c__capa.jpg', casa)
const fase = id(db.prepare("INSERT INTO fase (obra_id, nome, ordem) VALUES (?, 'F', 1)").run(casa))
db.prepare("INSERT INTO saida (fase_id, valor, data, anexo) VALUES (?, 100, '2026-10-03', '4-d__nota.pdf')").run(fase)
assert.ok(podeAnexo(req, '1-a__casa.jpg'))
assert.ok(podeAnexo(req, '3-c__capa.jpg'))
assert.ok(!podeAnexo(req, '2-b__predio.jpg')) // outra obra
assert.ok(!podeAnexo(req, '4-d__nota.pdf')) // nota fiscal de saída: é dinheiro
assert.ok(!podeAnexo(req, '5-e__contrato.pdf')) // Documentos
assert.ok(podeAnexo(escr, '4-d__nota.pdf'))
assert.ok(podeAnexo(escr, '5-e__contrato.pdf'))
// Recém-enviado (nada aponta pra ele ainda): abre pra quem pode enviar, não pra quem não pode.
assert.ok(podeAnexo(req, '9-z__solto.jpg'))
assert.ok(!podeAnexo({ permissoes: new Set(), usuarioId: ana }, '9-z__solto.jpg'))

// 5e. Obra do pedido (19/10/2026): quem não vê todas as obras não alcança a dos outros
// por nenhuma rota - nem as de dinheiro, que antes só o campo deixava de alcançar.
assert.equal(obraDoPedido({ path: `/api/obra/${predio}/fluxo` }), predio)
assert.equal(obraDoPedido({ path: `/api/obras/${casa}` }), casa)
assert.equal(obraDoPedido({ path: '/api/relatorios/estimado', query: { obra: String(predio) } }), predio)
assert.equal(obraDoPedido({ path: '/api/saidas', body: { fase_id: fase } }), casa)
assert.equal(obraDoPedido({ path: `/api/fases/${fase}` }), casa)
assert.equal(obraDoPedido({ path: '/api/relatorios/pagamentos' }), 'todas')
assert.equal(obraDoPedido({ path: '/api/relatorios/contas-a-pagar' }), null, 'esta recorta sozinha')
assert.equal(obraDoPedido({ path: '/api/fornecedores/3/extrato' }), 'todas')
assert.equal(obraDoPedido({ path: '/api/insumos' }), null)
const pend = id(db.prepare("INSERT INTO pendencia (obra_id, texto, criado_em) VALUES (?, 'impermeabilizante', '2026-10-19')").run(predio))
assert.equal(obraDoPedido({ path: `/api/pendencias/${pend}` }), predio, 'pendência de outra obra também é barrada')
assert.ok(autorizado(CAMPO, 'POST', '/api/pendencias') && !autorizado(new Set(['ver_valores']), 'POST', '/api/pendencias'))
const resposta = () => { const r = { status: (c) => { r.code = c; return r }, json: () => r }; return r }
const passa = (req) => { let ok = false; const r = resposta(); exigirObra(req, r, () => { ok = true }); return ok || r.code }
const leitor = { permissoes: new Set(['ver_valores']), usuarioId: ana } // vê valores, só a Casa
assert.equal(passa({ ...leitor, path: `/api/obra/${casa}/fluxo` }), true)
assert.equal(passa({ ...leitor, path: `/api/obra/${predio}/fluxo` }), 404)
assert.equal(passa({ ...leitor, path: '/api/relatorios/pagamentos', query: {} }), true, 'passa: a rota recorta pelas obras dele (rodada 4, A15)')
assert.equal(passa({ ...escr, path: '/api/relatorios/pagamentos', query: {} }), true)

// 6. Sem ninguém ativo que cadastre usuários o sistema trava - a rota desfaz quando isso acontece.
assert.ok(!semAdmin())
db.prepare("UPDATE usuario SET ativo = 0 WHERE nome = 'admin'").run()
assert.ok(semAdmin())
// Volta a ter quem cadastre: o Beto (Escritório) ganha `usuarios` nas permissões dele.
db.prepare('UPDATE usuario SET permissoes = ? WHERE id = ?').run(JSON.stringify([...ESCRITORIO, 'usuarios']), beto)
assert.ok(!semAdmin())

rmSync(dir, { recursive: true, force: true })
console.log('usuario.test: ok')

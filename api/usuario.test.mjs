// Papéis e sessão (UPDATE.md §5). Se `autorizado` escorregar, o campo vê quanto a fase
// custou; se a sessão não cair, um usuário inativado continua entrando.
//
//   docker compose run --rm api node --experimental-sqlite usuario.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db } = await import('./db.js')
const { autorizado, selo, abre, hashSenha, obrasVisiveis, podeObra, podeEditarPost, podeAnexo } = await import('./auth.js')
const { semAdmin } = await import('./rotas/usuario.js')

const id = (r) => Number(r.lastInsertRowid)
const usuario = (nome, papel) =>
  id(db.prepare('INSERT INTO usuario (nome, senha, papel) VALUES (?,?,?)').run(nome, hashSenha('x'), papel))
const linha = (uid) => db.prepare('SELECT id, senha FROM usuario WHERE id = ?').get(uid)

// 1. Semente: o admin do primeiro run é administrador.
assert.equal(db.prepare("SELECT papel FROM usuario WHERE nome = 'admin'").get().papel, 'admin')

// 2. Administrador pode tudo; escritório tudo menos usuários.
assert.ok(autorizado('admin', 'POST', '/api/usuarios'))
assert.ok(autorizado('escritorio', 'GET', '/api/obra/1/fluxo'))
assert.ok(autorizado('escritorio', 'POST', '/api/saidas'))
assert.ok(!autorizado('escritorio', 'GET', '/api/usuarios'))
assert.ok(!autorizado('escritorio', 'PATCH', '/api/usuarios/2'))

// 3. Campo: diário, galeria e a obra - e nenhuma rota de valor.
for (const [m, p] of [['GET', '/api/obras'], ['GET', '/api/obra/3'], ['POST', '/api/diario'],
  ['PATCH', '/api/diario/9'], ['DELETE', '/api/diario/9'], ['POST', '/api/arquivos'],
  ['DELETE', '/api/arquivos/4'], ['POST', '/api/anexos'], ['GET', '/api/anexo/1-a__f.jpg']]) {
  assert.ok(autorizado('campo', m, p), `${m} ${p}`)
}
for (const [m, p] of [['GET', '/api/obra/3/fluxo'], ['GET', '/api/obra/3/export.csv'],
  ['GET', '/api/orcamentos'], ['GET', '/api/orcamento/1'], ['POST', '/api/saidas'],
  ['POST', '/api/entradas'], ['GET', '/api/fornecedores'], ['GET', '/api/fornecedores/1/extrato'],
  ['GET', '/api/clientes'], ['PATCH', '/api/obras/3'], ['POST', '/api/obras'],
  ['PATCH', '/api/fases/1'], ['GET', '/api/usuarios'], ['GET', '/api/insumos']]) {
  assert.ok(!autorizado('campo', m, p), `${m} ${p}`)
}
// Papel desconhecido não passa em nada.
assert.ok(!autorizado('cliente', 'GET', '/api/obras'))

// 4. Sessão: o selo abre enquanto a senha e o ativo não mudam.
const ana = usuario('Ana', 'campo')
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

// 5. Obras: campo só as atribuídas; escritório todas (null).
const obra = (nome) => id(db.prepare("INSERT INTO obra (nome, criada_em) VALUES (?, '2026-10-03')").run(nome))
const casa = obra('Casa')
const predio = obra('Prédio')
db.prepare('INSERT INTO usuario_obra (usuario_id, obra_id) VALUES (?,?)').run(ana, casa)
const req = { papel: 'campo', usuarioId: ana }
assert.deepEqual([...obrasVisiveis(req)], [casa])
assert.ok(podeObra(req, casa))
assert.ok(podeObra(req, String(casa))) // obra_id do corpo pode vir como texto
assert.ok(!podeObra(req, predio))
const beto = usuario('Beto', 'escritorio')
assert.equal(obrasVisiveis({ papel: 'escritorio', usuarioId: beto }), null)
assert.ok(podeObra({ papel: 'escritorio', usuarioId: beto }, predio))

// 5b. Diário (Dúvida 20): o campo edita só o que escreveu; escritório, qualquer um.
// Autoria pelo ID - renomear o usuário não tira dele os próprios posts.
assert.ok(podeEditarPost(req, { autor_id: req.usuarioId }))
assert.ok(!podeEditarPost(req, { autor_id: beto }))
assert.ok(!podeEditarPost(req, { autor_id: null })) // post antigo sem dono
assert.ok(podeEditarPost({ papel: 'escritorio', usuarioId: beto }, { autor_id: req.usuarioId }))
assert.ok(db.prepare('PRAGMA table_info(diario)').all().some((c) => c.name === 'autor_id'))

// 5c. Anexo (rodada 2, A18): a rota é do campo, mas o arquivo tem dono. O campo abre só
// o que é da galeria/diário ou a foto de uma obra dele; nota de saída e de entrada, nunca.
const arq = (obraId, ref) =>
  db.prepare("INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em) VALUES (?, 'fotos', 'f', ?, '2026-10-03')").run(obraId, ref)
arq(casa, '1-a__casa.jpg')
arq(predio, '2-b__predio.jpg')
db.prepare('UPDATE obra SET foto = ? WHERE id = ?').run('3-c__capa.jpg', casa)
assert.ok(podeAnexo(req, '1-a__casa.jpg'))
assert.ok(podeAnexo(req, '3-c__capa.jpg'))
assert.ok(!podeAnexo(req, '2-b__predio.jpg')) // outra obra
assert.ok(!podeAnexo(req, '4-d__nota.pdf')) // nota fiscal de saída: não está em arquivo nem é capa
assert.ok(!podeAnexo(req, '9-z__solto.jpg'))
assert.ok(podeAnexo({ papel: 'escritorio', usuarioId: beto }, '4-d__nota.pdf'))

// 6. Sem administrador ativo o sistema trava o cadastro - a rota desfaz quando isso acontece.
assert.ok(!semAdmin())
db.prepare("UPDATE usuario SET ativo = 0 WHERE nome = 'admin'").run()
assert.ok(semAdmin())

rmSync(dir, { recursive: true, force: true })
console.log('usuario.test: ok')

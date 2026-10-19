// Gate de rede interna: hash de senha (scrypt) + sessão em cookie assinado (HMAC).
// Tudo node:crypto - sem bcrypt, sem express-session, sem cookie-parser.
// Permissões (UPDATE.md §5): quem pode o quê é decidido AQUI, no servidor - a tela só
// esconde o que já seria recusado.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'
import db from './db.js'

// O `papel` fixo (admin/escritório/campo) ficou só como coluna antiga: desde 19/10/2026
// (Jean: "o permissionamento é criado em tempo de uso") quem decide é o PERFIL do usuário,
// ou as permissões personalizadas dele. Os três papéis viraram perfis prontos.
export const PAPEIS = ['admin', 'escritorio', 'campo']

// O catálogo é fixo - é o código que sabe o que cada rota faz. O que o administrador
// monta é a combinação: perfis com nome, e permissões por usuário. `requer` é o que a
// permissão não faz sentido sem (lançar sem ver valor), e entra junto sozinho.
export const PERMISSOES = [
  { id: 'ver_valores', rotulo: 'Ver valores', descricao: 'Fluxo de caixa, estimativa, relatórios, Visão do cliente e os números do topo da obra.' },
  { id: 'lancar', rotulo: 'Lançar', descricao: 'Registrar, editar e excluir entradas e saídas.', requer: ['ver_valores'] },
  { id: 'estimativa', rotulo: 'Estimativa', descricao: 'Montar as fases e os serviços da obra.', requer: ['ver_valores'] },
  { id: 'concluir_fase', rotulo: 'Concluir fase', descricao: 'Concluir e reabrir fase e escolher a taxa de administração.', requer: ['ver_valores'] },
  { id: 'cadastros', rotulo: 'Cadastros', descricao: 'Clientes, fornecedores, itens e os dados da obra.' },
  { id: 'diario', rotulo: 'Diário e fotos', descricao: 'Lançar no Diário de obra e enviar fotos e projetos para a Galeria.' },
  { id: 'documentos', rotulo: 'Documentos da obra', descricao: 'Ver e enviar a pasta Documentos (contrato, cronograma físico-financeiro).' },
  { id: 'editar_de_outros', rotulo: 'Mexer no que é dos outros', descricao: 'Editar e excluir post do diário e arquivo que outra pessoa lançou.' },
  { id: 'todas_obras', rotulo: 'Todas as obras', descricao: 'Sem esta, vê só as obras marcadas no usuário.' },
  { id: 'usuarios', rotulo: 'Usuários e perfis', descricao: 'Cadastrar usuários e perfis e dar permissões.' },
]
export const TODAS = PERMISSOES.map((p) => p.id)
// Os papéis de antes, agora perfis que o administrador pode editar ou copiar.
export const PERFIS_PADRAO = [
  ['Administrador', TODAS, 'admin'],
  ['Escritório', TODAS.filter((p) => p !== 'usuarios'), 'escritorio'],
  ['Campo', ['diario'], 'campo'],
]
// Só ids conhecidos, na ordem do catálogo, com os `requer` puxados.
export function normalizar(lista) {
  const s = new Set((lista ?? []).filter((p) => TODAS.includes(p)))
  for (const p of PERMISSOES) if (s.has(p.id)) for (const r of p.requer ?? []) s.add(r)
  return TODAS.filter((p) => s.has(p))
}

db.exec('CREATE TABLE IF NOT EXISTS usuario (id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, senha TEXT NOT NULL)')
// ALTER idempotente. O DEFAULT 'admin' só vale pras linhas que já existiam: até aqui
// quem entrava podia tudo, e o banco existente continua assim. Usuário novo sempre
// nasce com papel explícito (rotas/usuario.js, criar-usuario.js).
{
  const tem = new Set(db.prepare('PRAGMA table_info(usuario)').all().map((c) => c.name))
  if (!tem.has('papel')) {
    db.exec(`ALTER TABLE usuario ADD COLUMN papel TEXT NOT NULL DEFAULT 'admin'
      CHECK (papel IN ('admin', 'escritorio', 'campo'))`)
  }
  // Inativar em vez de apagar: o autor do diário é o nome, e o histórico fica.
  if (!tem.has('ativo')) db.exec('ALTER TABLE usuario ADD COLUMN ativo INTEGER NOT NULL DEFAULT 1')
}
// Perfil: um nome e uma lista de permissões. O usuário aponta pra um perfil e pode ter
// `permissoes` próprias (JSON) - quando tem, valem elas, e o perfil fica só de nome.
db.exec(`
  CREATE TABLE IF NOT EXISTS perfil (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL UNIQUE, permissoes TEXT NOT NULL DEFAULT '[]'
  )
`)
if (db.prepare('SELECT COUNT(*) n FROM perfil').get().n === 0) {
  const ins = db.prepare('INSERT INTO perfil (nome, permissoes) VALUES (?,?)')
  for (const [nome, perms] of PERFIS_PADRAO) ins.run(nome, JSON.stringify(perms))
}
{
  const tem = new Set(db.prepare('PRAGMA table_info(usuario)').all().map((c) => c.name))
  if (!tem.has('perfil_id')) db.exec('ALTER TABLE usuario ADD COLUMN perfil_id INTEGER REFERENCES perfil(id)')
  if (!tem.has('permissoes')) db.exec('ALTER TABLE usuario ADD COLUMN permissoes TEXT')
  // Quem já existia ganha o perfil do papel que tinha.
  for (const [nome, , papel] of PERFIS_PADRAO) {
    db.prepare('UPDATE usuario SET perfil_id = (SELECT id FROM perfil WHERE nome = ?) WHERE perfil_id IS NULL AND papel = ?')
      .run(nome, papel)
  }
}
export const perfilAdmin = () => db.prepare("SELECT id FROM perfil WHERE nome = 'Administrador'").get()?.id

// Obras em que o usuário trabalha. Só quem não tem `todas_obras` é filtrado por ela;
// pros outros a tabela nem é consultada.
db.exec(`
  CREATE TABLE IF NOT EXISTS usuario_obra (
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    obra_id INTEGER NOT NULL REFERENCES obra(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, obra_id)
  )
`)

// Autor do diário por ID (UPDATE.md §13, Dúvida 20): `diario.autor` é o nome, que se
// troca na tela de Usuários - comparar autoria por ele tiraria de quem foi renomeado
// a edição dos próprios posts. O backfill casa pelo nome atual; post de nome que não
// casa com ninguém fica sem dono (só escritório e administrador mexem nele).
if (!db.prepare('PRAGMA table_info(diario)').all().some((c) => c.name === 'autor_id')) {
  db.exec('ALTER TABLE diario ADD COLUMN autor_id INTEGER REFERENCES usuario(id)')
  db.exec('UPDATE diario SET autor_id = (SELECT u.id FROM usuario u WHERE u.nome = diario.autor)')
}

// Quem enviou o arquivo (19/10/2026): "excluir só o que ele mesmo lançou" precisa saber.
// Anexo de post herda o autor do post; o resto que já existia fica sem dono (só quem tem
// `editar_de_outros` mexe nele).
if (!db.prepare('PRAGMA table_info(arquivo)').all().some((c) => c.name === 'autor_id')) {
  db.exec('ALTER TABLE arquivo ADD COLUMN autor_id INTEGER REFERENCES usuario(id)')
  db.exec('UPDATE arquivo SET autor_id = (SELECT d.autor_id FROM diario d WHERE d.id = arquivo.diario_id) WHERE diario_id IS NOT NULL')
}

// senha armazenada = salt:hash
export function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(senha, salt, 64).toString('hex')}`
}
function confere(senha, armazenado) {
  const [salt, hash] = armazenado.split(':')
  const a = Buffer.from(hash, 'hex')
  const b = scryptSync(senha, salt, 64)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Semente: admin/admin no primeiro run, pra tela abrir logável. Troque pela tela de
// Usuários. Gate, não fortaleza.
if (db.prepare('SELECT COUNT(*) n FROM usuario').get().n === 0) {
  db.prepare("INSERT INTO usuario (nome, senha, papel, perfil_id) VALUES (?,?,'admin',?)").run('admin', hashSenha('admin'), perfilAdmin())
}

// ponytail: cookie stateless assinado - sobrevive restart, sem session store.
// O selo é o ID (renomear não troca de pessoa) e a assinatura cobre o hash da senha:
// trocar a senha derruba as sessões abertas daquele usuário sem tabela de sessão.
// Inativar derruba porque exigirLogin relê o usuário a cada requisição.
const SEGREDO = process.env.OBRAS_SEGREDO || 'obras-dev-segredo'
const assina = (id, senha) => createHmac('sha256', SEGREDO).update(`${id}:${senha}`).digest('hex')
export const selo = (u) => `${u.id}.${assina(u.id, u.senha)}`
const buscaUsuario = db.prepare('SELECT id, nome, senha, papel, ativo, perfil_id, permissoes FROM usuario WHERE id = ?')
export function abre(cookie) {
  if (!cookie) return null
  const i = cookie.indexOf('.')
  const id = Number(cookie.slice(0, i))
  if (i < 0 || !Number.isInteger(id)) return null
  const u = buscaUsuario.get(id)
  if (!u || !u.ativo) return null
  const sig = Buffer.from(cookie.slice(i + 1))
  const esperado = Buffer.from(assina(u.id, u.senha))
  return sig.length === esperado.length && timingSafeEqual(sig, esperado) ? u : null
}

const leCookie = (req, chave) => {
  for (const p of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = p.trim().split('=')
    if (k === chave) return decodeURIComponent(v.join('='))
  }
  return null
}
const sessaoDe = (req) => abre(leCookie(req, 'sessao'))

// Também usado por rotas/usuario.js: quem troca a PRÓPRIA senha ganha cookie novo,
// senão a troca o jogaria pra fora na requisição seguinte.
export function emitirSessao(res, u) {
  res.setHeader('Set-Cookie', `sessao=${selo(u)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`)
}

// Permissões que valem pro usuário: as dele, se tiver; senão as do perfil.
const perfilDe = db.prepare('SELECT nome, permissoes FROM perfil WHERE id = ?')
export function permissoesDe(u) {
  const proprias = u.permissoes != null ? JSON.parse(u.permissoes) : null
  return new Set(normalizar(proprias ?? JSON.parse(perfilDe.get(u.perfil_id)?.permissoes ?? '[]')))
}
// O que a tela recebe sobre quem está logado: nome, perfil e as permissões.
const eu = (u) => ({
  usuario: u.nome,
  perfil: u.permissoes != null ? 'Personalizado' : perfilDe.get(u.perfil_id)?.nome ?? null,
  permissoes: [...permissoesDe(u)],
})

export function login(req, res) {
  const { usuario, senha } = req.body
  // `?? ''`: corpo sem `usuario` estourava o bind do SQLite e devolvia 500 com stack
  // trace - numa rota que responde ANTES do login. Sem usuário é 401, como qualquer
  // credencial errada.
  const u = db.prepare('SELECT id, nome, senha, papel, ativo, perfil_id, permissoes FROM usuario WHERE nome = ?').get(usuario ?? '')
  // Inativo recebe a mesma resposta de senha errada: não confirma que o nome existe.
  if (!u || !u.ativo || !confere(senha ?? '', u.senha)) {
    return res.status(401).json({ erro: 'usuário ou senha inválidos' })
  }
  emitirSessao(res, u)
  res.json(eu(u))
}
export function logout(req, res) {
  res.setHeader('Set-Cookie', 'sessao=; HttpOnly; Path=/; Max-Age=0')
  res.json({ ok: true })
}
export function quemSou(req, res) {
  const u = sessaoDe(req)
  if (!u) return res.status(401).json({ erro: 'não autenticado' })
  res.json(eu(u))
}
// Barra tudo abaixo dela que não tenha cookie válido.
export function exigirLogin(req, res, next) {
  const u = sessaoDe(req)
  if (!u) return res.status(401).json({ erro: 'não autenticado' })
  req.usuario = u.nome
  req.usuarioId = u.id
  req.permissoes = permissoesDe(u)
  next()
}

// Rota → permissão. `null` = qualquer um logado (a rota recorta por obra e por pasta);
// lista = basta uma delas. Lista branca de propósito: rota que não está aqui só passa
// pra quem tem TODAS as permissões - rota nova nasce fechada, em vez de nascer aberta
// até alguém lembrar de fechar.
const ROTAS = [
  [/^GET \/api\/obras$/, null],
  [/^GET \/api\/obra\/\d+$/, null],
  [/^GET \/api\/anexo\/[^/]+$/, null], // podeAnexo decide
  [/^POST \/api\/anexos$/, ['lancar', 'diario', 'documentos', 'cadastros']],
  [/^(POST|PATCH|DELETE) \/api\/diario(\/\d+)?$/, 'diario'],
  [/^(POST|DELETE) \/api\/arquivos(\/\d+)?$/, ['diario', 'documentos', 'cadastros']], // a rota vê a pasta
  [/^GET \/api\/clientes\/\d+\/arquivos$/, 'cadastros'],
  [/^GET \/api\/fornecedores\/\d+\/extrato(\.csv)?$/, 'ver_valores'],
  [/^GET \/api\/(clientes|fornecedores|insumos|catalogo)$/, ['cadastros', 'lancar', 'estimativa']],
  [/^GET \/api\/(fornecedores|insumos)\/\d+\/vinculos$/, ['cadastros', 'lancar']],
  // Quem lança cria o fornecedor e o item na hora e ensina o preço ("passa a ser o preço").
  [/^POST \/api\/(fornecedores|insumos)$/, ['cadastros', 'lancar']],
  [/^PUT \/api\/(fornecedores|insumos)\/\d+\/vinculos$/, ['cadastros', 'lancar']],
  [/^PATCH \/api\/insumos\/\d+$/, ['cadastros', 'lancar']],
  [/^POST \/api\/clientes$/, 'cadastros'],
  [/^PATCH \/api\/(clientes|fornecedores)\/\d+$/, 'cadastros'],
  [/^(POST \/api\/obras|PATCH \/api\/obras\/\d+)$/, 'cadastros'],
  [/^GET \/api\/obra\/\d+\/(fluxo|visao|export\.csv)$/, 'ver_valores'],
  [/^(POST|PATCH|DELETE) \/api\/(entradas|saidas)(\/\d+)?$/, 'lancar'],
  [/^PATCH \/api\/fases\/\d+$/, ['concluir_fase', 'estimativa']], // a rota vê o que muda
  [/^GET \/api\/(orcamentos|orcamento\/\d+)$/, 'ver_valores'],
  [/^(POST|PATCH|PUT|DELETE) \/api\/orcamentos?(\/.*)?$/, 'estimativa'],
  [/^GET \/api\/relatorios\//, 'ver_valores'],
  [/^\S+ \/api\/(usuarios|perfis)(\/.*)?$/, 'usuarios'],
]
export function autorizado(permissoes, metodo, caminho) {
  const pedido = `${metodo} ${caminho}`
  const regra = ROTAS.find(([re]) => re.test(pedido))
  if (!regra) return TODAS.every((p) => permissoes.has(p))
  return regra[1] == null || [regra[1]].flat().some((p) => permissoes.has(p))
}
export function exigirPapel(req, res, next) {
  if (!autorizado(req.permissoes, req.method, req.path)) return res.status(403).json({ erro: 'sem permissão' })
  next()
}
export const pode = (req, p) => req.permissoes.has(p)

// null = todas as obras; Set = só as atribuídas (quem não tem `todas_obras`).
const obrasDe = db.prepare('SELECT obra_id FROM usuario_obra WHERE usuario_id = ?')
export const obrasVisiveis = (req) =>
  pode(req, 'todas_obras') ? null : new Set(obrasDe.all(req.usuarioId).map((r) => r.obra_id))
export const podeObra = (req, obraId) => {
  const visiveis = obrasVisiveis(req)
  return !visiveis || visiveis.has(Number(obraId))
}
// Post do diário e arquivo da Galeria: todos veem, mas edita e exclui o autor - ou quem
// tem `editar_de_outros` (Dúvida 20; Jean, 19/10/2026, também pros arquivos).
export const podeEditarPost = (req, post) => pode(req, 'editar_de_outros') || post.autor_id === req.usuarioId
export const podeEditarArquivo = podeEditarPost

// Pasta da Galeria: Documentos (contrato, cronograma) tem permissão própria; Fotos,
// Projetos e o reflexo do diário são de quem lança diário - ou de quem só vê.
export const podePasta = (req, pasta) => pasta !== 'documentos' || pode(req, 'documentos')

// Anexo: o ref sozinho não diz de quem é. Quem vê valores e todas as obras abre tudo.
// Os outros abrem arquivo de obra visível numa pasta que podem ver, ou a capa da obra;
// nota fiscal de saída e comprovante de entrada só com `ver_valores` - são dinheiro;
// documento de cliente só com `cadastros`.
const anexoArquivo = db.prepare('SELECT obra_id, cliente_id, pasta FROM arquivo WHERE ref = ?')
const anexoCapa = db.prepare('SELECT id AS obra_id FROM obra WHERE foto = ?')
const anexoLanc = db.prepare(`
  SELECT obra_id FROM entrada WHERE anexo = ?
  UNION SELECT f.obra_id FROM saida s JOIN fase f ON f.id = s.fase_id WHERE s.anexo = ?`)
export const podeAnexo = (req, ref) => {
  const visiveis = obrasVisiveis(req)
  const ve = (obraId) => !visiveis || visiveis.has(obraId)
  if (anexoArquivo.all(ref).some((a) => (a.obra_id != null
    ? ve(a.obra_id) && podePasta(req, a.pasta)
    : pode(req, 'cadastros')))) return true
  const arquivos = anexoArquivo.all(ref)
  const capas = anexoCapa.all(ref)
  const lancs = anexoLanc.all(ref, ref)
  if (capas.some((o) => ve(o.obra_id))) return true
  if (pode(req, 'ver_valores') && lancs.some((l) => ve(l.obra_id))) return true
  // Recém-enviado, antes de salvar o lançamento ou o post: nada aponta pra ele ainda. Abre
  // pra quem pode enviar - o nome tem instante e sorteio, não se adivinha.
  return !arquivos.length && !capas.length && !lancs.length &&
    ['lancar', 'diario', 'documentos', 'cadastros'].some((p) => pode(req, p))
}

// Gate de rede interna: hash de senha (scrypt) + sessão em cookie assinado (HMAC).
// Tudo node:crypto - sem bcrypt, sem express-session, sem cookie-parser.
// Papéis (UPDATE.md §5): quem pode o quê é decidido AQUI, no servidor - a tela só
// esconde o que já seria recusado.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto'
import db from './db.js'

export const PAPEIS = ['admin', 'escritorio', 'campo']

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
// Obras em que o usuário de campo trabalha. Só o papel campo é filtrado por ela;
// escritório e administrador veem todas e a tabela nem é consultada pra eles.
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
  db.prepare("INSERT INTO usuario (nome, senha, papel) VALUES (?,?,'admin')").run('admin', hashSenha('admin'))
}

// ponytail: cookie stateless assinado - sobrevive restart, sem session store.
// O selo é o ID (renomear não troca de pessoa) e a assinatura cobre o hash da senha:
// trocar a senha derruba as sessões abertas daquele usuário sem tabela de sessão.
// Inativar derruba porque exigirLogin relê o usuário a cada requisição.
const SEGREDO = process.env.OBRAS_SEGREDO || 'obras-dev-segredo'
const assina = (id, senha) => createHmac('sha256', SEGREDO).update(`${id}:${senha}`).digest('hex')
export const selo = (u) => `${u.id}.${assina(u.id, u.senha)}`
const buscaUsuario = db.prepare('SELECT id, nome, senha, papel, ativo FROM usuario WHERE id = ?')
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

export function login(req, res) {
  const { usuario, senha } = req.body
  // `?? ''`: corpo sem `usuario` estourava o bind do SQLite e devolvia 500 com stack
  // trace - numa rota que responde ANTES do login. Sem usuário é 401, como qualquer
  // credencial errada.
  const u = db.prepare('SELECT id, nome, senha, papel, ativo FROM usuario WHERE nome = ?').get(usuario ?? '')
  // Inativo recebe a mesma resposta de senha errada: não confirma que o nome existe.
  if (!u || !u.ativo || !confere(senha ?? '', u.senha)) {
    return res.status(401).json({ erro: 'usuário ou senha inválidos' })
  }
  emitirSessao(res, u)
  res.json({ usuario: u.nome, papel: u.papel })
}
export function logout(req, res) {
  res.setHeader('Set-Cookie', 'sessao=; HttpOnly; Path=/; Max-Age=0')
  res.json({ ok: true })
}
export function quemSou(req, res) {
  const u = sessaoDe(req)
  if (!u) return res.status(401).json({ erro: 'não autenticado' })
  res.json({ usuario: u.nome, papel: u.papel })
}
// Barra tudo abaixo dela que não tenha cookie válido.
export function exigirLogin(req, res, next) {
  const u = sessaoDe(req)
  if (!u) return res.status(401).json({ erro: 'não autenticado' })
  req.usuario = u.nome
  req.usuarioId = u.id
  req.papel = u.papel
  next()
}

// O que o campo pode chamar - e NADA além disso. Lista branca de propósito: rota
// nova nasce fechada pro campo, em vez de nascer aberta até alguém lembrar de fechar.
// Só diário e galeria (Dúvida 9): nenhuma rota de valor está aqui. O recorte por obra
// é das próprias rotas (`podeObra`), porque é o corpo ou o registro que diz a obra.
const ROTAS_CAMPO = [
  /^GET \/api\/obras$/,
  /^GET \/api\/obra\/\d+$/,
  /^POST \/api\/anexos$/,
  /^GET \/api\/anexo\/[^/]+$/,
  /^POST \/api\/diario$/,
  /^(PATCH|DELETE) \/api\/diario\/\d+$/,
  /^POST \/api\/arquivos$/,
  /^DELETE \/api\/arquivos\/\d+$/,
]
export function autorizado(papel, metodo, caminho) {
  if (papel === 'admin') return true
  // Cadastro de usuário é a única coisa que só o administrador faz.
  if (caminho.startsWith('/api/usuarios')) return false
  if (papel === 'escritorio') return true
  const pedido = `${metodo} ${caminho}`
  return papel === 'campo' && ROTAS_CAMPO.some((r) => r.test(pedido))
}
export function exigirPapel(req, res, next) {
  if (!autorizado(req.papel, req.method, req.path)) return res.status(403).json({ erro: 'sem permissão' })
  next()
}

// null = todas as obras (escritório e administrador); Set = só as atribuídas.
const obrasDe = db.prepare('SELECT obra_id FROM usuario_obra WHERE usuario_id = ?')
export const obrasVisiveis = (req) =>
  req.papel === 'campo' ? new Set(obrasDe.all(req.usuarioId).map((r) => r.obra_id)) : null
export const podeObra = (req, obraId) => {
  const visiveis = obrasVisiveis(req)
  return !visiveis || visiveis.has(Number(obraId))
}
// Post do diário: o campo vê todos da obra, mas edita e exclui só os que ele escreveu
// (Dúvida 20). Escritório e administrador continuam mexendo em qualquer um.
export const podeEditarPost = (req, post) => req.papel !== 'campo' || post.autor_id === req.usuarioId
// Anexo: GET /api/anexo/:ref está na lista do campo (diário e galeria), mas o ref sozinho
// não diz de quem é. O campo abre só arquivo de obra dele (galeria, diário) ou a capa da
// obra; nota fiscal de saída e comprovante de entrada ficam de fora - são dinheiro.
const anexoDeObra = db.prepare(
  'SELECT obra_id FROM arquivo WHERE ref = ? AND obra_id IS NOT NULL UNION SELECT id FROM obra WHERE foto = ?')
export const podeAnexo = (req, ref) => {
  const visiveis = obrasVisiveis(req)
  return !visiveis || anexoDeObra.all(ref, ref).some((r) => visiveis.has(r.obra_id))
}

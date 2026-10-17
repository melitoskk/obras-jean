// Cadastro de usuários (UPDATE.md §5). Só o administrador chega aqui - quem barra é
// `autorizado` (auth.js), antes de qualquer rota deste arquivo.
import { Router } from 'express'
import db from '../db.js'
import { PAPEIS, hashSenha, emitirSessao } from '../auth.js'

const r = Router()

// Sem a senha, nunca: nem o hash sai do servidor.
r.get('/api/usuarios', (req, res) => {
  const obras = {}
  for (const v of db.prepare('SELECT usuario_id, obra_id FROM usuario_obra').all()) {
    (obras[v.usuario_id] ??= []).push(v.obra_id)
  }
  res.json(db.prepare('SELECT id, nome, papel, ativo FROM usuario ORDER BY nome').all()
    .map((u) => ({ ...u, obras: obras[u.id] ?? [] })))
})

// As obras só valem pro campo. Trocar o papel pra escritório limpa o vínculo, senão
// ele voltaria do nada se o usuário um dia virasse campo de novo.
function gravarObras(id, papel, obras) {
  db.prepare('DELETE FROM usuario_obra WHERE usuario_id = ?').run(id)
  if (papel !== 'campo') return
  const ins = db.prepare('INSERT OR IGNORE INTO usuario_obra (usuario_id, obra_id) VALUES (?,?)')
  for (const o of obras ?? []) ins.run(id, Number(o))
}

// Se a alteração deixar o sistema sem administrador ativo, ninguém mais cadastra
// usuário pela tela. Confere DEPOIS de gravar, dentro da transação, e desfaz.
export const semAdmin = () =>
  db.prepare("SELECT COUNT(*) n FROM usuario WHERE papel = 'admin' AND ativo = 1").get().n === 0

const invalido = (b, criando) => {
  if ((criando || 'nome' in b) && !b.nome?.trim()) return 'o nome é obrigatório'
  if ((criando || 'papel' in b) && !PAPEIS.includes(b.papel)) return 'papel inválido'
  if (criando && !b.senha) return 'a senha é obrigatória'
  return null
}
// UNIQUE(nome) do SQLite vira 409 legível em vez de 500.
const nomeRepetido = (e) => /UNIQUE/.test(e.message)

r.post('/api/usuarios', (req, res) => {
  const erro = invalido(req.body, true)
  if (erro) return res.status(400).json({ erro })
  const { nome, senha, papel, obras } = req.body
  db.exec('BEGIN')
  try {
    const id = Number(db.prepare('INSERT INTO usuario (nome, senha, papel) VALUES (?,?,?)')
      .run(nome.trim(), hashSenha(senha), papel).lastInsertRowid)
    gravarObras(id, papel, obras)
    db.exec('COMMIT')
    res.json({ id })
  } catch (e) {
    db.exec('ROLLBACK')
    if (nomeRepetido(e)) return res.status(409).json({ erro: 'já existe usuário com esse nome' })
    throw e
  }
})

// PATCH parcial: só o que veio muda. Senha vazia = manter a atual - o formulário
// manda o campo em branco quando ninguém mexeu nele.
r.patch('/api/usuarios/:id', (req, res) => {
  const id = Number(req.params.id)
  const atual = db.prepare('SELECT id, papel FROM usuario WHERE id = ?').get(id)
  if (!atual) return res.status(404).json({ erro: 'usuário não encontrado' })
  const erro = invalido(req.body, false)
  if (erro) return res.status(400).json({ erro })
  const b = req.body
  const cols = []
  const vals = []
  if ('nome' in b) { cols.push('nome'); vals.push(b.nome.trim()) }
  if ('papel' in b) { cols.push('papel'); vals.push(b.papel) }
  if ('ativo' in b) { cols.push('ativo'); vals.push(b.ativo ? 1 : 0) }
  if (b.senha) { cols.push('senha'); vals.push(hashSenha(b.senha)) }
  db.exec('BEGIN')
  try {
    if (cols.length) db.prepare(`UPDATE usuario SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`).run(...vals, id)
    if ('obras' in b || 'papel' in b) {
      const papel = b.papel ?? atual.papel
      const obras = 'obras' in b ? b.obras
        : db.prepare('SELECT obra_id FROM usuario_obra WHERE usuario_id = ?').all(id).map((v) => v.obra_id)
      gravarObras(id, papel, obras)
    }
    if (semAdmin()) {
      db.exec('ROLLBACK')
      return res.status(400).json({ erro: 'é preciso manter ao menos um administrador ativo' })
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    if (nomeRepetido(e)) return res.status(409).json({ erro: 'já existe usuário com esse nome' })
    throw e
  }
  if (id === req.usuarioId && b.senha) {
    emitirSessao(res, db.prepare('SELECT id, senha FROM usuario WHERE id = ?').get(id))
  }
  res.json({ ok: true })
})

export default r

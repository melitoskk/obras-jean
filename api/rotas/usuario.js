// Usuários e perfis (UPDATE.md §5). Só quem tem `usuarios` chega aqui - quem barra é
// `autorizado` (auth.js), antes de qualquer rota deste arquivo.
//
// Desde 19/10/2026 (Jean: "o permissionamento é criado em tempo de uso") o usuário tem
// um PERFIL e, se o administrador quiser, permissões PRÓPRIAS que valem no lugar das do
// perfil. Os três papéis antigos viraram os perfis Administrador, Escritório e Campo.
import { Router } from 'express'
import db from '../db.js'
import { hashSenha, emitirSessao, PERMISSOES, normalizar, permissoesDe } from '../auth.js'

const r = Router()

const lista = (json) => (json == null ? null : JSON.parse(json))

// Sem a senha, nunca: nem o hash sai do servidor. `efetivas` é o que vale de fato.
r.get('/api/usuarios', (req, res) => {
  const obras = {}
  for (const v of db.prepare('SELECT usuario_id, obra_id FROM usuario_obra').all()) {
    (obras[v.usuario_id] ??= []).push(v.obra_id)
  }
  res.json(db.prepare('SELECT id, nome, ativo, perfil_id, permissoes FROM usuario ORDER BY nome').all()
    .map((u) => ({ ...u, permissoes: lista(u.permissoes), efetivas: [...permissoesDe(u)], obras: obras[u.id] ?? [] })))
})

// As obras só valem pra quem não tem `todas_obras`. Ganhar `todas_obras` limpa o vínculo,
// senão ele voltaria do nada se a permissão um dia saísse.
function gravarObras(id, obras) {
  db.prepare('DELETE FROM usuario_obra WHERE usuario_id = ?').run(id)
  const u = db.prepare('SELECT perfil_id, permissoes FROM usuario WHERE id = ?').get(id)
  if (permissoesDe(u).has('todas_obras')) return
  const ins = db.prepare('INSERT OR IGNORE INTO usuario_obra (usuario_id, obra_id) VALUES (?,?)')
  for (const o of obras ?? []) ins.run(id, Number(o))
}

// Se a alteração deixar o sistema sem ninguém ativo que cadastre usuário, ninguém mais
// entra nesta tela. Confere DEPOIS de gravar, dentro da transação, e desfaz.
const semAdmin = () =>
  !db.prepare('SELECT perfil_id, permissoes FROM usuario WHERE ativo = 1').all().some((u) => permissoesDe(u).has('usuarios'))

const existePerfil = (id) => !!db.prepare('SELECT 1 FROM perfil WHERE id = ?').get(Number(id))
const invalido = (b, criando) => {
  if ((criando || 'nome' in b) && !b.nome?.trim()) return 'o nome é obrigatório'
  if ((criando || 'perfil_id' in b) && !existePerfil(b.perfil_id)) return 'escolha um perfil'
  if ('permissoes' in b && b.permissoes != null && !Array.isArray(b.permissoes)) return 'permissões inválidas'
  if (criando && !b.senha) return 'a senha é obrigatória'
  return null
}
// UNIQUE(nome) do SQLite vira 409 legível em vez de 500.
const nomeRepetido = (e) => /UNIQUE/.test(e.message)
// null = segue o perfil; lista = personalizadas (normalizadas: só ids do catálogo).
const permissoesJson = (p) => (p == null ? null : JSON.stringify(normalizar(p)))

// Toda escrita de usuário passa por aqui: grava, confere o administrador e desfaz se faltar.
function transacao(res, fn, repetido) {
  db.exec('BEGIN')
  try {
    const out = fn()
    if (semAdmin()) {
      db.exec('ROLLBACK')
      res.status(400).json({ erro: 'é preciso manter ao menos um usuário ativo que cadastre usuários' })
      return undefined
    }
    db.exec('COMMIT')
    return out ?? true
  } catch (e) {
    db.exec('ROLLBACK')
    if (nomeRepetido(e)) { res.status(409).json({ erro: repetido }); return undefined }
    throw e
  }
}

r.post('/api/usuarios', (req, res) => {
  const erro = invalido(req.body, true)
  if (erro) return res.status(400).json({ erro })
  const { nome, senha, perfil_id, permissoes, obras } = req.body
  const id = transacao(res, () => {
    const novo = Number(db.prepare('INSERT INTO usuario (nome, senha, perfil_id, permissoes) VALUES (?,?,?,?)')
      .run(nome.trim(), hashSenha(senha), Number(perfil_id), permissoesJson(permissoes)).lastInsertRowid)
    gravarObras(novo, obras)
    return novo
  }, 'já existe usuário com esse nome')
  if (id !== undefined) res.json({ id })
})

// PATCH parcial: só o que veio muda. Senha vazia = manter a atual - o formulário
// manda o campo em branco quando ninguém mexeu nele.
r.patch('/api/usuarios/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!db.prepare('SELECT 1 FROM usuario WHERE id = ?').get(id)) return res.status(404).json({ erro: 'usuário não encontrado' })
  const erro = invalido(req.body, false)
  if (erro) return res.status(400).json({ erro })
  const b = req.body
  const cols = []
  const vals = []
  if ('nome' in b) { cols.push('nome'); vals.push(b.nome.trim()) }
  if ('perfil_id' in b) { cols.push('perfil_id'); vals.push(Number(b.perfil_id)) }
  if ('permissoes' in b) { cols.push('permissoes'); vals.push(permissoesJson(b.permissoes)) }
  if ('ativo' in b) { cols.push('ativo'); vals.push(b.ativo ? 1 : 0) }
  if (b.senha) { cols.push('senha'); vals.push(hashSenha(b.senha)) }
  const ok = transacao(res, () => {
    if (cols.length) db.prepare(`UPDATE usuario SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`).run(...vals, id)
    // Mudar perfil ou permissões pode ligar/desligar `todas_obras`: regrava o vínculo.
    if ('obras' in b || 'perfil_id' in b || 'permissoes' in b) {
      const obras = 'obras' in b ? b.obras
        : db.prepare('SELECT obra_id FROM usuario_obra WHERE usuario_id = ?').all(id).map((v) => v.obra_id)
      gravarObras(id, obras)
    }
  }, 'já existe usuário com esse nome')
  if (ok === undefined) return
  if (id === req.usuarioId && b.senha) {
    emitirSessao(res, db.prepare('SELECT id, senha FROM usuario WHERE id = ?').get(id))
  }
  res.json({ ok: true })
})

// ── Perfis ──────────────────────────────────────────────────────────────────────────
// O catálogo vem junto: a tela monta as caixinhas a partir dele, sem lista própria.
r.get('/api/perfis', (req, res) => {
  const usam = Object.fromEntries(db.prepare('SELECT perfil_id k, COUNT(*) n FROM usuario GROUP BY perfil_id').all().map((x) => [x.k, x.n]))
  res.json({
    catalogo: PERMISSOES,
    perfis: db.prepare('SELECT id, nome, permissoes FROM perfil ORDER BY nome').all()
      .map((p) => ({ ...p, permissoes: JSON.parse(p.permissoes), usuarios: usam[p.id] ?? 0 })),
  })
})

r.post('/api/perfis', (req, res) => {
  const { nome, permissoes } = req.body
  if (!nome?.trim()) return res.status(400).json({ erro: 'o nome é obrigatório' })
  const id = transacao(res, () => Number(db.prepare('INSERT INTO perfil (nome, permissoes) VALUES (?,?)')
    .run(nome.trim(), JSON.stringify(normalizar(permissoes))).lastInsertRowid), 'já existe perfil com esse nome')
  if (id !== undefined) res.json({ id })
})

r.patch('/api/perfis/:id', (req, res) => {
  const id = Number(req.params.id)
  if (!existePerfil(id)) return res.status(404).json({ erro: 'perfil não encontrado' })
  const b = req.body
  if ('nome' in b && !b.nome?.trim()) return res.status(400).json({ erro: 'o nome é obrigatório' })
  const ok = transacao(res, () => {
    if ('nome' in b) db.prepare('UPDATE perfil SET nome = ? WHERE id = ?').run(b.nome.trim(), id)
    if ('permissoes' in b) {
      db.prepare('UPDATE perfil SET permissoes = ? WHERE id = ?').run(JSON.stringify(normalizar(b.permissoes)), id)
      // Quem usa o perfil pode ter ganhado ou perdido `todas_obras`.
      for (const u of db.prepare('SELECT id FROM usuario WHERE perfil_id = ?').all(id)) {
        gravarObras(u.id, db.prepare('SELECT obra_id FROM usuario_obra WHERE usuario_id = ?').all(u.id).map((v) => v.obra_id))
      }
    }
  }, 'já existe perfil com esse nome')
  if (ok !== undefined) res.json({ ok: true })
})

// Perfil em uso não sai: o usuário ficaria sem permissão nenhuma sem ninguém ver.
r.delete('/api/perfis/:id', (req, res) => {
  const id = Number(req.params.id)
  const n = db.prepare('SELECT COUNT(*) n FROM usuario WHERE perfil_id = ?').get(id).n
  if (n) return res.status(409).json({ erro: `${n} usuário(s) usam este perfil` })
  db.prepare('DELETE FROM perfil WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default r

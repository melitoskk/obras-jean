// node --experimental-sqlite criar-usuario.js <nome> <senha> [perfil]
// Cria ou troca a senha de um usuário pela linha de comando. O caminho normal é a tela
// de Usuários; este fica pra quando ninguém consegue entrar (ex.: senha do único
// administrador perdida). Sem perfil, cria no Administrador e não mexe no de quem já existe.
import db from './db.js'
import { hashSenha } from './auth.js'

const [nome, senha, perfil] = process.argv.slice(2)
const perfis = db.prepare('SELECT id, nome FROM perfil ORDER BY nome').all()
const escolhido = perfis.find((p) => p.nome === (perfil ?? 'Administrador'))
if (!nome || !senha || !escolhido) {
  console.error(`uso: node --experimental-sqlite criar-usuario.js <nome> <senha> [${perfis.map((p) => `"${p.nome}"`).join('|')}]`)
  process.exit(1)
}
db.prepare(`
  INSERT INTO usuario (nome, senha, perfil_id) VALUES (?,?,?)
  ON CONFLICT(nome) DO UPDATE SET senha = excluded.senha, ativo = 1, perfil_id = COALESCE(?, perfil_id)
`).run(nome, hashSenha(senha), escolhido.id, perfil ? escolhido.id : null)
console.log('ok:', nome)

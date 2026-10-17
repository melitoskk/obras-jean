// node --experimental-sqlite criar-usuario.js <nome> <senha> [papel]
// Cria ou troca a senha de um usuário pela linha de comando. O caminho normal é a tela
// de Usuários; este fica pra quando ninguém consegue entrar (ex.: senha do único
// administrador perdida). Sem papel, cria administrador e não mexe no de quem já existe.
import db from './db.js'
import { hashSenha, PAPEIS } from './auth.js'

const [nome, senha, papel] = process.argv.slice(2)
if (!nome || !senha || (papel && !PAPEIS.includes(papel))) {
  console.error(`uso: node --experimental-sqlite criar-usuario.js <nome> <senha> [${PAPEIS.join('|')}]`)
  process.exit(1)
}
db.prepare(`
  INSERT INTO usuario (nome, senha, papel) VALUES (?,?,?)
  ON CONFLICT(nome) DO UPDATE SET senha = excluded.senha, ativo = 1, papel = COALESCE(?, papel)
`).run(nome, hashSenha(senha), papel || 'admin', papel || null)
console.log('ok:', nome)

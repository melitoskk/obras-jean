// Troca em-dash/en-dash/aspas curvas por ASCII em todo texto do banco.
// Só mexe em caracteres não-ASCII, então data ISO e ref de arquivo passam intactos.
// Rodar: docker compose run --rm api node --experimental-sqlite limpar-tracos.js
import db from './db.js'

const DE_PARA = [['—', '-'], ['–', '-'], ['“', '"'], ['”', '"'], ['‘', "'"], ['’', "'"]]
const lit = (s) => `'${s.replace(/'/g, "''")}'` // a aspa simples vira '' dentro do literal
const expr = (col) => DE_PARA.reduce((e, [de, para]) => `replace(${e}, ${lit(de)}, ${lit(para)})`, `"${col}"`)

const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
let total = 0
for (const { name } of tabelas) {
  const cols = db.prepare(`PRAGMA table_info("${name}")`).all().filter((c) => c.type === 'TEXT')
  if (!cols.length) continue
  const sets = cols.map((c) => `"${c.name}" = ${expr(c.name)}`).join(', ')
  const onde = cols.map((c) => DE_PARA.map(([de]) => `"${c.name}" LIKE ${lit(`%${de}%`)}`).join(' OR ')).join(' OR ')
  const { changes } = db.prepare(`UPDATE "${name}" SET ${sets} WHERE ${onde}`).run()
  if (changes) console.log(`${name}: ${changes} linha(s)`)
  total += Number(changes)
}
console.log(`total: ${total} linha(s)`)

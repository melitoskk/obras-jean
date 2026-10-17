// Subir a API DUAS vezes sobre o mesmo banco não pode mudar dado nenhum.
// Este check existe porque `CREATE TABLE IF NOT EXISTS item` no schema base
// ressuscitava a tabela que a migração item→insumo apaga: no boot seguinte ela
// reagia à tabela vazia e remapeava todo saida_item.item_id pra NULL. O sintoma
// era mudo - o lançamento abria sem item, como se ninguém tivesse escolhido.
//
//   docker compose run --rm api node --experimental-sqlite migracao.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-mig-'))
process.env.OBRAS_DB = join(dir, 'teste.db')

const { default: db } = await import('./db.js')

const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-08-22')").run().lastInsertRowid,
)
const faseId = Number(
  db.prepare("INSERT INTO fase (obra_id, codigo, nome, ordem) VALUES (?, '1', 'Fundação', 1)")
    .run(obraId).lastInsertRowid,
)
const saidaId = Number(
  db.prepare("INSERT INTO saida (fase_id, valor, data) VALUES (?, 8500, '2026-08-22')")
    .run(faseId).lastInsertRowid,
)
const insumoId = Number(
  db.prepare("INSERT INTO insumo (nome) VALUES ('Cimento')").run().lastInsertRowid,
)
db.prepare('INSERT INTO saida_item (saida_id, item_id, descricao, qtd, valor_unit) VALUES (?,?,?,1,8500)')
  .run(saidaId, insumoId, 'Cimento')

// Segundo boot: outro processo, MESMO arquivo de banco - é o `docker compose restart`.
const { execFileSync } = await import('node:child_process')
execFileSync(process.execPath, ['--input-type=module', '-e', "await import('./db.js')"], {
  env: { ...process.env, OBRAS_DB: process.env.OBRAS_DB },
  cwd: import.meta.dirname,
})

const { default: db2 } = await import(`./db.js?bust=${Date.now()}`)
const linha = db2.prepare('SELECT item_id FROM saida_item WHERE saida_id = ?').get(saidaId)
assert.equal(linha.item_id, insumoId, 'reabrir o banco não pode zerar saida_item.item_id')

// E a tabela morta não pode renascer - é ela que reativa a migração.
assert.equal(
  db2.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='item'").get().n,
  0,
  'a tabela item voltou a ser criada',
)

// As duas conexões seguram o arquivo: no Windows o rm dá EPERM enquanto estiverem
// abertas, e o teste morria no cleanup depois de já ter passado.
db.close()
db2.close()
rmSync(dir, { recursive: true, force: true })
console.log('ok')

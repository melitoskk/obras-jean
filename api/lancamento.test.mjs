// Rastreabilidade do lançamento (UPDATE.md §6 e §9). O número é o do comprovante na
// pasta física da obra ("o Nº 2 é o 2º papel da pasta"): se ele se repetir depois de uma
// exclusão, a pasta passa a falar de outra nota sem ninguém perceber. E o serviço do lançamento é o de CATÁLOGO -
// se ele seguisse a versão, arquivar a estimativa arrancaria o realizado do serviço.
//
//   docker compose run --rm api node --experimental-sqlite lancamento.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db, novoOrcamento, renumerarObras } = await import('./db.js')
const { caixaDaObra } = await import('./rotas/orcamento.js')

const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-10-03')").run().lastInsertRowid,
)
const fc = db.prepare('SELECT * FROM fase_catalogo ORDER BY codigo LIMIT 1 OFFSET 3').get()
const [sc1, sc2] = db.prepare('SELECT * FROM servico_catalogo WHERE fase_catalogo_id = ? ORDER BY codigo').all(fc.id)
const faseId = Number(
  db.prepare('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)')
    .run(obraId, fc.id, fc.codigo, fc.nome, fc.codigo).lastInsertRowid,
)

let t = 0
const instante = () => new Date(Date.UTC(2026, 9, 3, 9, ++t)).toISOString()
const saida = (servico = null) => Number(
  db.prepare("INSERT INTO saida (fase_id, valor, data, criado_em, servico_catalogo_id) VALUES (?,100,'2026-10-03',?,?)")
    .run(faseId, instante(), servico).lastInsertRowid,
)
const entrada = () => Number(
  db.prepare("INSERT INTO entrada (obra_id, fase_id, valor, data, criado_em) VALUES (?,?,100,'2026-10-03',?)")
    .run(obraId, faseId, instante()).lastInsertRowid,
)
const numero = (tabela, id) => db.prepare(`SELECT numero FROM ${tabela} WHERE id = ?`).get(id).numero

// --- §9: número sequencial POR OBRA, entrada e saída na mesma sequência (Jean,
// 19/10/2026: uma pasta física por obra, o Nº 2 é o 2º comprovante dela) ---
const outraObra = Number(db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Sobrado', '2026-10-03')").run().lastInsertRowid)
const faseOutra = Number(db.prepare('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)')
  .run(outraObra, fc.id, fc.codigo, fc.nome, fc.codigo).lastInsertRowid)
const saidaEm = (f) => Number(db.prepare("INSERT INTO saida (fase_id, valor, data, criado_em) VALUES (?,100,'2026-10-03',?)")
  .run(f, instante()).lastInsertRowid)

const s1 = saida()
const e1 = entrada()
const s2 = saida()
assert.deepEqual([numero('saida', s1), numero('entrada', e1), numero('saida', s2)], [1, 2, 3],
  'entrada e saída na mesma sequência, na ordem em que foram lançadas')
assert.equal(numero('saida', saidaEm(faseOutra)), 1, 'outra obra começa no 1')

db.prepare('DELETE FROM saida WHERE id = ?').run(s2)
const s3 = saida()
// SQLite sem AUTOINCREMENT devolve o mesmo id aqui. O número não pode ir junto.
assert.equal(numero('saida', s3), 4, 'excluir o último lançamento não devolve o número dele')

// Renumerar é a migração / o fim da semente: por obra, na ordem de lançamento, contador acertado.
renumerarObras()
assert.deepEqual([numero('saida', s1), numero('entrada', e1), numero('saida', s3)], [1, 2, 3])
assert.equal(numero('entrada', entrada()), 4, 'depois de renumerar, o próximo segue do fim')
assert.equal(numero('saida', saidaEm(faseOutra)), 2)

// --- §6: serviço de catálogo atravessa versões ---
const orcId = novoOrcamento(obraId)
const insServ = db.prepare(`
  INSERT INTO servico (orcamento_id, fase_id, catalogo_id, codigo, nome, qtd, custo_mat_unit)
  VALUES (?,?,?,?,?,1,500)
`)
insServ.run(orcId, faseId, sc1.id, sc1.codigo, sc1.nome)
insServ.run(orcId, faseId, null, 9, 'Geral') // avulso: sem catálogo, não se aponta

const comServico = saida(sc1.id)

// Arquiva uma cópia (a versão), como o POST /versao faz: o vivo não troca de id.
const copia = novoOrcamento(obraId)
db.prepare('UPDATE orcamento SET ativo = 0 WHERE id = ?').run(copia)
insServ.run(copia, faseId, sc1.id, sc1.codigo, sc1.nome)
insServ.run(copia, faseId, sc2.id, sc2.codigo, sc2.nome) // só na versão arquivada

const { servicos, saidas } = caixaDaObra(obraId)
assert.deepEqual(servicos.map((s) => s.id), [sc1.id],
  'o combo lista só os serviços com catálogo da estimativa VIVA, sem repetir os da versão')
const lancada = saidas.find((s) => s.id === comServico)
assert.equal(lancada.servico_catalogo_id, sc1.id)
assert.equal(lancada.servico_nome, sc1.nome, 'o nome vem do catálogo, mesmo que o serviço saia da estimativa')
assert.ok(saidas.every((s) => typeof s.numero === 'number'), 'o payload do extrato traz o número')

rmSync(dir, { recursive: true, force: true })
console.log('lancamento.test: ok')

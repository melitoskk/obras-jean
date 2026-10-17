// Extrato do credor (UPDATE.md §10.2). Quanto de cada saída é de quem: com fornecedor no
// cabeçalho a nota inteira é dele; sem cabeçalho, cada fornecedor das linhas leva a soma
// das linhas dele. Se essa regra escorregar, o extrato que se manda pro credor cobra a
// nota de outro - ou some com uma empreita sem itens.
//
//   docker compose run --rm api node --experimental-sqlite credor.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db } = await import('./db.js')
const { extratoDoCredor } = await import('./rotas/fornecedor.js')

const id = (r) => Number(r.lastInsertRowid)
const obra = (nome) => id(db.prepare("INSERT INTO obra (nome, criada_em) VALUES (?, '2026-10-03')").run(nome))
const fase = (obraId) => id(db.prepare("INSERT INTO fase (obra_id, codigo, nome, ordem) VALUES (?, 4, 'FUNDAÇÕES', 4)").run(obraId))
const forn = (nome) => id(db.prepare('INSERT INTO fornecedor (nome) VALUES (?)').run(nome))
let t = 0
const saida = (faseId, valor, fornecedorId = null, extra = {}) => id(db.prepare(
  'INSERT INTO saida (fase_id, valor, data, fornecedor_id, pago_em, anexo, criado_em) VALUES (?,?,?,?,?,?,?)',
).run(faseId, valor, extra.data ?? '2026-10-03', fornecedorId, extra.pago_em ?? null, extra.anexo ?? null,
  new Date(Date.UTC(2026, 9, 3, 9, ++t)).toISOString()))
const linha = (saidaId, fornecedorId, qtd, valorUnit, descricao) =>
  db.prepare('INSERT INTO saida_item (saida_id, fornecedor_id, descricao, qtd, valor_unit) VALUES (?,?,?,?,?)')
    .run(saidaId, fornecedorId, descricao, qtd, valorUnit)

const casa = fase(obra('Casa'))
const predio = fase(obra('Prédio'))
const deposito = forn('Depósito')
const empreiteira = forn('Empreiteira')
const banco = forn('Banco')

// 1. Cabeçalho: a nota inteira é do Depósito, mesmo com linha de outro fornecedor nela.
const s1 = saida(casa, 10000, deposito, { pago_em: '2026-10-03', anexo: '1-abc__nf.pdf' })
linha(s1, deposito, 2, 4000, 'Cimento')
linha(s1, empreiteira, 1, 2000, 'Frete')
// 2. Empreita sem itens, só cabeçalho - antes não aparecia no total do fornecedor.
saida(predio, 50000, empreiteira)
// 3. Sem cabeçalho: cada um leva as linhas dele. 1,5 × 33,33 = 49,995 → 50,00 (meio pra cima).
const s3 = saida(casa, 3000 + 5000, null)
linha(s3, deposito, 1.5, 3333, 'Areia')
linha(s3, empreiteira, 1, 3000, 'Mão de obra')
// 4. Ninguém: sem credor, não entra em extrato nenhum.
const s4 = saida(casa, 700, null)
linha(s4, null, 1, 700, 'Taxa avulsa')

const dep = extratoDoCredor(deposito)
assert.deepEqual(dep.map((l) => l.valor), [10000, 5000])
assert.deepEqual(dep[0].itens, ['Cimento', 'Frete'], 'com cabeçalho, todas as linhas são dele')
assert.deepEqual(dep[1].itens, ['Areia'], 'sem cabeçalho, só as linhas dele')
assert.equal(dep[0].anexo, '1-abc__nf.pdf')
assert.equal(dep[0].obra, 'Casa')
assert.ok(dep[0].numero > 0)

const emp = extratoDoCredor(empreiteira)
assert.deepEqual(emp.map((l) => [l.obra, l.valor]), [['Prédio', 50000], ['Casa', 3000]])
// Filtro de obra.
const predioId = db.prepare("SELECT id FROM obra WHERE nome = 'Prédio'").get().id
assert.deepEqual(extratoDoCredor(empreiteira, predioId).map((l) => l.valor), [50000])

assert.deepEqual(extratoDoCredor(banco), [])
// A saída 4 não tem dono: ninguém a recebe.
assert.ok(![...dep, ...emp].some((l) => l.id === s4))

// A lista de fornecedores soma pela MESMA view: Total da lista = total do extrato.
const lista = db.prepare(`
  SELECT sc.fornecedor_id id, COUNT(*) compras, SUM(sc.valor) total FROM saida_credor sc GROUP BY sc.fornecedor_id
`).all()
const daLista = (f) => lista.find((l) => l.id === f)
assert.equal(daLista(deposito).total, dep.reduce((s, l) => s + l.valor, 0))
assert.equal(daLista(empreiteira).compras, emp.length)

rmSync(dir, { recursive: true, force: true })
console.log('credor ok')

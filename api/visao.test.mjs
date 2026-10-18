// Visão do cliente (UPDATE.md §12). O que se verifica é a regra que decide a tela: os
// números batem com o relatório e com o saldo do topo, e nada de dado interno sai -
// descrição de lançamento, fornecedor e arquivo que não é foto ficam no servidor.
//
//   docker compose run --rm api node --experimental-sqlite visao.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db } = await import('./db.js')
const { visaoCliente } = await import('./rotas/visao.js')

const ins = (sql, ...v) => Number(db.prepare(sql).run(...v).lastInsertRowid)
const cli = ins("INSERT INTO cliente (nome) VALUES ('Ana')")
const obra = ins("INSERT INTO obra (nome, cliente_id, criada_em) VALUES ('Casa', ?, '2026-08-01')", cli)
const cat = db.prepare("SELECT id, codigo FROM fase_catalogo WHERE nome LIKE 'FUNDA%'").get()
const fund = ins('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)', obra, cat.id, 1, 'FUNDAÇÕES', 1)
// Fase sem estimado e sem lançamento: não entra na pizza nem nas barras.
ins('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)', obra, cat.id, 2, 'VAZIA', 2)
const forn = ins("INSERT INTO fornecedor (nome) VALUES ('Concreteira X')")

const orc = ins("INSERT INTO orcamento (numero, obra_id, criado_em, ativo) VALUES ('000001', ?, '2026-08-01', 1)", obra)
ins('INSERT INTO servico (orcamento_id, fase_id, codigo, nome, qtd, custo_mo_unit, custo_mat_unit) VALUES (?,?,?,?,?,?,?)',
  orc, fund, 1, 'Geral', 1, 4_000_00, 6_000_00)

let t = 0
const saida = (valor, data) => ins(
  "INSERT INTO saida (fase_id, valor, data, descricao, fornecedor_id, criado_em) VALUES (?,?,?,'concreto da Concreteira X',?,?)",
  fund, valor, data, forn, `2026-10-02T10:00:${String(++t).padStart(2, '0')}`)
saida(3_000_00, '2026-08-10')
saida(2_000_00, '2026-09-05')
saida(500_00, '2026-09-20')
ins("INSERT INTO entrada (obra_id, valor, data, criado_em) VALUES (?, 4_000_00, '2026-08-01', '2026-08-01')", obra)
ins("INSERT INTO entrada (obra_id, valor, data, criado_em) VALUES (?, 4_000_00, '2026-10-01', '2026-10-01')", obra)

const arq = (pasta, nome) => ins("INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em) VALUES (?,?,?,?,'2026-09-01')",
  obra, pasta, nome, `1-x__${nome}`)
arq('fotos', 'frente.jpg')
arq('fotos', 'planta.pdf')
arq('projetos', 'corte.png')
const post = ins("INSERT INTO diario (obra_id, fase_id, texto, autor, criado_em) VALUES (?,?,'concretagem','jean','2026-09-02')", obra, fund)
ins("INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em, diario_id) VALUES (?, 'dia_a_dia', 'laje.webp', '2-y__laje.webp', '2026-09-02', ?)", obra, post)

const v = visaoCliente(obra)
assert.equal(v.obra.cliente, 'Ana')
assert.equal(v.investido, 8_000_00)
assert.equal(v.executado, 5_500_00)
assert.equal(v.saldo, 2_500_00, 'saldo = entradas − tudo lançado, o mesmo do topo')
assert.equal(v.estimado, 10_000_00)
assert.deepEqual(v.fases.map((f) => [f.nome, f.estimado, f.realizado]), [['FUNDAÇÕES', 10_000_00, 5_500_00]])
assert.deepEqual(v.meses, [
  { ym: '2026-08', realizado: 3_000_00, investido: 4_000_00 },
  { ym: '2026-09', realizado: 2_500_00, investido: 0 },
  { ym: '2026-10', realizado: 0, investido: 4_000_00 },
])
// Só imagem, só de Fotos e do Diário; a do diário leva a fase do post.
assert.deepEqual(v.fotos.map((f) => [f.nome, f.fase]).sort(), [['frente.jpg', null], ['laje.webp', 'FUNDAÇÕES']])

// Nada de dado interno no payload inteiro.
const texto = JSON.stringify(v)
assert.ok(!texto.includes('Concreteira'), 'nome de fornecedor não sai')
assert.ok(!texto.includes('concreto da'), 'descrição de lançamento não sai')
assert.ok(!/margem|custo_mo|custo_mat/.test(texto), 'margem e custo unitário não saem')

// Taxa de administração (Jean, 18/10/2026: o cliente vê a taxa). Só a DEVIDA, das
// fases concluídas, pela regra escolhida ao concluir: aberta não deve taxa ainda.
assert.equal(v.taxa, 0, 'sem fase concluída não há taxa devida')
db.prepare("UPDATE fase SET concluida_em = '2026-09-30', taxa_tipo = 'fixo', taxa_valor = 1_000_00 WHERE id = ?").run(fund)
const vt = visaoCliente(obra)
assert.equal(vt.taxa, 1_000_00)
assert.equal(vt.fases[0].taxa_devida, 1_000_00)

assert.equal(visaoCliente(999), null)

rmSync(dir, { recursive: true, force: true })
console.log('visao.test.mjs ok')

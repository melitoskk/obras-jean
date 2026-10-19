// Relatórios (UPDATE.md §11.3). O que se verifica é a regra que torna um relatório
// confiável: agrupe como quiser, o total é a soma das saídas - nota sem itens, linha
// sem insumo e linha sem fornecedor caem num grupo "sem ...", não somem.
//
//   docker compose run --rm api node --experimental-sqlite relatorio.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db, novoOrcamento } = await import('./db.js')
const { pagamentos, estimadoRealizado, extratoFase, DIMENSOES, aReceberPrevisto, pendenteParaConcluir, contasAPagar } = await import('./rotas/relatorio.js')

const ins = (sql, ...v) => Number(db.prepare(sql).run(...v).lastInsertRowid)
const obra = ins("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-10-01')")
const outra = ins("INSERT INTO obra (nome, criada_em) VALUES ('Sobrado', '2026-10-01')")
const catFund = db.prepare("SELECT id, codigo FROM fase_catalogo WHERE nome LIKE 'FUNDA%'").get()
const [estaca, sapata] = db.prepare('SELECT id, codigo, nome FROM servico_catalogo WHERE fase_catalogo_id = ? ORDER BY codigo LIMIT 2').all(catFund.id)
const fase = (o) => ins('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)',
  o, catFund.id, catFund.codigo, 'FUNDAÇÕES', catFund.codigo)
const fund = fase(obra)
const fundOutra = fase(outra)

const cimento = ins("INSERT INTO insumo (nome) VALUES ('Cimento')")
const jose = ins("INSERT INTO fornecedor (nome) VALUES ('José')")
const loja = ins("INSERT INTO fornecedor (nome) VALUES ('Loja')")

let t = 0
const saida = ({ fase: f = fund, valor, data = '2026-10-02', pago = null, forn = null, servico = null, itens = [] }) => {
  const id = ins('INSERT INTO saida (fase_id, valor, data, pago_em, fornecedor_id, servico_catalogo_id, criado_em) VALUES (?,?,?,?,?,?,?)',
    f, valor, data, pago, forn, servico, `2026-10-02T10:00:${String(++t).padStart(2, '0')}`)
  for (const [item, fornecedor, qtd, unit] of itens) {
    ins('INSERT INTO saida_item (saida_id, item_id, fornecedor_id, qtd, valor_unit) VALUES (?,?,?,?,?)', id, item, fornecedor, qtd, unit)
  }
  return id
}

// Nota com itens: cimento da loja + frete avulso sem fornecedor.
saida({ valor: 1_300_00, pago: '2026-10-03', servico: estaca.id, itens: [[cimento, loja, 10, 100_00], [null, null, 1, 300_00]] })
// Empreita: fornecedor no cabeçalho, sem itens, em aberto.
saida({ valor: 5_000_00, forn: jose, servico: sapata.id })
// Sem serviço, sem fornecedor, sem itens - e fora do período de outubro.
saida({ valor: 700_00, data: '2026-09-15', pago: '2026-09-15' })
// Outra obra.
saida({ fase: fundOutra, valor: 2_000_00, forn: jose, pago: '2026-10-04' })

const soma = (ls) => ls.reduce((a, l) => a + l.valor, 0)
const porGrupo = (ls) => Object.fromEntries(
  [...new Set(ls.map((l) => l.grupo))].map((g) => [g, soma(ls.filter((l) => l.grupo === g))]))

for (const por of DIMENSOES) {
  assert.equal(soma(pagamentos({ por })), 9_000_00, `${por}: total de todas as obras`)
  assert.equal(soma(pagamentos({ por, obra })), 7_000_00, `${por}: total da obra`)
  assert.equal(soma(pagamentos({ por, obra, de: '2026-10-01', ate: '2026-10-31' })), 6_300_00, `${por}: período`)
}

assert.deepEqual(porGrupo(pagamentos({ por: 'insumo', obra })), {
  Cimento: 1_000_00, 'Sem insumo cadastrado': 300_00, 'Sem itens (valor direto)': 5_700_00,
})
assert.deepEqual(porGrupo(pagamentos({ por: 'credor' })), {
  Loja: 1_000_00, 'Sem credor': 1_000_00, 'José': 7_000_00,
}, 'credor atravessa obras; frete sem fornecedor e nota sem ninguém ficam sem credor')
// Fase agrupa por nome: a fundação das duas obras é uma linha só.
assert.equal(Object.keys(porGrupo(pagamentos({ por: 'fase' }))).length, 1)
// Pago × em aberto vem da nota: a empreita do José na Casa está em aberto.
assert.equal(soma(pagamentos({ por: 'credor', obra }).filter((l) => !l.pago)), 5_000_00)

// ── Estimado × realizado ──
const orc = novoOrcamento(obra)
db.prepare('UPDATE orcamento SET taxa_adm = 1000 WHERE id = ?').run(orc)
const serv = (catalogo, nome, valor) => ins(
  'INSERT INTO servico (orcamento_id, fase_id, catalogo_id, codigo, nome, qtd, custo_mat_unit) VALUES (?,?,?,1,?,1,?)',
  orc, fund, catalogo, nome, valor)
serv(estaca.id, estaca.nome, 1_000_00)
serv(null, 'Geral', 500_00)

const er = estimadoRealizado(obra)
assert.equal(er.taxa_adm, 1000)
const [f] = er.fases
assert.equal(f.estimado, 1_500_00)
assert.equal(f.realizado, 7_000_00)
const sv = Object.fromEntries(f.servicos.map((s) => [s.chave, [s.estimado, s.realizado, s.lancamentos.length]]))
assert.deepEqual(sv, {
  [estaca.id]: [1_000_00, 1_300_00, 1],
  [sapata.id]: [0, 5_000_00, 1], // lançado num serviço que a estimativa não tem
  fase: [500_00, 700_00, 1],     // o `Geral` e a saída sem serviço, juntos
})
assert.equal(f.servicos.at(-1).chave, 'fase', 'fase inteira vem por último')
assert.equal(estimadoRealizado(999), null)

// ── Taxa de administração por fase (decidido com o Jean em 17/10/2026) ──
// Cada fase escolhe, ao ser CONCLUÍDA, valor fixo ou percentual. O percentual incide
// só sobre o que foi PAGO na fase. Fase em andamento não deve taxa nenhuma.
// Na fundação da Casa: 1.300 pago + 5.000 em aberto + 700 pago -> pago 2.000.
const taxaDe = () => estimadoRealizado(obra).fases[0]
assert.equal(taxaDe().pago, 2_000_00, 'pago conta só as saídas com pago_em')
db.prepare("UPDATE fase SET taxa_tipo='pct', taxa_valor=1000 WHERE id=?").run(fund)
assert.equal(taxaDe().taxa_devida, 0, 'fase em andamento não deve taxa, mesmo com a regra escolhida')
db.prepare("UPDATE fase SET concluida_em='2026-10-10' WHERE id=?").run(fund)
assert.equal(taxaDe().taxa_devida, 200_00, '10% sobre o PAGO (2.000), não sobre o lançado (7.000)')
db.prepare("UPDATE fase SET taxa_tipo='fixo', taxa_valor=5_000_00 WHERE id=?").run(fund)
assert.equal(taxaDe().taxa_devida, 5_000_00, 'fixo é o valor, qualquer que seja o gasto')
db.prepare("UPDATE fase SET taxa_tipo=NULL, taxa_valor=NULL WHERE id=?").run(fund)
assert.equal(taxaDe().taxa_devida, 0, 'concluída sem regra não deve taxa')
db.prepare("UPDATE fase SET concluida_em=NULL WHERE id=?").run(fund)

// A receber do cliente, PREVISTO (rodada 1 A6, rodada 2 A1/A17), fase a fase:
// - aberta: o que custar (orçado, ou o gasto se já passou) + taxa da estimativa sobre isso;
// - concluída: o custo é o gasto (o orçado não vem mais) + a taxa escolhida ao concluir.
// A obra da Marina, Fundação concluída com R$ 5.000 fixos e o resto aberto a 10%:
// (10.450,75 + 5.000) + (325.000 + 32.500) − 50.000 = 322.950,75.
const marina = [
  { orcado: 45_000_00, gasto: 10_450_75, pago: 6_200_00, concluida_em: '2026-10-17', taxa_tipo: 'fixo', taxa_valor: 5_000_00 },
  { orcado: 325_000_00, gasto: 450_00, pago: 450_00 },
]
assert.equal(aReceberPrevisto(marina, 1000, 50_000_00), 322_950_75)
// Percentual na concluída incide sobre TUDO o que ela gastou: a nota em aberto vai ser paga.
assert.equal(aReceberPrevisto([{ ...marina[0], taxa_tipo: 'pct', taxa_valor: 1000 }], 1000, 0), 10_450_75 + 1_045_08)
// Aberta acima do orçado: conta o gasto, não o orçado.
assert.equal(aReceberPrevisto([{ orcado: 100_00, gasto: 150_00, pago: 0 }], 1000, 0), 165_00)
// Concluída sem taxa escolhida: só o custo.
assert.equal(aReceberPrevisto([{ ...marina[0], taxa_tipo: null }], 1000, 0), 10_450_75)
// Obra concluída (a Casa Ribeiro): o orçado das fases abertas não vem mais; custo = gasto.
assert.equal(aReceberPrevisto([{ orcado: 900_00, gasto: 150_00, pago: 0 }, marina[0]], 1000, 0, true), 150_00 + 10_450_75 + 5_000_00)
assert.equal(aReceberPrevisto([], 1000, 0), 0, 'sem fase não há previsão')
assert.equal(aReceberPrevisto([{ orcado: 100_00, gasto: 0, pago: 0 }], 0, 150_00), -50_00, 'recebeu além: negativo, não some')

// ── Extrato da fase ──
// Aporte no mesmo dia da nota de 02/10, lançado DEPOIS dela: vem depois. O saldo corre
// pela data da nota e fecha igual ao Saldo do topo (entradas − tudo lançado).
ins("INSERT INTO entrada (fase_id, valor, data, descricao, criado_em) VALUES (?,?,?,?,?)",
  fund, 10_000_00, '2026-10-02', 'Aporte do cliente', '2026-10-02T11:00:00')
const ex = extratoFase(obra, fund)
assert.equal(ex.fase.id, fund)
assert.deepEqual(ex.lancamentos.map((l) => [l.data, l.tipo, l.valor, l.saldo]), [
  ['2026-09-15', 'saida', 700_00, -700_00],
  ['2026-10-02', 'saida', 1_300_00, -2_000_00],
  ['2026-10-02', 'saida', 5_000_00, -7_000_00],
  ['2026-10-02', 'entrada', 10_000_00, 3_000_00],
])
// Histórico: serviço → fornecedor (o único das linhas) → itens; empreita leva o do cabeçalho.
assert.match(ex.lancamentos[1].historico, new RegExp(`${estaca.nome} · Loja · Cimento`))
assert.match(ex.lancamentos[2].historico, /José/)
// Código e nome do serviço são os da ESTIMATIVA da obra, como no Fluxo (rodada 2, A19):
// a estimativa numera os serviços que escolheu, o catálogo numera todos.
db.prepare('UPDATE servico SET codigo = 7 WHERE orcamento_id = ? AND catalogo_id = ?').run(orc, estaca.id)
assert.match(extratoFase(obra, fund).lancamentos[1].historico, new RegExp(`^${catFund.codigo}\\.7 ${estaca.nome} · `))
assert.equal(ex.lancamentos[3].historico, 'Aporte do cliente')
// Sem fase: só obra e fases, pro combo. Fase de outra obra não vaza.
assert.deepEqual(extratoFase(obra).lancamentos, [])
assert.equal(extratoFase(obra, fundOutra).fase, null)
assert.equal(extratoFase(999), null)
// Fase concluída: o extrato leva a regra e a taxa devida (Jean, 18/10/2026: o cliente
// vê a taxa). 10% sobre o pago da fundação: 1.300 + 700 pagos = 200,00.
assert.equal(extratoFase(obra, fund).fase.taxa_devida, 0, 'aberta não deve taxa')
db.prepare("UPDATE fase SET concluida_em = '2026-10-05', taxa_tipo = 'pct', taxa_valor = 1000 WHERE id = ?").run(fund)
assert.deepEqual((({ taxa_tipo, taxa_valor, taxa_devida }) => ({ taxa_tipo, taxa_valor, taxa_devida }))(extratoFase(obra, fund).fase),
  { taxa_tipo: 'pct', taxa_valor: 1000, taxa_devida: 200_00 })
db.prepare('UPDATE fase SET concluida_em = NULL, taxa_tipo = NULL, taxa_valor = NULL WHERE id = ?').run(fund)

// ── Contas a pagar (rodada 2, A5): o que está em aberto, por vencimento ──
// Na fundação da Casa há a empreita de 5.000 sem vencimento; ponho mais duas com.
const vence = (valor, vencimento) => {
  const id = saida({ valor })
  db.prepare('UPDATE saida SET vencimento = ? WHERE id = ?').run(vencimento, id)
  return id
}
const cedo = vence(300_00, '2026-10-10')
const tarde = vence(200_00, '2026-11-20')
const ca = contasAPagar(null)
// Com vencimento primeiro, do mais antigo; sem vencimento no fim. Paga não entra.
assert.deepEqual(ca.map((c) => [c.valor, c.vencimento]), [[300_00, '2026-10-10'], [200_00, '2026-11-20'], [5_000_00, null]])
assert.equal(ca[0].obra, 'Casa')
assert.equal(ca[0].fornecedor ?? null, null)
assert.deepEqual(contasAPagar(new Set([outra])), [], 'recorte por obra: o Sobrado está todo pago')
assert.equal(contasAPagar(null, obra).length, 3, 'filtro de uma obra')
db.prepare('DELETE FROM saida WHERE id IN (?, ?)').run(cedo, tarde)

// ── Concluir a obra (Jean, 18/10/2026: impedir até tudo estar fechado) ──
// A fundação está aberta e tem a empreita de 5.000 em aberto: duas pendências.
assert.deepEqual(pendenteParaConcluir(obra), { fasesAbertas: ['FUNDAÇÕES'], aPagar: 5_000_00 })
db.prepare("UPDATE saida SET pago_em = '2026-10-06' WHERE fase_id = ? AND pago_em IS NULL").run(fund)
db.prepare("UPDATE fase SET concluida_em = '2026-10-06' WHERE id = ?").run(fund)
assert.equal(pendenteParaConcluir(obra), null, 'tudo fechado: pode concluir')
// Fase inativa sem lançamento não segura a obra.
ins("INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem, inativa) VALUES (?,?,?,'TIRADA',9,1)", obra, catFund.id, 9)
assert.equal(pendenteParaConcluir(obra), null)

rmSync(dir, { recursive: true, force: true })
console.log('relatorio.test: ok')

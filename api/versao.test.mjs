// As versões do orçamento são GAVETAS: o orçamento vivo é o que a obra usa, e cada
// versão salva é um retrato dele. A FASE não entra nisso - ela é da obra, e todas as
// versões falam das mesmas. Os riscos que este check existe pra pegar:
//   1. uma gaveta entrar somada no orçado da obra (dobrando o número da home);
//   2. versionar ou excluir orçamento encostar em fase, saída ou entrada;
//   3. uma gaveta mudar sozinha quando o vivo é editado - aí não é histórico.
//
//   docker compose run --rm api node --experimental-sqlite versao.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')

const { default: db, novoOrcamento } = await import('./db.js')
const { CUSTO, default: rotas } = await import('./rotas/orcamento.js')
const { default: express } = await import('express')

const app = express()
app.use(express.json())
app.use(rotas)
const servidor = app.listen(0)
const base = `http://127.0.0.1:${servidor.address().port}`
const chamar = (metodo, url, body) =>
  fetch(base + url, {
    method: metodo,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-08-15')").run().lastInsertRowid,
)
const orcId = novoOrcamento(obraId)
// A fase nasce da OBRA: nenhum orçamento no INSERT, e é assim que ela sobrevive a
// todos eles.
const faseId = Number(
  db.prepare("INSERT INTO fase (obra_id, codigo, nome, ordem) VALUES (?,1,'FUNDAÇÃO',1)")
    .run(obraId).lastInsertRowid,
)
const servId = Number(
  db.prepare(
    "INSERT INTO servico (orcamento_id, fase_id, codigo, nome, unidade, qtd, ordem, custo_mat_unit) VALUES (?,?,1,'Escavação','M3',1,1,?)",
  ).run(orcId, faseId, 50_000_00).lastInsertRowid,
)
db.prepare("INSERT INTO composicao (servico_id, insumo_id, tipo_custo, qtd, custo_unit) VALUES (?,1,'materiais',3,?)")
  .run(servId, 1_000_00)
db.prepare("INSERT INTO saida (fase_id, valor, data, pago_em) VALUES (?,?, '2026-08-10','2026-08-10')")
  .run(faseId, 12_000_00)

// O orçado da obra: soma dos serviços do orçamento ATIVO. É a query da home.
const orcadoDaObra = () => db.prepare(`
  SELECT IFNULL(SUM(${CUSTO}),0) v FROM servico s
  JOIN orcamento o ON o.id = s.orcamento_id AND o.ativo = 1
  JOIN fase f ON f.id = s.fase_id
  WHERE f.inativa = 0 AND f.obra_id = ?
`).get(obraId).v
const totalDe = (id) => db.prepare(`
  SELECT IFNULL(SUM(${CUSTO}),0) v FROM servico s WHERE s.orcamento_id=?
`).get(id).v
const fasesDaObra = () => db.prepare('SELECT COUNT(*) n FROM fase WHERE obra_id=?').get(obraId).n

assert.equal(orcadoDaObra(), 50_000_00, 'orçado antes de versionar')

// --- guardar uma gaveta com o estado atual ------------------------------------------
const r1 = await chamar('POST', `/api/orcamento/${orcId}/versao`, { nome: 'Revisão com o cliente' })
assert.equal(r1.status, 200, 'POST /versao')
const gavetaId = (await r1.json()).id

const vivo = db.prepare('SELECT * FROM orcamento WHERE id=?').get(orcId)
assert.equal(vivo.ativo, 1, 'o vivo continua vivo')
const gaveta = db.prepare('SELECT * FROM orcamento WHERE id=?').get(gavetaId)
assert.equal(gaveta.ativo, 0, 'a gaveta nasce inativa')
assert.equal(gaveta.nome, 'Revisão com o cliente', 'o nome digitado é o da gaveta')

// 1. A home não dobra: a gaveta tem os mesmos 50.000 e não entra na conta.
assert.equal(orcadoDaObra(), 50_000_00, 'a gaveta não pode somar no orçado da obra')
assert.equal(totalDe(gavetaId), 50_000_00, 'a gaveta guarda os valores congelados')
assert.equal(
  db.prepare('SELECT COUNT(*) n FROM composicao c JOIN servico s ON s.id=c.servico_id WHERE s.orcamento_id=?')
    .get(gavetaId).n,
  1,
  'composição copiada - sem ela a gaveta não explica de onde saiu o custo',
)

// 2. A FASE não se clonou: as duas versões apontam pra ela. É a refatoração inteira.
assert.equal(fasesDaObra(), 1, 'versionar não cria fase')
assert.deepEqual(
  db.prepare('SELECT DISTINCT fase_id FROM servico').all().map((s) => s.fase_id), [faseId],
  'os serviços das duas versões moram na mesma fase da obra',
)

// 3. O lançamento não se duplicou nem mudou de dono.
assert.equal(db.prepare('SELECT COUNT(*) n FROM saida').get().n, 1)
assert.equal(db.prepare('SELECT fase_id FROM saida').get().fase_id, faseId, 'a saída fica na fase da obra')

// --- editar depois de guardar só mexe no vivo ---------------------------------------
db.prepare('UPDATE servico SET custo_mat_unit=? WHERE id=?').run(80_000_00, servId)
assert.equal(orcadoDaObra(), 80_000_00, 'o vivo aceita o valor novo')
assert.equal(totalDe(gavetaId), 50_000_00, 'a gaveta não muda sozinha - senão não é histórico')

// --- uma segunda gaveta guarda o estado NOVO, sem encostar na primeira --------------
const r2 = await chamar('POST', `/api/orcamento/${orcId}/versao`, { nome: 'Depois do reajuste' })
assert.equal(r2.status, 200)
const gaveta2 = (await r2.json()).id
assert.equal(totalDe(gaveta2), 80_000_00, 'a gaveta nova guarda o estado do momento')
assert.equal(totalDe(gavetaId), 50_000_00, 'a gaveta antiga não se mexe')
assert.equal(orcadoDaObra(), 80_000_00, 'a home segue contando só o vivo')
assert.equal(db.prepare('SELECT COUNT(*) n FROM saida').get().n, 1, 'versionar não encosta em lançamento')
assert.equal(fasesDaObra(), 1, 'nem a segunda versão cria fase')

// --- excluir uma versão do histórico -------------------------------------------------
assert.equal((await chamar('DELETE', `/api/orcamento/${gaveta2}`)).status, 200)
assert.equal(db.prepare('SELECT COUNT(*) n FROM orcamento WHERE id=?').get(gaveta2).n, 0)
assert.equal(totalDe(gaveta2), 0, 'os serviços da versão saem junto')
assert.equal(orcadoDaObra(), 80_000_00, 'excluir versão não mexe no orçamento da obra')
assert.equal(totalDe(gavetaId), 50_000_00, 'a outra versão continua inteira')

// --- a asserção que a refatoração criou: LANÇAMENTO NÃO TRAVA MAIS -------------------
// O vivo tem R$ 12.000 de saída lançada na fase. Excluí-lo apaga números, não dinheiro:
// a fase é da obra e a saída mora nela.
const r3 = await chamar('DELETE', `/api/orcamento/${orcId}`)
assert.equal(r3.status, 200, 'orçamento com lançamento na obra se exclui sim')
assert.equal((await r3.json()).promovido, gavetaId, 'a versão que sobrou é promovida')
assert.equal(db.prepare('SELECT COUNT(*) n FROM saida').get().n, 1, 'a saída continua lá')
assert.equal(db.prepare('SELECT fase_id FROM saida').get().fase_id, faseId, 'e na mesma fase')
assert.equal(fasesDaObra(), 1, 'a fase da obra não vai junto')
assert.equal(orcadoDaObra(), 50_000_00, 'a obra passa a valer o que a versão promovida diz')
assert.equal(
  db.prepare('SELECT COUNT(*) n FROM orcamento WHERE obra_id=? AND ativo=1').get(obraId).n, 1,
  'a obra tem exatamente um orçamento vivo',
)

// Excluir o último não promove ninguém: a obra fica sem orçamento - com as fases e os
// lançamentos intactos, esperando valor de novo.
const r5 = await chamar('DELETE', `/api/orcamento/${gavetaId}`)
assert.equal(r5.status, 200)
assert.equal((await r5.json()).promovido, null)
assert.equal(db.prepare('SELECT COUNT(*) n FROM orcamento WHERE obra_id=?').get(obraId).n, 0)
assert.equal(orcadoDaObra(), 0)
assert.equal(fasesDaObra(), 1, 'a obra sem orçamento nenhum ainda tem a fase dela')
assert.equal(db.prepare('SELECT COUNT(*) n FROM saida').get().n, 1, 'e a saída lançada nela')

// --- as recusas de nome --------------------------------------------------------------
const orc2 = novoOrcamento(obraId)
assert.equal((await chamar('POST', `/api/orcamento/${orc2}/versao`, { nome: '  ' })).status, 400,
  'versão sem nome não entra - o histórico inteiro é a lista de nomes')
assert.equal((await chamar('POST', '/api/orcamento/999999/versao', { nome: 'x' })).status, 404)
assert.equal((await chamar('DELETE', '/api/orcamento/999999')).status, 404)

// --- o valor da fase é de UMA versão --------------------------------------------------
// Mesma fase, dois orçamentos, dois números. Era isto que a fase clonada fingia fazer.
const orc3 = novoOrcamento(obraId)
assert.equal((await chamar('PUT', `/api/orcamento/${orc2}/fase/${faseId}/orcado`, { valor: 7_000_00 })).status, 200)
assert.equal((await chamar('PUT', `/api/orcamento/${orc3}/fase/${faseId}/orcado`, { valor: 9_000_00 })).status, 200)
assert.equal(totalDe(orc2), 7_000_00)
assert.equal(totalDe(orc3), 9_000_00)
assert.equal(fasesDaObra(), 1, 'e continua sendo uma fase só')

servidor.close()
db.close()
rmSync(dir, { recursive: true, force: true })
console.log('ok - a fase é da obra: versão é retrato de valores, e excluir orçamento não toca em lançamento')

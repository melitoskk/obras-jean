// Percentual por fase (UPDATE.md §2) e taxa de administração (§4). O que este check
// existe pra pegar:
//   1. a distribuição padrão do catálogo deixar de somar 100% ao ser revisada;
//   2. a fase não herdar o padrão, ou o editado não ir e voltar;
//   3. o PATCH da fase, agora parcial, reabrir a fase ao gravar só o percentual;
//   4. a taxa não gravar em ponto-base, ou versionar esquecê-la na gaveta.
//
//   docker compose run --rm api node --experimental-sqlite percentual.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')

const { default: db, novoOrcamento } = await import('./db.js')
const { default: rotas } = await import('./rotas/orcamento.js')
const { CATALOGO, PERCENTUAL_PADRAO } = await import('./catalogo.js')
const { default: express } = await import('express')

const { TODAS } = await import('./auth.js')

const app = express()
app.use(express.json())
// Sem login neste teste: quem chama tem todas as permissões (auth.js decide o resto).
app.use((req, _res, next) => { req.permissoes = new Set(TODAS); next() })
app.use(rotas)
const servidor = app.listen(0)
const base = `http://127.0.0.1:${servidor.address().port}`
const chamar = async (metodo, url, body, status = 200) => {
  const r = await fetch(base + url, {
    method: metodo,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  assert.equal(r.status, status, `${metodo} ${url}`)
  return r.json()
}

// --- 1. a distribuição padrão -----------------------------------------------------
assert.deepEqual(Object.keys(PERCENTUAL_PADRAO).sort(), CATALOGO.map(([nome]) => nome).sort(),
  'toda fase do catálogo tem padrão, e nenhum padrão aponta pra fase que não existe')
assert.equal(Object.values(PERCENTUAL_PADRAO).reduce((a, b) => a + b, 0), 10000, 'soma 100,00%')
const cat = await chamar('GET', '/api/catalogo')
const fundacao = cat.fases.find((f) => f.nome === 'FUNDAÇÕES - INFRA ESTRUTURA')
const estrutura = cat.fases.find((f) => f.nome === 'ESTRUTURA')
assert.equal(fundacao.percentual, 1200, 'o padrão chega no banco')

// --- 2. a fase herda e edita ------------------------------------------------------
const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-10-03')").run().lastInsertRowid,
)
const orcId = novoOrcamento(obraId)
await chamar('PUT', `/api/orcamento/${orcId}/fases`, { fases: [fundacao.id, estrutura.id], servicos: [] })
let orc = await chamar('GET', `/api/orcamento/${orcId}`)
const faseFund = orc.fases.find((f) => f.catalogo_id === fundacao.id)
assert.equal(faseFund.percentual, 1200, 'fase nova herda o padrão')

await chamar('PATCH', `/api/fases/${faseFund.id}`, { concluida_em: '2026-10-01' })
await chamar('PATCH', `/api/fases/${faseFund.id}`, { percentual: 1450 })
orc = await chamar('GET', `/api/orcamento/${orcId}`)
const f = orc.fases.find((x) => x.id === faseFund.id)
assert.equal(f.percentual, 1450, 'o editado vence o padrão')
assert.equal(f.concluida_em, '2026-10-01', 'gravar o percentual não reabre a fase')

await chamar('PATCH', `/api/fases/${faseFund.id}`, { percentual: null })
orc = await chamar('GET', `/api/orcamento/${orcId}`)
assert.equal(orc.fases.find((x) => x.id === faseFund.id).percentual, 1200, 'null volta ao padrão')
await chamar('PATCH', `/api/fases/${faseFund.id}`, {}, 400)
await chamar('PATCH', `/api/fases/${faseFund.id}`, { concluida_em: '01/10/2026' }, 400)

// Taxa da fase, escolhida ao concluir: fixo em centavos, percentual em ponto-base.
await chamar('PATCH', `/api/fases/${faseFund.id}`, { taxa_tipo: 'fixo', taxa_valor: 5_000_00 })
let tx = db.prepare('SELECT taxa_tipo, taxa_valor FROM fase WHERE id=?').get(faseFund.id)
assert.deepEqual({ ...tx }, { taxa_tipo: 'fixo', taxa_valor: 5_000_00 })
await chamar('PATCH', `/api/fases/${faseFund.id}`, { taxa_tipo: 'pct', taxa_valor: -5 })
assert.equal(db.prepare('SELECT taxa_valor FROM fase WHERE id=?').get(faseFund.id).taxa_valor, 0, 'sem taxa negativa')
await chamar('PATCH', `/api/fases/${faseFund.id}`, { taxa_tipo: 'outro', taxa_valor: 1 }, 400)
await chamar('PATCH', `/api/fases/${faseFund.id}`, { taxa_tipo: null })
tx = db.prepare('SELECT taxa_tipo, taxa_valor FROM fase WHERE id=?').get(faseFund.id)
assert.deepEqual({ ...tx }, { taxa_tipo: null, taxa_valor: null }, 'null tira a regra')

// --- 3. a taxa de administração ---------------------------------------------------
await chamar('PATCH', `/api/orcamento/${orcId}`, { taxa_adm: 1500.4 })
orc = await chamar('GET', `/api/orcamento/${orcId}`)
assert.equal(orc.orcamento.taxa_adm, 1500, 'ponto-base inteiro')
await chamar('PATCH', `/api/orcamento/${orcId}`, { taxa_adm: -3 })
assert.equal((await chamar('GET', `/api/orcamento/${orcId}`)).orcamento.taxa_adm, 0, 'sem taxa negativa')

await chamar('PATCH', `/api/orcamento/${orcId}`, { taxa_adm: 1200 })
const { id: gavetaId } = await chamar('POST', `/api/orcamento/${orcId}/versao`, { nome: 'Antes' })
await chamar('PATCH', `/api/orcamento/${orcId}`, { taxa_adm: 1800 })
const gaveta = await chamar('GET', `/api/orcamento/${gavetaId}`)
assert.equal(gaveta.orcamento.taxa_adm, 1200, 'a gaveta guarda a taxa de quando foi tirada')

servidor.close()
rmSync(dir, { recursive: true, force: true })
console.log('percentual.test: ok')

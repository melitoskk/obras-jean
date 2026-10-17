// O catálogo revisado (UPDATE.md §1) e a subopção do serviço (§1.11). O que este check
// existe pra pegar:
//   1. a semente perder a forma `{ nome, opcoes, unidade }` e gravar "[object Object]";
//   2. a subopção não ir e voltar pela tela (GET traz a lista, PUT grava a escolha);
//   3. versionar o orçamento esquecer a subopção na gaveta.
//
//   docker compose run --rm api node --experimental-sqlite catalogo.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')

const { default: db, novoOrcamento } = await import('./db.js')
const { default: rotas } = await import('./rotas/orcamento.js')
const { default: express } = await import('express')

const app = express()
app.use(express.json())
app.use(rotas)
const servidor = app.listen(0)
const base = `http://127.0.0.1:${servidor.address().port}`
const chamar = async (metodo, url, body) => {
  const r = await fetch(base + url, {
    method: metodo,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  assert.equal(r.status, 200, `${metodo} ${url}`)
  return r.json()
}

// --- 1. a semente ------------------------------------------------------------------
const cat = await chamar('GET', '/api/catalogo')
assert.equal(cat.fases.length, 21, 'PORTAS DE MADEIRA saiu: 21 fases')
assert.ok(!cat.servicos.some((s) => s.nome.includes('[object')), 'serviço objeto gravado como texto')

const fase = (nome) => cat.fases.find((f) => f.nome === nome)
const servico = (f, nome) => cat.servicos.find((s) => s.fase_catalogo_id === fase(f).id && s.nome === nome)

assert.equal(fase('PAVIMENTAÇÃO').codigo, 13, 'as fases de baixo subiram um número')
assert.deepEqual(servico('PAVIMENTAÇÃO', 'Calçada').opcoes,
  ['basalto', 'tijolo maciço', 'bloqueto', 'concreto', 'outros'])
assert.equal(servico('PAVIMENTAÇÃO', 'Pavimento intertravado'), undefined, 'intertravado é calçada · bloqueto')
assert.equal(servico('ESQUADRIAS', 'Ferragens').unidade, 'UN', 'unidade do serviço vence a da fase')
assert.equal(servico('ESQUADRIAS', 'Grades e portões').unidade, 'M2')
assert.equal(servico('PAVIMENTAÇÃO', 'Meio-fio').unidade, 'M', 'meio-fio é metro linear (Dúvida 18)')
assert.equal(servico('ESQUADRIAS', 'Grades e portões').opcoes, null, 'sem lista = null, não []')
assert.equal(servico('FUNDAÇÕES - INFRA ESTRUTURA', 'Estaqueamento').codigo, 3)
assert.equal(servico('PINTURA', 'Selador').codigo, 1, 'selador antes da massa')
assert.ok(servico('SERVIÇOS', 'Sondagem') && !servico('CONTROLE TECNOLÓGICO', 'Sondagem'), 'sondagem subiu')
assert.ok(fase('VIDROS E GUARDA-CORPOS'), 'VIDROS renomeada')
for (const f of cat.fases) {
  const ultimo = cat.servicos.filter((s) => s.fase_catalogo_id === f.id).at(-1)
  assert.match(ultimo.nome, /^Outros/, `${f.nome} termina com Outros`)
}

// --- 2. ida e volta pela tela --------------------------------------------------------
const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-10-03')").run().lastInsertRowid,
)
const orcId = novoOrcamento(obraId)
const calcada = servico('PAVIMENTAÇÃO', 'Calçada')
const meioFio = servico('PAVIMENTAÇÃO', 'Meio-fio')
await chamar('PUT', `/api/orcamento/${orcId}/fases`, {
  fases: [fase('PAVIMENTAÇÃO').id], servicos: [calcada.id, meioFio.id],
})

let orc = await chamar('GET', `/api/orcamento/${orcId}`)
const sCalcada = orc.servicos.find((s) => s.catalogo_id === calcada.id)
const sMeioFio = orc.servicos.find((s) => s.catalogo_id === meioFio.id)
assert.deepEqual(sCalcada.opcoes, calcada.opcoes, 'o serviço do orçamento traz a lista do catálogo')
assert.equal(sCalcada.opcao, null, 'nasce sem escolha')

await chamar('PUT', `/api/orcamento/${orcId}/servicos`, {
  servicos: [
    { id: sCalcada.id, qtd: 1, custo_mo_unit: 0, custo_mat_unit: 1_000_00, opcao: '  pedra portuguesa ' },
    { id: sMeioFio.id, opcao: '   ' },
  ],
})
orc = await chamar('GET', `/api/orcamento/${orcId}`)
const depois = orc.servicos.find((s) => s.id === sCalcada.id)
assert.equal(depois.opcao, 'pedra portuguesa', '`outros` vira a palavra digitada, aparada')
assert.equal(depois.custo, 1_000_00, 'valor e subopção na mesma linha do lote')
assert.equal(orc.servicos.find((s) => s.id === sMeioFio.id).opcao, null, 'em branco é null')

// --- 3. a gaveta guarda a subopção ---------------------------------------------------
const { id: gavetaId } = await chamar('POST', `/api/orcamento/${orcId}/versao`, { nome: 'Antes' })
await chamar('PUT', `/api/orcamento/${orcId}/servicos`, { servicos: [{ id: sCalcada.id, opcao: 'basalto' }] })
const gaveta = await chamar('GET', `/api/orcamento/${gavetaId}`)
assert.equal(gaveta.servicos.find((s) => s.catalogo_id === calcada.id).opcao, 'pedra portuguesa',
  'a gaveta é retrato: não muda quando o vivo muda')

servidor.close()
rmSync(dir, { recursive: true, force: true })
console.log('catalogo.test: ok')

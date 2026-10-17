// O caixa da obra é a soma dos caixas das FASES - todo lançamento pertence a uma.
// E saldo ≠ caixa: saldo conta a nota que chegou, caixa só o dinheiro que saiu. Este
// check existe porque as duas contas usam as mesmas parcelas e trocá-las não quebra
// nada visível: a tela mostra um número plausível e errado.
//
//   docker compose run --rm api node --experimental-sqlite fluxo.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
process.env.OBRAS_DB = join(dir, 'teste.db')
const { default: db } = await import('./db.js')
const { caixaDaObra } = await import('./rotas/orcamento.js')

const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-08-22')").run().lastInsertRowid,
)
const novaFase = (nome, ordem, inativa = 0) => Number(
  db.prepare('INSERT INTO fase (obra_id, codigo, nome, ordem, inativa) VALUES (?,?,?,?,?)')
    .run(obraId, ordem, nome, ordem, inativa).lastInsertRowid,
)
// `criado_em` cresce a cada lançamento, como no servidor - é o instante, não o dia.
let t = 0
const instante = () => new Date(Date.UTC(2026, 7, 22, 9, ++t)).toISOString()
const entrada = (fase, valor) =>
  db.prepare("INSERT INTO entrada (obra_id, fase_id, valor, data, criado_em) VALUES (?,?,?,'2026-08-01',?)")
    .run(obraId, fase, valor, instante())
const saida = (fase, valor, pago_em) =>
  db.prepare("INSERT INTO saida (fase_id, valor, data, pago_em, criado_em) VALUES (?,?,'2026-08-02',?,?)")
    .run(fase, valor, pago_em, instante())

const fundacao = novaFase('FUNDAÇÃO', 1)
const estrutura = novaFase('ESTRUTURA', 2)
novaFase('ACABAMENTO', 3) // fase sem lançamento nenhum: vale zero, não some da lista

entrada(fundacao, 50_000_00)
saida(fundacao, 20_000_00, '2026-08-05') // paga
saida(fundacao, 5_000_00, null)          // em aberto: pesa no saldo, ainda não no caixa
entrada(estrutura, 10_000_00)
saida(estrutura, 30_000_00, '2026-08-06') // estoura a fase - sinaliza, não bloqueia

const dados0 = caixaDaObra(obraId)
const { porFase, fases } = dados0
const de = (fid) => porFase.find((p) => p.fase_id === fid)

assert.equal(fases.length, 3, 'as três fases ativas vêm no payload')
assert.equal(de(fundacao).aportado, 50_000_00)
assert.equal(de(fundacao).realizado, 25_000_00, 'realizado conta a conta em aberto também')
assert.equal(de(fundacao).aberto, 5_000_00)

// Saldo (competência) e caixa (só o pago) são números DIFERENTES na mesma fase.
const saldo = (f) => de(f).aportado - de(f).realizado
const caixa = (f) => de(f).aportado - (de(f).realizado - de(f).aberto)
assert.equal(saldo(fundacao), 25_000_00)
assert.equal(caixa(fundacao), 30_000_00)
assert.equal(saldo(estrutura), -20_000_00, 'fase no vermelho fica no vermelho')

// O caixa da obra é a soma das fases - inclusive a que não teve lançamento.
assert.equal(fases.reduce((a, f) => a + saldo(f.id), 0), 5_000_00)
assert.equal(fases.reduce((a, f) => a + caixa(f.id), 0), 10_000_00)

// Extrato da FUNDAÇÃO na ordem de lançamento, do último pro primeiro: entrada de 50k,
// saída de 20k, saída de 5k. Ordenar por id embaralharia - a entrada é id 1 e as saídas
// são 1 e 2 na tabela delas, e o 1 de uma não vem antes do 1 da outra.
const quando = (l) => l.criado_em ?? l.data
const extrato = [
  ...dados0.entradas.filter((e) => e.fase_id === fundacao).map((e) => ({ ...e, tipo: 'entrada' })),
  ...dados0.saidas.filter((s) => s.fase_id === fundacao).map((s) => ({ ...s, tipo: 'saida' })),
].sort((a, b) => quando(b).localeCompare(quando(a)) || b.id - a.id)
assert.deepEqual(
  extrato.map((l) => [l.tipo, l.valor]),
  [['saida', 5_000_00], ['saida', 20_000_00], ['entrada', 50_000_00]],
  'extrato fora da ordem de lançamento',
)

// Orçado da fase: soma dos serviços do orçamento VIVO. A versão arquivada existe pra
// provar que não entra na conta - senão a coluna soma o histórico inteiro.
let n = 0
const novoOrcamento = (ativo) => Number(
  db.prepare("INSERT INTO orcamento (obra_id, numero, criado_em, ativo) VALUES (?,?,'2026-08-22',?)")
    .run(obraId, `ORC-${++n}`, ativo).lastInsertRowid,
)
const servico = (oid, fase, qtd, mo, mat) =>
  db.prepare("INSERT INTO servico (orcamento_id, fase_id, codigo, nome, qtd, custo_mo_unit, custo_mat_unit) VALUES (?,?,'1','Geral',?,?,?)")
    .run(oid, fase, qtd, mo, mat)

const vivo = novoOrcamento(1)
servico(vivo, fundacao, 10, 1_000_00, 500_00) // 10k + 5k
servico(vivo, fundacao, 3, 100_00, 0)         // +300
servico(novoOrcamento(0), fundacao, 99, 1_000_00, 0) // versão arquivada: não conta

const comOrcado = caixaDaObra(obraId).porFase
assert.equal(comOrcado.find((p) => p.fase_id === fundacao).orcado, 15_300_00, 'orçado só do orçamento vivo')
assert.equal(comOrcado.find((p) => p.fase_id === estrutura).orcado, 0, 'fase sem serviço vale zero, não null')

// Fase inativa continua com o dinheiro dela: some da lista, não do caixa da obra.
const demolicao = novaFase('DEMOLIÇÃO', 4, 1)
saida(demolicao, 1_000_00, '2026-08-07')
const depois = caixaDaObra(obraId)
assert.equal(depois.fases.length, 3, 'fase inativa não entra na lista de fases')
assert.equal(depois.porFase.length, 4, 'mas o dinheiro dela continua no porFase')

// Fase concluída é MARCA (UPDATE.md §11.2): continua na lista, com a data, e o
// dinheiro dela não muda - nota atrasada lançada depois de concluir soma igual.
db.prepare("UPDATE fase SET concluida_em='2026-08-10' WHERE id=?").run(fundacao)
saida(fundacao, 1_000_00, null)
const concluida = caixaDaObra(obraId)
assert.equal(concluida.fases.find((f) => f.id === fundacao).concluida_em, '2026-08-10')
assert.equal(concluida.fases.length, 3, 'concluída não some da lista')
assert.equal(concluida.porFase.find((p) => p.fase_id === fundacao).realizado, 26_000_00, 'lançar em concluída soma')

// A observação do pagamento ("pix", "cheque 4412") vem no payload: é dele que o
// painel abre pra editar, e sem ela o campo voltava vazio e o salvar apagava a gravada.
const comObs = Number(
  db.prepare("INSERT INTO saida (fase_id, valor, data, pago_em, pago_obs, criado_em) VALUES (?,?,'2026-08-11','2026-08-11','pix',?)")
    .run(estrutura, 2_800_00, instante()).lastInsertRowid,
)
assert.equal(caixaDaObra(obraId).saidas.find((s) => s.id === comObs).pago_obs, 'pix', 'pago_obs some do fluxo')

db.close()
rmSync(dir, { recursive: true, force: true })
console.log('ok - saldo por fase, caixa por fase, soma da obra e ordem de lançamento')

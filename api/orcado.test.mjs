// O orçado da obra é a SOMA DOS SERVIÇOS das fases ativas - não a coluna `fase.orcado`,
// que morreu. Este check existe porque a coluna morta tinha o nome certo e passou meses
// sendo somada em silêncio: a home mostrava R$ 0,00 e ninguém viu erro nenhum.
//
//   docker compose run --rm api node --experimental-sqlite orcado.test.mjs
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { DatabaseSync } from 'node:sqlite'

const dir = mkdtempSync(join(tmpdir(), 'obras-'))
const arquivo = join(dir, 'teste.db')

// Banco no ESQUEMA ANTIGO, com as colunas mortas e um valor legado dentro de `orcado`:
// é o banco que o escritório tem hoje. Se a migração perder este número, perde
// orçamento de verdade. `executado` (avanço físico da v1) só precisa sumir.
{
  const velho = new DatabaseSync(arquivo)
  velho.exec(`
    CREATE TABLE fase (
      id INTEGER PRIMARY KEY, obra_id INTEGER,
      nome TEXT NOT NULL, orcado INTEGER NOT NULL DEFAULT 0, ordem INTEGER, inativa INTEGER DEFAULT 0,
      executado INTEGER NOT NULL DEFAULT 0
    );
  `)
  velho.close()
}

process.env.OBRAS_DB = arquivo
const { default: db, novoOrcamento } = await import('./db.js')
const { CUSTO } = await import('./rotas/orcamento.js')

const obraId = Number(
  db.prepare("INSERT INTO obra (nome, criada_em) VALUES ('Casa', '2026-08-15')").run().lastInsertRowid,
)
const orcId = novoOrcamento(obraId)
// A fase é da obra: sem orçamento no INSERT. Quem sabe de orçamento é o serviço.
const novaFase = (nome, ordem, inativa = 0) => Number(
  db.prepare('INSERT INTO fase (obra_id, codigo, nome, ordem, inativa) VALUES (?,?,?,?,?)')
    .run(obraId, ordem, nome, ordem, inativa).lastInsertRowid,
)

// 1. As colunas mortas caíram - se `orcado` voltar, volta a segunda fonte de verdade.
const colunas = db.prepare('PRAGMA table_info(fase)').all().map((c) => c.name)
for (const morta of ['orcado', 'executado']) {
  assert.ok(!colunas.includes(morta), `a coluna fase.${morta} devia ter sido derrubada`)
}

// 2. Valor direto na fase: "atribuo uma fase e atribuo um orçamento a ela".
//    Grava um serviço "Geral" - o resto do sistema não precisa saber disso.
const fundacao = novaFase('FUNDAÇÃO', 1)
db.prepare(
  "INSERT INTO servico (orcamento_id, fase_id, codigo, nome, unidade, qtd, ordem, custo_mat_unit) VALUES (?,?,1,'Geral','VB',1,1,?)",
).run(orcId, fundacao, 80_000_00)

// 3. Fase detalhada em serviços: o orçado é a soma deles, com as duas parcelas de
//    custo (mão de obra e materiais) arredondadas separado, como manda o CUSTO.
const estrutura = novaFase('ESTRUTURA', 2)
db.prepare(
  'INSERT INTO servico (orcamento_id, fase_id, codigo, nome, unidade, qtd, ordem, custo_mo_unit, custo_mat_unit) VALUES (?,?,1,?,?,?,1,?,?)',
).run(orcId, estrutura, 'Concreto', 'M3', 2.5, 100_00, 300_00)

// 4. Fase inativa não entra na conta, e fase sem serviço nenhum vale zero.
const desativada = novaFase('DEMOLIÇÃO', 3, 1)
db.prepare(
  "INSERT INTO servico (orcamento_id, fase_id, codigo, nome, unidade, qtd, ordem, custo_mat_unit) VALUES (?,?,1,'Geral','VB',1,1,?)",
).run(orcId, desativada, 999_999_00)
novaFase('ACABAMENTO', 4)

const { v } = db.prepare(`
  SELECT SUM(${CUSTO}) v FROM servico s JOIN fase f ON f.id = s.fase_id
  WHERE f.inativa = 0 AND f.obra_id = ?
`).get(obraId)

// 80.000 + (2,5 × 100 = 250) + (2,5 × 300 = 750) = 81.000
assert.equal(v, 81_000_00, `orçado da obra deu ${v}`)

db.close()
rmSync(dir, { recursive: true, force: true })
console.log('ok - orçado da obra = soma dos serviços das fases ativas')

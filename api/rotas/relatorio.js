import express from 'express'
import db from '../db.js'
import { CUSTO } from './orcamento.js'

// Relatórios operacionais do escritório (UPDATE.md §11.3, itens 1, 2, 4 e 5). O 3 - o
// extrato do credor - já tem rota própria em fornecedor.js e a tela só o reaproveita.
//
// Sintético × analítico (item 4) NÃO é parâmetro de rota: o servidor devolve sempre no
// nível do lançamento e a tela agrupa. Assim os dois níveis saem da MESMA consulta e
// não há dois totais pra divergir.
const r = express.Router()

const ISO = /^\d{4}-\d{2}-\d{2}$/
const dataDe = (v) => (ISO.test(v ?? '') ? v : null)
const obraDe = (req) => Number(req.query.obra) || null

// ── 1. Quanto já foi pago em X / para quem ──────────────────────────────────────────
// Cada linha é (grupo, saída, parte do valor). Uma saída cai em vários grupos quando a
// dimensão desce abaixo dela (insumo, credor das linhas) - e o que sobra da nota sem
// dono naquela dimensão vai pro grupo "sem ...", pra o total do relatório ser SEMPRE a
// soma das saídas filtradas. Relatório que soma diferente do Fluxo de caixa é mentira.
//
// O período filtra pela data da NOTA (`s.data`), a mesma do extrato; `pago` diz se a
// parte já saiu do caixa. Lançado, pago e em aberto saem os três da mesma linha.
export const DIMENSOES = ['fase', 'servico', 'insumo', 'credor']

export function pagamentos({ por = 'fase', obra = null, de = null, ate = null } = {}) {
  const saidas = db.prepare(`
    SELECT s.id, s.numero, s.data, s.descricao, s.valor, s.pago_em,
      o.id AS obra_id, o.nome AS obra, f.nome AS fase, sc.nome AS servico
    FROM saida s JOIN fase f ON f.id = s.fase_id JOIN obra o ON o.id = f.obra_id
    LEFT JOIN servico_catalogo sc ON sc.id = s.servico_catalogo_id
    WHERE (:obra IS NULL OR o.id = :obra)
      AND (:de IS NULL OR s.data >= :de) AND (:ate IS NULL OR s.data <= :ate)
    ORDER BY s.data, s.criado_em, s.id
  `).all({ obra, de, ate })

  // A fase e o serviço agrupam pelo NOME, sem código: com "todas as obras" a fundação
  // de cada obra é uma fase diferente, e a pergunta é quanto foi pra fundação. O código
  // não serve de chave - `fase.codigo` é a posição da fase NA OBRA (a ESTRUTURA é 1 numa
  // e 4 noutra). Serviço leva a fase junto: `Outros` existe em toda fase.
  const partes = {
    fase: (s) => [[s.fase, s.valor]],
    servico: (s) => [[`${s.fase} › ${s.servico ?? 'fase inteira (sem serviço)'}`, s.valor]],
    insumo: partesPor(`
      SELECT si.saida_id, i.nome AS grupo, CAST(ROUND(si.qtd * si.valor_unit) AS INTEGER) AS valor
      FROM saida_item si LEFT JOIN insumo i ON i.id = si.item_id
    `, 'Sem insumo cadastrado', 'Sem itens (valor direto)'),
    credor: partesPor(`
      SELECT c.saida_id, f.nome AS grupo, c.valor FROM saida_credor c JOIN fornecedor f ON f.id = c.fornecedor_id
    `, null, 'Sem credor'),
  }[por]

  return saidas.flatMap((s) => partes(s).map(([grupo, valor]) => ({
    grupo, valor, pago: !!s.pago_em,
    id: s.id, numero: s.numero, data: s.data, descricao: s.descricao,
    obra: s.obra, fase: s.fase,
  })))
}

// Dimensão que desce da saída: lê as partes de uma vez (sem N+1) e completa cada nota
// com o resto. `semNome` é o rótulo da linha sem grupo (insumo avulso); `resto`, o do
// que nenhuma linha cobre (nota sem itens, linhas sem fornecedor).
function partesPor(sql, semNome, resto) {
  const porSaida = new Map()
  for (const p of db.prepare(sql).all()) {
    if (!porSaida.has(p.saida_id)) porSaida.set(p.saida_id, [])
    porSaida.get(p.saida_id).push([p.grupo ?? semNome, p.valor])
  }
  return (s) => {
    const ps = porSaida.get(s.id) ?? []
    const falta = s.valor - ps.reduce((a, [, v]) => a + v, 0)
    return falta ? [...ps, [resto, falta]] : ps
  }
}

r.get('/api/relatorios/pagamentos', (req, res) => {
  const por = DIMENSOES.includes(req.query.por) ? req.query.por : 'fase'
  res.json(pagamentos({ por, obra: obraDe(req), de: dataDe(req.query.de), ate: dataDe(req.query.ate) }))
})

// Taxa de administração devida pela fase (decidido com o Jean em 17/10/2026): só
// existe com a fase CONCLUÍDA; 'fixo' é o valor, 'pct' incide sobre o que foi PAGO.
// Nota paga depois de concluir entra na conta: a nota atrasada é da fase (§11.2).
export function taxaDevida({ concluida_em, taxa_tipo, taxa_valor }, pago) {
  if (!concluida_em || !taxa_tipo) return 0
  // Inteiro × inteiro antes de dividir: centavo × ponto-base não passa de 2^53.
  return taxa_tipo === 'fixo' ? taxa_valor ?? 0 : Math.round((pago * (taxa_valor ?? 0)) / 10000)
}

// Quanto o cliente ainda deve, PREVISTO (validação, rodada 1 A6; rodada 2 A1/A17): por
// administração não há preço fechado, então soma-se fase a fase o que ela vai custar
// mais a taxa, e tira-se o que já entrou. Fase aberta custa o orçado, ou o gasto se já
// passou dele, com a taxa da estimativa por cima (o tipo só se escolhe ao concluir).
// Fase concluída custa o que gastou - o orçado não vem mais - e leva a taxa escolhida
// ao concluir; no percentual, sobre o gasto todo, porque a nota em aberto vai ser paga.
// Obra concluída: toda fase já custou o que custou, aberta ou não.
// Negativo = recebeu além do previsto; não se esconde.
export function aReceberPrevisto(fases, taxaAdm, recebido, obraConcluida = false) {
  const previsto = fases.reduce((a, f) => {
    if (f.concluida_em || obraConcluida) return a + f.gasto + taxaDevida(f, f.gasto)
    const custo = Math.max(f.orcado, f.gasto)
    return a + custo + Math.round((custo * taxaAdm) / 10000)
  }, 0)
  return previsto - recebido
}

// ── 2 e 5. Estimado × realizado, e a taxa de administração ──────────────────────────
// Uma obra por vez: o estimado é de UMA estimativa (a viva), e somar fases de obras
// diferentes não responde pergunta nenhuma. O relatório 5 é este mesmo payload com a
// taxa aplicada (UPDATE.md §4): taxa × estimado contra taxa × realizado, por fase,
// mais a taxa DEVIDA de cada fase concluída (`taxaDevida`, a regra escolhida ao concluir).
//
// Por fase, os serviços; por serviço, os lançamentos. A chave do serviço é o id de
// CATÁLOGO, que é o que a saída grava (§6). Serviço sem catálogo (o `Geral` do valor
// direto na fase) e saída sem serviço caem juntos na linha "fase inteira".
export function estimadoRealizado(obraId) {
  const obra = db.prepare('SELECT id, nome FROM obra WHERE id = ?').get(obraId)
  if (!obra) return null
  const viva = db.prepare('SELECT id, numero, nome, taxa_adm FROM orcamento WHERE obra_id = ? AND ativo = 1').get(obraId)

  // Fase inativa entra se tiver lançamento: sumir com ela sumiria com dinheiro gasto.
  const fases = db.prepare(`
    SELECT f.id, f.codigo, f.nome, f.concluida_em, f.taxa_tipo, f.taxa_valor FROM fase f
    WHERE f.obra_id = ? AND (f.inativa = 0 OR EXISTS (SELECT 1 FROM saida s WHERE s.fase_id = f.id))
    ORDER BY f.codigo, f.ordem, f.id
  `).all(obraId)

  const estimados = viva ? db.prepare(`
    SELECT s.fase_id, s.catalogo_id, s.codigo, s.nome, s.opcao, ${CUSTO} AS valor
    FROM servico s WHERE s.orcamento_id = ? ORDER BY s.codigo, s.id
  `).all(viva.id) : []

  const saidas = db.prepare(`
    SELECT s.id, s.numero, s.data, s.descricao, s.valor, s.pago_em, s.fase_id,
      s.servico_catalogo_id, sc.codigo AS servico_codigo, sc.nome AS servico
    FROM saida s JOIN fase f ON f.id = s.fase_id
    LEFT JOIN servico_catalogo sc ON sc.id = s.servico_catalogo_id
    WHERE f.obra_id = ? ORDER BY s.data, s.criado_em, s.id
  `).all(obraId)

  const INTEIRA = 'fase'
  const resultado = fases.map((f) => {
    const servicos = new Map()
    const servico = (chave, codigo, nome) => {
      if (!servicos.has(chave)) servicos.set(chave, { chave, codigo, nome, estimado: 0, realizado: 0, lancamentos: [] })
      return servicos.get(chave)
    }
    for (const e of estimados.filter((e) => e.fase_id === f.id)) {
      const sv = e.catalogo_id
        ? servico(e.catalogo_id, e.codigo, e.opcao ? `${e.nome} (${e.opcao})` : e.nome)
        : servico(INTEIRA, null, 'Fase inteira (sem serviço)')
      sv.estimado += e.valor
    }
    for (const s of saidas.filter((s) => s.fase_id === f.id)) {
      const sv = s.servico_catalogo_id
        ? servico(s.servico_catalogo_id, s.servico_codigo, s.servico)
        : servico(INTEIRA, null, 'Fase inteira (sem serviço)')
      sv.realizado += s.valor
      sv.lancamentos.push({ id: s.id, numero: s.numero, data: s.data, descricao: s.descricao, valor: s.valor, pago: !!s.pago_em })
    }
    // "Fase inteira" por último: é o resto, não um serviço.
    const lista = [...servicos.values()].sort((a, b) =>
      (a.chave === INTEIRA) - (b.chave === INTEIRA) || (a.codigo ?? 0) - (b.codigo ?? 0))
    const pago = saidas.filter((s) => s.fase_id === f.id && s.pago_em).reduce((a, s) => a + s.valor, 0)
    return {
      id: f.id, codigo: f.codigo, nome: f.nome, concluida_em: f.concluida_em,
      estimado: lista.reduce((a, s) => a + s.estimado, 0),
      realizado: lista.reduce((a, s) => a + s.realizado, 0),
      pago, taxa_tipo: f.taxa_tipo, taxa_valor: f.taxa_valor, taxa_devida: taxaDevida(f, pago),
      servicos: lista,
    }
  })

  return { obra, estimativa: viva ?? null, taxa_adm: viva?.taxa_adm ?? 0, fases: resultado }
}

r.get('/api/relatorios/estimado', (req, res) => {
  const dados = estimadoRealizado(obraDe(req))
  if (!dados) return res.status(404).json({ erro: 'obra não encontrada' })
  res.json(dados)
})

// ── Extrato da fase ─────────────────────────────────────────────────────────────────
// Entradas e saídas de UMA fase numa lista só, com cara de extrato de banco: da mais
// antiga pra mais nova, pela data da NOTA (a do documento, que é a que se confere), e
// o saldo correndo linha a linha. Saldo = entradas − tudo lançado, a MESMA conta do
// Saldo do topo da obra (§11.1) - extrato que fecha diferente do topo é mentira.
//
// Sem `fase`, devolve só a obra e as fases dela, pro combo. Fase inativa entra se tiver
// lançamento, como no relatório 2: sumir com ela sumiria com dinheiro.
export function extratoFase(obraId, faseId = null) {
  const obra = db.prepare(`
    SELECT o.id, o.nome, c.nome AS cliente
    FROM obra o LEFT JOIN cliente c ON c.id = o.cliente_id WHERE o.id = ?
  `).get(obraId)
  if (!obra) return null
  const fases = db.prepare(`
    SELECT f.id, f.codigo, f.nome, f.concluida_em FROM fase f
    WHERE f.obra_id = ? AND (f.inativa = 0
      OR EXISTS (SELECT 1 FROM saida s WHERE s.fase_id = f.id)
      OR EXISTS (SELECT 1 FROM entrada e WHERE e.fase_id = f.id))
    ORDER BY f.codigo, f.ordem, f.id
  `).all(obraId)
  const fase = fases.find((f) => f.id === faseId) ?? null
  if (!fase) return { obra, fases, fase: null, lancamentos: [] }

  const entradas = db.prepare(`
    SELECT 'entrada' AS tipo, id, numero, data, criado_em, descricao, valor
    FROM entrada WHERE fase_id = ?
  `).all(fase.id)
  // O histórico da saída se monta como no extrato do Fluxo: serviço → quem cobrou →
  // o que veio → o que a pessoa escreveu. Fornecedor é o do cabeçalho ou, sem ele, o
  // das linhas quando é um só. O serviço sai numerado como na estimativa viva, igual ao
  // Fluxo (rodada 2, A19); o catálogo só cobre o que saiu da estimativa depois.
  const saidas = db.prepare(`
    SELECT 'saida' AS tipo, s.id, s.numero, s.data, s.criado_em, s.descricao, s.valor, s.vencimento, s.pago_em,
      COALESCE(sv.codigo, sc.codigo) AS servico_codigo, COALESCE(sv.nome, sc.nome) AS servico, fo.nome AS fornecedor
    FROM saida s
    LEFT JOIN servico_catalogo sc ON sc.id = s.servico_catalogo_id
    -- Subconsulta, não JOIN: a estimativa pode ter o serviço duas vezes (opções) e a
    -- nota não pode sair duplicada. O primeiro, como o Fluxo faz.
    LEFT JOIN servico sv ON sv.id = (
      SELECT x.id FROM servico x JOIN orcamento o ON o.id = x.orcamento_id AND o.ativo = 1
      WHERE x.fase_id = s.fase_id AND x.catalogo_id = s.servico_catalogo_id ORDER BY x.codigo, x.id LIMIT 1)
    LEFT JOIN fornecedor fo ON fo.id = s.fornecedor_id
    WHERE s.fase_id = ?
  `).all(fase.id)
  const linhas = db.prepare(`
    SELECT COALESCE(NULLIF(si.descricao, ''), i.nome) AS descricao, fo.nome AS fornecedor
    FROM saida_item si LEFT JOIN insumo i ON i.id = si.item_id LEFT JOIN fornecedor fo ON fo.id = si.fornecedor_id
    WHERE si.saida_id = ? ORDER BY si.id
  `)
  const historico = (l) => {
    if (l.tipo === 'entrada') return l.descricao || 'Aporte'
    const ls = linhas.all(l.id)
    const dasLinhas = [...new Set(ls.map((x) => x.fornecedor).filter(Boolean))]
    return [
      l.servico && `${fase.codigo}.${l.servico_codigo} ${l.servico}`,
      l.fornecedor ?? (dasLinhas.length === 1 ? dasLinhas[0] : null),
      ls.map((x) => x.descricao).filter(Boolean).join(', '),
      l.descricao,
    ].filter(Boolean).join(' · ')
  }

  // Mesmo dia: na ordem em que foi lançado. `criado_em` é comum às duas tabelas; o id
  // não (contadores separados), por isso só desempata dentro do mesmo tipo.
  const ordenados = [...entradas, ...saidas].sort((a, b) =>
    a.data.localeCompare(b.data) || (a.criado_em ?? '').localeCompare(b.criado_em ?? '') || a.id - b.id)
  let saldo = 0
  const lancamentos = ordenados.map((l) => {
    saldo += l.tipo === 'entrada' ? l.valor : -l.valor
    return {
      tipo: l.tipo, id: l.id, numero: l.numero, data: l.data, historico: historico(l), valor: l.valor, saldo,
      ...(l.tipo === 'saida' && { vencimento: l.vencimento, pago_em: l.pago_em }),
    }
  })
  return { obra, fases, fase, lancamentos }
}

r.get('/api/relatorios/extrato-fase', (req, res) => {
  const dados = extratoFase(obraDe(req), Number(req.query.fase) || null)
  if (!dados) return res.status(404).json({ erro: 'obra não encontrada' })
  res.json(dados)
})

export default r

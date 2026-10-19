import express from 'express'
import db from '../db.js'
import { enviarCsv, reais } from '../csv.js'
import { obrasVisiveis } from '../auth.js'

// Extrato do credor (UPDATE.md §10.2): tudo que foi lançado pra um fornecedor, em todas
// as obras. É o documento que se manda pro credor conferir - por isso leva número do
// lançamento e comprovante. Quanto de cada saída é dele sai da view `saida_credor`
// (db.js), a mesma que dá o Total da lista de fornecedores: os dois números não podem
// divergir.
const r = express.Router()

// `obraId` opcional: o extrato que se manda costuma ser de UMA obra.
// `itens` são as linhas da nota que são dele - com fornecedor no cabeçalho, todas.
// `obras` (Set) recorta pra quem não vê todas as obras (rodada 4, A15); null = todas.
export function extratoDoCredor(fornecedorId, obraId = null, obras = null) {
  const linhas = db.prepare(`
    SELECT s.id, s.numero, s.data, s.criado_em, s.descricao, s.vencimento, s.pago_em, s.pago_obs,
      s.anexo, s.fornecedor_id AS cabecalho, sc.valor,
      o.id AS obra_id, o.nome AS obra, f.codigo AS fase_codigo, f.nome AS fase,
      cat.codigo AS servico_codigo, cat.nome AS servico
    FROM saida_credor sc
    JOIN saida s ON s.id = sc.saida_id
    JOIN fase f ON f.id = s.fase_id
    JOIN obra o ON o.id = f.obra_id
    LEFT JOIN servico_catalogo cat ON cat.id = s.servico_catalogo_id
    WHERE sc.fornecedor_id = ? AND (? IS NULL OR o.id = ?)
    ORDER BY s.data, s.criado_em, s.id
  `).all(fornecedorId, obraId, obraId)
  const itens = db.prepare(
    'SELECT descricao FROM saida_item WHERE saida_id = ? AND (? IS NOT NULL OR fornecedor_id = ?) ORDER BY id',
  )
  return linhas.filter((l) => !obras || obras.has(l.obra_id)).map(({ cabecalho, ...l }) => ({
    ...l,
    itens: itens.all(l.id, cabecalho, fornecedorId).map((i) => i.descricao).filter(Boolean),
  }))
}

// `?obra=` vazio ou ausente = todas.
const obraDe = (req) => Number(req.query.obra) || null

r.get('/api/fornecedores/:id/extrato', (req, res) => {
  res.json(extratoDoCredor(Number(req.params.id), obraDe(req), obrasVisiveis(req)))
})

r.get('/api/fornecedores/:id/extrato.csv', (req, res) => {
  const forn = db.prepare('SELECT nome FROM fornecedor WHERE id = ?').get(Number(req.params.id))
  if (!forn) return res.status(404).json({ erro: 'fornecedor não encontrado' })
  const linhas = extratoDoCredor(Number(req.params.id), obraDe(req), obrasVisiveis(req))
  const soma = (ls) => ls.reduce((s, l) => s + l.valor, 0)
  const pago = soma(linhas.filter((l) => l.pago_em))
  // Comprovante vai como nome do arquivo: o CSV não abre anexo, mas diz qual pedir.
  const corpo = linhas.map((l) => [
    l.numero ?? '', l.data, l.obra,
    [`${l.fase_codigo} - ${l.fase}`, l.servico && `${l.fase_codigo}.${l.servico_codigo} ${l.servico}`]
      .filter(Boolean).join(' / '),
    [...l.itens, l.descricao].filter(Boolean).join(' · '),
    reais(l.valor), l.vencimento ?? '', l.pago_em ?? '', l.pago_obs ?? '',
    l.anexo ? l.anexo.split('__').slice(1).join('__') : '',
  ])
  // Os totais no pé, como o extrato da tela: é o que o credor confere primeiro.
  const total = (rotulo, v) => ['', '', '', '', rotulo, reais(v), '', '', '', '']
  enviarCsv(res, `extrato_${forn.nome}`,
    ['Nº', 'Data', 'Obra', 'Fase / serviço', 'Descrição', 'Valor', 'Vencimento', 'Pago em', 'Pagamento', 'Comprovante'],
    [...corpo, total('Total lançado', soma(linhas)), total('Total pago', pago),
      total('Em aberto', soma(linhas) - pago)])
})

export default r

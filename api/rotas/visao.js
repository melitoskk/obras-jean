import express from 'express'
import db from '../db.js'
import { estimadoRealizado } from './relatorio.js'

// Visão do cliente (UPDATE.md §12): o painel da obra que o escritório abre na mesa com
// o cliente. Rota própria, e não o payload da obra recortado na tela, porque a regra
// "sem dado interno" fica mais fácil de garantir onde o dado nasce: daqui só saem
// SOMAS por fase e por mês, e fotos. Descrição de lançamento, fornecedor, insumo e
// margem não saem - descrição costuma levar o nome de quem vendeu.
//
// Não está na lista branca do campo (auth.js): nasce fechada pra ele, como as outras.
const r = express.Router()

// Só imagem rasterizada - a mesma lista do /api/anexo inline. PDF e planta ficam na Galeria.
const IMAGEM = /\.(png|jpe?g|gif|webp|avif)$/i

export function visaoCliente(obraId) {
  const obra = db.prepare(`
    SELECT o.id, o.nome, o.status, o.foto, o.cidade, o.dt_inicio, o.dt_fim, o.dt_inicio_real, o.dt_fim_real,
      c.nome AS cliente
    FROM obra o LEFT JOIN cliente c ON c.id = o.cliente_id WHERE o.id = ?
  `).get(obraId)
  if (!obra) return null

  // Estimado × realizado por fase é o MESMO cálculo do relatório 2 - reaproveitado, e
  // não reescrito, pra a tela do cliente nunca dizer um número que o relatório não diz.
  // Os serviços e lançamentos ficam pra trás: o cliente vê a fase.
  const { fases } = estimadoRealizado(obraId)
  const porFase = fases
    .filter((f) => f.estimado || f.realizado || f.taxa_devida)
    .map(({ id, codigo, nome, concluida_em, estimado, realizado, taxa_devida }) =>
      ({ id, codigo, nome, concluida_em, estimado, realizado, taxa_devida }))

  // Por mês, sem acumular: quem desenha acumula. Realizado pela data da nota (a mesma
  // do extrato), investido pela data da entrada.
  const meses = new Map()
  const mes = (ym) => {
    if (!meses.has(ym)) meses.set(ym, { ym, realizado: 0, investido: 0 })
    return meses.get(ym)
  }
  for (const m of db.prepare(`
    SELECT substr(s.data, 1, 7) AS ym, SUM(s.valor) AS v FROM saida s JOIN fase f ON f.id = s.fase_id
    WHERE f.obra_id = ? GROUP BY ym
  `).all(obraId)) mes(m.ym).realizado = m.v
  for (const m of db.prepare(`
    SELECT substr(data, 1, 7) AS ym, SUM(valor) AS v FROM entrada WHERE obra_id = ? GROUP BY ym
  `).all(obraId)) mes(m.ym).investido = m.v

  // Fotos da pasta Fotos e as do Diário de obra (com a fase do post, quando houver).
  // Documentos e Projetos não entram: é a obra em foto que o cliente quer ver.
  const fotos = db.prepare(`
    -- A foto do diário leva o dia do registro, não o do envio (rodada 4, A10).
    SELECT a.id, a.nome, a.ref, COALESCE(d.data, a.criado_em) AS criado_em, f.nome AS fase
    FROM arquivo a LEFT JOIN diario d ON d.id = a.diario_id LEFT JOIN fase f ON f.id = d.fase_id
    WHERE a.obra_id = ? AND a.pasta IN ('fotos', 'dia_a_dia')
    ORDER BY a.criado_em DESC, a.id DESC
  `).all(obraId).filter((a) => IMAGEM.test(a.nome))

  const soma = (k) => porFase.reduce((a, f) => a + f[k], 0)
  const investido = db.prepare('SELECT IFNULL(SUM(valor), 0) v FROM entrada WHERE obra_id = ?').get(obraId).v
  const executado = soma('realizado')
  return {
    obra,
    // Saldo é o do destaque do topo (§11.1): entradas − tudo lançado.
    investido, executado, saldo: investido - executado, estimado: soma('estimado'),
    // A taxa de administração DEVIDA, das fases concluídas (Jean, 18/10/2026: o cliente
    // vê a taxa). A mesma `taxaDevida` do relatório e do topo da obra.
    taxa: soma('taxa_devida'),
    fases: porFase,
    meses: [...meses.values()].sort((a, b) => a.ym.localeCompare(b.ym)),
    fotos,
  }
}

r.get('/api/obra/:id/visao', (req, res) => {
  const dados = visaoCliente(Number(req.params.id))
  if (!dados) return res.status(404).json({ erro: 'obra não encontrada' })
  res.json(dados)
})

export default r

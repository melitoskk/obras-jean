import express from 'express'
import { pode } from '../auth.js'
import db, { novoOrcamento } from '../db.js'

// Rotas do módulo Orçamento. Saíram de server.js porque ele já passava de 350 linhas.
const r = express.Router()

// Agregação em SQL, não em reduce no cliente: um orçamento tem 21 fases × N serviços,
// e mandar tudo pro browser somar é o caminho de a tela travar aos 300 serviços.
//
// O total soma as DUAS SUB-LINHAS arredondadas (mão de obra e materiais), não o
// unitário somado. É o que faz as parcelas do grid fecharem com o total exibido.
// Exportado porque os relatórios precisam do MESMO custo - duas fórmulas de dinheiro
// com o mesmo nome divergindo é o pior bug possível neste sistema.
export const CUSTO = `(CAST(ROUND(s.qtd*s.custo_mo_unit) AS INTEGER) + CAST(ROUND(s.qtd*s.custo_mat_unit) AS INTEGER))`

// `opcoes` é JSON na coluna (é conteúdo do catálogo); a tela recebe o array pronto.
const comOpcoes = (linhas) => linhas.map((l) => ({ ...l, opcoes: l.opcoes ? JSON.parse(l.opcoes) : null }))

r.get('/api/orcamentos', (req, res) => {
  res.json(db.prepare(`
    SELECT o.id, o.numero, o.nome, o.criado_em, o.ativo,
           ob.id AS obra_id, ob.nome AS obra, c.nome AS cliente,
           IFNULL(t.custo,0) AS custo
    FROM orcamento o
    JOIN obra ob ON ob.id = o.obra_id
    LEFT JOIN cliente c ON c.id = ob.cliente_id
    LEFT JOIN (
      SELECT s.orcamento_id oid, SUM(${CUSTO}) custo
      FROM servico s JOIN fase f ON f.id = s.fase_id
      WHERE f.inativa = 0 GROUP BY s.orcamento_id
    ) t ON t.oid = o.id
    ORDER BY CAST(o.numero AS INTEGER) DESC
  `).all())
})

r.post('/api/orcamentos', (req, res) => {
  const obra_id = Number(req.body.obra_id)
  if (!db.prepare('SELECT 1 FROM obra WHERE id=?').get(obra_id)) {
    return res.status(400).json({ erro: 'obra inexistente' })
  }
  res.json({ id: novoOrcamento(obra_id) })
})

// Tudo do orçamento num payload só - a tela abre com um GET.
r.get('/api/orcamento/:id', (req, res) => {
  const id = Number(req.params.id)
  const orcamento = db.prepare(`
    SELECT o.*, ob.nome AS obra, ob.id AS obra_id, c.nome AS cliente
    FROM orcamento o JOIN obra ob ON ob.id=o.obra_id
    LEFT JOIN cliente c ON c.id=ob.cliente_id WHERE o.id=?
  `).get(id)
  if (!orcamento) return res.status(404).json({ erro: 'não encontrado' })

  // As fases são as da OBRA; os valores, os que ESTE orçamento atribui a elas. O
  // LEFT JOIN com `s.orcamento_id` importa: fase que este orçamento não precificou
  // vale 0 e continua na lista - sumir dela seria a obra mudar de forma por versão.
  // `percentual` é o de referência (§2): o editado na fase, senão o padrão do catálogo.
  // Fase avulsa, sem catálogo, não tem padrão - vale 0 até alguém digitar.
  const fases = db.prepare(`
    SELECT f.id, f.codigo, f.nome, f.catalogo_id, f.ordem, f.concluida_em,
           COALESCE(f.percentual, fc.percentual, 0) AS percentual,
           IFNULL(SUM(${CUSTO}),0) AS custo
    FROM fase f LEFT JOIN servico s ON s.fase_id=f.id AND s.orcamento_id=:id
    LEFT JOIN fase_catalogo fc ON fc.id = f.catalogo_id
    WHERE f.obra_id=:obra AND f.inativa=0
    GROUP BY f.id ORDER BY f.codigo, f.id
  `).all({ id, obra: orcamento.obra_id })

  // A lista de subopções vem do catálogo: o serviço guarda só a escolhida.
  const servicos = comOpcoes(db.prepare(`
    SELECT s.*, sc.opcoes, ${CUSTO} AS custo
    FROM servico s LEFT JOIN servico_catalogo sc ON sc.id = s.catalogo_id
    WHERE s.orcamento_id=? ORDER BY s.codigo, s.id
  `).all(id))

  res.json({ orcamento, fases, servicos })
})

// `ativo` fica na lista mesmo sem tela que o alterne: é o servidor que o escreve ao
// versionar e ao excluir o vivo, e as consultas de orçado filtram por ele.
// `taxa_adm` é a taxa de administração (UPDATE.md §4), em ponto-base sobre o custo da
// estimativa - um % só, aplicado em cada fase. Vai como linha à parte: não entra no
// custo da fase nem no CUSTO dos relatórios.
const CAMPOS = ['ativo', 'nome', 'taxa_adm']
const valorCampo = (k, v) => (k === 'taxa_adm' ? Math.max(0, Math.round(Number(v) || 0)) : v)
r.patch('/api/orcamento/:id', (req, res) => {
  const campos = CAMPOS.filter((k) => k in req.body)
  if (campos.length) {
    db.prepare(`UPDATE orcamento SET ${campos.map((k) => `${k}=?`).join(',')} WHERE id=?`)
      .run(...campos.map((k) => valorCampo(k, req.body[k])), Number(req.params.id))
  }
  res.json({ ok: true })
})

// Versionar: congela o estado ATUAL num orçamento inativo (o histórico) e devolve o
// vivo com o nome novo. A cópia vai pro PASSADO de propósito - o orçamento vivo nunca
// troca de id, então `saida.fase_id` e `entrada.fase_id` continuam apontando pra fase
// certa. Clonar pra frente exigiria repontar todo lançamento da obra, e um erro ali
// perde dinheiro lançado.
//
// O avanço (`avanco`) NÃO é copiado: planejamento e medição são avanço FÍSICO da obra,
// não do orçamento. E a FASE também não: ela é da obra, e as duas versões apontam pra
// mesma. Copia serviço → composição, com o orçamento novo. Sem transação aqui: quem
// chama já está dentro de uma.
function clonarConteudo(deId, paraId) {
  const insServ = db.prepare(`
    INSERT INTO servico (orcamento_id, fase_id, catalogo_id, codigo, nome, unidade, opcao, qtd, ordem,
                         custo_mo_unit, custo_mat_unit, margem_mo, margem_mat)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `)
  const insComp = db.prepare(
    'INSERT INTO composicao (servico_id, insumo_id, tipo_custo, qtd, custo_unit) VALUES (?,?,?,?,?)',
  )
  const composicaoDe = db.prepare('SELECT * FROM composicao WHERE servico_id=? ORDER BY id')

  for (const s of db.prepare('SELECT * FROM servico WHERE orcamento_id=? ORDER BY id').all(deId)) {
    const servId = Number(
      insServ.run(paraId, s.fase_id, s.catalogo_id, s.codigo, s.nome, s.unidade, s.opcao, s.qtd, s.ordem,
        s.custo_mo_unit, s.custo_mat_unit, s.margem_mo, s.margem_mat).lastInsertRowid,
    )
    for (const c of composicaoDe.all(s.id)) {
      insComp.run(servId, c.insumo_id, c.tipo_custo, c.qtd, c.custo_unit)
    }
  }
}

// Guarda o estado atual do orçamento vivo numa GAVETA nova e nomeada. O vivo não muda
// de id nem de nome: ele é o orçamento da obra, e a gaveta é um retrato dele.
r.post('/api/orcamento/:id/versao', (req, res) => {
  const id = Number(req.params.id)
  const nome = String(req.body.nome ?? '').trim()
  if (!nome) return res.status(400).json({ erro: 'nome obrigatório' })
  const vivo = db.prepare('SELECT * FROM orcamento WHERE id=?').get(id)
  if (!vivo) return res.status(404).json({ erro: 'não encontrado' })

  db.exec('BEGIN')
  try {
    const copiaId = novoOrcamento(vivo.obra_id)
    db.prepare('UPDATE orcamento SET ativo=0, nome=?, taxa_adm=?, observacao=? WHERE id=?')
      .run(nome, vivo.taxa_adm, vivo.observacao, copiaId)
    clonarConteudo(id, copiaId)
    db.exec('COMMIT')
    res.json({ id: copiaId, nome })
  } catch (e) {
    db.exec('ROLLBACK')
    res.status(500).json({ erro: String(e) })
  }
})

// Excluir um orçamento - versão arquivada ou o próprio vivo. Não existe trava: o
// orçamento é um documento de números, e apagá-lo não encosta em fase, saída, entrada
// nem avanço, que são da OBRA. Errar a montagem e querer recomeçar é o caso comum.
//
// Se o excluído era o ativo, a versão mais recente que sobrou toma o lugar: a obra fica
// com um orçamento vivo só, sempre. Sem isso o `ativo=1` das consultas de orçado não
// acharia nada e a obra apareceria zerada com um histórico cheio.
r.delete('/api/orcamento/:id', (req, res) => {
  const id = Number(req.params.id)
  const alvo = db.prepare('SELECT * FROM orcamento WHERE id=?').get(id)
  if (!alvo) return res.status(404).json({ erro: 'não encontrado' })

  db.exec('BEGIN')
  try {
    // composicao cai por ON DELETE CASCADE do serviço. A fase FICA: ela é da obra.
    db.prepare('DELETE FROM servico WHERE orcamento_id=?').run(id)
    db.prepare('DELETE FROM orcamento WHERE id=?').run(id)

    let promovido = null
    if (alvo.ativo) {
      promovido = db.prepare(
        'SELECT id FROM orcamento WHERE obra_id=? ORDER BY CAST(numero AS INTEGER) DESC LIMIT 1',
      ).get(alvo.obra_id)?.id ?? null
      if (promovido) db.prepare('UPDATE orcamento SET ativo=1 WHERE id=?').run(promovido)
    }
    db.exec('COMMIT')
    res.json({ ok: true, promovido })
  } catch (e) {
    db.exec('ROLLBACK')
    res.status(500).json({ erro: String(e) })
  }
})

r.get('/api/catalogo', (req, res) => {
  res.json({
    fases: db.prepare('SELECT * FROM fase_catalogo ORDER BY codigo').all(),
    servicos: comOpcoes(db.prepare('SELECT * FROM servico_catalogo ORDER BY fase_catalogo_id, codigo').all()),
  })
})

// Sincroniza a seleção do modal "Editar fases e serviços".
//
// Duas escritas em tabelas de donos diferentes: a FASE é da obra (marcar cria uma fase
// da obra, se ela ainda não existir) e o SERVIÇO é deste orçamento. Por isso a mesma
// fase aparece pra todas as versões, com valor só onde alguém digitou.
//
// Desmarcar exclui - MAS só o que está vazio. Serviço com valor ou composição fica, e
// fase fica se tiver serviço de QUALQUER orçamento, lançamento ou post no dia a dia:
// ela é da obra, e desmarcar num orçamento não é motivo pra sumir dos outros. O que se
// recusou a apagar volta em `mantidas` pra tela dizer por quê - perder orçamento
// digitado por um clique num checkbox não se conserta com Ctrl+Z.
r.put('/api/orcamento/:id/fases', (req, res) => {
  const id = Number(req.params.id)
  const fases = new Set((req.body.fases ?? []).map(Number))
  const servicos = new Set((req.body.servicos ?? []).map(Number))
  const mantidas = []

  const cat = {
    fases: db.prepare('SELECT * FROM fase_catalogo').all(),
    servicos: db.prepare('SELECT * FROM servico_catalogo').all(),
  }
  const obra_id = db.prepare('SELECT obra_id FROM orcamento WHERE id=?').get(id)?.obra_id
  if (!obra_id) return res.status(404).json({ erro: 'não encontrado' })

  const atuais = db.prepare('SELECT * FROM fase WHERE obra_id=?').all(obra_id)
  const porCatalogo = new Map(atuais.filter((f) => f.catalogo_id).map((f) => [f.catalogo_id, f]))

  // --- criar o que foi marcado e ainda não existe ---
  const insFase = db.prepare(
    'INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem) VALUES (?,?,?,?,?)',
  )
  const insServ = db.prepare(
    'INSERT INTO servico (orcamento_id, fase_id, catalogo_id, codigo, nome, unidade, ordem) VALUES (?,?,?,?,?,?,?)',
  )
  for (const fc of cat.fases) {
    if (!fases.has(fc.id)) continue
    let fase = porCatalogo.get(fc.id)
    if (!fase) {
      const novoId = Number(insFase.run(obra_id, fc.id, fc.codigo, fc.nome, fc.codigo).lastInsertRowid)
      fase = { id: novoId, catalogo_id: fc.id, nome: fc.nome }
      porCatalogo.set(fc.id, fase)
    }
    const tem = new Set(
      db.prepare('SELECT catalogo_id FROM servico WHERE fase_id=? AND orcamento_id=? AND catalogo_id IS NOT NULL')
        .all(fase.id, id).map((s) => s.catalogo_id),
    )
    for (const sc of cat.servicos) {
      if (sc.fase_catalogo_id !== fc.id || !servicos.has(sc.id) || tem.has(sc.id)) continue
      insServ.run(id, fase.id, sc.id, sc.codigo, sc.nome, sc.unidade, sc.codigo)
    }
  }

  // --- remover o que foi desmarcado, se estiver vazio ---
  const servicoVazio = db.prepare(`
    SELECT s.id, s.nome FROM servico s WHERE s.id=?
      AND s.qtd = 0 AND s.custo_mo_unit = 0 AND s.custo_mat_unit = 0
      AND NOT EXISTS (SELECT 1 FROM composicao c WHERE c.servico_id = s.id)
  `)
  for (const s of db.prepare('SELECT s.*, f.catalogo_id fc FROM servico s JOIN fase f ON f.id=s.fase_id WHERE s.orcamento_id=?').all(id)) {
    // O modal só manda no que veio do catálogo. Fase ou serviço criado fora dele é
    // avulso e não some porque um checkbox que nem o representa está desmarcado.
    if (!s.catalogo_id || !s.fc) continue
    if (fases.has(s.fc) && servicos.has(s.catalogo_id)) continue
    if (servicoVazio.get(s.id)) db.prepare('DELETE FROM servico WHERE id=?').run(s.id)
    else mantidas.push(s.nome)
  }

  // Vazia = ninguém, em orçamento nenhum, tem nada nela. `diario` entra porque um post
  // do dia a dia aponta pra fase: apagá-la derrubaria a FK e, pior, o registro.
  const faseVazia = db.prepare(`
    SELECT f.id FROM fase f WHERE f.id=?
      AND NOT EXISTS (SELECT 1 FROM servico s WHERE s.fase_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM saida x WHERE x.fase_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM entrada e WHERE e.fase_id = f.id)
      AND NOT EXISTS (SELECT 1 FROM diario d WHERE d.fase_id = f.id)
  `)
  for (const f of atuais) {
    if (!f.catalogo_id || fases.has(f.catalogo_id)) continue
    if (faseVazia.get(f.id)) db.prepare('DELETE FROM fase WHERE id=?').run(f.id)
    else mantidas.push(f.nome)
  }

  res.json({ ok: true, mantidas })
})

// ── Valores: a lista salva em lote ───────────────────────────────────────────────
// Só aceita serviço que pertence a ESTE orçamento: o id vem do cliente, e sem o
// vínculo dava pra escrever em serviço de outro orçamento mandando outro id.
const CAMPOS_SERVICO = ['qtd', 'custo_mo_unit', 'custo_mat_unit', 'opcao']

// Orçado direto NA FASE, sem passar por serviço: grava num serviço "Geral", e por isso
// o resto do sistema (soma, Previsto × Realizado, insumos) funciona sem saber disto.
// A rota carrega o orçamento porque o valor é DELE - a mesma fase vale um número em
// cada versão. Fase que já tem serviço de verdade recusa: ali o valor É a soma, e
// deixar digitar por cima criaria dois números pra mesma coisa.
r.put('/api/orcamento/:id/fase/:faseId/orcado', (req, res) => {
  const id = Number(req.params.id)
  const faseId = Number(req.params.faseId)
  const valor = Math.max(0, Math.round(Number(req.body.valor) || 0))
  const servicos = db.prepare('SELECT id, nome FROM servico WHERE fase_id=? AND orcamento_id=?').all(faseId, id)
  if (servicos.length > 1 || (servicos.length === 1 && servicos[0].nome !== 'Geral')) {
    return res.status(409).json({ erro: 'fase com serviços: o valor é a soma deles' })
  }
  if (servicos.length) {
    db.prepare('UPDATE servico SET qtd=1, custo_mat_unit=? WHERE id=?').run(valor, servicos[0].id)
  } else {
    db.prepare(
      "INSERT INTO servico (orcamento_id, fase_id, codigo, nome, unidade, qtd, ordem, custo_mat_unit) VALUES (?,?,1,'Geral','VB',1,1,?)",
    ).run(id, faseId, valor)
  }
  res.json({ ok: true })
})

r.put('/api/orcamento/:id/servicos', (req, res) => {
  const id = Number(req.params.id)
  const meus = new Set(db.prepare('SELECT id FROM servico WHERE orcamento_id=?').all(id).map((s) => s.id))
  let gravados = 0
  for (const linha of req.body.servicos ?? []) {
    if (!meus.has(Number(linha.id))) continue
    const campos = CAMPOS_SERVICO.filter((k) => k in linha)
    if (!campos.length) continue
    // Subopção em branco é "nenhuma", não string vazia - senão a soma por material
    // dos relatórios ganha um grupo "".
    const val = (k) => (k === 'opcao' ? String(linha.opcao ?? '').trim() || null : linha[k])
    db.prepare(`UPDATE servico SET ${campos.map((k) => `${k}=?`).join(',')} WHERE id=?`)
      .run(...campos.map(val), Number(linha.id))
    gravados++
  }
  res.json({ ok: true, gravados })
})

// PATCH parcial da fase: só mexe no que veio. Concluir/reabrir (UPDATE.md §11.2) é só
// a data - nula = em andamento; data que não é ISO volta 400, é ela que a tela formata
// e que ordena "concluída em". `percentual` é o de referência (§2), ponto-base; null
// volta ao padrão do catálogo.
r.patch('/api/fases/:id', (req, res) => {
  // Concluir/reabrir e a taxa são de `concluir_fase`; o % de referência é da estimativa.
  const fecha = ['concluida_em', 'taxa_tipo', 'taxa_valor'].some((k) => k in req.body)
  if ((fecha && !pode(req, 'concluir_fase')) || ('percentual' in req.body && !pode(req, 'estimativa'))) {
    return res.status(403).json({ erro: 'sem permissão' })
  }
  const sets = []
  const vals = []
  if ('concluida_em' in req.body) {
    const quando = req.body.concluida_em ?? null
    if (quando !== null && !/^\d{4}-\d{2}-\d{2}$/.test(quando)) {
      return res.status(400).json({ erro: 'concluida_em deve ser AAAA-MM-DD ou null' })
    }
    sets.push('concluida_em=?')
    vals.push(quando)
  }
  if ('percentual' in req.body) {
    const p = req.body.percentual
    sets.push('percentual=?')
    vals.push(p == null ? null : Math.max(0, Math.round(Number(p) || 0)))
  }
  // Taxa de administração da fase, escolhida ao concluir. Tipo null tira a regra.
  if ('taxa_tipo' in req.body) {
    const tipo = req.body.taxa_tipo ?? null
    if (tipo !== null && tipo !== 'fixo' && tipo !== 'pct') {
      return res.status(400).json({ erro: "taxa_tipo deve ser 'fixo', 'pct' ou null" })
    }
    sets.push('taxa_tipo=?', 'taxa_valor=?')
    vals.push(tipo, tipo === null ? null : Math.max(0, Math.round(Number(req.body.taxa_valor) || 0)))
  }
  if (!sets.length) return res.status(400).json({ erro: 'nada pra alterar' })
  const r2 = db.prepare(`UPDATE fase SET ${sets.join(',')} WHERE id=?`).run(...vals, Number(req.params.id))
  if (!r2.changes) return res.status(404).json({ erro: 'fase não encontrada' })
  res.json({ ok: true })
})

// ── Fluxo de caixa da obra ────────────────────────────────────────────────────────
// Previsto = o que o orçamento diz que a fase custa. Realizado = as saídas lançadas
// nela. Aportado = as entradas. Tudo agregado em SQL, no mesmo GET.
// O lançamento é da OBRA: o filtro é `f.obra_id`, e o orçamento entra só pelo previsto.
r.get('/api/obra/:id/fluxo', (req, res) => {
  const id = Number(req.params.id)
  const obra = db.prepare(`
    SELECT o.id, o.nome, c.nome AS cliente
    FROM obra o LEFT JOIN cliente c ON c.id = o.cliente_id WHERE o.id = ?
  `).get(id)
  if (!obra) return res.status(404).json({ erro: 'obra não encontrada' })
  res.json({ ...caixaDaObra(id), obra })
})

// Exportada pro check de fluxo.test.mjs: é dinheiro somado em SQL, e soma de dinheiro
// que ninguém verifica é como a `fase.orcado` que passou meses devolvendo zero.
export function caixaDaObra(obra_id) {
  // `realizado` conta TUDO (a obra consumiu o material quando a nota chegou) e
  // `aberto` é a parte que ainda não saiu do caixa - PROJETO-v3 §7.2.
  const porFase = db.prepare(`
    SELECT f.id AS fase_id,
      IFNULL((SELECT SUM(s.valor) FROM saida s   WHERE s.fase_id = f.id), 0) AS realizado,
      IFNULL((SELECT SUM(s.valor) FROM saida s   WHERE s.fase_id = f.id AND s.pago_em IS NULL), 0) AS aberto,
      IFNULL((SELECT SUM(e.valor) FROM entrada e WHERE e.fase_id = f.id), 0) AS aportado,
      -- Mesma fórmula (CUSTO) e mesmo filtro o.ativo = 1 da home: o orçado da fase é
      -- o que o orçamento VIVO diz, não a soma das versões arquivadas.
      IFNULL((SELECT SUM(${CUSTO}) FROM servico s
              JOIN orcamento o ON o.id = s.orcamento_id AND o.ativo = 1
              WHERE s.fase_id = f.id), 0) AS orcado
    FROM fase f WHERE f.obra_id = ?
  `).all(obra_id)

  const entradas = db.prepare(`
    SELECT e.id, e.numero, e.fase_id, e.valor, e.data, e.descricao, e.anexo, e.criado_em
    FROM entrada e JOIN fase f ON f.id = e.fase_id
    WHERE f.obra_id = ? ORDER BY e.criado_em DESC, e.id DESC
  `).all(obra_id)

  const saidasRaw = db.prepare(`
    SELECT s.id, s.numero, s.fase_id, s.valor, s.data, s.descricao, s.anexo,
           s.fornecedor_id, s.vencimento, s.pago_em, s.pago_obs, s.criado_em,
           s.servico_catalogo_id, sc.nome AS servico_nome
    FROM saida s JOIN fase f ON f.id = s.fase_id
    LEFT JOIN servico_catalogo sc ON sc.id = s.servico_catalogo_id
    WHERE f.obra_id = ? ORDER BY s.criado_em DESC, s.id DESC
  `).all(obra_id)
  const linhasDe = db.prepare('SELECT * FROM saida_item WHERE saida_id = ?')
  const saidas = saidasRaw.map((s) => ({
    ...s,
    itens: linhasDe.all(s.id).map((l) => ({
      descricao: l.descricao, itemId: l.item_id, fornecedorId: l.fornecedor_id,
      qtd: l.qtd, valorUnit: l.valor_unit,
    })),
  }))

  // Histórico de preço: alimenta "último preço" e a ordenação por relevância no
  // Combobox. Sai de saida_item - a relação insumo↔fornecedor nunca é cadastrada.
  const historico = db.prepare(`
    SELECT si.item_id AS itemId, si.fornecedor_id AS fornecedorId,
           si.valor_unit AS valorUnit, s.data, s.id AS saidaId
    FROM saida_item si JOIN saida s ON s.id = si.saida_id
    JOIN fase f ON f.id = s.fase_id
    WHERE f.obra_id = ? AND si.item_id IS NOT NULL
  `).all(obra_id)

  // Vínculo declarado (aba Insumos do fornecedor). Vem inteiro: são pares de inteiros,
  // e filtrar por obra não faria sentido - o catálogo é global.
  const vinculos = db.prepare(
    'SELECT insumo_id AS itemId, fornecedor_id AS fornecedorId, preco FROM insumo_fornecedor',
  ).all()

  // Os serviços que o lançamento pode apontar (UPDATE.md §6): os da estimativa VIVA,
  // por fase, identificados pelo id DE CATÁLOGO - é ele que a saída grava. Serviço
  // avulso (o "Geral" do valor direto na fase) não tem catálogo e não entra: lançar
  // nele é lançar na fase inteira. `servico_nome` na saída cobre o serviço que saiu
  // da estimativa depois de lançado - o nome continua aparecendo no extrato.
  const servicos = db.prepare(`
    SELECT s.fase_id, s.catalogo_id AS id, s.codigo, s.nome, s.opcao
    FROM servico s JOIN orcamento o ON o.id = s.orcamento_id AND o.ativo = 1
    JOIN fase f ON f.id = s.fase_id
    WHERE f.obra_id = ? AND s.catalogo_id IS NOT NULL ORDER BY s.codigo, s.id
  `).all(obra_id)

  return {
    porFase, entradas, saidas, historico, vinculos, servicos,
    // As fases vêm junto porque o Fluxo de caixa não passa pelo orçamento e precisa
    // do nome delas. A tela do orçamento já tem as suas e ignora estas.
    fases: db.prepare(
      'SELECT id, codigo, nome, ordem, concluida_em, taxa_tipo, taxa_valor FROM fase WHERE obra_id = ? AND inativa = 0 ORDER BY ordem, id',
    ).all(obra_id),
    // O % da estimativa viva só sugere a taxa ao concluir uma fase sem regra ainda.
    taxa_estimativa: db.prepare('SELECT taxa_adm FROM orcamento WHERE obra_id = ? AND ativo = 1').get(obra_id)?.taxa_adm ?? 0,
    // tipo_custo e os dois checks do fornecedor: lançar mão de obra lista prestador
    // primeiro (UPDATE.md §10.1, ordenarFornecedores).
    insumos: db.prepare('SELECT id, nome, unidade, preco_base, tipo_custo FROM insumo ORDER BY nome').all(),
    fornecedores: db.prepare(
      'SELECT id, nome, incompleto, fornece_material, presta_servico FROM fornecedor ORDER BY nome',
    ).all(),
    obra_id,
  }
}

// `fornecedores` é o vínculo declarado; `compras`/`ultima` é o que emergiu do histórico.
// As duas colunas juntas são a tela: quem promete vender isto, e de quem já se comprou.
r.get('/api/insumos', (req, res) => {
  res.json(db.prepare(`
    SELECT i.*,
      (SELECT COUNT(*) FROM insumo_fornecedor v WHERE v.insumo_id = i.id) AS fornecedores,
      (SELECT COUNT(DISTINCT si.saida_id) FROM saida_item si WHERE si.item_id = i.id) AS compras,
      (SELECT MAX(s.data) FROM saida_item si JOIN saida s ON s.id = si.saida_id
        WHERE si.item_id = i.id) AS ultima
    FROM insumo i ORDER BY i.nome
  `).all())
})

// PATCH parcial com lista branca fechada, igual cliente/obra/fornecedor: `campos` vira
// nome de coluna no SQL. Completar qualquer campo tira o insumo da fila de pendências.
const CAMPOS_INSUMO = ['nome', 'unidade', 'tipo_custo', 'preco_base']
r.patch('/api/insumos/:id', (req, res) => {
  const campos = CAMPOS_INSUMO.filter((k) => k in req.body)
  db.prepare(`UPDATE insumo SET ${[...campos.map((k) => `${k}=?`), 'incompleto=0'].join(',')} WHERE id=?`)
    .run(...campos.map((k) => req.body[k]), Number(req.params.id))
  res.json({ ok: true })
})

// Quick-create: nasce só com o nome e marcado como incompleto, igual cliente e fornecedor.
r.post('/api/insumos', (req, res) => {
  const nome = String(req.body.nome ?? '').trim()
  if (!nome) return res.status(400).json({ erro: 'nome obrigatório' })
  const r2 = db.prepare('INSERT INTO insumo (nome, incompleto) VALUES (?,1)').run(nome)
  res.json({ id: Number(r2.lastInsertRowid), nome, tipo_custo: 'materiais', incompleto: 1 })
})

export default r

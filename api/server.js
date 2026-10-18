import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import express from 'express'
import db from './db.js'
import { login, logout, quemSou, exigirLogin, exigirPapel, obrasVisiveis, podeObra, podeEditarPost, podeAnexo } from './auth.js'
import rotasOrcamento, { CUSTO } from './rotas/orcamento.js'
import rotasFornecedor from './rotas/fornecedor.js'
import rotasUsuario from './rotas/usuario.js'
import rotasRelatorio, { aReceberPrevisto, taxaDevida, pendenteParaConcluir } from './rotas/relatorio.js'
import rotasVisao from './rotas/visao.js'
import { enviarCsv, reais, numeroLancamento } from './csv.js'

// Anexos ficam no mesmo volume do .db - backup continua sendo copiar /data.
const ANEXOS = process.env.ANEXOS_DIR || '/data/anexos'
mkdirSync(ANEXOS, { recursive: true })

const app = express()
app.use(express.json())

// Auth: login/logout/eu são públicas; tudo abaixo de exigirLogin pede sessão.
app.post('/api/login', login)
app.post('/api/logout', logout)
app.get('/api/eu', quemSou)
app.use(exigirLogin)
// Papel (UPDATE.md §5): barra pela rota antes de qualquer handler. O recorte por obra
// do papel campo fica nas rotas que ele alcança - `podeObra` abaixo.
app.use(exigirPapel)

// Módulo Orçamento em arquivo próprio - server.js já passava de 350 linhas.
app.use(rotasOrcamento)
// Extrato do credor (UPDATE.md §10.2), pelo mesmo motivo.
app.use(rotasFornecedor)
app.use(rotasUsuario)
// Relatórios do escritório (UPDATE.md §11.3). Fechados pro campo: não estão na lista branca dele.
app.use(rotasRelatorio)
// Visão do cliente (UPDATE.md §12): só somas e fotos. Também fora da lista branca do campo.
app.use(rotasVisao)

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const hoje = () => new Date().toISOString().slice(0, 10)
// Instante do lançamento - é o que ordena o extrato quando a data da nota empata.
const agora = () => new Date().toISOString()

// { id → valor } a partir de um SELECT que devolve colunas k, v. Evita N+1 na home.
const aggById = (sql) => {
  const m = {}
  for (const r of db.prepare(sql).all()) m[r.k] = r.v
  return m
}

// --- Home: a listagem de obras é um painel disfarçado de lista. Cada obra já
// vem com os três números (orçado = soma das fases ativas, gasto, caixa). ---
app.get('/api/obras', (req, res) => {
  const obras = db.prepare(`
    SELECT o.*, c.nome AS cliente
    FROM obra o LEFT JOIN cliente c ON c.id = o.cliente_id
    ORDER BY o.criada_em DESC, o.id DESC
  `).all()
  // Campo: só as obras atribuídas e sem nenhum número - `o.*` é cadastro, o dinheiro
  // são as somas aqui de baixo, que ele não recebe (Dúvida 9).
  const visiveis = obrasVisiveis(req)
  if (visiveis) return res.json(obras.filter((o) => visiveis.has(o.id)))
  // O orçado da fase é a soma dos SERVIÇOS dela - mesma fórmula (CUSTO) do módulo
  // Orçamento, importada em vez de reescrita. Havia uma coluna `fase.orcado` somada
  // aqui: ninguém mais escrevia nela desde que a árvore fase→serviço entrou, e a home
  // vinha mostrando R$ 0,00 com a barra dividindo por zero. A coluna caiu (db.js).
  //
  // `o.ativo = 1` porque a obra guarda VERSÕES do orçamento (as inativas são o
  // histórico) e o orçado da obra é o que o orçamento VIVO diz. A fase entra só pra
  // filtrar `inativa` e agrupar por obra - quem tem versão é o serviço.
  const orcado = aggById(`
    SELECT f.obra_id k, SUM(${CUSTO}) v
    FROM servico s
    JOIN orcamento o ON o.id = s.orcamento_id AND o.ativo = 1
    JOIN fase f ON f.id = s.fase_id
    WHERE f.inativa = 0 GROUP BY f.obra_id
  `)
  // Duas somas, de propósito (PROJETO-v3 §7.2): `gasto` conta TUDO, porque a obra
  // consumiu o material no dia em que a nota chegou; `pago` conta só o que saiu do
  // caixa. Consumo de orçamento e saldo em conta pararam de ser o mesmo número.
  const gasto = aggById('SELECT f.obra_id k, SUM(s.valor) v FROM saida s JOIN fase f ON f.id=s.fase_id GROUP BY f.obra_id')
  const pago = aggById('SELECT f.obra_id k, SUM(s.valor) v FROM saida s JOIN fase f ON f.id=s.fase_id WHERE s.pago_em IS NOT NULL GROUP BY f.obra_id')
  const entrada = aggById('SELECT obra_id k, SUM(valor) v FROM entrada GROUP BY obra_id')
  const taxa = aggById('SELECT obra_id k, taxa_adm v FROM orcamento WHERE ativo = 1')
  // Fase a fase pro "A receber (previsto)": o orçado do orçamento vivo (fase ativa, como
  // o `orcado` acima), o gasto e o pago de cada uma, e a taxa escolhida ao concluir.
  const fasesDa = Map.groupBy(db.prepare(`
    SELECT f.obra_id, f.concluida_em, f.taxa_tipo, f.taxa_valor,
      CASE WHEN f.inativa = 0 THEN (SELECT COALESCE(SUM(${CUSTO}), 0) FROM servico s
        JOIN orcamento o ON o.id = s.orcamento_id AND o.ativo = 1 WHERE s.fase_id = f.id) ELSE 0 END AS orcado,
      (SELECT COALESCE(SUM(valor), 0) FROM saida WHERE fase_id = f.id) AS gasto,
      (SELECT COALESCE(SUM(valor), 0) FROM saida WHERE fase_id = f.id AND pago_em IS NOT NULL) AS pago
    FROM fase f
  `).all(), (f) => f.obra_id)
  res.json(obras.map((o) => ({
    ...o,
    orcado: orcado[o.id] || 0,
    gasto: gasto[o.id] || 0,
    aPagar: (gasto[o.id] || 0) - (pago[o.id] || 0),
    // Saldo é competência (entrou − tudo lançado), caixa é só o pago: o mesmo par do
    // Fluxo de caixa, aqui pro destaque no topo da obra (UPDATE.md §11.1).
    saldo: (entrada[o.id] || 0) - (gasto[o.id] || 0),
    caixa: (entrada[o.id] || 0) - (pago[o.id] || 0),
    aReceber: aReceberPrevisto(fasesDa.get(o.id) ?? [], taxa[o.id] || 0, entrada[o.id] || 0, o.status === 'concluida'),
    // Taxa de administração já devida: fases concluídas, sobre o pago (Jean, 18/10/2026).
    taxaDevida: (fasesDa.get(o.id) ?? []).reduce((a, f) => a + taxaDevida(f, f.pago), 0),
  })))
})

// Nova obra: cliente vem do Combobox (quick-create já criou o cliente_id). As fases
// vêm depois, pelo orçamento (FasesCatalogoPanel) - `orcado_inicial` e
// `copiar_fases_de` eram da v1, nenhuma tela mandava e criavam fase SEM orcamento_id.
// Campos que o cadastro de obra pode gravar. Lista branca fechada: `campos` vira nome
// de coluna no SQL, e sem ela qualquer chave do corpo entraria na query.
const CAMPOS_OBRA = ['nome', 'cliente_id', 'status', 'foto', 'cidade', 'categoria', 'observacao',
  'dt_inicio', 'dt_fim', 'dt_inicio_real', 'dt_fim_real',
  'cei', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'uf']

app.post('/api/obras', (req, res) => {
  const campos = CAMPOS_OBRA.filter((k) => k in req.body)
  const r = db.prepare(
    `INSERT INTO obra (${[...campos, 'criada_em'].join(',')}) VALUES (${campos.map(() => '?').join(',')},?)`,
  ).run(...campos.map((k) => req.body[k]), hoje())
  res.json({ id: Number(r.lastInsertRowid) })
})

// Editar obra. Só os campos enviados mudam - assim a home consegue trocar só a
// foto sem precisar reenviar nome, cliente e status junto.
app.patch('/api/obras/:id', (req, res) => {
  const campos = CAMPOS_OBRA.filter((k) => k in req.body)
  // Concluída só com tudo fechado (Jean, 18/10/2026): toda fase concluída, com a taxa
  // escolhida, e nenhuma conta a pagar. Obra que já estava concluída não é barrada.
  if (req.body.status === 'concluida') {
    const atual = db.prepare('SELECT status FROM obra WHERE id = ?').get(Number(req.params.id))?.status
    const p = atual !== 'concluida' && pendenteParaConcluir(Number(req.params.id))
    if (p) {
      const falta = [
        p.fasesAbertas.length && `concluir ${p.fasesAbertas.length === 1 ? 'a fase' : `${p.fasesAbertas.length} fases:`} ${p.fasesAbertas.join(', ')}`,
        p.aPagar && `pagar R$ ${(p.aPagar / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`,
      ].filter(Boolean).join(' e ')
      return res.status(409).json({ erro: `Para concluir a obra, falta ${falta}.` })
    }
  }
  if (campos.length) {
    db.prepare(`UPDATE obra SET ${campos.map((k) => `${k}=?`).join(',')} WHERE id=?`)
      .run(...campos.map((k) => req.body[k]), Number(req.params.id))
  }
  res.json({ ok: true })
})

// --- Clientes: agrupador de obras. Quick-create nasce incompleto; a tela de
// clientes é onde se completa (contato) e some da fila. ---
app.get('/api/clientes', (req, res) => {
  res.json(db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM obra o WHERE o.cliente_id = c.id) AS obras
    FROM cliente c ORDER BY c.nome
  `).all())
})
// Documentos do cliente. Rota separada porque a lista de clientes é uma consulta só
// e não vai carregar arquivo de todo mundo pra mostrar o de um.
app.get('/api/clientes/:id/arquivos', (req, res) => {
  res.json(db.prepare(
    'SELECT id, nome, ref, criado_em FROM arquivo WHERE cliente_id = ? ORDER BY criado_em DESC',
  ).all(Number(req.params.id)))
})
app.post('/api/clientes', (req, res) => {
  const r = db.prepare('INSERT INTO cliente (nome, incompleto) VALUES (?, 1)').run(req.body.nome)
  res.json({ id: Number(r.lastInsertRowid), nome: req.body.nome, incompleto: 1 })
})
// PATCH parcial, como o de obras: só os campos enviados mudam. Assim o cadastro pode
// salvar só a aba Endereço sem reenviar identificação e contato junto.
// Lista branca fechada - `campos` vem do cliente e sem ela viraria SQL arbitrário.
const CAMPOS_CLIENTE = ['nome', 'tipo', 'cpf_cnpj', 'rg', 'dt_nasc', 'categoria', 'telefone',
  'celular', 'email', 'observacao', 'ativo', 'cep', 'logradouro', 'numero', 'complemento',
  'bairro', 'cidade', 'uf', 'contato', 'whatsapp_celular']
app.patch('/api/clientes/:id', (req, res) => {
  const campos = CAMPOS_CLIENTE.filter((k) => k in req.body)
  // Completar qualquer campo tira o cliente da fila de pendências.
  // Inativar/ativar manda só `ativo` e não completa nada (rodada 3, A2).
  const completa = campos.some((k) => k !== 'ativo')
  if (!campos.length) return res.json({ ok: true })
  db.prepare(`UPDATE cliente SET ${[...campos.map((k) => `${k}=?`), ...(completa ? ['incompleto=0'] : [])].join(',')} WHERE id=?`)
    .run(...campos.map((k) => req.body[k]), Number(req.params.id))
  res.json({ ok: true })
})

// --- Leitura: tudo da obra num payload só (a Tela da Obra carrega com um GET). ---
app.get('/api/obra/:id', (req, res) => {
  const id = Number(req.params.id)
  const obra = db.prepare('SELECT id, cliente_id, nome, status, foto, cidade FROM obra WHERE id = ?').get(id)
  // Obra de outro canteiro é 404, não 403: pro campo ela não existe.
  if (!obra || !podeObra(req, id)) return res.status(404).json({ erro: 'obra não encontrada' })
  const cliente = db.prepare('SELECT id, nome FROM cliente WHERE id = ?').get(obra.cliente_id)
  // Sem orçado aqui: quem mostra dinheiro de fase é o módulo Orçamento. Este payload
  // usa as fases só pelo NOME, no Combobox e no rótulo do Dia a dia. As fases são da
  // obra e ponto - não há versão pra escolher, nem nome repetido no Combobox.
  const fases = db.prepare(
    'SELECT id, nome, ordem, inativa FROM fase WHERE obra_id = ? ORDER BY ordem',
  ).all(id)
  const entradas = db.prepare('SELECT id, fase_id, valor, data, descricao, anexo FROM entrada WHERE obra_id = ? ORDER BY data').all(id)
  const saidasRaw = db.prepare(
    'SELECT s.id, s.fase_id, s.valor, s.data, s.descricao, s.anexo, s.fornecedor_id, s.vencimento, s.pago_em, s.pago_obs FROM saida s JOIN fase f ON f.id = s.fase_id WHERE f.obra_id = ? ORDER BY s.data',
  ).all(id)
  const linhaStmt = db.prepare('SELECT item_id, fornecedor_id, descricao, qtd, valor_unit FROM saida_item WHERE saida_id = ?')
  const saidas = saidasRaw.map((s) => ({
    ...s,
    itens: linhaStmt.all(s.id).map((l) => ({
      descricao: l.descricao, itemId: l.item_id, fornecedorId: l.fornecedor_id, qtd: l.qtd, valorUnit: l.valor_unit,
    })),
  }))
  const itens = db.prepare('SELECT id, nome, unidade FROM insumo ORDER BY nome').all()
  const fornecedores = db.prepare('SELECT id, nome, contato, incompleto FROM fornecedor').all()
  // Lista inteira de clientes porque o painel de editar obra tem Combobox de
  // cliente (com quick-create) - mesma razão de itens e fornecedores virem aqui.
  const clientes = db.prepare('SELECT id, nome FROM cliente ORDER BY nome').all()
  // ponytail: o diário vem no mesmo payload da obra em vez de ter GET próprio -
  // a tela já recarrega tudo a cada escrita e assim não nasce um segundo caminho
  // de refresh. Se um feed passar de umas centenas de posts, aí vira GET paginado.
  const anexosDo = db.prepare('SELECT id, nome, ref FROM arquivo WHERE diario_id = ? ORDER BY id')
  const diario = db.prepare(
    'SELECT id, fase_id, texto, autor, autor_id, criado_em FROM diario WHERE obra_id = ? ORDER BY criado_em DESC, id DESC',
  ).all(id).map(({ autor_id, ...d }) => ({ ...d, editavel: podeEditarPost(req, { autor_id }), anexos: anexosDo.all(d.id) }))
  const arquivos = db.prepare(
    'SELECT id, pasta, nome, ref, criado_em, diario_id FROM arquivo WHERE obra_id = ? ORDER BY id DESC',
  ).all(id)
  // Campo recebe o que o diário e a galeria usam - lançamento, insumo e fornecedor
  // são valor e custo, e não saem do servidor pra ele.
  if (req.papel === 'campo') {
    return res.json({ obra, cliente, clientes: [], fases, saidas: [], entradas: [], itens: [], fornecedores: [], diario, arquivos })
  }
  res.json({ obra, cliente, clientes, fases, saidas, entradas, itens, fornecedores, diario, arquivos })
})

// --- Exportar CSV: o livro-caixa da obra (entradas + saídas) num arquivo só.
app.get('/api/obra/:id/export.csv', (req, res) => {
  const id = Number(req.params.id)
  const obra = db.prepare('SELECT nome FROM obra WHERE id = ?').get(id)
  if (!obra) return res.status(404).json({ erro: 'obra não encontrada' })
  const entradas = db.prepare(
    'SELECT e.numero, e.data, e.descricao, e.valor, f.nome fase FROM entrada e LEFT JOIN fase f ON f.id = e.fase_id WHERE e.obra_id = ?',
  ).all(id)
  // Vencimento e situação entram no livro-caixa: sem eles, uma conta em aberto some
  // no meio das pagas e o arquivo passa a mentir sobre o que já saiu do caixa.
  const saidas = db.prepare(
    `SELECT s.numero, s.data, s.descricao, s.valor, s.vencimento, s.pago_em, f.nome fase, sc.nome servico
     FROM saida s JOIN fase f ON f.id = s.fase_id LEFT JOIN servico_catalogo sc ON sc.id = s.servico_catalogo_id
     WHERE f.obra_id = ?`,
  ).all(id)
  const linhas = [
    ...entradas.map((e) => [numeroLancamento('entrada', e.numero), 'Entrada', e.data, e.fase || '', '',
      e.descricao, reais(e.valor), '', 'Recebida']),
    ...saidas.map((s) => [numeroLancamento('saida', s.numero), 'Saída', s.data, s.fase, s.servico ?? '',
      s.descricao, reais(s.valor), s.vencimento ?? '', s.pago_em ? `Paga em ${s.pago_em}` : 'Em aberto']),
  ].sort((a, b) => a[2].localeCompare(b[2]))
  enviarCsv(res, obra.nome,
    ['Nº', 'Tipo', 'Data', 'Fase', 'Serviço', 'Descrição', 'Valor', 'Vencimento', 'Situação'], linhas)
})

// --- Anexos: upload cru (sem multipart, sem dependência). O ref carrega o nome
// original depois de "__", pra download e exibição sairem dele. ---
app.post('/api/anexos', express.raw({ type: '*/*', limit: '25mb' }), (req, res) => {
  const nome = decodeURIComponent(req.get('X-Nome') || 'anexo').replace(/[^\w.\-]+/g, '_')
  const ref = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}__${nome}`
  writeFileSync(join(ANEXOS, ref), req.body)
  res.json({ ref })
})
// Só imagem rasterizada abre inline (miniatura da Galeria). SVG fica de fora de
// propósito: SVG carrega script, e servir inline na origem do app seria XSS
// armazenado. Qualquer outra coisa cai no download, que é inofensivo.
const IMAGEM = /\.(png|jpe?g|gif|webp|avif)$/i

app.get('/api/anexo/:ref', (req, res) => {
  const ref = basename(req.params.ref) // basename corta qualquer ../ - não sai da pasta
  const p = join(ANEXOS, ref)
  if (!ref.includes('__') || !existsSync(p) || !podeAnexo(req, ref)) return res.status(404).end()
  const nome = ref.split('__').slice(1).join('__')
  if (req.query.inline && IMAGEM.test(nome)) {
    res.setHeader('X-Content-Type-Options', 'nosniff') // sem adivinhar tipo pelo conteúdo
    return res.sendFile(p)
  }
  res.download(p, nome)
})

// --- Fases ---
// POST/PATCH/DELETE /api/fases saíram junto com a coluna `fase.orcado`: eram da v1,
// nenhuma tela chamava desde que FasesCatalogoPanel passou a criar fase pelo orçamento
// (PUT /api/orcamento/:id/fases), e as duas primeiras gravavam justamente a coluna que
// ninguém lia. Fase nasce, muda de valor e morre pelo módulo Orçamento, num lugar só.

// --- Entradas ---
app.post('/api/entradas', (req, res) => {
  const { obra_id, fase_id, valor, data, descricao = null, anexo = null } = req.body
  const r = db.prepare('INSERT INTO entrada (obra_id, fase_id, valor, data, descricao, anexo, criado_em) VALUES (?,?,?,?,?,?,?)')
    .run(obra_id, fase_id, valor, data, descricao, anexo, agora())
  res.json({ id: r.lastInsertRowid })
})
app.patch('/api/entradas/:id', (req, res) => {
  const { fase_id, valor, data, descricao = null, anexo = null } = req.body
  db.prepare('UPDATE entrada SET fase_id=?, valor=?, data=?, descricao=?, anexo=? WHERE id=?')
    .run(fase_id, valor, data, descricao, anexo, Number(req.params.id))
  res.json({ ok: true })
})
app.delete('/api/entradas/:id', (req, res) => {
  db.prepare('DELETE FROM entrada WHERE id = ?').run(Number(req.params.id))
  res.json({ ok: true })
})

// --- Saídas ---
// Materializa itens marcados "salvar" (find-or-create por nome normalizado), grava
// a saída e suas linhas. A relação insumo↔fornecedor emerge daqui - nunca é cadastrada.
// O catálogo é o MESMO do orçamento (tabela insumo): cadastrar num lado serve o outro.
const gravarLinhas = (saidaId, itens) => {
  db.prepare('DELETE FROM saida_item WHERE saida_id = ?').run(saidaId)
  const acharItem = db.prepare('SELECT id, nome FROM insumo')
  const criarItem = db.prepare('INSERT INTO insumo (nome, incompleto) VALUES (?, 1)')
  const insLinha = db.prepare(
    'INSERT INTO saida_item (saida_id, item_id, fornecedor_id, descricao, qtd, valor_unit) VALUES (?,?,?,?,?,?)',
  )
  for (const l of itens) {
    // `?? null`: undefined não se liga a parâmetro do SQLite e derrubava o POST
    // inteiro com 500. Linha sem insumo é caso legítimo (frete, mão de obra).
    let itemId = l.itemId ?? null
    if (itemId == null && l.salvar) {
      const existente = acharItem.all().find((it) => norm(it.nome) === norm(l.descricao))
      itemId = existente ? existente.id : Number(criarItem.run(l.descricao).lastInsertRowid)
    }
    insLinha.run(saidaId, itemId, l.fornecedorId ?? null, l.descricao, l.qtd, l.valorUnit)
  }
}

// pago_em e pago_obs são os ÚLTIMOS: o UPDATE fatia esta lista pra deixá-los de fora
// quando não vierem no corpo.
const COLS_SAIDA = 'fase_id, valor, data, descricao, anexo, fornecedor_id, vencimento, servico_catalogo_id, pago_em, pago_obs'

// O serviço tem que ser da fase do lançamento: o id vem do cliente, e um serviço de
// outra fase faria o realizado aparecer no serviço certo da fase errada.
const servicoDaFase = db.prepare(`
  SELECT 1 FROM servico_catalogo sc JOIN fase f ON f.catalogo_id = sc.fase_catalogo_id
  WHERE sc.id = ? AND f.id = ?
`)
const servicoInvalido = (b) => b.servico_catalogo_id != null && !servicoDaFase.get(b.servico_catalogo_id, b.fase_id)

// node:sqlite não tem .transaction(); BEGIN/COMMIT na mão (saída + linhas é atômico).
function escreverSaida(body, id) {
  const {
    fase_id, valor, data, descricao = null, anexo = null, itens = [],
    fornecedor_id = null, vencimento = null, servico_catalogo_id = null,
  } = body
  // criado_em fica FORA de COLS_SAIDA de propósito: ele só se escreve no INSERT, e o
  // UPDATE lá embaixo fatia essa mesma lista. Editar uma nota não a relança.
  const ins = db.prepare(`INSERT INTO saida (${COLS_SAIDA}, criado_em) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  const quando = agora()

  // O check "Pago" do próprio lançamento - quem paga é quem lança. Sem baixa, sem
  // observação: desmarcar limpa as duas, senão sobrava "pix" numa conta em aberto.
  const pago_em = 'pago_em' in body ? body.pago_em : null
  const pago_obs = pago_em ? (body.pago_obs || null) : null

  db.exec('BEGIN')
  try {
    if (id) {
      // A baixa só se escreve se vier no corpo: um PATCH parcial não pode desfazê-la
      // sem querer.
      const valores = [fase_id, valor, data, descricao, anexo, fornecedor_id, vencimento, servico_catalogo_id]
      const cols = COLS_SAIDA.split(', ').slice(0, valores.length)
      if ('pago_em' in body) { cols.push('pago_em', 'pago_obs'); valores.push(pago_em, pago_obs) }
      db.prepare(`UPDATE saida SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`).run(...valores, id)
      gravarLinhas(id, itens)
      db.exec('COMMIT')
      return id
    }
    const saidaId = Number(
      ins.run(fase_id, valor, data, descricao, anexo, fornecedor_id, vencimento, servico_catalogo_id,
        pago_em, pago_obs, quando)
        .lastInsertRowid,
    )
    gravarLinhas(saidaId, itens)
    db.exec('COMMIT')
    return saidaId
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

app.post('/api/saidas', (req, res) => {
  if (servicoInvalido(req.body)) return res.status(400).json({ erro: 'serviço não é desta fase' })
  res.json({ id: escreverSaida(req.body, null) })
})
app.patch('/api/saidas/:id', (req, res) => {
  if (servicoInvalido(req.body)) return res.status(400).json({ erro: 'serviço não é desta fase' })
  res.json({ id: escreverSaida(req.body, Number(req.params.id)) })
})
app.delete('/api/saidas/:id', (req, res) => {
  db.prepare('DELETE FROM saida WHERE id = ?').run(Number(req.params.id))
  res.json({ ok: true })
})

// --- Dia a dia ---
// Post + seus anexos são atômicos (mesmo BEGIN/COMMIT na mão das saídas). O autor
// vem da sessão, nunca do corpo - ninguém escolhe em nome de quem está postando.
app.post('/api/diario', (req, res) => {
  const { obra_id, fase_id = null, texto, anexos = [] } = req.body
  if (!texto?.trim()) return res.status(400).json({ erro: 'texto é obrigatório' })
  if (!podeObra(req, obra_id)) return res.status(404).json({ erro: 'obra não encontrada' })
  const agora = new Date().toISOString()
  db.exec('BEGIN')
  try {
    const id = Number(db.prepare('INSERT INTO diario (obra_id, fase_id, texto, autor, autor_id, criado_em) VALUES (?,?,?,?,?,?)')
      .run(obra_id, fase_id, texto.trim(), req.usuario, req.usuarioId, agora).lastInsertRowid)
    const ins = db.prepare('INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em, diario_id) VALUES (?,?,?,?,?,?)')
    for (const a of anexos) ins.run(obra_id, 'dia_a_dia', a.nome, a.ref, agora, id)
    db.exec('COMMIT')
    res.json({ id })
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
})
// Editar texto, fase e anexos. O autor e o criado_em não mudam: quem escreveu
// escreveu, e quando. `anexos` é o conjunto final - o que sumiu da lista sai do
// banco, o que apareceu entra.
app.patch('/api/diario/:id', (req, res) => {
  const id = Number(req.params.id)
  const { fase_id = null, texto, anexos = [] } = req.body
  if (!texto?.trim()) return res.status(400).json({ erro: 'texto é obrigatório' })
  const post = db.prepare('SELECT obra_id, autor_id FROM diario WHERE id = ?').get(id)
  const obra_id = post?.obra_id
  if (!obra_id || !podeObra(req, obra_id)) return res.status(404).json({ erro: 'registro não encontrado' })
  if (!podeEditarPost(req, post)) return res.status(403).json({ erro: 'só quem escreveu edita o registro' })
  db.exec('BEGIN')
  try {
    db.prepare('UPDATE diario SET fase_id = ?, texto = ? WHERE id = ?').run(fase_id, texto.trim(), id)
    const antigos = db.prepare('SELECT id, ref FROM arquivo WHERE diario_id = ?').all(id)
    const refs = new Set(anexos.map((a) => a.ref))
    const del = db.prepare('DELETE FROM arquivo WHERE id = ?')
    for (const a of antigos) if (!refs.has(a.ref)) del.run(a.id)
    const tinha = new Set(antigos.map((a) => a.ref))
    const ins = db.prepare('INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em, diario_id) VALUES (?,?,?,?,?,?)')
    const agora = new Date().toISOString()
    for (const a of anexos) if (!tinha.has(a.ref)) ins.run(obra_id, 'dia_a_dia', a.nome, a.ref, agora, id)
    db.exec('COMMIT')
    res.json({ id })
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
})
// ON DELETE CASCADE limpa as linhas de `arquivo`.
// ponytail: o blob em /data/anexos fica órfão no disco. Anexo de obra é barato e
// some junto no backup; se o volume encher, aí entra uma varredura de órfãos.
app.delete('/api/diario/:id', (req, res) => {
  const post = db.prepare('SELECT obra_id, autor_id FROM diario WHERE id = ?').get(Number(req.params.id))
  if (post && !podeObra(req, post.obra_id)) return res.status(404).json({ erro: 'registro não encontrado' })
  if (post && !podeEditarPost(req, post)) return res.status(403).json({ erro: 'só quem escreveu exclui o registro' })
  db.prepare('DELETE FROM diario WHERE id = ?').run(Number(req.params.id))
  res.json({ ok: true })
})

// --- Galeria ---
// Pastas são fixas. 'dia_a_dia' NÃO aceita upload direto: aquela pasta é o reflexo
// dos anexos do diário, e só o POST /api/diario escreve nela. Lista branca porque
// `pasta` vem do cliente - sem isso, qualquer string vira pasta nova.
const PASTAS_UPLOAD = ['fotos', 'documentos', 'projetos']

app.post('/api/arquivos', (req, res) => {
  const { obra_id, cliente_id, pasta, nome, ref } = req.body
  if (!nome || !ref) return res.status(400).json({ erro: 'nome e ref são obrigatórios' })
  // Documento do cliente não tem pasta - cliente não tem canteiro nem projeto. A pasta
  // 'cliente' é constante DO SERVIDOR, nunca vem do corpo: assim a lista branca segue
  // valendo pro caso da obra, que é o único onde a tela escolhe pasta.
  if (cliente_id) {
    // Documento de cliente é cadastro do escritório, não galeria de obra.
    if (req.papel === 'campo') return res.status(403).json({ erro: 'sem permissão' })
    const r = db.prepare('INSERT INTO arquivo (cliente_id, pasta, nome, ref, criado_em) VALUES (?,?,?,?,?)')
      .run(Number(cliente_id), 'cliente', nome, ref, new Date().toISOString())
    return res.json({ id: Number(r.lastInsertRowid) })
  }
  if (!PASTAS_UPLOAD.includes(pasta)) return res.status(400).json({ erro: 'pasta inválida' })
  if (!podeObra(req, obra_id)) return res.status(404).json({ erro: 'obra não encontrada' })
  const r = db.prepare('INSERT INTO arquivo (obra_id, pasta, nome, ref, criado_em) VALUES (?,?,?,?,?)')
    .run(obra_id, pasta, nome, ref, new Date().toISOString())
  res.json({ id: Number(r.lastInsertRowid) })
})
// Some da Galeria. Se for anexo de um post, o post continua lá - só perde o anexo.
app.delete('/api/arquivos/:id', (req, res) => {
  // Arquivo sem obra é documento de cliente: pro campo, fora do alcance também.
  const arq = db.prepare('SELECT obra_id FROM arquivo WHERE id = ?').get(Number(req.params.id))
  if (arq && (arq.obra_id == null ? req.papel === 'campo' : !podeObra(req, arq.obra_id))) {
    return res.status(404).json({ erro: 'arquivo não encontrado' })
  }
  db.prepare('DELETE FROM arquivo WHERE id = ?').run(Number(req.params.id))
  res.json({ ok: true })
})

// --- Fornecedores (quick-create incompleto + a tela que finalmente completa) ---
// `compras`, `ultima` e `total` saem do histórico, nunca de cadastro - é o que dá
// utilidade a esta lista. Vêm da view `saida_credor` (db.js), a mesma do extrato do
// credor: o Total daqui é o "Total lançado" de lá.
app.get('/api/fornecedores', (req, res) => {
  res.json(db.prepare(`
    SELECT f.*, IFNULL(h.compras, 0) AS compras, h.ultima, IFNULL(h.total, 0) AS total
    FROM fornecedor f LEFT JOIN (
      SELECT sc.fornecedor_id, COUNT(*) AS compras, MAX(s.data) AS ultima, SUM(sc.valor) AS total
      FROM saida_credor sc JOIN saida s ON s.id = sc.saida_id GROUP BY sc.fornecedor_id
    ) h ON h.fornecedor_id = f.id
    ORDER BY f.nome
  `).all())
})
app.post('/api/fornecedores', (req, res) => {
  const r = db.prepare('INSERT INTO fornecedor (nome, incompleto) VALUES (?, 1)').run(req.body.nome)
  res.json({ id: r.lastInsertRowid, nome: req.body.nome, incompleto: 1 })
})
// PATCH parcial com lista branca fechada, igual ao de cliente e obra: `campos` vira
// nome de coluna no SQL e sem ela qualquer chave do corpo entraria na query.
const CAMPOS_FORNECEDOR = ['nome', 'cnpj', 'ie', 'contato', 'telefone', 'celular', 'email',
  'observacao', 'ativo', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
  'whatsapp_celular', 'fornece_material', 'presta_servico']
app.patch('/api/fornecedores/:id', (req, res) => {
  const campos = CAMPOS_FORNECEDOR.filter((k) => k in req.body)
  // Completar qualquer campo tira o fornecedor da fila de pendências.
  // Inativar/ativar manda só `ativo` e não completa nada (rodada 3, A2).
  const completa = campos.some((k) => k !== 'ativo')
  if (!campos.length) return res.json({ ok: true })
  db.prepare(`UPDATE fornecedor SET ${[...campos.map((k) => `${k}=?`), ...(completa ? ['incompleto=0'] : [])].join(',')} WHERE id=?`)
    .run(...campos.map((k) => req.body[k]), Number(req.params.id))
  res.json({ ok: true })
})

// Insumos que o fornecedor fornece - o vínculo declarado, que convive com o que emerge
// de saida_item. Lê dos dois lados pela MESMA tabela (`?` no lado que veio na rota), e
// o PUT troca o conjunto inteiro, que é o que a aba edita.
// A lista branca é o que deixa o nome da coluna entrar no SQL: `lado` vem da URL.
const LADOS = {
  fornecedores: ['fornecedor_id', 'insumo_id', 'insumo'],
  insumos: ['insumo_id', 'fornecedor_id', 'fornecedor'],
}

app.get('/api/:lado/:id/vinculos', (req, res) => {
  const lado = LADOS[req.params.lado]
  if (!lado) return res.status(404).json({ erro: 'lado desconhecido' })
  const [meu, outro, tabela] = lado
  res.json(db.prepare(`
    SELECT o.id, o.nome, v.preco FROM insumo_fornecedor v
    JOIN ${tabela} o ON o.id = v.${outro} WHERE v.${meu} = ? ORDER BY o.nome
  `).all(Number(req.params.id)))
})

app.put('/api/:lado/:id/vinculos', (req, res) => {
  const lado = LADOS[req.params.lado]
  if (!lado) return res.status(404).json({ erro: 'lado desconhecido' })
  const [meu, outro] = lado
  const id = Number(req.params.id)
  // Cada vínculo carrega o preço que ESTE par combinou (0 = não informado). Dedupe por
  // id: o último ganha, que é o que a tela mostraria.
  const vinculos = new Map(
    (req.body.vinculos ?? [])
      .map((v) => [Number(v.id), Math.max(0, Math.trunc(Number(v.preco) || 0))])
      .filter(([outroId]) => Number.isInteger(outroId)),
  )
  const del = db.prepare(`DELETE FROM insumo_fornecedor WHERE ${meu} = ?`)
  const ins = db.prepare(`INSERT INTO insumo_fornecedor (${meu}, ${outro}, preco) VALUES (?,?,?)`)
  db.exec('BEGIN')
  try {
    del.run(id)
    for (const [outroId, preco] of vinculos) ins.run(id, outroId, preco)
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
  res.json({ ok: true })
})

app.listen(7100, () => console.log('api on :7100'))

// SQLite via node:sqlite (embutido no Node 22 - sem dependência nativa).
// Um arquivo .db num volume; backup é copiar o arquivo. Dinheiro em centavos.
import { DatabaseSync } from 'node:sqlite'
import { CATALOGO, INSUMOS as SEMENTE_INSUMOS, PERCENTUAL_PADRAO } from './catalogo.js'

const db = new DatabaseSync(process.env.OBRAS_DB || '/data/obras.db')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS cliente (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL, contato TEXT, incompleto INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS obra (
    id INTEGER PRIMARY KEY, cliente_id INTEGER REFERENCES cliente(id),
    nome TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ativa', criada_em TEXT
  );
  CREATE TABLE IF NOT EXISTS fase (
    id INTEGER PRIMARY KEY, obra_id INTEGER REFERENCES obra(id),
    nome TEXT NOT NULL, ordem INTEGER, inativa INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS entrada (
    id INTEGER PRIMARY KEY, obra_id INTEGER REFERENCES obra(id), fase_id INTEGER REFERENCES fase(id),
    valor INTEGER NOT NULL, data TEXT NOT NULL, descricao TEXT, anexo TEXT
  );
  CREATE TABLE IF NOT EXISTS saida (
    id INTEGER PRIMARY KEY, fase_id INTEGER REFERENCES fase(id),
    valor INTEGER NOT NULL, data TEXT NOT NULL, descricao TEXT, anexo TEXT
  );
  CREATE TABLE IF NOT EXISTS fornecedor (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL, contato TEXT, incompleto INTEGER DEFAULT 0
  );
  -- descricao aqui porque a linha avulsa ("mão de obra") não tem item_id, só texto.
  -- item_id aponta pra INSUMO: a tabela item morreu (PROJETO-v2 §3). Ela NÃO pode
  -- voltar a ser criada aqui - enquanto esteve, o CREATE IF NOT EXISTS a ressuscitava
  -- vazia a cada boot, a migração item→insumo lá embaixo reagia ao vê-la e remapeava
  -- todo item_id por um de_para vazio: item_id = NULL em TODAS as linhas, a cada
  -- restart da API. O lançamento abria sem item e pedia pra escolher de novo.
  CREATE TABLE IF NOT EXISTS saida_item (
    id INTEGER PRIMARY KEY, saida_id INTEGER REFERENCES saida(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES insumo(id), fornecedor_id INTEGER REFERENCES fornecedor(id),
    descricao TEXT, qtd REAL NOT NULL DEFAULT 1, valor_unit INTEGER NOT NULL DEFAULT 0
  );
  -- Dia a dia: o que aconteceu na obra. fase_id opcional - nem todo acontecimento
  -- pertence a uma fase. criado_em é ISO COM hora (o feed é do dia, ordena dentro dele).
  CREATE TABLE IF NOT EXISTS diario (
    id INTEGER PRIMARY KEY, obra_id INTEGER REFERENCES obra(id),
    fase_id INTEGER REFERENCES fase(id), texto TEXT NOT NULL,
    autor TEXT NOT NULL, criado_em TEXT NOT NULL
  );
  -- Galeria e Dia a dia são a MESMA coisa vista de dois ângulos: um post do dia a
  -- dia grava aqui com pasta='dia_a_dia' e diario_id preenchido. A coluna ref é o
  -- mesmo valor que /api/anexos devolve - nenhum caminho de arquivo novo.
  CREATE TABLE IF NOT EXISTS arquivo (
    id INTEGER PRIMARY KEY, obra_id INTEGER REFERENCES obra(id),
    pasta TEXT NOT NULL, nome TEXT NOT NULL, ref TEXT NOT NULL, criado_em TEXT NOT NULL,
    diario_id INTEGER REFERENCES diario(id) ON DELETE CASCADE
  );
`)

// Entrada agora é vinculada a uma fase (KPI de aporte por fase). ALTER idempotente
// pra bancos que já existem antes dessa mudança.
if (!db.prepare('PRAGMA table_info(entrada)').all().some((c) => c.name === 'fase_id')) {
  db.exec('ALTER TABLE entrada ADD COLUMN fase_id INTEGER REFERENCES fase(id)')
}

// A obra ganhou foto e cidade - o card da home é a foto, e cidade é o que
// distingue duas obras de mesmo nome. ALTER idempotente, banco existente sobrevive.
// obra.foto guarda o mesmo `ref` de /api/anexos; não é caminho de arquivo.
for (const [coluna, tipo] of [['foto', 'TEXT'], ['cidade', 'TEXT']]) {
  if (!db.prepare('PRAGMA table_info(obra)').all().some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE obra ADD COLUMN ${coluna} ${tipo}`)
  }
}

// `fase.executado` (avanço físico em %) era da v1 e virou campo morto quando a Medição
// passou a viver na tabela `avanco`, que guarda o avanço POR MÊS - um número só na fase
// não diz em que mês a obra andou. Cai pelo mesmo motivo de `fase.orcado`: coluna com
// nome plausível que ninguém escreve é armadilha esperando a próxima consulta.
if (db.prepare('PRAGMA table_info(fase)').all().some((c) => c.name === 'executado')) {
  db.exec('ALTER TABLE fase DROP COLUMN executado')
}

// PROJETO-v2 §3: o cliente da referência (Cadastro-Cliente.png) tem identificação,
// contato e endereço.
const COLUNAS_CLIENTE = [
  ['tipo', "TEXT NOT NULL DEFAULT 'fisica'"], // fisica | juridica
  ['cpf_cnpj', 'TEXT'], ['rg', 'TEXT'], ['dt_nasc', 'TEXT'], ['categoria', 'TEXT'],
  ['telefone', 'TEXT'], ['celular', 'TEXT'], ['email', 'TEXT'], ['observacao', 'TEXT'],
  ['ativo', 'INTEGER NOT NULL DEFAULT 1'],
  // Só o celular tem marca de WhatsApp (decidido em 14/08/2026). Fixo com zap existe,
  // mas é raro o bastante pra não valer uma segunda coluna e uma segunda caixa na tela.
  ['whatsapp_celular', 'INTEGER NOT NULL DEFAULT 0'],
  ['cep', 'TEXT'], ['logradouro', 'TEXT'], ['numero', 'TEXT'], ['complemento', 'TEXT'],
  ['bairro', 'TEXT'], ['cidade', 'TEXT'], ['uf', 'TEXT'],
]
// A obra de Cadastro-Obra.png: categoria, período com duração, CEI e endereço.
// `status` NÃO virou `situacao`: os dados já estão nele e renomear coluna pra ganhar
// sinônimo é churn. Ganhou só o valor novo 'nao_iniciada', que é o padrão da referência.
const COLUNAS_OBRA = [
  ['categoria', 'TEXT'], ['observacao', 'TEXT'],
  ['dt_inicio', 'TEXT'], ['dt_fim', 'TEXT'], ['cei', 'TEXT'],
  // Previsto × realizado do prazo da obra. Duas datas, sem duração gravada: ela se
  // calcula das datas, e campo derivado no banco é a primeira coisa a divergir.
  ['dt_inicio_real', 'TEXT'], ['dt_fim_real', 'TEXT'],
  ['cep', 'TEXT'], ['logradouro', 'TEXT'], ['numero', 'TEXT'], ['complemento', 'TEXT'],
  ['bairro', 'TEXT'], ['uf', 'TEXT'],
]

for (const [tabela, colunas] of [['cliente', COLUNAS_CLIENTE], ['obra', COLUNAS_OBRA]]) {
  const tem = new Set(db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name))
  for (const [coluna, tipo] of colunas) {
    if (!tem.has(coluna)) db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`)
  }
}

// Sem semente de obra/cliente/lançamento (14/08/2026): o sistema abre VAZIO, que é o
// princípio 1 - zero cadastro prévio. O mock da fase 3 já cumpriu o papel dele de dar
// tela pra olhar antes do backend existir. Continuam semeados, e não são placeholder:
// o catálogo de fases/serviços/insumos (catalogo.js) e o usuário admin (auth.js).

// ─────────────────────────────────────────────────────────────────────────────────
// PROJETO-v2 §3 - o Orçamento e a hierarquia fase → serviço → composição.
// A árvore tem DOIS níveis: `1.1 - SERVIÇOS TÉCNICOS` e `4.3 - Estaqueamento`
// são a mesma coisa (serviço). Não existe sub-fase - nem a subopção é uma (UPDATE.md §1.11).
db.exec(`
  -- Catálogo: compartilhado por todos os orçamentos, semeado em catalogo.js.
  CREATE TABLE IF NOT EXISTS fase_catalogo (
    id INTEGER PRIMARY KEY, codigo INTEGER NOT NULL, nome TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS servico_catalogo (
    id INTEGER PRIMARY KEY,
    fase_catalogo_id INTEGER NOT NULL REFERENCES fase_catalogo(id),
    codigo INTEGER NOT NULL, nome TEXT NOT NULL, unidade TEXT,
    opcoes TEXT                            -- JSON: ["basalto", "bloqueto", ...] ou NULL
  );
  -- Uma obra pode ter vários orçamentos (a lista da referência mostra 000001 e 000002).
  -- numero é sequencial de 6 dígitos, gerado no servidor: é identidade visual do produto.
  CREATE TABLE IF NOT EXISTS orcamento (
    id INTEGER PRIMARY KEY, numero TEXT NOT NULL UNIQUE,
    obra_id INTEGER NOT NULL REFERENCES obra(id),
    criado_em TEXT NOT NULL, ativo INTEGER NOT NULL DEFAULT 1,
    taxa_adm INTEGER NOT NULL DEFAULT 0,   -- ponto-base (1500 = 15,00%) sobre o custo - §4
    observacao TEXT
  );
  -- Custo unitário fica no serviço, partido em mão de obra e materiais (as duas
  -- sub-linhas do grid). A composição é calculadora: salvar sobrescreve estes campos.
  -- Margem em ponto-base inteiro (1500 = 15,00%), mesmo motivo de dinheiro ser centavo.
  -- orcamento_id fica AQUI e não na fase: a fase é da OBRA (nasce e morre com ela) e o
  -- serviço é o que UM orçamento diz sobre UMA fase. É o que faz versionar não clonar
  -- fase, excluir orçamento não encostar em lançamento, e o Dia a dia não listar
  -- "FUNDAÇÃO" quatro vezes.
  CREATE TABLE IF NOT EXISTS servico (
    id INTEGER PRIMARY KEY,
    orcamento_id INTEGER NOT NULL REFERENCES orcamento(id),
    fase_id INTEGER NOT NULL REFERENCES fase(id) ON DELETE CASCADE,
    catalogo_id INTEGER REFERENCES servico_catalogo(id),
    codigo INTEGER NOT NULL, nome TEXT NOT NULL, unidade TEXT,
    opcao TEXT,                            -- a subopção escolhida: 'basalto'
    qtd REAL NOT NULL DEFAULT 0, ordem INTEGER,
    custo_mo_unit INTEGER NOT NULL DEFAULT 0,
    custo_mat_unit INTEGER NOT NULL DEFAULT 0,
    margem_mo INTEGER NOT NULL DEFAULT 0,
    margem_mat INTEGER NOT NULL DEFAULT 0
  );
  -- A tabela insumo toma o lugar de item: o insumo do orçamento e o item da saída são
  -- a mesma coisa. Uma tabela a menos, e a relação insumo/fornecedor segue emergindo
  -- de saida_item. Vem ANTES de composicao, que a referencia.
  CREATE TABLE IF NOT EXISTS insumo (
    id INTEGER PRIMARY KEY, nome TEXT NOT NULL, unidade TEXT,
    tipo_custo TEXT NOT NULL DEFAULT 'materiais', incompleto INTEGER DEFAULT 0
  );
  -- Planejamento e Medição são a MESMA matriz fase × período, uma prevista e outra
  -- realizada. Uma tabela com coluna tipo em vez de duas iguais - e nada de tabela
  -- periodo: o mês é uma string 'YYYY-MM' na própria linha, e as colunas da tela
  -- saem do período da obra. Tabela de período seria um join a mais pra guardar texto.
  CREATE TABLE IF NOT EXISTS avanco (
    id INTEGER PRIMARY KEY,
    fase_id INTEGER NOT NULL REFERENCES fase(id) ON DELETE CASCADE,
    ym TEXT NOT NULL,                      -- '2017-12'
    tipo TEXT NOT NULL,                    -- planejado | medido
    pct INTEGER NOT NULL DEFAULT 0,        -- ponto-base (2500 = 25,00%)
    concluido_em TEXT,
    UNIQUE (fase_id, ym, tipo)
  );
  CREATE TABLE IF NOT EXISTS composicao (
    id INTEGER PRIMARY KEY,
    servico_id INTEGER NOT NULL REFERENCES servico(id) ON DELETE CASCADE,
    insumo_id INTEGER NOT NULL REFERENCES insumo(id),
    tipo_custo TEXT NOT NULL,              -- materiais | mao_de_obra
    qtd REAL NOT NULL DEFAULT 0, custo_unit INTEGER NOT NULL DEFAULT 0
  );
`)

// A fase ganha código e vínculo com o catálogo. `obra_id` já estava lá e é o único
// dono dela - quem tem orçamento é o serviço.
for (const [coluna, tipo] of [
  ['catalogo_id', 'INTEGER REFERENCES fase_catalogo(id)'],
  ['codigo', 'INTEGER'],
  // Fase concluída (UPDATE.md §11.2): a data, na própria fase. `avanco.concluido_em`
  // não serve - é por mês e por tipo (planejado/medido), e "a fundação acabou" é um
  // fato da fase, não de um mês dela. É MARCA, não trava: lançar continua valendo
  // (nota atrasada chega depois), a tela só avisa.
  ['concluida_em', 'TEXT'],
  // Percentual de referência da fase (UPDATE.md §2), ponto-base. NULL = o padrão do
  // catálogo, resolvido na leitura: a fase só grava número quando alguém o edita, e
  // por isso nenhum INSERT de fase (modal, semente) precisa saber que ele existe.
  ['percentual', 'INTEGER'],
  // Taxa de administração DA FASE (decidido com o Jean em 17/10/2026): escolhida ao
  // concluir, 'fixo' (taxa_valor em centavos) ou 'pct' (ponto-base sobre o PAGO da fase).
  // NULL = sem regra. Só é devida com a fase concluída - a conta mora em relatorio.js.
  ['taxa_tipo', 'TEXT'],
  ['taxa_valor', 'INTEGER'],
]) {
  if (!db.prepare('PRAGMA table_info(fase)').all().some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE fase ADD COLUMN ${coluna} ${tipo}`)
  }
}

// Subopção do serviço (UPDATE.md §1.11): a lista mora no catálogo, a escolha no
// serviço do orçamento. A escolha é TEXTO, não id - `outros` vira palavra digitada.
// Banco de antes da coluna ganha ela vazia; o catálogo dele, porém, é o velho - a
// revisão de 03/10/2026 só entra recriando o banco (§1.16).
for (const [tabela, coluna] of [['servico_catalogo', 'opcoes'], ['servico', 'opcao']]) {
  if (!db.prepare(`PRAGMA table_info(${tabela})`).all().some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} TEXT`)
  }
}

// Semente do catálogo, uma vez só.
if (db.prepare('SELECT COUNT(*) n FROM fase_catalogo').get().n === 0) {
  const insFase = db.prepare('INSERT INTO fase_catalogo (codigo, nome) VALUES (?,?)')
  const insServ = db.prepare(
    'INSERT INTO servico_catalogo (fase_catalogo_id, codigo, nome, unidade, opcoes) VALUES (?,?,?,?,?)',
  )
  CATALOGO.forEach(([nome, servicos, unidade], i) => {
    const faseId = Number(insFase.run(i + 1, nome).lastInsertRowid)
    servicos.forEach((s, j) => {
      const { nome: nomeServ, opcoes, unidade: un } = typeof s === 'string' ? { nome: s } : s
      insServ.run(faseId, j + 1, nomeServ, un ?? unidade, opcoes ? JSON.stringify(opcoes) : null)
    })
  })
  const insIns = db.prepare('INSERT INTO insumo (nome, unidade, tipo_custo) VALUES (?,?,?)')
  for (const [nome, unidade, tipo] of SEMENTE_INSUMOS) insIns.run(nome, unidade, tipo)
}

// Meio-fio é metro linear (Dúvida 18, 03/10/2026). Tinha herdado o M2 da fase. Banco já
// semeado não passa pela semente acima, então o acerto vai aqui, no catálogo e nos
// serviços que copiaram a unidade dele. Idempotente: só pega quem ainda está em M2.
db.exec(`
  UPDATE servico_catalogo SET unidade = 'M' WHERE nome = 'Meio-fio' AND unidade = 'M2';
  UPDATE servico SET unidade = 'M' WHERE unidade = 'M2'
    AND catalogo_id IN (SELECT id FROM servico_catalogo WHERE nome = 'Meio-fio');
`)

// Percentual padrão da fase de catálogo (UPDATE.md §2). Reescrito a CADA boot a partir
// de catalogo.js, casando por nome: é conteúdo de revisão da engenharia, e mexer nele
// não pode depender de recriar o banco como o resto do catálogo.
if (!db.prepare('PRAGMA table_info(fase_catalogo)').all().some((c) => c.name === 'percentual')) {
  db.exec('ALTER TABLE fase_catalogo ADD COLUMN percentual INTEGER NOT NULL DEFAULT 0')
}
{
  const setPct = db.prepare('UPDATE fase_catalogo SET percentual=? WHERE nome=?')
  for (const [nome, pct] of Object.entries(PERCENTUAL_PADRAO)) setPct.run(pct, nome)
}

// item → insumo: são a mesma entidade (PROJETO-v2 §3). Deixar as duas conviverem
// daria dois catálogos na cara do usuário - cadastra o insumo no orçamento e ele não
// aparece na saída. Reconstrói saida_item apontando pra insumo e apaga item.
// Roda uma vez; depois a tabela item não existe mais e o guard salta.
if (db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='item'").get().n) {
  db.exec('PRAGMA foreign_keys = OFF')
  db.exec('BEGIN')
  try {
    const acha = db.prepare('SELECT id FROM insumo WHERE lower(nome) = lower(?)')
    const cria = db.prepare('INSERT INTO insumo (nome, unidade, incompleto) VALUES (?,?,?)')
    const de_para = new Map()
    for (const it of db.prepare('SELECT * FROM item').all()) {
      const existente = acha.get(it.nome)
      de_para.set(
        it.id,
        existente ? existente.id : Number(cria.run(it.nome, it.unidade, it.incompleto ?? 0).lastInsertRowid),
      )
    }
    db.exec(`
      CREATE TABLE saida_item_novo (
        id INTEGER PRIMARY KEY,
        saida_id INTEGER REFERENCES saida(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES insumo(id),
        fornecedor_id INTEGER REFERENCES fornecedor(id),
        descricao TEXT, qtd REAL NOT NULL DEFAULT 1, valor_unit INTEGER NOT NULL DEFAULT 0
      );
    `)
    const ins = db.prepare(
      'INSERT INTO saida_item_novo (id, saida_id, item_id, fornecedor_id, descricao, qtd, valor_unit) VALUES (?,?,?,?,?,?,?)',
    )
    for (const l of db.prepare('SELECT * FROM saida_item').all()) {
      ins.run(l.id, l.saida_id, l.item_id == null ? null : (de_para.get(l.item_id) ?? null),
        l.fornecedor_id, l.descricao, l.qtd, l.valor_unit)
    }
    db.exec('DROP TABLE saida_item; ALTER TABLE saida_item_novo RENAME TO saida_item; DROP TABLE item;')
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
  db.exec('PRAGMA foreign_keys = ON')
}

// `fase.orcado` era a v1: um número solto na fase. A árvore nova soma SERVIÇOS, e duas
// fontes com o mesmo nome é o bug que este sistema não pode ter - a home somava a
// coluna morta e mostrava R$ 0,00. Cai junto de `executado`, pelo mesmo motivo.
if (db.prepare('PRAGMA table_info(fase)').all().some((c) => c.name === 'orcado')) {
  db.exec('ALTER TABLE fase DROP COLUMN orcado')
}

// ─────────────────────────────────────────────────────────────────────────────────
// PROJETO-v3 §7.1 e §7.2 - Fornecedores e Contas a pagar.
//
// O fornecedor ganha os campos do cliente porque a tela é a mesma tela. A saída ganha
// três colunas e passa a ser conta a pagar: quem cobra, quando vence, quando saiu do
// caixa. NENHUMA tabela nova - a despesa já existia, só não sabia que vence.
const COLUNAS_FORNECEDOR = [
  ['cnpj', 'TEXT'], ['ie', 'TEXT'], ['telefone', 'TEXT'], ['celular', 'TEXT'],
  ['email', 'TEXT'], ['observacao', 'TEXT'], ['ativo', 'INTEGER NOT NULL DEFAULT 1'],
  ['whatsapp_celular', 'INTEGER NOT NULL DEFAULT 0'],
  ['cep', 'TEXT'], ['logradouro', 'TEXT'], ['numero', 'TEXT'], ['complemento', 'TEXT'],
  ['bairro', 'TEXT'], ['cidade', 'TEXT'], ['uf', 'TEXT'],
  // Fornecedor × prestador (UPDATE.md §10.1): dois checks, não um tipo - a empreiteira
  // que também vende material existe. Os dois desmarcados = ainda não classificado.
  ['fornece_material', 'INTEGER NOT NULL DEFAULT 0'],
  ['presta_servico', 'INTEGER NOT NULL DEFAULT 0'],
]
const COLUNAS_SAIDA = [
  ['fornecedor_id', 'INTEGER REFERENCES fornecedor(id)'],
  ['vencimento', 'TEXT'], // ISO. NULL = à vista, não tem boleto pra vencer
  ['pago_em', 'TEXT'],    // ISO. NULL = em aberto, ainda não saiu do caixa
  ['pago_obs', 'TEXT'],   // como se pagou: "pix", "cheque 4412", "abatido do saldo"
]
for (const [tabela, colunas] of [['fornecedor', COLUNAS_FORNECEDOR], ['saida', COLUNAS_SAIDA]]) {
  const tem = new Set(db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name))
  for (const [coluna, tipo] of colunas) {
    if (tem.has(coluna)) continue
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`)
    // Toda saída que existe hoje foi lançada DEPOIS de paga - até agora o sistema não
    // tinha noção de conta em aberto. Sem isto o caixa zeraria na primeira subida.
    // Roda junto do ALTER, uma vez só na vida do banco.
    if (coluna === 'pago_em') db.exec('UPDATE saida SET pago_em = data')
  }
}

// `whatsapp_telefone` existiu por algumas horas em 14/08/2026 e foi cortada no mesmo
// dia: a marca ficou só no celular. Como o ALTER já pode ter rodado em algum banco,
// derruba a coluna em vez de deixar campo morto que ninguém sabe se pode preencher.
for (const t of ['cliente', 'fornecedor']) {
  if (db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === 'whatsapp_telefone')) {
    db.exec(`ALTER TABLE ${t} DROP COLUMN whatsapp_telefone`)
  }
}

// Duração da obra deixou de ser campo (14/08/2026): o período previsto são duas datas,
// e quantos meses isso dá é INFORMAÇÃO derivada, na tela e na matriz de Planejamento.
// Guardar o número junto das datas era guardar a mesma coisa duas vezes, com as duas
// livres pra divergir.
for (const c of ['duracao', 'duracao_unidade']) {
  if (db.prepare('PRAGMA table_info(obra)').all().some((x) => x.name === c)) {
    db.exec(`ALTER TABLE obra DROP COLUMN ${c}`)
  }
}

// O orçamento ganhou nome porque agora ele se versiona: "Salvar como novo" congela o
// estado atual num orçamento INATIVO e o vivo segue com o nome novo. Sem nome, um
// histórico de quatro versões seria quatro números de seis dígitos na lista.
if (!db.prepare('PRAGMA table_info(orcamento)').all().some((c) => c.name === 'nome')) {
  db.exec('ALTER TABLE orcamento ADD COLUMN nome TEXT')
}

// Documento do cliente (contrato, procuração, RG) mora na MESMA tabela arquivo: é o
// mesmo blob, o mesmo upload e o mesmo download. `obra_id` fica nulo e `cliente_id`
// preenchido - uma coluna, em vez de uma tabela `documento_cliente` que refaria tudo.
if (!db.prepare('PRAGMA table_info(arquivo)').all().some((c) => c.name === 'cliente_id')) {
  db.exec('ALTER TABLE arquivo ADD COLUMN cliente_id INTEGER REFERENCES cliente(id)')
}

// Insumo ↔ fornecedor DECLARADO (21/08/2026). O histórico de `saida_item` continua
// sendo a relação REAL - é dele que sai preço e data, e ele não muda. Esta tabela é o
// que o usuário AFIRMA antes da primeira compra: fornecedor novo não tem histórico e
// não sugeria nada. N:N e simétrica: uma linha lida dos dois lados.
db.exec(`
  CREATE TABLE IF NOT EXISTS insumo_fornecedor (
    insumo_id INTEGER NOT NULL REFERENCES insumo(id) ON DELETE CASCADE,
    fornecedor_id INTEGER NOT NULL REFERENCES fornecedor(id) ON DELETE CASCADE,
    PRIMARY KEY (insumo_id, fornecedor_id)
  ) WITHOUT ROWID;
`)

// Preço base do item e preço por fornecedor (22/08/2026). Centavos, como todo dinheiro
// daqui. Zero = não informado, que é diferente de "de graça" e não precisa de NULL.
//
// São três preços com PAPÉIS diferentes, e é isso que impede a divergência que derrubou
// `fase.orcado`: `insumo.preco_base` é o padrão do catálogo (o que a coisa costuma
// custar), `insumo_fornecedor.preco` é o que ESTE fornecedor cobra, e o que já foi pago
// continua saindo de `saida_item` - esse é fato consumado e não se edita. Os dois
// primeiros são chute inicial de campo; o terceiro é história.
for (const [tabela, coluna] of [['insumo', 'preco_base'], ['insumo_fornecedor', 'preco']]) {
  if (!db.prepare(`PRAGMA table_info(${tabela})`).all().some((c) => c.name === coluna)) {
    db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} INTEGER NOT NULL DEFAULT 0`)
  }
}

// Ordem de LANÇAMENTO (22/08/2026). O extrato da fase mistura entrada e saída, e cada
// uma tem o seu contador de id - ordenar por id intercalava as duas ao acaso. `data`
// também não serve: é a data da nota, e uma rajada de dez notas no mesmo dia tem dez
// datas iguais.
//
// Backfill: a hora do que já existe ninguém guardou, mas o `id` guarda a ordem DENTRO
// de cada tabela - vira um instante sintético que a preserva, com a entrada logo antes
// da saída de mesmo número. É palpite só no cruzamento das duas; dentro de cada uma é
// a ordem real. `2*id` em segundos dá conta de 1800 lançamentos por dia sem virar a hora.
const INSTANTE = (n) => `data || 'T00:' || printf('%02d:%02d', (${n})/60, (${n})%60)`
for (const [t, n] of [['entrada', '2*id-2'], ['saida', '2*id-1']]) {
  if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === 'criado_em')) {
    db.exec(`ALTER TABLE ${t} ADD COLUMN criado_em TEXT`)
    db.exec(`UPDATE ${t} SET criado_em = ${INSTANTE(n)}`)
  }
}

// Número do lançamento (UPDATE.md §9). POR OBRA, entrada e saída na mesma sequência
// (Jean, 19/10/2026): uma pasta física de comprovantes por obra, e o Nº 2 é o 2º papel
// dela. Substituiu o `E-000231` / `S-000412` global por tipo (03/10/2026).
//
// Não é o `id`: SQLite sem AUTOINCREMENT reaproveita o maior id quando a última linha
// é excluída, e número citado ("confere o Nº 12") não pode voltar a existir com outra
// nota. O contador mora em `sequencia` (`obra:<id>`) e só anda pra frente. Quem numera é
// TRIGGER, não a rota: todo INSERT (servidor, semear.js, testes) sai numerado sem saber.
// A obra da saída vem da fase - por isso a saída não troca de obra (server.js).
db.exec(`
  CREATE TABLE IF NOT EXISTS sequencia (
    nome TEXT PRIMARY KEY, ultimo INTEGER NOT NULL DEFAULT 0
  ) WITHOUT ROWID;
`)

// Numera tudo de novo, 1..n por obra na ordem de lançamento, e acerta os contadores. É
// a migração e o fim do semear.js (que insere fora de ordem). Fora desses dois, NUNCA:
// renumerar o que já está escrito na pasta é exatamente o que o número evita.
export function renumerarObras() {
  db.exec('UPDATE entrada SET numero = NULL; UPDATE saida SET numero = NULL')
  const lancs = db.prepare(`
    SELECT 'entrada' AS t, id, obra_id, criado_em FROM entrada
    UNION ALL
    SELECT 'saida', s.id, f.obra_id, s.criado_em FROM saida s JOIN fase f ON f.id = s.fase_id
    ORDER BY obra_id, criado_em, id
  `).all()
  const up = { entrada: db.prepare('UPDATE entrada SET numero = ? WHERE id = ?'), saida: db.prepare('UPDATE saida SET numero = ? WHERE id = ?') }
  const ultimo = new Map()
  for (const l of lancs) {
    const n = (ultimo.get(l.obra_id) ?? 0) + 1
    ultimo.set(l.obra_id, n)
    up[l.t].run(n, l.id)
  }
  db.exec("DELETE FROM sequencia WHERE nome IN ('entrada', 'saida') OR nome LIKE 'obra:%'")
  const seq = db.prepare('INSERT INTO sequencia (nome, ultimo) VALUES (?,?)')
  for (const [obra, n] of ultimo) seq.run(`obra:${obra}`, n)
}

for (const t of ['entrada', 'saida']) {
  if (!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => c.name === 'numero')) {
    db.exec(`ALTER TABLE ${t} ADD COLUMN numero INTEGER`)
  }
}
// Migração da numeração global por tipo (índice único por tabela, trigger `<t>_numerar`)
// pra por obra: o número repete entre obras, então o índice deixa de ser único.
const temTrigger = (nome) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'trigger' AND name = ?").get(nome)
if (!temTrigger('entrada_numerar_obra')) {
  db.exec(`
    DROP TRIGGER IF EXISTS entrada_numerar; DROP TRIGGER IF EXISTS saida_numerar;
    DROP INDEX IF EXISTS entrada_numero; DROP INDEX IF EXISTS saida_numero;
  `)
  renumerarObras()
  const obraDe = { entrada: 'NEW.obra_id', saida: '(SELECT obra_id FROM fase WHERE id = NEW.fase_id)' }
  for (const t of ['saida', 'entrada']) {
    db.exec(`
      CREATE TRIGGER ${t}_numerar_obra AFTER INSERT ON ${t} WHEN NEW.numero IS NULL
      BEGIN
        INSERT OR IGNORE INTO sequencia (nome, ultimo) VALUES ('obra:' || ${obraDe[t]}, 0);
        UPDATE sequencia SET ultimo = ultimo + 1 WHERE nome = 'obra:' || ${obraDe[t]};
        UPDATE ${t} SET numero = (SELECT ultimo FROM sequencia WHERE nome = 'obra:' || ${obraDe[t]}) WHERE id = NEW.id;
      END;
    `)
  }
}

// Serviço do lançamento (UPDATE.md §6). Aponta pro serviço DE CATÁLOGO, não pro da
// estimativa: `servico` pertence a uma versão, e versionar a estimativa deixaria o
// lançamento preso no retrato antigo. O de catálogo atravessa versões - o estimado
// do serviço é o que a versão VIVA diz pra (fase, catalogo_id). NULL = fase inteira.
// Só a saída: entrada é aporte do cliente na fase, não pagamento de serviço.
if (!db.prepare('PRAGMA table_info(saida)').all().some((c) => c.name === 'servico_catalogo_id')) {
  db.exec('ALTER TABLE saida ADD COLUMN servico_catalogo_id INTEGER REFERENCES servico_catalogo(id)')
}

// Quanto de cada saída é devido a qual credor (UPDATE.md §10.2) - a regra num lugar só,
// lida pela lista de fornecedores e pelo extrato do credor. Credor é fornecedor
// cadastrado (Dúvida 12): banco e prefeitura entram como cadastro, sem tipo marcado.
//   - saída com fornecedor no cabeçalho: a nota inteira é dele ("quem cobra");
//   - sem cabeçalho: cada fornecedor das linhas leva a soma das linhas dele.
// Saída sem fornecedor em lugar nenhum não tem credor e não entra em extrato nenhum.
// Antes a lista somava só saida_item, e nota sem itens com fornecedor no cabeçalho
// (empreita, adiantamento) não aparecia no total dele.
// DROP + CREATE a cada boot: `IF NOT EXISTS` congelaria a primeira versão da view.
db.exec(`
  DROP VIEW IF EXISTS saida_credor;
  CREATE VIEW saida_credor AS
    SELECT s.id AS saida_id, s.fornecedor_id, s.valor
    FROM saida s WHERE s.fornecedor_id IS NOT NULL
    UNION ALL
    SELECT si.saida_id, si.fornecedor_id, CAST(SUM(ROUND(si.qtd * si.valor_unit)) AS INTEGER)
    FROM saida_item si JOIN saida s ON s.id = si.saida_id
    WHERE s.fornecedor_id IS NULL AND si.fornecedor_id IS NOT NULL
    GROUP BY si.saida_id, si.fornecedor_id;
`)

// Numeração de 6 dígitos, sequencial global - é o que a lista da referência mostra.
export function novoOrcamento(obra_id) {
  const { n } = db.prepare('SELECT IFNULL(MAX(CAST(numero AS INTEGER)),0) n FROM orcamento').get()
  const numero = String(n + 1).padStart(6, '0')
  return Number(
    db.prepare('INSERT INTO orcamento (numero, obra_id, criado_em) VALUES (?,?,?)')
      .run(numero, obra_id, new Date().toISOString()).lastInsertRowid,
  )
}

export default db

// Semente de demonstração: um ano de uso do escritório (22/08/2025 → 22/08/2026).
//
//   docker compose run --rm api node --experimental-sqlite semear.js [--limpar]
//
// Não é semente de produção - db.js continua abrindo VAZIO (princípio 1). Isto aqui é
// pra olhar as telas cheias: obra estourando orçamento, conta vencida em aberto, fase
// sem gasto, cliente incompleto vindo de quick-create, galeria com foto e com .dwg.
//
// Determinístico (PRNG com semente fixa): rodar duas vezes com --limpar dá o mesmo banco.
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { deflateSync } from 'node:zlib'
import db, { novoOrcamento, renumerarObras } from './db.js'
import { CATALOGO } from './catalogo.js'

const ANEXOS = process.env.ANEXOS_DIR || '/data/anexos'
mkdirSync(ANEXOS, { recursive: true })

// ── Aleatório determinístico (LCG) ────────────────────────────────────────────────
let semente = 20260822
const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296)
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1))
const pick = (a) => a[Math.floor(rnd() * a.length)]
const talvez = (p) => rnd() < p
// Embaralha e devolve os n primeiros.
const alguns = (a, n) => [...a].sort(() => rnd() - 0.5).slice(0, n)

// ── Datas ─────────────────────────────────────────────────────────────────────────
const DIA = 86400000
const HOJE = Date.parse('2026-08-22')
const INICIO = HOJE - 365 * DIA
const iso = (t) => new Date(t).toISOString().slice(0, 10)
const isoHora = (t) => new Date(t).toISOString().slice(0, 19)
const maisDias = (d, n) => iso(Date.parse(d) + n * DIA)
const entreDatas = (a, b) => iso(a + Math.floor(rnd() * (b - a)))

// ── PNG sólido/gradiente, sem dependência (zlib basta) ────────────────────────────
// Foto de obra e miniatura de galeria precisam de bytes de imagem DE VERDADE - a
// galeria serve inline e o <img> não renderiza placeholder de texto.
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function bloco(tipo, dados) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([len, corpo, crc])
}
function png(w, h, cor) {
  const linha = 1 + w * 3
  const raw = Buffer.alloc(h * linha)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = cor(x, y)
      const p = y * linha + 1 + x * 3
      raw[p] = r
      raw[p + 1] = g
      raw[p + 2] = b
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 2 // RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloco('IHDR', ihdr),
    bloco('IDAT', deflateSync(raw)),
    bloco('IEND', Buffer.alloc(0)),
  ])
}

// Céu em gradiente + silhueta de prédios. Não é foto, mas enche o card e a grade da
// galeria com algo que se distingue de obra pra obra.
function fotoObra(matiz) {
  const preds = Array.from({ length: int(3, 6) }, () => ({
    x: int(0, 560), l: int(60, 130), a: int(90, 220),
  }))
  return png(640, 360, (x, y) => {
    const t = y / 360
    let r = Math.round(matiz[0] * (0.55 + 0.45 * t))
    let g = Math.round(matiz[1] * (0.55 + 0.45 * t))
    let b = Math.round(matiz[2] * (0.55 + 0.45 * t))
    for (const p of preds) {
      if (x >= p.x && x < p.x + p.l && y > 360 - p.a) {
        const janela = (x - p.x) % 22 < 10 && (360 - y) % 26 < 12 && y > 360 - p.a + 14
        return janela ? [230, 210, 150] : [Math.round(r * 0.3), Math.round(g * 0.3), Math.round(b * 0.32)]
      }
    }
    return [r, g, b]
  })
}

let seqRef = 0
function guardar(nome, buf) {
  const limpo = nome.replace(/[^\w.\-]+/g, '_')
  const ref = `${1755800000000 + seqRef++ * 997}-${(seqRef * 7919).toString(36).slice(0, 6)}__${limpo}`
  writeFileSync(join(ANEXOS, ref), buf)
  return ref
}
// ponytail: documento e projeto são bytes de placeholder - essas extensões só caem no
// download (nunca inline), então o conteúdo não muda nenhuma tela.
const arquivoFalso = (nome, texto) => guardar(nome, Buffer.from(`${texto}\n\n(arquivo de demonstração)\n`))

// ── Limpeza ───────────────────────────────────────────────────────────────────────
const TABELAS = ['servico', 'orcamento', 'saida_item', 'arquivo',
  'diario', 'saida', 'entrada', 'fase', 'obra', 'insumo_fornecedor', 'cliente', 'fornecedor']

if (process.argv.includes('--limpar')) {
  // ponytail: os blobs em /data/anexos ficam órfãos - mesmo trato que o DELETE de obra
  // já dá hoje. Disco é barato; varrer arquivo é o que estraga o dia de alguém.
  db.exec('PRAGMA foreign_keys = OFF')
  for (const t of TABELAS) db.exec(`DELETE FROM ${t}`)
  // O contador do número do lançamento volta junto: cada obra da demo começa no Nº 1.
  db.exec("DELETE FROM sequencia WHERE nome IN ('entrada', 'saida') OR nome LIKE 'obra:%'")
  db.exec('PRAGMA foreign_keys = ON')
  console.log('banco limpo (catálogo, insumos e usuários preservados)')
} else if (db.prepare('SELECT COUNT(*) n FROM obra').get().n) {
  console.error('já existem obras no banco. Rode com --limpar para apagar e semear de novo.')
  process.exit(1)
}

db.exec('BEGIN')

// ── Insumos: preço base nos que já vieram do catálogo + o resto do almoxarifado ────
const PRECOS = {
  'Areia lavada tipo media': 12000, 'Pedra britada 1': 14500,
  'Cimento portland cp ii-e-32': 78, 'Tijolo ceramico furado de vedacao': 145,
  'Aço CA-50 10mm': 890, 'Concreto usinado fck 25': 48500, 'Cal hidratada': 95,
  Servente: 1450, Pedreiro: 2600, Carpinteiro: 2800, Armador: 2750,
  Encanador: 2900, Eletricista: 3100, Pintor: 2400,
}
const EXTRAS = [
  ['Bloco de concreto 14x19x39', 'Unidades', 'materiais', 380],
  ['Argamassa colante AC-II 20kg', 'Sacos', 'materiais', 2450],
  ['Rejunte flexível', 'Quilos', 'materiais', 1200],
  ['Porcelanato 60x60 acetinado', 'Metro Quadrado', 'materiais', 6900],
  ['Tinta acrílica premium 18L', 'Latas', 'materiais', 32900],
  ['Massa corrida PVA 18L', 'Latas', 'materiais', 11500],
  ['Telha cerâmica portuguesa', 'Unidades', 'materiais', 320],
  ['Madeira para forma pinus', 'Metro Quadrado', 'materiais', 5200],
  ['Tubo PVC esgoto 100mm', 'Metros', 'materiais', 2850],
  ['Tubo PVC soldável 25mm', 'Metros', 'materiais', 890],
  ['Fio flexível 2,5mm² rolo 100m', 'Rolos', 'materiais', 18900],
  ['Eletroduto corrugado 3/4', 'Metros', 'materiais', 340],
  ['Disjuntor bipolar 40A', 'Unidades', 'materiais', 4800],
  ['Caixa d\'água 1000L', 'Unidades', 'materiais', 79000],
  ['Janela de alumínio 1,20x1,00', 'Unidades', 'materiais', 48000],
  ['Porta de madeira semi-oca 80cm', 'Unidades', 'materiais', 39000],
  ['Vaso sanitário com caixa acoplada', 'Unidades', 'materiais', 52000],
  ['Manta asfáltica 3mm', 'Metro Quadrado', 'materiais', 4700],
  ['Gesso em pó', 'Quilos', 'materiais', 120],
  ['Locação de betoneira 400L', 'Diárias', 'materiais', 8500],
  ['Locação de andaime', 'Metro Quadrado', 'materiais', 1800],
  ['Mestre de obras', 'Hora', 'mao_de_obra', 4200],
  ['Ajudante geral', 'Hora', 'mao_de_obra', 1350],
  ['Gesseiro', 'Hora', 'mao_de_obra', 2700],
  ['Azulejista', 'Hora', 'mao_de_obra', 3000],
  ['Serralheiro', 'Hora', 'mao_de_obra', 3200],
  // Incompletos: nasceram do `+ Criar` dentro de um lançamento e ninguém completou.
  ['Rodapé de poliestireno', null, 'materiais', 0, 1],
  ['Selante PU 400ml', null, 'materiais', 0, 1],
  ['Fita crepe larga', null, 'materiais', 0, 1],
]

const achaInsumo = db.prepare('SELECT id FROM insumo WHERE lower(nome) = lower(?)')
const insInsumo = db.prepare(
  'INSERT INTO insumo (nome, unidade, tipo_custo, preco_base, incompleto) VALUES (?,?,?,?,?)',
)
function insumo(nome, unidade, tipo, preco, incompleto = 0) {
  const j = achaInsumo.get(nome)
  if (j) {
    db.prepare('UPDATE insumo SET preco_base=? WHERE id=?').run(preco, j.id)
    return j.id
  }
  return Number(insInsumo.run(nome, unidade, tipo, preco, incompleto).lastInsertRowid)
}
for (const [nome, preco] of Object.entries(PRECOS)) {
  const j = achaInsumo.get(nome)
  if (j) db.prepare('UPDATE insumo SET preco_base=? WHERE id=?').run(preco, j.id)
}
for (const [nome, un, tipo, preco, inc] of EXTRAS) insumo(nome, un, tipo, preco, inc)

const INSUMOS = db.prepare('SELECT id, nome, unidade, tipo_custo, preco_base FROM insumo').all()
const porNome = (frag) => INSUMOS.filter((i) => i.nome.toLowerCase().includes(frag.toLowerCase()))

// ── Fornecedores ──────────────────────────────────────────────────────────────────
// [nome, cnpj, cidade, uf, fornece (fragmentos de nome de insumo), extras]
const FORNECEDORES = [
  ['Depósito Central Materiais de Construção', '12.345.678/0001-90', 'Campinas', 'SP',
    ['areia', 'pedra', 'cimento', 'cal', 'tijolo', 'bloco', 'argamassa', 'rejunte']],
  ['Concreteira Bandeirantes Ltda', '23.456.789/0001-01', 'Campinas', 'SP', ['concreto usinado', 'betoneira']],
  ['Aço & Ferro Distribuidora', '34.567.890/0001-12', 'Sumaré', 'SP', ['aço', 'serralheiro']],
  ['Casa das Tintas Boa Pintura', '45.678.901/0001-23', 'Campinas', 'SP', ['tinta', 'massa corrida', 'pintor']],
  ['Cerâmica São João', '56.789.012/0001-34', 'Itu', 'SP', ['tijolo', 'telha']],
  ['Hidrotec Materiais Hidráulicos', '67.890.123/0001-45', 'Campinas', 'SP',
    ['tubo pvc', 'caixa d', 'vaso sanit', 'encanador']],
  ['Eletrocentro Materiais Elétricos', '78.901.234/0001-56', 'Valinhos', 'SP',
    ['fio flex', 'eletroduto', 'disjuntor', 'eletricista']],
  ['Madeireira Três Irmãos', '89.012.345/0001-67', 'Indaiatuba', 'SP', ['madeira', 'carpinteiro', 'porta de madeira']],
  ['Porcelanatos Del Rey', '90.123.456/0001-78', 'Campinas', 'SP', ['porcelanato', 'azulejista', 'argamassa']],
  ['Alumínio Sul Esquadrias', '01.234.567/0001-89', 'Hortolândia', 'SP', ['janela de alum']],
  ['Gesso Prime Acabamentos', '11.222.333/0001-44', 'Campinas', 'SP', ['gesso']],
  ['Locadora de Máquinas Norte', '22.333.444/0001-55', 'Paulínia', 'SP', ['locação']],
  ['J. Alves Empreitas de Mão de Obra', '33.444.555/0001-66', 'Campinas', 'SP',
    ['pedreiro', 'servente', 'ajudante', 'mestre de obras', 'armador']],
  ['Impermeabiliza Já Ltda', '44.555.666/0001-77', 'Campinas', 'SP', ['manta asf']],
  ['Transporte e Bota-Fora Silva', '55.666.777/0001-88', 'Campinas', 'SP', [], { servico: 1 }],
  ['Vidraçaria Cristal', '66.777.888/0001-99', 'Campinas', 'SP', [], { ativo: 0, material: 1 }],
  ['Marcelo Encanador', null, null, null, [], { incompleto: 1, servico: 1 }],
  ['Serralheria Pontual', null, null, null, [], { incompleto: 1 }],
]

const insForn = db.prepare(`
  INSERT INTO fornecedor (nome, cnpj, contato, telefone, celular, email, cidade, uf,
                          whatsapp_celular, ativo, incompleto, observacao)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
`)
const insVinculo = db.prepare(
  'INSERT OR IGNORE INTO insumo_fornecedor (insumo_id, fornecedor_id, preco) VALUES (?,?,?)',
)
const fornecedores = FORNECEDORES.map(([nome, cnpj, cidade, uf, fornece, extra = {}]) => {
  const inc = extra.incompleto ?? 0
  const id = Number(insForn.run(
    nome, cnpj,
    inc ? null : pick(['Sr. Antônio', 'Dna. Célia', 'Paulo (vendas)', 'Renata', 'Balcão']),
    inc ? null : `(19) 3${int(200, 899)}-${int(1000, 9999)}`,
    inc ? null : `(19) 9${int(8000, 9999)}-${int(1000, 9999)}`,
    inc ? null : `contato@${nome.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}.com.br`,
    cidade, uf, inc ? 0 : (talvez(0.7) ? 1 : 0), extra.ativo ?? 1, inc,
    talvez(0.25) ? 'Entrega em 48h para pedido acima de R$ 2.000.' : null,
  ).lastInsertRowid)
  // Vínculo DECLARADO (aba Itens do fornecedor): preço combinado gira em torno do base.
  const tipos = new Set()
  for (const frag of fornece) {
    for (const i of porNome(frag)) {
      insVinculo.run(i.id, id, Math.round(i.preco_base * (0.88 + rnd() * 0.24)))
      tipos.add(i.tipo_custo)
    }
  }
  // Fornecedor × prestador (UPDATE.md §10.1) sai do que ele declara fornecer: vende
  // insumo de material → fornece material; vende hora de mão de obra → presta serviço.
  // Sem rnd(): não mexe na sequência do PRNG, o resto do banco sai igual. A Serralheria
  // fica sem nenhum dos dois de propósito - é o cadastro ainda não classificado.
  db.prepare('UPDATE fornecedor SET fornece_material = ?, presta_servico = ? WHERE id = ?').run(
    extra.material ?? (tipos.has('materiais') ? 1 : 0),
    extra.servico ?? (tipos.has('mao_de_obra') ? 1 : 0),
    id,
  )
  return { id, nome, fornece }
})
const fornAtivos = fornecedores.filter((f) => f.fornece.length)
// Quem fornece o insumo (pra saída sair coerente com o vínculo declarado).
const fornDe = (insumoNome) => {
  const c = fornAtivos.filter((f) => f.fornece.some((g) => insumoNome.toLowerCase().includes(g.toLowerCase())))
  return c.length ? pick(c) : pick(fornecedores)
}

// ── Clientes ──────────────────────────────────────────────────────────────────────
const CLIENTES = [
  ['Construtora Vale Verde Ltda', 'juridica', 'Construtora', 'Campinas'],
  ['Marcos Antônio Ribeiro', 'fisica', 'Particular', 'Campinas'],
  ['Condomínio Residencial Aurora', 'juridica', 'Outro', 'Valinhos'],
  ['Juliana Prado Menezes', 'fisica', 'Particular', 'Vinhedo'],
  ['Incorporadora Nova Praça S/A', 'juridica', 'Incorporadora', 'Campinas'],
  ['Padaria Pão de Ouro ME', 'juridica', 'Outro', 'Sumaré'],
  ['Igreja Batista Central', 'juridica', 'Outro', 'Campinas'],
  ['Fernanda Lopes Camargo', 'fisica', 'Particular', 'Indaiatuba', { ativo: 0 }],
  ['Ricardo Sanches', 'fisica', null, null, { incompleto: 1 }],
  ['Eduardo Kimura', 'fisica', null, null, { incompleto: 1 }],
]
const RUAS = ['Rua das Acácias', 'Av. Brasil', 'Rua Coronel Quirino', 'Av. Norte-Sul',
  'Rua Barão de Jaguara', 'Rua Sete de Setembro', 'Av. das Amoreiras', 'Rua Projetada A']
const BAIRROS = ['Centro', 'Cambuí', 'Jardim Chapadão', 'Vila Industrial', 'Taquaral', 'Nova Campinas']

const insCliente = db.prepare(`
  INSERT INTO cliente (nome, tipo, categoria, contato, cpf_cnpj, telefone, celular, email,
                       whatsapp_celular, observacao, ativo, incompleto,
                       cep, logradouro, numero, bairro, cidade, uf)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`)
const clientes = CLIENTES.map(([nome, tipo, categoria, cidade, extra = {}]) => {
  const inc = extra.incompleto ?? 0
  const doc = tipo === 'juridica'
    ? `${int(10, 99)}.${int(100, 999)}.${int(100, 999)}/0001-${int(10, 99)}`
    : `${int(100, 999)}.${int(100, 999)}.${int(100, 999)}-${int(10, 99)}`
  const id = Number(insCliente.run(
    nome, tipo, categoria,
    inc ? null : pick(['Falar com o engenheiro', 'Direto com o proprietário', 'Setor de compras', null]),
    inc ? null : doc,
    inc ? null : `(19) 3${int(200, 899)}-${int(1000, 9999)}`,
    inc ? null : `(19) 9${int(8000, 9999)}-${int(1000, 9999)}`,
    inc ? null : `${nome.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}@email.com.br`,
    inc ? 0 : 1,
    talvez(0.3) ? 'Prefere receber medição por e-mail até o dia 5.' : null,
    extra.ativo ?? 1, inc,
    inc ? null : `13${int(100, 999)}-${int(100, 999)}`,
    inc ? null : pick(RUAS), inc ? null : String(int(10, 2400)),
    inc ? null : pick(BAIRROS), cidade, cidade ? 'SP' : null,
  ).lastInsertRowid)
  return { id, nome }
})

// Documento de cliente (contrato) - mesma tabela `arquivo`, obra_id nulo.
const insArquivo = db.prepare(
  'INSERT INTO arquivo (obra_id, cliente_id, pasta, nome, ref, criado_em, diario_id) VALUES (?,?,?,?,?,?,?)',
)
for (const c of clientes.slice(0, 5)) {
  insArquivo.run(null, c.id, 'documentos', 'Contrato de prestacao de servicos.pdf',
    arquivoFalso('Contrato de prestacao de servicos.pdf', `Contrato - ${c.nome}`),
    isoHora(INICIO + int(0, 200) * DIA), null)
}

// ── Obras ─────────────────────────────────────────────────────────────────────────
// [cliente, nome, cidade, categoria, status, diaInicio (offset), duracaoDias, nFases,
//  gastoPct, orçamento alvo em reais]
//
// O orçamento é ALVO, não resultado: a qtd de cada serviço é calculada pra fechar nele.
// Sem isso o produto de "qtd aleatória × custo de composição" dava casa de R$ 5 milhões.
const OBRAS = [
  [0, 'Residencial Alto da Serra - Bloco A', 'Campinas', 'Construção Prédio', 'concluida', -20, 330, 12, 1.02, 4_800_000],
  [1, 'Casa Ribeiro - Jardim Chapadão', 'Campinas', 'Construção Casa', 'concluida', 10, 250, 9, 0.94, 620_000],
  [2, 'Reforma da fachada e hall', 'Valinhos', 'Reforma', 'concluida', 40, 150, 5, 1.18, 185_000],
  [0, 'Residencial Alto da Serra - Bloco B', 'Campinas', 'Construção Prédio', 'ativa', 150, 400, 11, 0.62, 5_200_000],
  [3, 'Casa Menezes - Condomínio Terras', 'Vinhedo', 'Construção Casa', 'ativa', 190, 330, 10, 0.55, 890_000],
  [4, 'Edifício Nova Praça', 'Campinas', 'Construção Prédio', 'ativa', 120, 540, 14, 0.41, 7_400_000],
  [5, 'Galpão da padaria - ampliação', 'Sumaré', 'Galpão', 'ativa', 250, 200, 6, 0.73, 340_000],
  [6, 'Salão paroquial', 'Campinas', 'Construção Casa', 'ativa', 280, 240, 7, 0.35, 720_000],
  [1, 'Piscina e área gourmet', 'Campinas', 'Reforma', 'pausada', 210, 120, 4, 0.28, 145_000],
  [7, 'Reforma do sobrado', 'Indaiatuba', 'Reforma', 'pausada', 60, 180, 5, 0.66, 260_000],
  [4, 'Edifício Nova Praça - Torre 2', 'Campinas', 'Construção Prédio', 'nao_iniciada', 350, 600, 8, 0, 6_800_000],
  [8, 'Muro de arrimo e drenagem', 'Campinas', 'Infraestrutura', 'ativa', 340, 90, 3, 0.81, 95_000],
  // Obra recém-criada, sem orçamento montado ainda: é o estado vazio das telas.
  [9, 'Levantamento - terreno da Av. Norte', 'Campinas', 'Infraestrutura', 'nao_iniciada', 360, 180, 0, 0, 0],
]
const MATIZES = [[92, 124, 158], [150, 120, 96], [110, 140, 110], [86, 106, 140], [160, 132, 108],
  [120, 118, 150], [140, 148, 120], [104, 132, 148], [148, 116, 116], [116, 144, 132],
  [130, 130, 150], [124, 140, 116], [140, 128, 140]]

const insObra = db.prepare(`
  INSERT INTO obra (cliente_id, nome, status, criada_em, foto, cidade, categoria, observacao,
                    dt_inicio, dt_fim, dt_inicio_real, dt_fim_real, cei,
                    cep, logradouro, numero, bairro, uf)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`)
const insFase = db.prepare('INSERT INTO fase (obra_id, catalogo_id, codigo, nome, ordem, inativa) VALUES (?,?,?,?,?,?)')
const insServico = db.prepare(`
  INSERT INTO servico (orcamento_id, fase_id, catalogo_id, codigo, nome, unidade, qtd, ordem,
                       custo_mo_unit, custo_mat_unit)
  VALUES (?,?,?,?,?,?,?,?,?,?)
`)
const insEntrada = db.prepare(
  'INSERT INTO entrada (obra_id, fase_id, valor, data, descricao, criado_em) VALUES (?,?,?,?,?,?)',
)
const insSaida = db.prepare(`
  INSERT INTO saida (fase_id, valor, data, descricao, fornecedor_id, vencimento, pago_em, pago_obs, criado_em,
                     servico_catalogo_id)
  VALUES (?,?,?,?,?,?,?,?,?,?)
`)
const insSaidaItem = db.prepare(
  'INSERT INTO saida_item (saida_id, item_id, fornecedor_id, descricao, qtd, valor_unit) VALUES (?,?,?,?,?,?)',
)
const insDiario = db.prepare(
  'INSERT INTO diario (obra_id, fase_id, texto, autor, criado_em) VALUES (?,?,?,?,?)',
)
const catFases = db.prepare('SELECT id, codigo, nome FROM fase_catalogo ORDER BY codigo').all()
const catServicos = db.prepare('SELECT id, fase_catalogo_id, codigo, nome, unidade FROM servico_catalogo').all()

const DESCR_SAIDA = [
  'NF {n} - material', 'NF {n} - entrega no canteiro', 'Medição de empreita',
  'NF {n}', 'Pagamento parcial NF {n}', 'Compra de balcão', 'Locação mensal',
  'Frete e descarga', 'NF {n} - segunda parcela', 'Complemento de material',
]
const DESCR_ENTRADA = [
  'Aporte do cliente', 'Parcela do contrato', 'Transferência do cliente',
  'Repasse do financiamento', 'Sinal', 'Medição aprovada', 'Depósito em conta',
]
const AUTORES = ['admin', 'Cris Pegoraro', 'Eng. Marina Duarte', 'Téc. Roberto']
const POSTS = [
  'Concretagem da laje concluída sem intercorrências. Cura iniciada.',
  'Chuva forte pela manhã, equipe liberada às 11h. Perdemos meio dia.',
  'Problemas na tubulação externa - refazer trecho do esgoto entre a caixa e a rua.',
  'Recebida a carga de blocos. Conferida a quantidade, faltaram 40 unidades.',
  'Fiscalização da prefeitura passou. Tudo conforme o projeto aprovado.',
  'Cliente esteve na obra e aprovou o acabamento do banheiro social.',
  'Início da alvenaria do segundo pavimento.',
  'Furo na parede da cozinha para passagem hidráulica - combinado com o projetista.',
  'Equipe de gesso começou hoje. Previsão de 6 dias para o pavimento todo.',
  'Betoneira quebrou. Locadora troca amanhã cedo.',
  'Escora retirada da laje 2. Sem fissura aparente.',
  'Marcação da alvenaria conferida com o projeto. Duas paredes deslocadas 5cm, corrigido.',
  'Entrega das esquadrias adiada pelo fornecedor para a semana que vem.',
  'Impermeabilização do box concluída, teste de estanqueidade em 24h.',
  'Ligação definitiva de energia solicitada à concessionária.',
  'Limpeza grossa do pavimento térreo feita. Amanhã começa a pintura.',
  'Reunião com o cliente: aprovada a troca do porcelanato da sala.',
  'Falta de material parou a equipe de revestimento por 2h.',
]

const obras = []
OBRAS.forEach(([iCli, nome, cidade, categoria, status, diaIni, dur, nFases, gastoPct, alvoReais], iObra) => {
  const dtInicio = iso(INICIO + diaIni * DIA)
  const dtFim = maisDias(dtInicio, dur)
  const real = status === 'nao_iniciada' ? [null, null]
    : status === 'concluida' ? [maisDias(dtInicio, int(-5, 20)), maisDias(dtFim, int(-10, 40))]
      : [maisDias(dtInicio, int(-5, 15)), null]
  const temFoto = iObra % 4 !== 3 // uma em cada quatro sem foto: o card não pode mudar de forma
  const obraId = Number(insObra.run(
    clientes[iCli].id, nome, status, iso(INICIO + Math.max(diaIni - 10, 0) * DIA),
    temFoto ? guardar(`obra-${iObra + 1}.png`, fotoObra(MATIZES[iObra])) : null,
    cidade, categoria,
    talvez(0.4) ? 'Obra acompanhada semanalmente. Medição fechada todo dia 25.' : null,
    dtInicio, dtFim, real[0], real[1],
    talvez(0.5) ? `${int(10, 99)}.${int(100, 999)}.${int(10000, 99999)}/${int(10, 99)}` : null,
    `13${int(100, 999)}-${int(100, 999)}`, pick(RUAS), String(int(10, 2400)), pick(BAIRROS), 'SP',
  ).lastInsertRowid)

  const orcId = novoOrcamento(obraId)
  db.prepare('UPDATE orcamento SET criado_em=?, nome=? WHERE id=?')
    .run(`${dtInicio}T09:00:00`, 'Estimativa executiva', orcId)

  const fases = []
  const escolhidas = alguns(catFases.slice(0, 18), nFases).sort((a, b) => a.codigo - b.codigo)
  // Peso de cada fase no orçamento: estrutura pesa mais que serviços técnicos, mas sem
  // tabela de pesos - sorteio simples, normalizado.
  const pesos = escolhidas.map(() => 0.4 + rnd() * 1.6)
  const somaPesos = pesos.reduce((a, b) => a + b, 0) || 1

  escolhidas.forEach((cf, ordem) => {
    const faseId = Number(insFase.run(obraId, cf.id, ordem + 1, cf.nome, ordem + 1, 0).lastInsertRowid)
    const servs = alguns(catServicos.filter((s) => s.fase_catalogo_id === cf.id), int(1, 4))
    const alvoFase = Math.round(alvoReais * 100 * pesos[ordem] / somaPesos)
    let orcadoFase = 0
    servs.forEach((cs, j) => {
      // Um valor por serviço, que é o que a lista de orçamento grava: qtd 1, tudo em
      // materiais. Mesmo formato que sai do MoneyInput da aba.
      const mat = Math.max(1, Math.round(alvoFase / servs.length))
      insServico.run(orcId, faseId, cs.id, j + 1, cs.nome, cs.unidade, 1, j + 1, 0, mat)
      orcadoFase += mat
    })
    fases.push({ id: faseId, nome: cf.nome, ordem: ordem + 1, orcado: orcadoFase, servicos: servs.map((cs) => cs.id) })
  })

  // Uma versão congelada do orçamento em duas obras - o histórico da tela de versões.
  if (iObra === 3 || iObra === 5) {
    const copiaId = novoOrcamento(obraId)
    db.prepare('UPDATE orcamento SET ativo=0, nome=?, criado_em=? WHERE id=?')
      .run('Versão inicial (antes do reajuste)', `${maisDias(dtInicio, 15)}T14:30:00`, copiaId)
    for (const s of db.prepare('SELECT * FROM servico WHERE orcamento_id=?').all(orcId)) {
      insServico.run(copiaId, s.fase_id, s.catalogo_id, s.codigo, s.nome, s.unidade,
        s.qtd, s.ordem, Math.round(s.custo_mo_unit * 0.92), Math.round(s.custo_mat_unit * 0.9))
    }
  }

  obras.push({ id: obraId, nome, status, dtInicio, dtFim, fases, gastoPct })
})

// ── Lançamentos ───────────────────────────────────────────────────────────────────
let nf = 1000
for (const o of obras) {
  if (!o.fases.length || !o.gastoPct) continue
  const t0 = Date.parse(o.dtInicio)
  const t1 = Math.min(Date.parse(o.dtFim), HOJE)
  const fim = Math.max(t1, t0 + 30 * DIA)

  // As fases andam em sequência: as primeiras estão gastas, as últimas ainda nem
  // começaram. É o que dá barra cheia, barra pela metade e barra zerada na mesma tela.
  // A escala no fim é o que faz a obra fechar no gastoPct pedido - sem ela o corte em
  // 1,3 nas primeiras fases empurrava toda obra concluída pra 130% do orçado.
  const bruto = o.fases.map((f, i) => {
    const avanco = Math.max(0, Math.min(1.3, (o.gastoPct - (i + 0.5) / o.fases.length) * 2.4 + 0.55))
    return avanco < 0.05 ? 0 : f.orcado * avanco * (0.85 + rnd() * 0.35)
  })
  const orcadoObra = o.fases.reduce((a, f) => a + f.orcado, 0)
  const somaBruto = bruto.reduce((a, b) => a + b, 0)
  const escala = somaBruto ? (orcadoObra * o.gastoPct) / somaBruto : 0

  o.fases.forEach((f, i) => {
    const alvo = Math.round(bruto[i] * escala)
    if (alvo < 10000) return

    const janelaIni = t0 + (fim - t0) * (i / o.fases.length) * 0.9
    const janelaFim = t0 + (fim - t0) * Math.min(1, (i + 2.2) / o.fases.length)

    // Saídas da fase
    const n = int(2, 7)
    let restante = alvo
    for (let k = 0; k < n; k++) {
      const valor = k === n - 1 ? restante : Math.round(alvo / n * (0.6 + rnd() * 0.8))
      if (valor <= 0) break
      restante -= valor
      const data = entreDatas(janelaIni, janelaFim)
      const forn = pick(fornecedores.filter((x) => x.fornece.length || talvez(0.2)))
      const prazo = pick([0, 0, 15, 28, 30, 45])
      const vencimento = prazo ? maisDias(data, prazo) : null
      // Em aberto: o que ainda não venceu, mais algumas vencidas de propósito (é o
      // vermelho de Contas a pagar). O resto foi pago, alguns com atraso.
      const venceu = vencimento ? Date.parse(vencimento) < HOJE : true
      const emAberto = vencimento && (!venceu ? talvez(0.85) : talvez(0.18))
      const pagoEm = emAberto ? null
        : maisDias(vencimento || data, vencimento ? int(-3, 6) : 0)
      const saidaId = Number(insSaida.run(
        f.id, valor, data,
        DESCR_SAIDA[int(0, DESCR_SAIDA.length - 1)].replace('{n}', String(++nf)),
        forn.id, vencimento, pagoEm,
        pagoEm ? pick(['pix', 'boleto', `cheque ${int(1000, 9999)}`, 'transferência', 'dinheiro']) : null,
        `${data}T${String(int(8, 17)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00`,
        // Dois terços apontam o serviço; o resto é lançamento da fase inteira (§6).
        f.servicos.length && talvez(0.66) ? pick(f.servicos) : null,
      ).lastInsertRowid)

      // Itens: pouco mais da metade das saídas é detalhada.
      if (talvez(0.58)) {
        const linhas = int(1, 4)
        let sobra = valor
        for (let l = 0; l < linhas; l++) {
          const ultima = l === linhas - 1
          const parte = ultima ? sobra : Math.round(valor / linhas * (0.5 + rnd()))
          if (parte <= 0) break
          sobra -= parte
          // Linha avulsa (sem item, só texto) existe no mundo real - frete, taxa.
          if (talvez(0.12)) {
            insSaidaItem.run(saidaId, null, forn.id, pick(['Frete', 'Descarga', 'Taxa de entrega']), 1, parte)
            continue
          }
          const ins = pick(INSUMOS.filter((x) => x.preco_base > 0))
          // Preço pago gira em torno do base - alguns acima, que é o que pinta de âmbar.
          const unit = Math.max(1, Math.round(ins.preco_base * (0.85 + rnd() * 0.4)))
          const qtd = Math.max(1, Math.round(parte / unit))
          insSaidaItem.run(saidaId, ins.id, fornDe(ins.nome).id, null, qtd, unit)
        }
      }
    }

    // Entradas: o dinheiro do cliente aportado nesta fase. Umas fases ficam sub-aportadas
    // (âmbar) e outras cobertas (verde) - é o KPI de aporte necessário.
    const cobertura = pick([0.6, 0.85, 1.05, 1.1, 1.2, 1.35])
    const aportes = int(1, 3)
    for (let k = 0; k < aportes; k++) {
      insEntrada.run(
        o.id, f.id, Math.round(alvo * cobertura / aportes),
        entreDatas(janelaIni, janelaFim),
        DESCR_ENTRADA[int(0, DESCR_ENTRADA.length - 1)],
        `${entreDatas(janelaIni, janelaFim)}T10:00:00`,
      )
    }
  })
}

// ── Dia a dia e Galeria ───────────────────────────────────────────────────────────
for (const o of obras) {
  if (o.status === 'nao_iniciada') continue
  const t0 = Date.parse(o.dtInicio)
  const t1 = Math.min(Date.parse(o.dtFim), HOJE)
  const n = o.status === 'concluida' ? int(6, 14) : int(4, 12)
  for (let k = 0; k < n; k++) {
    const quando = entreDatas(t0, Math.max(t1, t0 + 30 * DIA))
    const fase = o.fases.length && talvez(0.7) ? pick(o.fases) : null
    const diarioId = Number(insDiario.run(
      o.id, fase ? fase.id : null, POSTS[int(0, POSTS.length - 1)], pick(AUTORES),
      `${quando}T${String(int(7, 18)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00`,
    ).lastInsertRowid)
    // Anexos do post caem na pasta dia_a_dia - é o que faz Galeria e Dia a dia serem
    // a mesma coisa vista de dois ângulos.
    if (talvez(0.55)) {
      for (let a = 0; a < int(1, 3); a++) {
        const nome = `foto-${quando}-${a + 1}.png`
        insArquivo.run(o.id, null, 'dia_a_dia', nome,
          guardar(nome, fotoObra([int(90, 180), int(90, 170), int(90, 170)])),
          `${quando}T12:00:00`, diarioId)
      }
    }
  }

  // Upload direto na galeria (as três pastas graváveis).
  for (let k = 0; k < int(2, 5); k++) {
    const quando = entreDatas(t0, Math.max(t1, t0 + 30 * DIA))
    const nome = `${pick(['fachada', 'laje', 'canteiro', 'acabamento', 'estrutura'])}-${k + 1}.png`
    insArquivo.run(o.id, null, 'fotos', nome,
      guardar(nome, fotoObra([int(90, 180), int(90, 170), int(90, 170)])), `${quando}T12:00:00`, null)
  }
  for (const nome of alguns(['ART registrada.pdf', 'Alvara de construcao.pdf', 'Memorial descritivo.pdf',
    'Contrato assinado.pdf', 'Cronograma fisico-financeiro.pdf'], int(1, 3))) {
    insArquivo.run(o.id, null, 'documentos', nome, arquivoFalso(nome, `${nome} - ${o.nome}`),
      `${entreDatas(t0, t1 || t0 + DIA)}T12:00:00`, null)
  }
  for (const nome of alguns(['Planta baixa.dwg', 'Corte AA.dwg', 'Projeto hidraulico.pdf',
    'Projeto eletrico.pdf', 'Implantacao.dwg'], int(1, 3))) {
    insArquivo.run(o.id, null, 'projetos', nome, arquivoFalso(nome, `${nome} - ${o.nome}`),
      `${entreDatas(t0, t1 || t0 + DIA)}T12:00:00`, null)
  }
}

// Obra Concluída fecha de verdade (Jean, 18/10/2026: só se conclui com tudo fechado):
// toda conta paga - no vencimento, ou na data da nota - e toda fase concluída no fim
// real da obra, com a taxa da estimativa. Antes a demo tinha obra Concluída com fase
// aberta e conta a pagar, o que a tela agora nem deixa fazer (rodada 2, A25).
for (const o of db.prepare(`
  SELECT o.id, o.dt_fim_real, (SELECT taxa_adm FROM orcamento WHERE obra_id = o.id AND ativo = 1) AS taxa
  FROM obra o WHERE o.status = 'concluida'
`).all()) {
  db.prepare(`UPDATE saida SET pago_em = MAX(data, COALESCE(vencimento, data))
    WHERE pago_em IS NULL AND fase_id IN (SELECT id FROM fase WHERE obra_id = ?)`).run(o.id)
  db.prepare("UPDATE fase SET concluida_em = ?, taxa_tipo = 'pct', taxa_valor = ? WHERE obra_id = ? AND concluida_em IS NULL")
    .run(o.dt_fim_real, o.taxa || 1000, o.id)
}
// Obra em andamento já passou pela primeira fase: ela sai concluída, com a taxa, na data
// do último lançamento dela - pra demo ter extrato de fase fechada (M4 da validação).
for (const f of db.prepare(`
  SELECT f.id, (SELECT taxa_adm FROM orcamento WHERE obra_id = o.id AND ativo = 1) AS taxa,
    (SELECT MAX(s.data) FROM saida s WHERE s.fase_id = f.id) AS ultima
  FROM obra o JOIN fase f ON f.obra_id = o.id
  WHERE o.status = 'ativa' AND f.ordem = (SELECT MIN(ordem) FROM fase WHERE obra_id = o.id AND inativa = 0)
`).all()) {
  if (f.ultima) {
    db.prepare("UPDATE fase SET concluida_em = ?, taxa_tipo = 'pct', taxa_valor = ? WHERE id = ?").run(f.ultima, f.taxa || 1000, f.id)
  }
}

// As obras se semeiam uma depois da outra, cada uma com datas do seu período: o
// trigger numerou na ordem de INSERÇÃO, não na de lançamento. Renumera pela ordem real.
renumerarObras()

db.exec('COMMIT')

const conta = (t) => db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n
console.log('semeado:', Object.fromEntries(
  ['cliente', 'obra', 'fase', 'orcamento', 'servico', 'fornecedor', 'insumo',
    'insumo_fornecedor', 'entrada', 'saida', 'saida_item', 'diario', 'arquivo']
    .map((t) => [t, conta(t)]),
))

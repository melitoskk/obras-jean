import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, Printer } from 'lucide-react'
import Tela from '../ui/Tela'
import Abas from '../ui/Abas'
import Grid, { TotalGrid } from '../ui/Grid'
import Badge from '../ui/Badge'
import Botao from '../ui/Botao'
import Logo from '../ui/Logo'
import EmptyState from '../ui/EmptyState'
import { Input, Select, Radios } from '../ui/Form'
import ExtratoCredor from '../components/ExtratoCredor'
import { getObras, getFornecedores, getRelPagamentos, getContasAPagar, getRelEstimado, getRelExtratoFase } from '../lib/api'
import { formatMoeda, formatPct, formatData, numeroLancamento, vencimentoTxt, mult, pct, hoje } from '../lib/format'

// Relatórios do escritório (UPDATE.md §11.3, itens 1 a 5, e o extrato da fase, §11.4). Os enviáveis ao cliente
// (6 e 7) ficam pra quando a visão do cliente (§12) e o MIV chegarem.
//
// Qual relatório e os filtros moram na query (?r=pagamentos&obra=3&por=credor): voltar,
// recarregar e mandar o link trazem o mesmo relatório. O servidor devolve sempre no
// nível do lançamento; sintético e analítico (item 4) são a mesma lista agrupada aqui,
// então os dois níveis não têm como fechar totais diferentes.
const RELATORIOS = [
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'apagar', label: 'Contas a pagar' },
  { id: 'estimado', label: 'Estimado × realizado' },
  { id: 'credor', label: 'Extrato do credor' },
  { id: 'adm', label: 'Taxa de administração' },
  { id: 'fase', label: 'Extrato da fase' },
]

const DIMENSOES = [
  { valor: 'fase', label: 'Por fase' },
  { valor: 'servico', label: 'Por serviço' },
  { valor: 'insumo', label: 'Por insumo' },
  { valor: 'credor', label: 'Por credor' },
  { valor: 'tipo', label: 'Material × mão de obra' },
]

const TITULO_DIMENSAO = { fase: 'Fase', servico: 'Serviço', insumo: 'Insumo', credor: 'Credor', tipo: 'Tipo' }

const NIVEIS = [
  { valor: 'sintetico', label: 'Sintético' },
  { valor: 'analitico', label: 'Analítico' },
]

export default function Relatorios() {
  const [q, setQ] = useSearchParams()
  const filtro = (k, padrao = '') => q.get(k) ?? padrao
  // Trocar um filtro mantém os outros - a obra escolhida vale pra todos os relatórios.
  const setFiltro = (k) => (v) => {
    const valor = v?.target ? v.target.value : v
    setQ((atual) => {
      const novo = new URLSearchParams(atual)
      if (valor) novo.set(k, valor)
      else novo.delete(k)
      return novo
    }, { replace: true })
  }

  const r = filtro('r', 'pagamentos')
  const [obras, setObras] = useState([])
  useEffect(() => { getObras().then(setObras).catch(() => setObras([])) }, [])
  const opcoesObra = obras.map((o) => ({ valor: String(o.id), label: o.nome }))

  const comum = { filtro, setFiltro, opcoesObra }
  return (
    <Tela titulo="Relatórios">
      <Abas abas={RELATORIOS} ativa={r} onChange={setFiltro('r')} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 pt-2">
        {r === 'pagamentos' && <Pagamentos {...comum} />}
        {r === 'apagar' && <ContasAPagar {...comum} />}
        {r === 'estimado' && <EstimadoRealizado {...comum} />}
        {r === 'credor' && <Credor {...comum} />}
        {r === 'adm' && <Administracao {...comum} />}
        {r === 'fase' && <ExtratoDaFase {...comum} />}
      </div>
    </Tela>
  )
}

// Linha de filtros. Cada relatório manda os seus.
const Filtros = ({ children }) => <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">{children}</div>
const Rotulo = ({ children }) => <span className="text-rotulo">{children}</span>

const Nivel = ({ filtro, setFiltro }) => (
  <Radios name="nivel" value={filtro('nivel', 'sintetico')} onChange={setFiltro('nivel')} opcoes={NIVEIS} />
)

const EscolhaObra = ({ vazio = 'Escolha a obra...', filtro, setFiltro, opcoesObra }) => (
  <div className="w-[240px]">
    <Select vazio={vazio} opcoes={opcoesObra} value={filtro('obra')} onChange={setFiltro('obra')} />
  </div>
)

const SemObra = () => (
  <EmptyState icone={FileText} titulo="Escolha a obra" texto="O estimado é o da estimativa viva da obra, por isso este relatório é de uma obra por vez." />
)

// Linha de grupo (fase, credor...) no analítico: negrito e fundo, como o rodapé.
const classeNivel = (l) => (l.nivel === 0 && l.temFilhos ? 'font-bold bg-barra!' : l.nivel === 1 && l.temFilhos ? 'font-bold' : '')
const recuo = (nivel) => ({ paddingLeft: nivel * 16 })
const Rs = ({ v, className = '' }) => <span className={`tabular-nums ${className}`}>{formatMoeda(v)}</span>

// ── 1. Quanto já foi pago em X / para quem ──────────────────────────────────────────
function Pagamentos({ filtro, setFiltro, opcoesObra }) {
  const por = filtro('por', 'fase')
  const analitico = filtro('nivel', 'sintetico') === 'analitico'
  const [linhas, setLinhas] = useState(null)
  const obra = filtro('obra')
  const fase = filtro('fase')
  const de = filtro('de')
  const ate = filtro('ate')
  // As fases que têm lançamento na obra (ou em todas), pelo nome - é por ele que filtra.
  const [fases, setFases] = useState([])

  useEffect(() => {
    setLinhas(null)
    getRelPagamentos({ por, obra, fase, de, ate }).then(setLinhas).catch(() => setLinhas([]))
  }, [por, obra, fase, de, ate])
  useEffect(() => {
    getRelPagamentos({ por: 'fase', obra })
      .then((ls) => setFases([...new Set(ls.map((l) => l.grupo))].sort().map((n) => ({ valor: n, label: n }))))
      .catch(() => setFases([]))
  }, [obra])

  const { grupos, total } = useMemo(() => {
    const m = new Map()
    for (const l of linhas ?? []) {
      if (!m.has(l.grupo)) m.set(l.grupo, { grupo: l.grupo, lancado: 0, pago: 0, itens: [] })
      const g = m.get(l.grupo)
      g.lancado += l.valor
      if (l.pago) g.pago += l.valor
      g.itens.push(l)
    }
    // Maior primeiro: a pergunta é "pra onde foi o dinheiro".
    const grupos = [...m.values()].sort((a, b) => b.lancado - a.lancado || a.grupo.localeCompare(b.grupo))
    const total = grupos.reduce((t, g) => ({ lancado: t.lancado + g.lancado, pago: t.pago + g.pago }), { lancado: 0, pago: 0 })
    return { grupos, total }
  }, [linhas])

  const visiveis = grupos.flatMap((g) => [
    { key: g.grupo, nivel: 0, temFilhos: analitico, rotulo: g.grupo, lancado: g.lancado, pago: g.pago, parte: pct(g.lancado, total.lancado) },
    ...(analitico ? g.itens.map((l, i) => ({
      key: `${g.grupo}-${l.id}-${i}`, nivel: 1, lanc: l,
      rotulo: [numeroLancamento(l.numero), l.fornecedor, l.descricao].filter(Boolean).join(' · '),
      lancado: l.valor, pago: l.pago ? l.valor : 0,
    })) : []),
  ])

  return (
    <>
      <Filtros>
        <EscolhaObra vazio="Todas as obras" filtro={filtro} setFiltro={setFiltro} opcoesObra={opcoesObra} />
        <div className="w-[200px]">
          <Select vazio="Todas as fases" opcoes={fases} value={fase} onChange={setFiltro('fase')} />
        </div>
        <div className="w-[190px]">
          <Select vazio={null} opcoes={DIMENSOES} value={por} onChange={setFiltro('por')} />
        </div>
        <Rotulo>Data da nota de</Rotulo>
        <div className="w-[140px]"><Input type="date" value={de} onChange={setFiltro('de')} /></div>
        <Rotulo>até</Rotulo>
        <div className="w-[140px]"><Input type="date" value={ate} onChange={setFiltro('ate')} /></div>
        <Nivel filtro={filtro} setFiltro={setFiltro} />
      </Filtros>

      <Grid
        className="flex-1"
        linhas={linhas ? visiveis : []}
        chave={(l) => l.key}
        zebra={!analitico}
        classeLinha={classeNivel}
        vazio={linhas ? 'Nenhum lançamento no filtro.' : 'Carregando...'}
        colunas={[
          {
            chave: 'rotulo', titulo: TITULO_DIMENSAO[por], nowrap: false,
            render: (l) => <div style={recuo(l.nivel)}>{l.rotulo}</div>,
          },
          ...(analitico ? [
            { chave: 'obra', titulo: 'Obra', largura: 140, nowrap: false, render: (l) => l.lanc?.obra },
            // Agrupado por fase, a fase já é a primeira coluna (rodada 2, A15).
            ...(por === 'fase' ? [] : [{ chave: 'fase', titulo: 'Fase', largura: 170, nowrap: false, render: (l) => l.lanc?.fase }]),
            { chave: 'data', titulo: 'Data', largura: 80, render: (l) => l.lanc && formatData(l.lanc.data) },
          ] : []),
          { chave: 'lancado', titulo: 'Lançado (R$)', largura: 110, align: 'right', render: (l) => <Rs v={l.lancado} /> },
          { chave: 'pago', titulo: 'Pago (R$)', largura: 110, align: 'right', render: (l) => <Rs v={l.pago} /> },
          {
            chave: 'aberto', titulo: 'Em aberto (R$)', largura: 110, align: 'right',
            render: (l) => <Rs v={l.lancado - l.pago} className={l.lancado - l.pago > 0 ? 'text-laranja' : ''} />,
          },
          {
            chave: 'parte', titulo: '% do total', largura: 80, align: 'right',
            render: (l) => l.parte != null && <span className="tabular-nums">{formatPct(Math.round(l.parte * 100))}</span>,
          },
        ]}
        rodape={
          <TotalGrid>
            Lançado: <b>R$ {formatMoeda(total.lancado)}</b>
            <span className="mx-3 text-[#bbb]">|</span>
            Pago: R$ {formatMoeda(total.pago)}
            <span className="mx-3 text-[#bbb]">|</span>
            Em aberto: <b className={total.lancado - total.pago > 0 ? 'text-laranja' : ''}>R$ {formatMoeda(total.lancado - total.pago)}</b>
          </TotalGrid>
        }
      />
    </>
  )
}

// Carrega o estimado × realizado da obra do filtro. Usado pelo relatório 2 e pelo 5,
// que é o mesmo payload com a taxa aplicada.
// ── Contas a pagar (rodada 2, A5 e A28) ─────────────────────────────────────────────
// O que foi lançado sem o Pago, de todas as obras ou de uma, na ordem em que se paga: do
// vencimento mais antigo pro mais novo, e o que não tem vencimento no fim. Vencida em
// vermelho, com há quantos dias. Pagar continua sendo marcar Pago no lançamento.
function ContasAPagar({ filtro, setFiltro, opcoesObra }) {
  const obra = filtro('obra')
  const [contas, setContas] = useState(null)
  useEffect(() => {
    setContas(null)
    getContasAPagar({ obra }).then(setContas).catch(() => setContas([]))
  }, [obra])
  const lista = contas ?? []
  const soma = (ls) => ls.reduce((a, c) => a + c.valor, 0)
  const vencidas = lista.filter((c) => vencimentoTxt(c.vencimento).vencida)
  return (
    <>
      <Filtros>
        <EscolhaObra vazio="Todas as obras" filtro={filtro} setFiltro={setFiltro} opcoesObra={opcoesObra} />
        {vencidas.length > 0 && <Badge cor="perigo">{vencidas.length} vencida(s): R$ {formatMoeda(soma(vencidas))}</Badge>}
      </Filtros>
      <Grid
        className="flex-1"
        linhas={lista}
        vazio={contas ? 'Nada a pagar.' : 'Carregando...'}
        colunas={[
          {
            chave: 'vencimento', titulo: 'Vencimento', largura: 150,
            render: (c) => {
              const v = vencimentoTxt(c.vencimento)
              return <span className={v.vencida ? 'font-semibold text-perigo' : ''}>{v.texto}</span>
            },
          },
          ...(obra ? [] : [{ chave: 'obra', titulo: 'Obra', largura: 180, nowrap: false }]),
          { chave: 'numero', titulo: 'Nº', largura: 50, align: 'right' },
          { chave: 'data', titulo: 'Nota', largura: 85, render: (c) => formatData(c.data) },
          { chave: 'fase', titulo: 'Fase', largura: 160, nowrap: false, render: (c) => `${c.fase_codigo ?? ''} - ${c.fase}` },
          { chave: 'fornecedor', titulo: 'Fornecedor', largura: 160, nowrap: false, render: (c) => c.fornecedor ?? '' },
          {
            chave: 'descricao', titulo: 'Descrição', nowrap: false,
            render: (c) => [c.descricao, c.boleto && `boleto ${c.boleto}`].filter(Boolean).join(' · '),
          },
          { chave: 'valor', titulo: 'Valor (R$)', largura: 110, align: 'right', render: (c) => formatMoeda(c.valor) },
        ]}
      />
      <TotalGrid>
        {lista.length} conta(s) · A pagar: <b>R$ {formatMoeda(soma(lista))}</b>
      </TotalGrid>
    </>
  )
}

function useEstimado(obra) {
  const [dados, setDados] = useState(null)
  useEffect(() => {
    setDados(null)
    if (obra) getRelEstimado(obra).then(setDados).catch(() => setDados({ fases: [] }))
  }, [obra])
  return dados
}

const somaFases = (fases, k) => fases.reduce((a, f) => a + f[k], 0)

// Diferença = realizado − estimado. Positiva é estouro: vermelho. Sem estimado não há
// percentual - o realizado ali é estouro inteiro, e diz isso em vez de "∞%".
function Diferenca({ estimado, realizado, emPct }) {
  const dif = realizado - estimado
  const cor = dif > 0 ? 'text-perigo font-bold' : ''
  if (!emPct) return <Rs v={dif} className={cor} />
  if (!estimado) return realizado ? <span className="text-perigo">sem estimado</span> : null
  return <span className={`tabular-nums ${cor}`}>{formatPct(Math.round(pct(dif, estimado) * 100))}</span>
}

// ── 2. Estimado × realizado ─────────────────────────────────────────────────────────
function EstimadoRealizado({ filtro, setFiltro, opcoesObra }) {
  const obra = filtro('obra')
  const analitico = filtro('nivel', 'sintetico') === 'analitico'
  const dados = useEstimado(obra)

  // Analítico: fase → serviço → lançamento. O lançamento só tem realizado.
  const linhas = (dados?.fases ?? []).flatMap((f) => [
    {
      key: `f${f.id}`, nivel: 0, temFilhos: analitico && f.servicos.length > 0,
      rotulo: `${f.codigo ?? ''} - ${f.nome}`, concluida: f.concluida_em, estimado: f.estimado, realizado: f.realizado,
    },
    ...(analitico ? f.servicos.flatMap((s) => [
      {
        key: `f${f.id}-s${s.chave}`, nivel: 1, temFilhos: s.lancamentos.length > 0,
        rotulo: s.codigo != null ? `${f.codigo}.${s.codigo} ${s.nome}` : s.nome, estimado: s.estimado, realizado: s.realizado,
      },
      ...s.lancamentos.map((l) => ({
        key: `f${f.id}-s${s.chave}-l${l.id}`, nivel: 2, lancamento: true, data: l.data,
        rotulo: [numeroLancamento(l.numero), l.descricao].filter(Boolean).join(' · '), realizado: l.valor,
      })),
    ]) : []),
  ])
  const estimado = somaFases(dados?.fases ?? [], 'estimado')
  const realizado = somaFases(dados?.fases ?? [], 'realizado')

  return (
    <>
      <Filtros>
        <EscolhaObra filtro={filtro} setFiltro={setFiltro} opcoesObra={opcoesObra} />
        <Nivel filtro={filtro} setFiltro={setFiltro} />
        {dados?.estimativa && <span className="text-rotulo">Estimativa {dados.estimativa.numero}{dados.estimativa.nome && ` · ${dados.estimativa.nome}`}</span>}
        {dados && !dados.estimativa && <Badge cor="aviso">Obra sem estimativa</Badge>}
      </Filtros>
      {!obra ? <SemObra /> : (
        <Grid
          className="flex-1"
          linhas={dados ? linhas : []}
          chave={(l) => l.key}
          zebra={!analitico}
          classeLinha={classeNivel}
          vazio={dados ? 'A obra não tem fases.' : 'Carregando...'}
          colunas={[
            {
              chave: 'rotulo', titulo: analitico ? 'Fase / serviço / lançamento' : 'Fase', nowrap: false,
              render: (l) => (
                <div style={recuo(l.nivel)} className="flex items-center gap-2">
                  <span>{l.rotulo}</span>
                  {l.concluida && <Badge cor="sucesso">Concluída</Badge>}
                </div>
              ),
            },
            ...(analitico ? [{ chave: 'data', titulo: 'Data', largura: 80, render: (l) => formatData(l.data) }] : []),
            { chave: 'estimado', titulo: 'Estimado (R$)', largura: 115, align: 'right', render: (l) => !l.lancamento && <Rs v={l.estimado} /> },
            { chave: 'realizado', titulo: 'Realizado (R$)', largura: 115, align: 'right', render: (l) => <Rs v={l.realizado} /> },
            {
              chave: 'dif', titulo: 'Diferença (R$)', largura: 115, align: 'right',
              render: (l) => !l.lancamento && <Diferenca estimado={l.estimado} realizado={l.realizado} />,
            },
            {
              chave: 'difPct', titulo: 'Diferença (%)', largura: 100, align: 'right',
              render: (l) => !l.lancamento && <Diferenca estimado={l.estimado} realizado={l.realizado} emPct />,
            },
          ]}
          rodape={
            <TotalGrid>
              Estimado: <b>R$ {formatMoeda(estimado)}</b>
              <span className="mx-3 text-[#bbb]">|</span>
              Realizado: <b>R$ {formatMoeda(realizado)}</b>
              <span className="mx-3 text-[#bbb]">|</span>
              Diferença: <b><Diferenca estimado={estimado} realizado={realizado} /></b>
              {estimado > 0 && <> (<Diferenca estimado={estimado} realizado={realizado} emPct />%)</>}
            </TotalGrid>
          }
        />
      )}
    </>
  )
}

// ── 3. Extrato do credor ────────────────────────────────────────────────────────────
// O mesmo extrato da aba do fornecedor, com o CSV dele: aqui só se escolhe o credor.
function Credor({ filtro, setFiltro }) {
  const [fornecedores, setFornecedores] = useState([])
  useEffect(() => { getFornecedores().then(setFornecedores).catch(() => setFornecedores([])) }, [])
  // Só quem tem algum lançamento - credor sem nota daria um extrato vazio.
  const opcoes = fornecedores.filter((f) => f.total > 0).map((f) => ({ valor: String(f.id), label: f.nome }))
  const credor = filtro('credor')
  return (
    <>
      <Filtros>
        <div className="w-[260px]">
          <Select vazio="Escolha o credor..." opcoes={opcoes} value={credor} onChange={setFiltro('credor')} />
        </div>
      </Filtros>
      {credor
        ? <div className="min-h-0 flex-1"><ExtratoCredor key={credor} fornecedorId={Number(credor)} /></div>
        : <EmptyState icone={FileText} titulo="Escolha o credor" texto="Tudo que foi lançado para ele, em todas as obras, com o comprovante de cada nota." />}
    </>
  )
}

// Regra da taxa da fase, como foi escolhida ao concluir. Do relatório de taxa e do extrato.
const regra = (f) => (!f.taxa_tipo ? '' : f.taxa_tipo === 'fixo' ? 'Valor fixo' : `${formatPct(f.taxa_valor)}% do pago`)

// ── 5. Taxa de administração ────────────────────────────────────────────────────────
// A taxa DEVIDA é por fase, escolhida ao concluir (decidido com o Jean em 17/10/2026):
// valor fixo ou % sobre o que foi PAGO na fase; quem calcula é o servidor (`taxaDevida`).
// A prevista continua a da estimativa (UPDATE.md §4): % único × estimado, só referência.
function Administracao({ filtro, setFiltro, opcoesObra }) {
  const obra = filtro('obra')
  const dados = useEstimado(obra)
  const taxa = dados?.taxa_adm ?? 0
  const adm = (v) => mult(taxa / 10000, v)

  const fases = dados?.fases ?? []
  const admPrevista = adm(somaFases(fases, 'estimado'))
  const devida = somaFases(fases, 'taxa_devida')
  const semRegra = fases.filter((f) => f.concluida_em && !f.taxa_tipo).length
  return (
    <>
      <Filtros>
        <EscolhaObra filtro={filtro} setFiltro={setFiltro} opcoesObra={opcoesObra} />
        {dados?.estimativa && <span className="text-rotulo">Taxa da estimativa {dados.estimativa.numero}: <b className="text-[#333]">{formatPct(taxa)}%</b></span>}
        {dados && !dados.estimativa && <Badge cor="aviso">Obra sem estimativa</Badge>}
        {semRegra > 0 && <Badge cor="aviso">{semRegra} fase(s) concluída(s) sem taxa</Badge>}
      </Filtros>
      {!obra ? <SemObra /> : (
        <Grid
          className="flex-1"
          linhas={dados ? fases : []}
          vazio={dados ? 'A obra não tem fases.' : 'Carregando...'}
          colunas={[
            {
              chave: 'nome', titulo: 'Fase', nowrap: false,
              render: (f) => (
                <div className="flex items-center gap-2">
                  <span>{f.codigo ?? ''} - {f.nome}</span>
                  {f.concluida_em && <Badge cor="sucesso">Concluída</Badge>}
                </div>
              ),
            },
            { chave: 'estimado', titulo: 'Estimado (R$)', largura: 115, align: 'right', render: (f) => <Rs v={f.estimado} /> },
            { chave: 'admPrev', titulo: 'Adm. prevista (R$)', largura: 125, align: 'right', render: (f) => <Rs v={adm(f.estimado)} /> },
            { chave: 'pago', titulo: 'Pago (R$)', largura: 115, align: 'right', render: (f) => <Rs v={f.pago} /> },
            { chave: 'regra', titulo: 'Taxa da fase', largura: 120, render: (f) => (f.concluida_em ? regra(f) || 'Sem taxa' : <span className="text-[#999]">ao concluir</span>) },
            { chave: 'devida', titulo: 'Taxa devida (R$)', largura: 125, align: 'right', render: (f) => (f.concluida_em ? <Rs v={f.taxa_devida} /> : null) },
          ]}
          rodape={
            <TotalGrid>
              Adm. prevista pela estimativa: <b>R$ {formatMoeda(admPrevista)}</b>
              <span className="mx-3 text-[#bbb]">|</span>
              Taxa devida (fases concluídas): <b>R$ {formatMoeda(devida)}</b>
            </TotalGrid>
          }
        />
      )}
    </>
  )
}

// ── Extrato da fase ─────────────────────────────────────────────────────────────────
// Entradas e saídas de uma fase com cara de extrato de banco: cabeçalho com obra e
// fase, lançamentos da data mais antiga pra mais nova com o saldo correndo, totais e
// rodapé. É uma folha: `Imprimir` chama o navegador e o CSS de impressão (index.css,
// o mesmo da Visão do cliente) imprime só ela, com o cabeçalho da tabela repetido em
// cada página. Por isso é <table> simples e não o Grid, que rola por dentro e cortaria
// o impresso na altura da janela.
function ExtratoDaFase({ filtro, setFiltro, opcoesObra }) {
  const obra = filtro('obra')
  const fase = filtro('fase')
  const [dados, setDados] = useState(null)

  useEffect(() => {
    setDados(null)
    if (obra) getRelExtratoFase({ obra, fase }).then(setDados).catch(() => setDados({ fases: [], lancamentos: [] }))
  }, [obra, fase])

  // Trocar a obra limpa a fase: a fase de uma obra não existe na outra.
  const [, setQ] = useSearchParams()
  const trocarObra = (e) => setQ((atual) => {
    const novo = new URLSearchParams(atual)
    if (e.target.value) novo.set('obra', e.target.value)
    else novo.delete('obra')
    novo.delete('fase')
    return novo
  }, { replace: true })

  // Concluída marcada na lista (rodada 4, A22): é o extrato que vai pro cliente no fim da fase.
  const opcoesFase = (dados?.fases ?? []).map((f) => ({ valor: String(f.id), label: `${f.codigo ?? ''} - ${f.nome}${f.concluida_em ? ' (concluída)' : ''}` }))
  const ls = dados?.lancamentos ?? []
  const soma = (tipo) => ls.filter((l) => l.tipo === tipo).reduce((a, l) => a + l.valor, 0)
  const entradas = soma('entrada')
  const saidas = soma('saida')
  const aberto = ls.filter((l) => l.tipo === 'saida' && !l.pago_em).reduce((a, l) => a + l.valor, 0)
  const pronto = dados?.fase && String(dados.fase.id) === fase

  return (
    <>
      <Filtros>
        <div className="w-[240px]">
          <Select vazio="Escolha a obra..." opcoes={opcoesObra} value={obra} onChange={trocarObra} />
        </div>
        <div className="w-[280px]">
          <Select vazio="Escolha a fase..." opcoes={opcoesFase} value={fase} onChange={setFiltro('fase')} disabled={!obra} />
        </div>
        <Botao variante="acento" icone={Printer} className="ml-auto" disabled={!pronto} onClick={() => window.print()}>
          Imprimir / salvar PDF
        </Botao>
      </Filtros>

      {!obra || !fase ? (
        <EmptyState icone={FileText} titulo={obra ? 'Escolha a fase' : 'Escolha a obra e a fase'} texto="Entradas e saídas da fase, da mais antiga para a mais nova, com o saldo linha a linha." />
      ) : !pronto ? null : (
        <div className="min-h-0 flex-1 overflow-auto bg-[#e9e9e9] p-3">
          <FolhaExtrato dados={dados} totais={{ entradas, saidas, aberto }} />
        </div>
      )}
    </>
  )
}

function FolhaExtrato({ dados, totais }) {
  const { obra, fase, lancamentos } = dados
  const saldo = totais.entradas - totais.saidas
  const periodo = lancamentos.length
    ? `${formatData(lancamentos[0].data)} a ${formatData(lancamentos[lancamentos.length - 1].data)}`
    : null
  const sinal = (v) => `${v < 0 ? '− ' : ''}${formatMoeda(Math.abs(v))}`
  const th = 'border-b-2 border-titulo px-2 py-1.5 text-left text-[11px] font-bold uppercase text-[#555]'
  const td = 'border-b border-grade-linha px-2 py-1 align-top'

  return (
    <div className="folha-impressao mx-auto flex max-w-[900px] flex-col gap-4 bg-white p-6 text-[12px] text-[#333] shadow-sm">
      <header className="flex items-end gap-4 border-b-2 border-titulo pb-2">
        <div><Logo /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] leading-tight font-bold text-titulo">Extrato da fase</h2>
          <p className="text-[13px] text-[#555]">{[obra.nome, obra.cliente].filter(Boolean).join(' · ')}</p>
        </div>
        <p className="text-right text-[11px] text-[#777]">Emitido em{' '}<br /><b className="text-[13px] text-[#333]">{formatData(hoje())}</b></p>
      </header>

      <section className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        <span className="text-rotulo">Obra</span><b>{obra.nome}</b>
        {obra.cliente && <><span className="text-rotulo">Cliente</span><span>{obra.cliente}</span></>}
        <span className="text-rotulo">Fase</span>
        <span><b>{fase.codigo ?? ''} - {fase.nome}</b>{fase.concluida_em && <span className="text-[#777]"> · concluída em {formatData(fase.concluida_em)}</span>}</span>
        <span className="text-rotulo">Período</span><span>{periodo ?? 'sem lançamentos'}</span>
      </section>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} w-[78px]`}>Data</th>
            <th className={`${th} w-[86px]`}>Nº</th>
            <th className={th}>Histórico</th>
            <th className={`${th} w-[100px] text-right!`}>Entrada (R$)</th>
            <th className={`${th} w-[100px] text-right!`}>Saída (R$)</th>
            <th className={`${th} w-[110px] text-right!`}>Saldo (R$)</th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.length === 0 && (
            <tr><td colSpan={6} className={`${td} py-4 text-center text-[#888]`}>Nenhum lançamento nesta fase.</td></tr>
          )}
          {lancamentos.map((l) => (
            <tr key={`${l.tipo}${l.id}`} className="break-inside-avoid">
              <td className={`${td} tabular-nums`}>{formatData(l.data)}</td>
              <td className={`${td} tabular-nums`}>{l.numero}</td>
              <td className={td}>
                {l.historico}
                {l.tipo === 'saida' && !l.pago_em && (
                  <span className={vencimentoTxt(l.vencimento).vencida ? 'text-perigo' : 'text-laranja'}>
                    {' '}· em aberto{l.vencimento && `, ${vencimentoTxt(l.vencimento).texto.toLowerCase()}`}
                  </span>
                )}
              </td>
              <td className={`${td} text-right tabular-nums text-[#3d833d]`}>{l.tipo === 'entrada' && formatMoeda(l.valor)}</td>
              <td className={`${td} text-right tabular-nums`}>{l.tipo === 'saida' && formatMoeda(l.valor)}</td>
              <td className={`${td} text-right tabular-nums ${l.saldo < 0 ? 'text-perigo' : ''}`}>{sinal(l.saldo)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td colSpan={3} className="border-t-2 border-titulo px-2 py-1.5 text-right">Totais</td>
            <td className="border-t-2 border-titulo px-2 py-1.5 text-right tabular-nums text-[#3d833d]">{formatMoeda(totais.entradas)}</td>
            <td className="border-t-2 border-titulo px-2 py-1.5 text-right tabular-nums">{formatMoeda(totais.saidas)}</td>
            <td className={`border-t-2 border-titulo px-2 py-1.5 text-right tabular-nums ${saldo < 0 ? 'text-perigo' : ''}`}>{sinal(saldo)}</td>
          </tr>
        </tfoot>
      </table>

      <section className="bloco-impressao ml-auto grid w-[320px] grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 border border-grade-linha p-3">
        <span>Total de entradas</span><span className="text-right tabular-nums">R$ {formatMoeda(totais.entradas)}</span>
        <span>Total de saídas</span><span className="text-right tabular-nums">R$ {formatMoeda(totais.saidas)}</span>
        {totais.aberto > 0 && <>
          <span className="pl-3 text-[#777]">das quais em aberto</span>
          <span className="text-right tabular-nums text-laranja">R$ {formatMoeda(totais.aberto)}</span>
        </>}
        <b className="border-t border-grade-linha pt-1">Saldo da fase</b>
        <b className={`border-t border-grade-linha pt-1 text-right tabular-nums ${saldo < 0 ? 'text-perigo' : 'text-[#3d833d]'}`}>
          {saldo < 0 ? '− ' : '+ '}R$ {formatMoeda(Math.abs(saldo))}
        </b>
        {/* Taxa de administração da fase concluída (Jean, 18/10/2026: o cliente vê a taxa). */}
        {fase.concluida_em && fase.taxa_tipo && <>
          <span className="pt-1">Taxa de administração <span className="text-[#777]">({regra(fase)})</span></span>
          <span className="pt-1 text-right tabular-nums">R$ {formatMoeda(fase.taxa_devida)}</span>
        </>}
      </section>

      <footer className="mt-2 border-t border-grade-linha pt-1.5 text-[10px] text-[#999]">
        Carvalho Rosa · {obra.nome} · fase {fase.codigo ?? ''} - {fase.nome} · emitido em {formatData(hoje())}.
        Valores em reais. Saldo = entradas − saídas lançadas, pagas ou não, pela data da nota.
      </footer>
    </div>
  )
}

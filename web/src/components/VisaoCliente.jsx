import { useEffect, useMemo, useState } from 'react'
import { Printer, Image as ImagemIcone } from 'lucide-react'
import Botao from '../ui/Botao'
import Barra from '../ui/Barra'
import EmptyState from '../ui/EmptyState'
import Logo from '../ui/Logo'
import { getVisao } from '../lib/api'
import { formatBRL, formatData, hoje, pct } from '../lib/format'

// Visão do cliente (UPDATE.md §12): a tela que se abre com o cliente na mesa. Números
// grandes e poucos, três gráficos e as fotos. A regra que decide o que entra é "sem
// dado interno" - por isso o payload é rota própria (GET /api/obra/:id/visao), que só
// devolve somas e fotos: margem, fornecedor e descrição de lançamento nem chegam aqui.
//
// É também o enviável (§11.3, itens 6 e 7; Dúvida 15 = tela + imprimir): `Imprimir`
// chama o navegador, e o `Salvar como PDF` dele faz o arquivo. O CSS de impressão
// (index.css) mostra só a `.folha-impressao` e some com o que tem `.so-tela`.
// Sem o arquivo do MIV (Dúvida 14), vale o visual atual do sistema.

// Paleta categórica de referência (dataviz, tema claro), na ordem que passa no teste de
// daltonismo entre vizinhos. Fixa: a 8ª fatia é "Outras fases", nunca uma cor gerada.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const OUTRAS = '#b4b2aa'
const ESTIMADO = '#b4b2aa'
const REALIZADO = '#2a78d6'
const INVESTIDO = '#eb6834'

// "R$ 1,2 mi" / "R$ 350 mil" - eixo e rótulo de gráfico. O valor exato fica no tooltip.
const curto = (centavos) => {
  const r = Math.abs(centavos) / 100
  const s = centavos < 0 ? '−' : ''
  const n = (v, c) => v.toLocaleString('pt-BR', { maximumFractionDigits: c })
  if (r >= 1e6) return `${s}R$ ${n(r / 1e6, 1)} mi`
  if (r >= 1e3) return `${s}R$ ${n(r / 1e3, 0)} mil`
  return `${s}R$ ${n(r, 0)}`
}
const pctTxt = (v) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const rotuloMes = (ym) => `${MESES[Number(ym.slice(5, 7)) - 1]}/${ym.slice(2, 4)}`

export default function VisaoCliente({ obraId, situacao }) {
  const [v, setV] = useState(null)
  const [erro, setErro] = useState(false)
  useEffect(() => { getVisao(obraId).then(setV).catch(() => setErro(true)) }, [obraId])

  if (erro) return <EmptyState titulo="Não foi possível carregar a visão do cliente." />
  if (!v) return null

  const { obra } = v
  const concluidas = v.fases.filter((f) => f.concluida_em).length
  const executadoPct = pct(v.executado, v.estimado)

  return (
    <div className="flex flex-col gap-3">
      <div className="so-tela flex items-center gap-2 text-[#777]">
        <span>Tela para apresentar ao cliente: só somas e fotos, sem fornecedor, insumo ou margem.</span>
        <Botao variante="acento" icone={Printer} className="ml-auto" onClick={() => window.print()}>
          Imprimir / salvar PDF
        </Botao>
      </div>

      <div className="folha-impressao flex flex-col gap-4">
        {/* Cabeçalho: vale na tela (é o que o cliente lê primeiro) e é a capa do impresso. */}
        <header className="flex items-end gap-4 border-b-2 border-titulo pb-2">
          <div className="text-[#333]"><Logo /></div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] leading-tight font-bold text-titulo">{obra.nome}</h2>
            <p className="text-[13px] text-[#555]">
              {[obra.cliente, obra.cidade, situacao].filter(Boolean).join(' · ')}
            </p>
          </div>
          <p className="text-right text-[11px] text-[#777]">Posição em{' '}<br /><b className="text-[13px] text-[#333]">{formatData(hoje())}</b></p>
        </header>

        {/* Números grandes e poucos. */}
        <section className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Numero rotulo="Investido" valor={formatBRL(v.investido)} nota="aportes do cliente na obra" />
          <Numero rotulo="Executado" valor={formatBRL(v.executado)} nota="tudo o que já foi lançado na obra" />
          <Numero
            rotulo="Saldo"
            valor={`${v.saldo < 0 ? '− ' : '+ '}${formatBRL(Math.abs(v.saldo))}`}
            nota={v.saldo < 0 ? 'executado acima do investido' : 'investido ainda não executado'}
            cor={v.saldo < 0 ? 'text-perigo' : 'text-[#3d833d]'}
          />
          <div className="flex flex-col justify-center gap-1 border border-grade-linha px-3 py-2">
            <span className="text-rotulo">Executado do estimado</span>
            <b className="text-[24px] leading-tight tabular-nums text-[#333]">
              {v.estimado ? pctTxt(executadoPct) : '—'}
            </b>
            {v.estimado > 0 && <Barra pct={executadoPct} cor="acento" rotulo={`${formatBRL(v.executado)} de ${formatBRL(v.estimado)}`} />}
            <span className="text-[11px] text-[#888]">
              {v.fases.length ? `${concluidas} de ${v.fases.length} fases concluídas` : 'sem fases com valor'}
            </span>
          </div>
        </section>

        {/* Taxa de administração devida (Jean, 18/10/2026: o cliente vê a taxa). Só das
            fases concluídas: é quando ela passa a ser devida. */}
        {v.taxa > 0 && (
          <section className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border border-grade-linha px-3 py-2">
            <span>
              <span className="text-rotulo">Taxa de administração devida </span>
              <b className="tabular-nums text-[#333]">{formatBRL(v.taxa)}</b>
            </span>
            <span className="text-[11px] text-[#888]">
              {v.fases.filter((f) => f.taxa_devida > 0).map((f) => `${f.codigo} - ${f.nome}: ${formatBRL(f.taxa_devida)}`).join(' · ')}
            </span>
          </section>
        )}

        {v.fases.length === 0 ? (
          <EmptyState titulo="Esta obra ainda não tem estimativa nem lançamentos." />
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Bloco titulo={v.estimado ? 'Participação de cada fase no estimado' : 'Participação de cada fase no executado'}>
                <Pizza fases={v.fases} campo={v.estimado ? 'estimado' : 'realizado'} />
              </Bloco>
              <Bloco titulo="Investido e executado no tempo (acumulado)">
                <Tempo meses={v.meses} estimado={v.estimado} />
              </Bloco>
            </div>
            <Bloco titulo="Estimado × executado por fase">
              <Barras fases={v.fases} />
            </Bloco>
          </>
        )}

        <Fotos fotos={v.fotos} />

        <footer className="mt-2 border-t border-grade-linha pt-1.5 text-[10px] text-[#999]">
          Carvalho Rosa · {obra.nome} · posição em {formatData(hoje())}. Valores em reais; executado = notas lançadas na obra.
        </footer>
      </div>
    </div>
  )
}

function Numero({ rotulo, valor, nota, cor = 'text-[#333]' }) {
  return (
    <div className="flex flex-col justify-center border border-grade-linha px-3 py-2">
      <span className="text-rotulo">{rotulo}</span>
      <b className={`text-[24px] leading-tight tabular-nums ${cor}`}>{valor}</b>
      <span className="text-[11px] text-[#888]">{nota}</span>
    </div>
  )
}

function Bloco({ titulo, children }) {
  return (
    <section className="bloco-impressao border border-grade-linha p-3">
      <h3 className="pb-2 text-[13px] font-bold text-[#444]">{titulo}</h3>
      {children}
    </section>
  )
}

// ── Pizza (rosca) ───────────────────────────────────────────────────────────────────
// Até 8 fases com cor própria (7 quando sobra resto), na ordem do maior pro menor; o resto vira "Outras fases"
// em cinza. A legenda ao lado leva valor e % - é a tabela do gráfico, e o que faz a cor
// nunca ser a única pista.
function Pizza({ fases, campo }) {
  const fatias = useMemo(() => {
    const ord = fases.filter((f) => f[campo] > 0).sort((a, b) => b[campo] - a[campo])
    const top = ord.slice(0, ord.length > 8 ? 7 : 8).map((f, i) => ({ nome: f.nome, valor: f[campo], cor: SERIES[i] ?? OUTRAS }))
    const resto = ord.slice(top.length)
    if (resto.length) top.push({ nome: `Outras fases (${resto.length})`, valor: resto.reduce((a, f) => a + f[campo], 0), cor: OUTRAS })
    return top
  }, [fases, campo])
  const total = fatias.reduce((a, f) => a + f.valor, 0)

  let ang = -Math.PI / 2
  const R = 80
  const r = 50
  const ponto = (raio, a) => `${100 + raio * Math.cos(a)} ${100 + raio * Math.sin(a)}`
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg viewBox="0 0 200 200" className="w-[180px] shrink-0" role="img" aria-label="Participação por fase">
        {fatias.length === 1 ? (
          <circle cx="100" cy="100" r={(R + r) / 2} fill="none" stroke={fatias[0].cor} strokeWidth={R - r}>
            <title>{fatias[0].nome}: {formatBRL(fatias[0].valor)} (100%)</title>
          </circle>
        ) : fatias.map((f) => {
          const a0 = ang
          const a1 = (ang += (f.valor / total) * 2 * Math.PI)
          const grande = a1 - a0 > Math.PI ? 1 : 0
          return (
            <path
              key={f.nome}
              d={`M ${ponto(R, a0)} A ${R} ${R} 0 ${grande} 1 ${ponto(R, a1)} L ${ponto(r, a1)} A ${r} ${r} 0 ${grande} 0 ${ponto(r, a0)} Z`}
              fill={f.cor}
              stroke="#fff"
              strokeWidth="2"
              className="hover:opacity-80"
            >
              <title>{f.nome}: {formatBRL(f.valor)} ({pctTxt(pct(f.valor, total))})</title>
            </path>
          )
        })}
        <text x="100" y="96" textAnchor="middle" className="fill-[#777] text-[10px]">total</text>
        <text x="100" y="112" textAnchor="middle" className="fill-[#333] text-[13px] font-bold">{curto(total)}</text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-1">
        {fatias.map((f) => (
          <li key={f.nome} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: f.cor }} />
            <span className="min-w-0 flex-1 truncate" title={f.nome}>{f.nome}</span>
            <span className="tabular-nums text-[#777]">{pctTxt(pct(f.valor, total))}</span>
            <span className="w-[92px] text-right tabular-nums">{curto(f.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Barras: estimado × executado ────────────────────────────────────────────────────
// Horizontal, uma linha por fase na ordem da obra: nome de fase é longo e não cabe em
// eixo de barra em pé. Estimado em cinza (é a referência), executado em azul; o valor
// e a diferença ficam escritos na ponta, então dá pra ler sem a cor.
function Barras({ fases }) {
  const max = Math.max(...fases.map((f) => Math.max(f.estimado, f.realizado)), 1)
  return (
    <div className="flex flex-col gap-2">
      <Legenda itens={[['Estimado', ESTIMADO], ['Executado', REALIZADO]]} />
      {fases.map((f) => {
        const acima = f.estimado > 0 && f.realizado > f.estimado
        return (
          <div key={f.id} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-2 sm:grid-cols-[minmax(0,240px)_1fr]">
            <span className="truncate text-[#444]" title={f.nome}>
              {f.nome}{f.concluida_em && <span className="text-[#3d833d]"> ✓</span>}
            </span>
            <div className="flex flex-col gap-[2px]" title={`${f.nome}\nEstimado: ${formatBRL(f.estimado)}\nExecutado: ${formatBRL(f.realizado)}`}>
              <Linha valor={f.estimado} max={max} cor={ESTIMADO} texto={curto(f.estimado)} />
              <Linha
                valor={f.realizado}
                max={max}
                cor={REALIZADO}
                texto={`${curto(f.realizado)}${f.estimado ? ` · ${pctTxt(pct(f.realizado, f.estimado))}` : ''}`}
                aviso={acima ? 'acima do estimado' : null}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Linha({ valor, max, cor, texto, aviso }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-[9px] rounded-r-[4px]" style={{ width: `${(valor / max) * 75}%`, minWidth: valor ? 2 : 0, background: cor }} />
      <span className="text-[11px] whitespace-nowrap tabular-nums text-[#555]">
        {texto}{aviso && <b className="text-perigo"> ▲ {aviso}</b>}
      </span>
    </div>
  )
}

function Legenda({ itens }) {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-[#555]">
      {itens.map(([nome, cor, tracejado]) => (
        <span key={nome} className="flex items-center gap-1">
          {tracejado
            ? <span className="w-4 border-t-2 border-dashed" style={{ borderColor: cor }} />
            : <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: cor }} />}
          {nome}
        </span>
      ))}
    </div>
  )
}

// ── No tempo: investido e executado acumulados, mês a mês ───────────────────────────
// Um eixo só (tudo é R$). O estimado total entra como linha tracejada de referência:
// é o "até onde a obra vai".
function Tempo({ meses, estimado }) {
  if (!meses.length) return <p className="py-6 text-center text-[#999]">Sem lançamentos ainda.</p>
  let ac = { r: 0, i: 0 }
  const pts = meses.map((m) => {
    ac = { r: ac.r + m.realizado, i: ac.i + m.investido }
    return { ym: m.ym, executado: ac.r, investido: ac.i }
  })
  const W = 420
  const H = 200
  const E = 56 // margem do eixo
  const B = 22 // margem de baixo
  const topo = Math.max(estimado, ...pts.map((p) => Math.max(p.executado, p.investido)), 1)
  const passo = degrau(topo / 4)
  const teto = Math.ceil(topo / passo) * passo
  const x = (i) => E + (pts.length === 1 ? (W - E - 10) / 2 : (i / (pts.length - 1)) * (W - E - 10))
  const y = (v) => 8 + (1 - v / teto) * (H - B - 8)
  const linha = (k) => pts.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p[k])}`).join(' ')
  const ticks = Array.from({ length: Math.round(teto / passo) + 1 }, (_, i) => i * passo)
  // Rótulo do mês: no máximo ~8 no eixo, senão encavalam.
  const cada = Math.ceil(pts.length / 8)

  return (
    <div className="flex flex-col gap-2">
      <Legenda itens={[['Investido', INVESTIDO], ['Executado', REALIZADO], ...(estimado ? [['Estimado total', '#777', true]] : [])]} />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Investido e executado acumulados por mês">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={E} x2={W - 4} y1={y(t)} y2={y(t)} stroke="#ececec" />
            <text x={E - 4} y={y(t) + 3} textAnchor="end" className="fill-[#888] text-[9px]">{curto(t)}</text>
          </g>
        ))}
        {pts.map((p, i) => i % cada === 0 && (
          <text key={p.ym} x={x(i)} y={H - 6} textAnchor="middle" className="fill-[#888] text-[9px]">{rotuloMes(p.ym)}</text>
        ))}
        {estimado > 0 && <line x1={E} x2={W - 4} y1={y(estimado)} y2={y(estimado)} stroke="#777" strokeDasharray="4 3" strokeWidth="1.5" />}
        {[['investido', INVESTIDO], ['executado', REALIZADO]].map(([k, cor]) => (
          <g key={k}>
            <path d={linha(k)} fill="none" stroke={cor} strokeWidth="2" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={p.ym} cx={x(i)} cy={y(p[k])} r="4" fill={cor} stroke="#fff" strokeWidth="2">
                <title>{rotuloMes(p.ym)} - {k === 'investido' ? 'Investido' : 'Executado'} até aqui: {formatBRL(p[k])}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}

// Passo "redondo" do eixo: 1, 2 ou 5 × potência de 10, em centavos.
function degrau(bruto) {
  const p = 10 ** Math.floor(Math.log10(bruto))
  return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= bruto)
}

// ── Fotos ───────────────────────────────────────────────────────────────────────────
// Da pasta Fotos e do Diário de obra, as mais recentes primeiro, com data e fase. O
// filtro por fase só existe na tela; o impresso leva as que estiverem filtradas.
function Fotos({ fotos }) {
  const [fase, setFase] = useState('')
  const fases = [...new Set(fotos.map((f) => f.fase).filter(Boolean))]
  const vis = fase ? fotos.filter((f) => f.fase === fase) : fotos
  return (
    <section className="bloco-impressao border border-grade-linha p-3">
      <div className="flex items-center gap-2 pb-2">
        <h3 className="text-[13px] font-bold text-[#444]">Fotos da obra</h3>
        {fases.length > 0 && (
          <select className="so-tela op-input ml-auto w-auto" value={fase} onChange={(e) => setFase(e.target.value)}>
            <option value="">Todas as fases ({fotos.length})</option>
            {fases.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>
      {vis.length === 0 ? (
        <EmptyState icone={ImagemIcone} titulo="Nenhuma foto ainda." texto="Entram as imagens da pasta Fotos da Galeria e as do Diário de obra." />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {vis.map((f) => (
            <a
              key={f.id}
              href={`/api/anexo/${f.ref}?inline=1`}
              target="_blank"
              rel="noreferrer"
              className="foto-impressao flex flex-col border border-grade-linha bg-[#fafafa]"
            >
              <img src={`/api/anexo/${f.ref}?inline=1`} alt={f.nome} className="aspect-[4/3] w-full object-cover" />
              <span className="truncate px-1.5 py-1 text-[11px] text-[#666]">
                {formatData(f.criado_em)}{f.fase ? ` · ${f.fase}` : ''}
              </span>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

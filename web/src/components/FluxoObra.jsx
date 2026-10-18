import { useCallback, useEffect, useState } from 'react'
import { Download, CheckCircle2, RotateCcw } from 'lucide-react'
import { Navegador } from '../ui/Tela'
import Grid, { TotalGrid } from '../ui/Grid'
import Botao from '../ui/Botao'
import EmptyState from '../ui/EmptyState'
import Badge from '../ui/Badge'
import Confirm from '../ui/Confirm'
import { Select } from '../ui/Form'
import { MoneyInput, PctInput } from '../ui/Numeros'
import ExtratoFase from './ExtratoFase'
import { getFluxo, concluirFase } from '../lib/api'
import { formatMoeda, formatPct, formatData, hoje } from '../lib/format'

// Fluxo de caixa da obra. Todo lançamento - entrada ou saída - pertence a uma FASE,
// então o caixa da obra é a soma dos caixas das fases; não existe lançamento solto.
//
// Duas leituras do mesmo dinheiro, e é por isso que são duas colunas: `saldo` é
// competência (tudo que foi lançado, a nota já chegou) e `caixa` é regime de caixa
// (só o que efetivamente saiu, `pago_em` preenchido). A diferença entre os dois é o
// que ainda não foi pago - por isso aparece no rodapé em vez de virar uma terceira
// coluna que ninguém saberia ler.
//
// Aba da obra, não tela: /obra/:id já é largura cheia (Registro ignora `largura`
// quando é página), então o extrato cabe aqui e o contexto da obra fica visível
// em cima, como manda a regra "a Obra é uma tela só".
//
// Fase concluída (UPDATE.md §11.2) é marca, não trava: concluir pergunta pra qual fase
// ir e já abre ela - o fluxo de quem está no canteiro. As concluídas saem do grid por
// padrão (e não das somas do rodapé); a fase aberta fica, mesmo concluída.
// `onMudou`: o saldo em destaque no topo da obra vem de fora e precisa recarregar.
export default function FluxoObra({ obraId, onFaixa, onMudou }) {
  const [dados, setDados] = useState(undefined) // undefined = carregando, null = não achou
  // A fase escolhida vai pro hash, como no Orçamento: recarregar não volta pro começo.
  const [faseAtiva, setFaseAtiva] = useState(() => Number(location.hash.slice(2)) || null)
  const irFase = (fid) => { location.hash = `f${fid}`; setFaseAtiva(fid) }
  const [verConcluidas, setVerConcluidas] = useState(false)
  // Depois de concluir: { proxima } = perguntando pra onde ir.
  const [seguir, setSeguir] = useState(null)
  // Antes de concluir: { tipo, valor } = escolhendo a taxa de administração da fase.
  const [fechando, setFechando] = useState(null)

  const carregar = useCallback(
    () => getFluxo(obraId).then(setDados).catch(() => setDados(null)),
    [obraId],
  )
  useEffect(() => { carregar() }, [carregar])

  if (dados === undefined) return null
  if (!dados) return <EmptyState titulo="Não foi possível carregar o caixa." />

  const { fases } = dados
  const de = (fid) => dados.porFase.find((p) => p.fase_id === fid) ?? { realizado: 0, aberto: 0, aportado: 0, orcado: 0 }
  // Competência: entrou menos tudo que foi lançado. Caixa: menos só o que já foi pago.
  const saldoFase = (f) => de(f.id).aportado - de(f.id).realizado
  const caixaFase = (f) => de(f.id).aportado - (de(f.id).realizado - de(f.id).aberto)

  const soma = (fn) => fases.reduce((a, f) => a + fn(f), 0)
  const entradas = soma((f) => de(f.id).aportado)
  const saidas = soma((f) => de(f.id).realizado)
  const aberto = soma((f) => de(f.id).aberto)
  const orcado = soma((f) => de(f.id).orcado)

  const ativa = fases.find((f) => f.id === faseAtiva) ?? fases.find((f) => !f.concluida_em) ?? fases[0]
  const visiveis = fases.filter((f) => verConcluidas || !f.concluida_em || f.id === ativa?.id)
  const nConcluidas = fases.filter((f) => f.concluida_em).length
  const idx = Math.max(0, visiveis.findIndex((f) => f.id === ativa?.id))

  // A próxima é a primeira EM ANDAMENTO depois desta na ordem da obra; se não houver
  // pra frente, a primeira que sobrou pra trás (fase pulada também é fase pendente).
  const pendentes = fases.filter((f) => !f.concluida_em && f.id !== ativa?.id)
  const posAtiva = fases.findIndex((f) => f.id === ativa?.id)
  const sugerida = pendentes.find((f) => fases.indexOf(f) > posAtiva) ?? pendentes[0]

  // A taxa de administração se escolhe ao concluir (decidido com o Jean em 17/10/2026):
  // valor fixo ou % sobre o que foi PAGO na fase. Vem a regra que a fase já teve (foi
  // reaberta) ou o % da estimativa como sugestão.
  function pedirTaxa() {
    setFechando(ativa.taxa_tipo
      ? { tipo: ativa.taxa_tipo, valor: ativa.taxa_valor ?? 0 }
      : { tipo: 'pct', valor: dados.taxa_estimativa ?? 0 })
  }
  const pagoDa = (f) => de(f.id).realizado - de(f.id).aberto
  // A mesma conta de `taxaDevida` (api/rotas/relatorio.js): inteiro × inteiro, depois divide.
  const previa = (t) => (t.tipo === 'fixo' ? t.valor : t.tipo === 'pct' ? Math.round((pagoDa(ativa) * t.valor) / 10000) : 0)

  async function concluir() {
    const t = fechando
    setFechando(null)
    // Fixa a fase no endereço: sem isso, a ativa era "a primeira não concluída" e, ao
    // recarregar, pulava sozinha pra seguinte - que então sumia das opções de "pra qual
    // fase a obra vai agora?" (rodada 2, A30).
    irFase(ativa.id)
    try {
      await concluirFase(ativa.id, hoje(), {
        taxa_tipo: t.tipo === 'sem' ? null : t.tipo, taxa_valor: t.tipo === 'sem' ? null : t.valor,
      })
      await carregar()
      onMudou?.() // a taxa escolhida entra no "A receber" do topo
    } catch {
      return onFaixa?.({ tipo: 'erro', texto: 'Não foi possível concluir a fase.' })
    }
    if (sugerida) setSeguir({ proxima: sugerida.id })
    else onFaixa?.({ tipo: 'sucesso', texto: 'Fase concluída. Todas as fases da obra estão concluídas.' })
  }

  async function reabrir() {
    try {
      await concluirFase(ativa.id, null)
      await carregar()
      onMudou?.()
    } catch {
      onFaixa?.({ tipo: 'erro', texto: 'Não foi possível reabrir a fase.' })
    }
  }

  if (!fases.length) {
    return <EmptyState titulo="Nenhuma fase ainda." texto="Defina as fases na estimativa." />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Exportar perdeu o cabeçalho de tela quando o Fluxo virou aba; fica aqui,
          discreto, em cima do que ele exporta. */}
      <div className="flex justify-end pb-1">
        <Botao icone={Download} onClick={() => window.open(`/api/obra/${obraId}/export.csv`)}>Exportar</Botao>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 md:flex-row">
        <div className="flex min-h-[180px] w-full flex-col md:w-[52%] md:min-w-[380px]">
          <Grid
            className="flex-1"
            ativa={ativa?.id}
            onLinha={(f) => irFase(f.id)}
            linhas={visiveis}
            vazio="Nenhuma fase."
            classeLinha={(f) => (f.concluida_em ? 'text-[#999]' : '')}
            colunas={[
              {
                chave: 'nome', titulo: 'Fase', nowrap: false,
                render: (f) => (
                  <span className="inline-flex items-center gap-1">
                    {f.concluida_em && (
                      <span title={`Concluída em ${formatData(f.concluida_em)}`}>
                        <CheckCircle2 size={13} className="shrink-0 text-sucesso" />
                      </span>
                    )}
                    {f.codigo} - {f.nome}
                  </span>
                ),
              },
              {
                // O que a fase deveria custar, ao lado do que ela já consumiu - sem
                // isso a coluna Saídas é um número sem régua.
                chave: 'o', titulo: 'Estimado (R$)', largura: 104, align: 'right',
                render: (f) => formatMoeda(de(f.id).orcado),
              },
              {
                chave: 'e', titulo: 'Entradas (R$)', largura: 104, align: 'right',
                render: (f) => <span className="text-sucesso">{formatMoeda(de(f.id).aportado)}</span>,
              },
              { chave: 's', titulo: 'Saídas (R$)', largura: 104, align: 'right', render: (f) => formatMoeda(de(f.id).realizado) },
              {
                // Sinaliza, não bloqueia: fase no vermelho pinta e continua lá.
                chave: 'saldo', titulo: 'Saldo (R$)', largura: 104, align: 'right',
                render: (f) => <b className={saldoFase(f) < 0 ? 'text-perigo' : ''}>{formatMoeda(saldoFase(f))}</b>,
              },
              {
                chave: 'caixa', titulo: 'Caixa (R$)', largura: 104, align: 'right',
                render: (f) => <span className={caixaFase(f) < 0 ? 'text-perigo' : ''}>{formatMoeda(caixaFase(f))}</span>,
              },
            ]}
            rodape={
              <TotalGrid>
                Estimado: <b>R$ {formatMoeda(orcado)}</b> ·
                {' '}Entradas: <b className="text-sucesso">R$ {formatMoeda(entradas)}</b> ·
                {' '}Saídas: <b>R$ {formatMoeda(saidas)}</b> ·
                {' '}Saldo: <b className={entradas - saidas < 0 ? 'text-perigo' : ''}>R$ {formatMoeda(entradas - saidas)}</b> ·
                {' '}Caixa: <b className={entradas - (saidas - aberto) < 0 ? 'text-perigo' : ''}>R$ {formatMoeda(entradas - (saidas - aberto))}</b>
                {/* Só o número: quem paga abre o lançamento na lista ao lado e marca
                    Pago. Não há tela pra onde levar. */}
                {aberto > 0 && <> · A pagar: <b className="text-laranja">R$ {formatMoeda(aberto)}</b></>}
              </TotalGrid>
            }
          />
          {nConcluidas > 0 && (
            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 pt-1.5 text-rotulo">
              <input type="checkbox" checked={verConcluidas} onChange={(e) => setVerConcluidas(e.target.checked)} />
              Mostrar fases concluídas ({nConcluidas})
            </label>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {ativa && (
            <Navegador
              titulo={`${ativa.codigo} - ${ativa.nome} · Saldo R$ ${formatMoeda(saldoFase(ativa))}`}
              onAnterior={idx > 0 ? () => irFase(visiveis[idx - 1].id) : undefined}
              onProximo={idx < visiveis.length - 1 ? () => irFase(visiveis[idx + 1].id) : undefined}
            />
          )}
          {ativa && (
            <div className="flex shrink-0 items-center justify-end gap-2 pb-1.5">
              {ativa.concluida_em ? (
                <>
                  <Badge cor="sucesso">Concluída em {formatData(ativa.concluida_em)}</Badge>
                  {ativa.taxa_tipo && (
                    <span className="text-rotulo">
                      Taxa: {ativa.taxa_tipo === 'fixo'
                        ? `R$ ${formatMoeda(ativa.taxa_valor)}`
                        : `${formatPct(ativa.taxa_valor)}% do pago = R$ ${formatMoeda(previa({ tipo: 'pct', valor: ativa.taxa_valor }))}`}
                    </span>
                  )}
                  <Botao icone={RotateCcw} onClick={reabrir}>Reabrir fase</Botao>
                </>
              ) : (
                <Botao icone={CheckCircle2} onClick={pedirTaxa}>Concluir fase</Botao>
              )}
            </div>
          )}
          <ExtratoFase
            dados={dados}
            setDados={setDados}
            recarregar={async () => { await carregar(); onMudou?.() }}
            fases={fases}
            ativa={ativa}
            realizadoDaFase={(fid) => de(fid).realizado}
            onFaixa={onFaixa}
          />
        </div>
      </div>

      <Confirm
        open={!!fechando}
        danger={false}
        title={ativa && `Concluir ${ativa.codigo} - ${ativa.nome}`}
        message={fechando && (
          <span className="flex flex-col gap-2">
            Taxa de administração desta fase:
            {[['pct', 'Percentual sobre o pago'], ['fixo', 'Valor fixo'], ['sem', 'Sem taxa']].map(([tipo, rotulo]) => (
              <label key={tipo} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="taxa_tipo"
                  checked={fechando.tipo === tipo}
                  onChange={() => setFechando({ tipo, valor: tipo === 'pct' ? dados.taxa_estimativa ?? 0 : 0 })}
                />
                <span className="w-[150px]">{rotulo}</span>
                {fechando.tipo === tipo && tipo === 'pct' && (
                  <><PctInput className="w-[80px]" value={fechando.valor} onChange={(valor) => setFechando({ tipo, valor })} />%</>
                )}
                {fechando.tipo === tipo && tipo === 'fixo' && (
                  <>R$ <MoneyInput className="w-[110px]" value={fechando.valor} onChange={(valor) => setFechando({ tipo, valor })} /></>
                )}
              </label>
            ))}
            <span className="text-rotulo">
              Pago na fase: R$ {formatMoeda(pagoDa(ativa))} · Taxa devida: <b className="text-[#333]">R$ {formatMoeda(previa(fechando))}</b>
            </span>
            {/* Conta em aberto não trava (fase concluída é marca, §11.2), mas avisa: no
                percentual ela entra na taxa só quando for paga (rodada 2, A11). */}
            {de(ativa.id).aberto > 0 && (
              <span className="text-[12px] text-perigo">
                Ainda há R$ {formatMoeda(de(ativa.id).aberto)} em aberto nesta fase
                {fechando.tipo === 'pct' && (
                  <>, que entram na taxa quando forem pagos: com tudo pago, R$ {formatMoeda(Math.round((de(ativa.id).realizado * fechando.valor) / 10000))} (é o que o A receber previsto já conta)</>
                )}.
              </span>
            )}
          </span>
        )}
        confirmLabel="Concluir fase"
        onConfirm={concluir}
        onCancel={() => setFechando(null)}
      />

      <Confirm
        open={!!seguir}
        danger={false}
        title="Fase concluída"
        message={seguir && (
          <span className="flex flex-col gap-2">
            Pra qual fase a obra vai agora?
            <Select
              vazio={null}
              value={seguir.proxima}
              onChange={(e) => setSeguir({ proxima: Number(e.target.value) })}
              opcoes={pendentes.map((f) => ({ valor: f.id, label: `${f.codigo} - ${f.nome}` }))}
            />
          </span>
        )}
        confirmLabel="Abrir fase"
        cancelLabel="Ficar nesta"
        onConfirm={() => { irFase(seguir.proxima); setSeguir(null) }}
        onCancel={() => setSeguir(null)}
      />
    </div>
  )
}

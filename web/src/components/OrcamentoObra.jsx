import { useEffect, useState } from 'react'
import {
  Save, ChevronDown, ChevronRight, History, FilePlus, Trash2, Pencil, MoreVertical,
} from 'lucide-react'
import Grid, { TotalGrid } from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import Faixa from '../ui/Faixa'
import EmptyState from '../ui/EmptyState'
import Confirm from '../ui/Confirm'
import { Campos, Campo, Input, Select } from '../ui/Form'
import { MoneyInput, PctInput } from '../ui/Numeros'
import {
  excluirOrcamento, getOrcamento, patchFase, patchOrcamento, salvarOrcadoFase, salvarServicos,
  versionarOrcamento,
} from '../lib/api'
import { formatMoeda, formatPct, mult, pct } from '../lib/format'

// O total do serviço, como o servidor calcula: soma das duas parcelas JÁ arredondadas.
// Digitando aqui, mo é sempre 0 e qtd 1 - mas linhas antigas ainda podem trazer valor
// nos dois, e o que a tela mostra tem que ser o que o total da fase soma.
const totalServico = (s) => mult(s.qtd, s.custo_mo_unit) + mult(s.qtd, s.custo_mat_unit)

// Subopção do serviço (UPDATE.md §1.11): o material escolhido de uma lista do
// catálogo, na MESMA linha do serviço - `Calçada · basalto`, sem nível novo na árvore.
// `outros` abre um campo pra digitar a palavra, e é a palavra que se grava.
function Subopcao({ opcoes, value, onChange }) {
  const naLista = opcoes.includes(value)
  const outro = !naLista && !!value && opcoes.includes('outros')
  return (
    <>
      <Select
        className="op-input op-cel w-[120px] text-left"
        vazio="Material..."
        opcoes={opcoes.map((o) => ({ valor: o, label: o }))}
        value={naLista ? value : outro ? 'outros' : ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {(outro || value === 'outros') && (
        <Input
          className="op-input op-cel w-[120px] text-left"
          placeholder="Qual?"
          value={value === 'outros' ? '' : value}
          onChange={(e) => onChange(e.target.value || 'outros')}
        />
      )}
    </>
  )
}

// Aba Orçamento do cadastro da obra: expande a fase, digita o valor de cada serviço.
// Uma linha, um valor - toda linha é editável, sempre.
//
// VERSÕES: o orçamento vivo é o que a obra usa - é dele que sai o orçado da home. As
// versões salvas são GAVETAS nomeadas: retratos do vivo, guardados por escolha do
// usuário. Todas falam das MESMAS fases da obra, cada uma com o seu valor; por isso
// trocar de versão não muda a lista de fases nem encosta em lançamento. Abrir uma
// gaveta mostra o que havia nela, em somente leitura: editar histórico faria dele
// qualquer outra coisa.

export default function OrcamentoObra({ orcamento, versoes = [], onSalvo }) {
  // rascunho: { [chave]: centavos }, onde chave é `s<id>` (serviço) ou `f<id>` (fase
  // que este orçamento ainda não precificou - grava pelo
  // /api/orcamento/:id/fase/:faseId/orcado e nasce como serviço "Geral").
  // `o<id>` é a exceção que não é dinheiro: a subopção escolhida do serviço.
  // `p<id>` é o percentual de referência da fase e `adm` a taxa de administração - os
  // dois em ponto-base (UPDATE.md §2 e §4).
  const [rascunho, setRascunho] = useState({})
  const [abertas, setAbertas] = useState(() => new Set())
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [nomeando, setNomeando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [renomeando, setRenomeando] = useState(false)
  const [menu, setMenu] = useState(false)
  const [faixa, setFaixa] = useState(null)
  // null = olhando o orçamento vivo. Um id = olhando uma gaveta arquivada.
  const [vendo, setVendo] = useState(null)
  const [arquivada, setArquivada] = useState(null)

  useEffect(() => {
    if (!vendo) return setArquivada(null)
    setArquivada(null)
    getOrcamento(vendo).then(setArquivada).catch(() => setArquivada(null))
  }, [vendo])

  const vivoId = orcamento?.orcamento?.id
  const gavetas = versoes.filter((v) => v.id !== vivoId)
  const soLeitura = !!vendo
  // Enquanto a gaveta não chegou, o grid fica vazio em vez de mostrar o vivo com o
  // rótulo da arquivada - meio segundo de número errado é número errado.
  const atual = vendo ? arquivada : orcamento
  const fases = atual?.fases ?? []

  const servicosDe = (f) => (atual?.servicos ?? []).filter((s) => s.fase_id === f.id)
  const valor = (chave, padrao) => rascunho[chave] ?? padrao
  const escrever = (chave, v) => setRascunho((s) => ({ ...s, [chave]: v }))
  const sujo = Object.keys(rascunho).length > 0

  // O total sai do RASCUNHO: o número da fase mexe enquanto se digita, sem salvar.
  const totalFase = (f, ler = valor) => {
    const servicos = servicosDe(f)
    if (!servicos.length) return ler(`f${f.id}`, f.custo)
    return servicos.reduce((a, s) => a + ler(`s${s.id}`, totalServico(s)), 0)
  }
  const total = fases.reduce((a, f) => a + totalFase(f), 0)

  // Administração (UPDATE.md §4): um % da estimativa sobre o custo de cada fase - que
  // somado é o % sobre o total. Linha à parte: o total da fase continua sendo custo, e
  // é ele que o % real abaixo compara com a referência.
  const taxaAdm = valor('adm', atual?.orcamento?.taxa_adm ?? 0)
  const adm = mult(taxaAdm / 10000, total)

  // Percentual por fase (UPDATE.md §2): conferência, não trava nem gera valor. O real é
  // a fatia da fase no custo; passa da referência, fica laranja. A soma das referências
  // fora de 100% só avisa - mesmo princípio do estouro de estimativa.
  const pctRef = (f) => valor(`p${f.id}`, f.percentual)
  const pctReal = (f) => pct(totalFase(f), total)
  const somaRef = fases.reduce((a, f) => a + pctRef(f), 0)
  // Sobrepor só existe quando há o que sobrepor: no primeiro orçamento (tudo zerado)
  // o Salvar grava direto, sem perguntar por um valor anterior que não existe.
  const jaTemValor = fases.some((f) => totalFase(f, (_, padrao) => padrao) > 0)

  const alternar = (id) =>
    setAbertas((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  // Fase e serviço no MESMO array achatado: o Grid é uma tabela burra e a hierarquia
  // é só indentação mais uma classe de linha.
  const linhas = fases.flatMap((f) => {
    if (!abertas.has(f.id)) return [{ k: `fase${f.id}`, fase: f }]
    const servicos = servicosDe(f)
    return [
      { k: `fase${f.id}`, fase: f },
      // Fase sem serviço continua sendo um campo só - é o "atribuo uma fase e
      // atribuo um orçamento a ela". Vira o serviço "Geral" no servidor.
      ...(servicos.length
        ? servicos.map((s) => ({ k: `serv${s.id}`, fase: f, servico: s }))
        : [{ k: `geral${f.id}`, fase: f, geral: true }]),
    ]
  })

  // nomeVersao vazio = sobrepõe o orçamento atual. Com nome, o orçamento NOVO é que
  // passa a valer: o estado de ANTES vai pra gaveta (com o nome que o vivo tinha) e só
  // depois os valores novos entram no vivo, que assume o nome digitado. O vivo nunca
  // troca de id - é o que mantém fase e lançamento apontando pro lugar certo.
  async function gravar(nomeVersao) {
    setSalvando(true)
    try {
      if (nomeVersao && jaTemValor) {
        const vivo = orcamento.orcamento
        await versionarOrcamento(vivoId, vivo.nome || `Versão ${vivo.numero}`)
      }

      // Valor e subopção do mesmo serviço saem numa linha só do lote.
      const porId = {}
      const linha = (k) => (porId[k.slice(1)] ??= { id: Number(k.slice(1)) })
      for (const [k, v] of Object.entries(rascunho)) {
        // O total do servidor é qtd*(mo+mat): zerar qtd/mo é o que faz o valor gravado
        // ser exatamente o que se digitou, venha a linha de onde vier.
        if (k.startsWith('s')) Object.assign(linha(k), { qtd: 1, custo_mo_unit: 0, custo_mat_unit: v })
        if (k.startsWith('o')) linha(k).opcao = v
      }
      const lote = Object.values(porId)
      if (lote.length) await salvarServicos(vivoId, lote)

      for (const [k, v] of Object.entries(rascunho)) {
        if (k.startsWith('f')) await salvarOrcadoFase(vivoId, Number(k.slice(1)), v)
        // O percentual é da FASE, que é da obra: vale pra todas as versões, e por isso
        // não vai pra gaveta ao versionar.
        if (k.startsWith('p')) await patchFase(Number(k.slice(1)), { percentual: v })
      }
      // Depois do versionar: a gaveta leva a taxa de antes, o vivo fica com a nova.
      if ('adm' in rascunho) await patchOrcamento(vivoId, { taxa_adm: rascunho.adm })
      if (nomeVersao) await patchOrcamento(vivoId, { nome: nomeVersao })

      setRascunho({})
      setConfirmando(false)
      setNomeando(false)
      onSalvo?.()
      setFaixa({
        tipo: 'sucesso',
        texto: nomeVersao ? `Salvo. "${nomeVersao}" agora é a estimativa da obra.` : 'Operação executada com sucesso.',
      })
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  // O alvo do menu é sempre o que está na tela - arquivada ou o próprio vivo.
  const vendoVersao = gavetas.find((g) => g.id === vendo)
  const alvoId = vendo ?? vivoId
  const alvoNome = vendo ? (vendoVersao?.nome ?? '') : (orcamento?.orcamento?.nome ?? '')
  const alvoRotulo = alvoNome || (vendo ? vendoVersao?.numero : 'Estimativa atual')

  async function excluirAlvo() {
    try {
      await excluirOrcamento(alvoId)
      setExcluindo(false)
      setVendo(null) // o que estava na tela não existe mais
      onSalvo?.()
      setFaixa({ tipo: 'sucesso', texto: `"${alvoRotulo}" excluída.` })
    } catch {
      setExcluindo(false)
      setFaixa({ tipo: 'erro', texto: 'Não foi possível excluir.' })
    }
  }

  async function renomearAlvo(nome) {
    try {
      await patchOrcamento(alvoId, { nome })
      setRenomeando(false)
      onSalvo?.()
      setFaixa({ tipo: 'sucesso', texto: `Renomeado para "${nome}".` })
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível renomear.' })
    }
  }

  const seletor = (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      <History size={14} className="text-[#777]" />
      <span className="text-[#555]">Versão:</span>
      <div className="w-[260px]">
        <Select
          value={vendo ?? ''}
          vazio={null}
          onChange={(e) => { setVendo(Number(e.target.value) || null); setRascunho({}); setMenu(false) }}
          opcoes={[
            { valor: '', label: `${orcamento?.orcamento?.nome || 'Estimativa viva'} (atual)` },
            ...gavetas.map((v) => ({ valor: v.id, label: `${v.nome || v.numero} (R$ ${formatMoeda(v.custo)})` })),
          ]}
        />
      </div>

      {/* As ações moram ao lado da versão, não na barra do rodapé: lá elas disputavam
          espaço com Salvar e um "Excluir" vermelho ficava perto demais do gesto que se
          repete o dia inteiro. Vale pro vivo também - errar a montagem do orçamento e
          querer começar de novo é o caso mais comum. O que trava é lançamento, e essa
          trava é do servidor. */}
      {alvoId && (
        <div className="relative">
          <button
            type="button"
            title="Ações da versão"
            onClick={() => setMenu((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-[3px] border border-grade-linha text-[#555] hover:bg-[#f0f0f0]"
          >
            <MoreVertical size={15} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-20" onMouseDown={() => setMenu(false)} />
              <div className="absolute right-0 z-30 mt-1 min-w-[170px] border border-grade-linha bg-white shadow-lg">
                <ItemMenu icone={Pencil} onClick={() => { setMenu(false); setRenomeando(true) }}>
                  Renomear
                </ItemMenu>
                <ItemMenu icone={Trash2} perigo onClick={() => { setMenu(false); setExcluindo(true) }}>
                  Excluir
                </ItemMenu>
              </div>
            </>
          )}
        </div>
      )}

      {soLeitura && <Badge>Arquivada · somente leitura</Badge>}
    </div>
  )

  if (!vivoId || (!vendo && !fases.length)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {gavetas.length > 0 && seletor}
        <EmptyState
          titulo="Nenhuma fase ainda."
          texto="Escolha as fases na aba Fases."
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      {seletor}
      <Grid
        className="flex-1"
        chave={(l) => l.k}
        linhas={linhas}
        zebra={false}
        vazio={vendo && !arquivada ? 'Carregando a versão...' : 'Nenhuma fase nesta versão.'}
        classeLinha={(l) => (l.servico || l.geral ? 'bg-grade-zebra text-[#555]' : 'bg-white')}
        colunas={[
          {
            chave: 'codigo', titulo: 'Cód.', largura: 54, align: 'right',
            render: (l) => (l.servico ? `${l.fase.codigo}.${l.servico.codigo}` : l.geral ? '' : l.fase.codigo),
          },
          {
            chave: 'nome', titulo: 'Fase / serviço', nowrap: false,
            render: (l) => {
              if (l.servico) {
                const s = l.servico
                const opcao = valor(`o${s.id}`, s.opcao ?? '')
                if (soLeitura || !s.opcoes?.length) {
                  return <span className="pl-6">{opcao ? `${s.nome} · ${opcao}` : s.nome}</span>
                }
                return (
                  <span className="flex items-center gap-1.5 pl-6">
                    {s.nome}
                    <Subopcao opcoes={s.opcoes} value={opcao} onChange={(v) => escrever(`o${s.id}`, v)} />
                  </span>
                )
              }
              if (l.geral) return <span className="pl-6">Valor da fase</span>
              const aberta = abertas.has(l.fase.id)
              return (
                <button
                  type="button"
                  onClick={() => alternar(l.fase.id)}
                  className="flex items-center gap-1.5 text-left"
                >
                  {aberta ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  {l.fase.nome}
                  {/* A marca é da fase, não da versão: aparece igual em todas (§11.2). */}
                  {l.fase.concluida_em && <Badge cor="sucesso">Concluída</Badge>}
                </button>
              )
            },
          },
          {
            chave: 'valor', titulo: 'Estimado (R$)', largura: 170, align: 'right',
            render: (l) => {
              if (!l.servico && !l.geral) return <b>{formatMoeda(totalFase(l.fase))}</b>
              if (soLeitura) {
                return formatMoeda(l.geral ? l.fase.custo : totalServico(l.servico))
              }
              if (l.geral) {
                return (
                  <MoneyInput
                    cel
                    value={valor(`f${l.fase.id}`, l.fase.custo)}
                    onChange={(v) => escrever(`f${l.fase.id}`, v)}
                  />
                )
              }
              return (
                <MoneyInput
                  cel
                  value={valor(`s${l.servico.id}`, totalServico(l.servico))}
                  onChange={(v) => escrever(`s${l.servico.id}`, v)}
                />
              )
            },
          },
          {
            chave: 'real', titulo: '% real', largura: 76, align: 'right',
            render: (l) => {
              if (l.servico || l.geral) return null
              const p = pctReal(l.fase)
              const acima = Math.round(p * 100) > pctRef(l.fase)
              return <span className={acima ? 'text-laranja' : ''} title={acima ? 'Acima da referência' : undefined}>{formatPct(Math.round(p * 100))}</span>
            },
          },
          {
            chave: 'ref', titulo: '% ref.', largura: 90, align: 'right',
            render: (l) => {
              if (l.servico || l.geral) return null
              if (soLeitura) return formatPct(pctRef(l.fase))
              return <PctInput cel value={pctRef(l.fase)} onChange={(v) => escrever(`p${l.fase.id}`, v)} />
            },
          },
        ]}
        rodape={
          <TotalGrid>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className={somaRef === 10000 ? 'text-[#777]' : 'text-laranja'}>
                Referência: {formatPct(somaRef)}%
                {somaRef < 10000 && ` · faltam ${formatPct(10000 - somaRef)}%`}
                {somaRef > 10000 && ` · passa ${formatPct(somaRef - 10000)}%`}
              </span>
              <span className="flex flex-wrap items-center justify-end gap-x-3">
                <span>Custo: <b>R$ {formatMoeda(total)}</b></span>
                <span className="flex items-center gap-1">
                  Administração
                  {soLeitura
                    ? ` ${formatPct(taxaAdm)}%`
                    : <><PctInput cel className="w-[64px]" value={taxaAdm} onChange={(v) => escrever('adm', v)} />%</>}
                  : <b>R$ {formatMoeda(adm)}</b>
                </span>
                <span>Total da obra: <b>R$ {formatMoeda(total + adm)}</b></span>
              </span>
            </div>
          </TotalGrid>
        }
      />
      {/* Sem `-mx-4`: o corpo da aba mora num Registro em modo página, que não tem
          padding horizontal pra sangrar - o negativo virava scroll horizontal. */}
      <div className="sticky bottom-0 z-10 mt-2">
        <BarraAcao
          esquerda={
            soLeitura
              ? <span className="text-[#777]">Versão arquivada - somente leitura.</span>
              : sujo && <span className="text-laranja">Alterações não salvas</span>
          }
        >
          {!soLeitura && (
            <>
              <Botao icone={FilePlus} onClick={() => setNomeando(true)} disabled={salvando || !sujo}>
                Salvar como nova estimativa
              </Botao>
              <Botao
                variante="acento"
                icone={Save}
                onClick={() => (jaTemValor ? setConfirmando(true) : gravar(null))}
                disabled={salvando || !sujo}
              >
                Salvar
              </Botao>
            </>
          )}
        </BarraAcao>
      </div>

      <Confirm
        open={confirmando}
        danger={false}
        title="Sobrepor a estimativa?"
        message={`Os valores atuais viram ${formatMoeda(total)} e não dá pra voltar.`}
        confirmLabel="Sobrepor"
        onCancel={() => setConfirmando(false)}
        onConfirm={() => gravar(null)}
      />

      <Confirm
        open={excluindo}
        title={vendo ? 'Excluir esta versão?' : 'Excluir a estimativa atual?'}
        message={
          vendo
            ? `"${alvoRotulo}" sai do histórico e não volta.`
            : `Os valores de "${alvoRotulo}" são apagados e não voltam. As fases e os lançamentos ficam.${
                gavetas.length
                  ? ` "${gavetas[0].nome || gavetas[0].numero}" passa a ser a estimativa.`
                  : ' A obra fica sem estimativa.'
              }`
        }
        confirmLabel="Excluir"
        onCancel={() => setExcluindo(false)}
        onConfirm={excluirAlvo}
      />

      {nomeando && (
        <DialogoNome
          titulo="Salvar como nova estimativa"
          descricao="Passa a ser a estimativa da obra. A atual vai pro histórico."
          ocupado={salvando}
          onSalvar={gravar}
          onCancelar={() => setNomeando(false)}
        />
      )}

      {renomeando && (
        <DialogoNome
          titulo={vendo ? 'Renomear versão' : 'Renomear a estimativa atual'}
          descricao={vendo ? undefined : 'É o nome que aparece no seletor de versão.'}
          inicial={alvoNome}
          onSalvar={renomearAlvo}
          onCancelar={() => setRenomeando(false)}
        />
      )}
    </div>
  )
}

const ItemMenu = ({ icone: Icone, perigo, children, ...props }) => (
  <button
    type="button"
    className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-[#f0f0f0] ${perigo ? 'text-perigo' : 'text-[#333]'}`}
    {...props}
  >
    <Icone size={13} />
    {children}
  </button>
)

// Só existe porque o `Confirm` não tem campo de texto. Fora isso é o mesmo diálogo:
// mesmo véu, mesmo Esc, mesmo rodapé cinza. Serve o "salvar como novo" e o "renomear"
// - a diferença entre os dois é o título e o valor inicial, não uma segunda tela.
function DialogoNome({ titulo, descricao, inicial = '', ocupado, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(inicial)
  const pronto = nome.trim().length > 0

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancelar()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancelar])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" onMouseDown={onCancelar}>
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md bg-white shadow-2xl">
        <h2 className="px-4 pt-3 pb-2 text-[16px] font-bold text-titulo">{titulo}</h2>
        <div className="px-4 pb-4">
          {descricao && <p className="pb-3 text-[#555]">{descricao}</p>}
          <Campos lbl={60}>
            <Campo label="Nome">
              <Input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Revisão com o cliente"
                onKeyDown={(e) => e.key === 'Enter' && pronto && onSalvar(nome.trim())}
              />
            </Campo>
          </Campos>
        </div>
        <div className="flex justify-end gap-1.5 border-t border-grade-linha bg-[#f7f7f7] px-3 py-2">
          <Botao onClick={onCancelar}>Cancelar</Botao>
          <Botao variante="acento" icone={Save} disabled={ocupado || !pronto} onClick={() => onSalvar(nome.trim())}>
            Salvar
          </Botao>
        </div>
      </div>
    </div>
  )
}

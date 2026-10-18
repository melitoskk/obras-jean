import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Save, Plus } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import Combobox from '../ui/Combobox'
import { FotoDrop } from '../ui/FileDrop'
import { Campos, Campo, Secao, Input, Select, Texto } from '../ui/Form'
import AbaEndereco from './AbaEndereco'
import DiarioObra from './DiarioObra'
import DestaqueSaldo from './DestaqueSaldo'
import FluxoObra from './FluxoObra'
import GaleriaObra from './GaleriaObra'
import { FasesCatalogo } from './FasesCatalogoPanel'
import OrcamentoObra from './OrcamentoObra'
import VisaoCliente from './VisaoCliente'
import {
  criarObra, patchObra, criarCliente, uploadAnexo, getObra,
  getOrcamentos, getOrcamento, criarOrcamento,
} from '../lib/api'
import { duracaoEntre, plural } from '../lib/format'
import { useSessao } from '../lib/sessao'

// Cadastro de obra - Obra-Prima-Cadastro-Obra.png. `obra` nulo = criar.
// Dia a dia e Galeria ficam desabilitadas ENQUANTO a obra não tem id: não há onde
// pendurar post nem arquivo antes de a obra existir. É espera real, não promessa -
// por isso continuam, enquanto Atendimento e Configurações (cinzas para sempre) saíram.
const CATEGORIAS = ['Construção Casa', 'Construção Prédio', 'Reforma', 'Galpão', 'Infraestrutura']

// Situação da obra: rótulo e cor num lugar só. Mora aqui e não na página de Obras
// porque a lista de obras do cliente também precisa, e página não exporta constante
// pra componente. `status` no banco, "situação" na tela - a referência chama assim.
export const SITUACOES = {
  nao_iniciada: { label: 'Não iniciada', cor: 'neutro' },
  ativa: { label: 'Em andamento', cor: 'acento' },
  pausada: { label: 'Paralisada', cor: 'aviso' },
  concluida: { label: 'Concluída', cor: 'sucesso' },
}
const OPCOES_SITUACAO = Object.entries(SITUACOES).map(([valor, { label }]) => ({ valor, label }))

// `pagina` só atravessa até o Registro: é ele que sabe ser modal ou tela.
// `onCaixaMudou`: um lançamento no Fluxo, ou o orçamento salvo, mexe nos números do topo, que vêm da lista de
// obras - quem tem a lista (a página) recarrega. Não é `onSalvo`: no modal de nova
// obra, onSalvo fecha o modal.
export default function ObraPanel({ obra, clientes = [], onFechar, onSalvo, onCaixaMudou, onClienteCriado, pagina }) {
  // Campo (UPDATE.md §5, Dúvida 9) vê só Diário de obra e Galeria: sem cadastro, sem
  // estimativa, sem fluxo e sem o saldo do topo. A API recusa o resto de todo jeito.
  const soCampo = useSessao().papel === 'campo'
  const [aba, setAba] = useState(soCampo ? 'diario' : 'dados')
  // O rascunho é o que o botão `+` do cliente deixou guardado antes de sair daqui.
  // Lê-e-apaga: só vale pra viagem de volta, não pra "nova obra" de meia hora depois.
  const [d, setD] = useState(() => {
    const rascunho = sessionStorage.getItem('obra-rascunho')
    sessionStorage.removeItem('obra-rascunho')
    return { status: 'nao_iniciada', ...obra, ...(rascunho ? JSON.parse(rascunho) : null) }
  })
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  // Dia a dia e Galeria vivem do payload da obra. Só busca quando a aba abre -
  // não faz sentido carregar feed e arquivos pra quem veio trocar o nome.
  const [conteudo, setConteudo] = useState(null)
  const recarregar = useCallback(
    () => (d.id ? getObra(d.id).then(setConteudo).catch(() => {}) : undefined),
    [d.id],
  )
  useEffect(() => { if (aba === 'diario' || aba === 'galeria') recarregar() }, [aba, recarregar])

  // Fases da obra: vêm do orçamento ativo dela. `orc` undefined = ainda buscando,
  // null = a obra não tem orçamento nenhum (e aí o botão cria um).
  const [orc, setOrc] = useState(undefined)
  // Todas as versões da obra (a viva e as gavetas arquivadas). A aba Orçamento usa
  // pra dizer qual está na tela e pra deixar abrir uma antiga.
  const [versoes, setVersoes] = useState([])
  useEffect(() => {
    if ((aba !== 'fases' && aba !== 'orcamento') || !d.id || orc !== undefined) return
    getOrcamentos()
      .then(async (todos) => {
        const minhas = todos.filter((o) => o.obra_id === d.id)
        setVersoes(minhas)
        const meu = minhas.find((o) => o.ativo) ?? minhas[0]
        setOrc(meu ? await getOrcamento(meu.id) : null)
      })
      .catch(() => setOrc(null))
  }, [aba, d.id, orc])


  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const campo = (k) => ({ value: d[k] ?? '', onChange: (e) => set(k, e.target.value) })

  // `?cliente=3` na URL preenche o Combobox: é como a aba Obras do cliente abre este
  // formulário, e é como o cadastro de cliente devolve quem acabou de ser criado.
  const navegar = useNavigate()
  const { pathname, search } = useLocation()
  const clienteUrl = Number(new URLSearchParams(search).get('cliente')) || null
  useEffect(() => { if (clienteUrl) setD((s) => ({ ...s, cliente_id: clienteUrl })) }, [clienteUrl])

  // O `+` sai do formulário de propósito: é o cadastro COMPLETO do cliente (CPF,
  // endereço, anexos), que não cabe aqui dentro. O que já foi digitado vai junto no
  // rascunho e volta quando o cliente for salvo - quem só quer o nome usa o Combobox.
  const irCriarCliente = () => {
    sessionStorage.setItem('obra-rascunho', JSON.stringify(d))
    navegar(`/clientes/novo?voltar=${encodeURIComponent(pathname)}`)
  }

  // Data ISO ('2026-01-10') compara como string na ordem certa - sem Date, sem fuso.
  const invertido = (ini, fim) => !!(ini && fim && fim < ini)
  const erroPrevisto = invertido(d.dt_inicio, d.dt_fim)
  const erroRealizado = invertido(d.dt_inicio_real, d.dt_fim_real)

  // Duração é INFORMAÇÃO, não campo: sai das duas datas e ninguém digita. Campo de
  // duração editável brigaria com as datas a cada tecla - foi o que tiramos daqui.
  // Período invertido não mostra duração: "-3 meses" não informa nada, confunde.
  const previsto = d.dt_inicio && d.dt_fim && !erroPrevisto
    ? duracaoEntre(d.dt_inicio, d.dt_fim, 'meses')
    : null
  // O atraso compara os FINS: é a pergunta que se faz ("entregou quando prometeu?").
  const realizado = d.dt_inicio_real && d.dt_fim_real && !erroRealizado
    ? {
        meses: duracaoEntre(d.dt_inicio_real, d.dt_fim_real, 'meses'),
        atraso: d.dt_fim && !erroPrevisto ? duracaoEntre(d.dt_fim, d.dt_fim_real, 'dias') : null,
      }
    : null

  async function pegarFoto(file) {
    setEnviandoFoto(true)
    try {
      set('foto', await uploadAnexo(file))
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível enviar a foto.' })
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome da obra é obrigatório.' })
    // Este é dos poucos que BLOQUEIA: estouro de orçamento é a obra real acontecendo,
    // mas fim antes do início é digitação errada - não existe obra que acabou antes
    // de começar. Salvar assim só empurra o erro pro relatório.
    if (erroPrevisto || erroRealizado) {
      return setFaixa({ tipo: 'erro', texto: 'A data fim não pode ser antes da data início.' })
    }
    setSalvando(true)
    try {
      const { id, cliente: _, orcado: __, gasto: ___, caixa: ____, criada_em: _____, ...campos } = d
      // Só o que mudou desde que a obra foi carregada (rodada 2, A22): mandando tudo, a
      // aba que salvava por último devolvia os campos velhos e apagava o que a outra gravou.
      if (id) await patchObra(id, Object.fromEntries(Object.entries(campos).filter(([k, v]) => v !== obra?.[k])))
      else await criarObra(campos)
      setFaixa({ tipo: 'sucesso', texto: 'Operação executada com sucesso.' })
      onSalvo?.()
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Registro
      pagina={pagina}
      onFechar={onFechar}
      largura="md"
      titulo={d.id ? `Obra: ${obra.nome}` : 'Nova obra'}
      aba={aba}
      onAba={setAba}
      abas={[
        ...(soCampo ? [] : [
          { id: 'dados', label: 'Dados' },
          { id: 'endereco', label: 'Endereço' },
          // Do que a obra é feita. A árvore de catálogo (21 fases × 103 serviços) não cabe
          // aqui dentro e painel sobre painel é proibido - então esta aba MOSTRA as fases
          // e leva pra tela grande, criando o orçamento sozinho se ainda não houver.
          { id: 'fases', label: 'Fases', disabled: !d.id },
          { id: 'orcamento', label: 'Estimativa', disabled: !d.id },
          { id: 'fluxo', label: 'Fluxo de caixa', disabled: !d.id },
          // A tela de mesa com o cliente (UPDATE.md §12): aba do escritório, sem login de
          // cliente. Fora do campo - é toda feita de valores.
          { id: 'cliente', label: 'Visão do cliente', disabled: !d.id },
        ]),
        // Só existem depois que a obra existe - não dá pra anexar foto ao nada.
        { id: 'diario', label: 'Diário de obra', disabled: !d.id },
        { id: 'galeria', label: 'Galeria', disabled: !d.id },
      ]}
      // Do `obra` e não do rascunho `d`: é o número do banco, recarregado a cada
      // lançamento, e o rascunho não muda enquanto se digita o nome.
      destaque={d.id && !soCampo && <DestaqueSaldo saldo={obra?.saldo} caixa={obra?.caixa} aPagar={obra?.aPagar} aReceber={obra?.aReceber} taxaDevida={obra?.taxaDevida} />}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      // Fases, Orçamento e Fluxo têm Salvar PRÓPRIO (gravam fase/valor/lançamento, não
      // o cadastro); Diário e Galeria gravam ao registrar (rodada 2, A15). Dois
      // botões "Salvar" na mesma tela é o que fez o primeiro teste falhar: clica-se no
      // do rodapé, que gravava só nome e endereço, e a seleção ia pro lixo.
      acoes={
        soCampo || ['fases', 'orcamento', 'fluxo', 'cliente', 'diario', 'galeria'].includes(aba) ? null : (
          <BarraAcao>
            <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
          </BarraAcao>
        )
      }
    >
      {aba === 'dados' && (
        <>
          {/* A foto divide espaço só com o bloco de cima. Período e Outras informações
              correm a largura inteira - é assim na referência, e é o que faz a linha
              do período caber numa linha só.
              No celular ela EMPILHA em cima: lado a lado sobravam 180px pros campos e
              "Categoria"/"Situação" viravam frestas. */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row">
            <div className="min-w-0 flex-1">
              <Campos lbl={104}>
              <Campo label="Cliente" req>
                <div className="flex items-center gap-1.5">
                  <div className="min-w-0 flex-1">
                    {/* Falta cliente? Digita o nome e cria aqui, sem sair do formulário. */}
                    <Combobox
                      value={d.cliente_id ?? null}
                      onChange={(v) => set('cliente_id', v)}
                      options={clientes.map((c) => ({ id: c.id, label: c.nome }))}
                      onCreate={async (nome) => {
                        const novo = await criarCliente(nome)
                        onClienteCriado?.(novo)
                        return novo.id
                      }}
                      placeholder="Digite para buscar ou criar..."
                    />
                  </div>
                  <Botao
                    variante="acento"
                    icone={Plus}
                    className="px-1.5"
                    title="Cadastro completo do cliente"
                    onClick={irCriarCliente}
                  />
                </div>
              </Campo>
              <Campo label="Nome da obra" req><Input autoFocus {...campo('nome')} /></Campo>
              <Campo label="Categoria">
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <Select {...campo('categoria')} opcoes={CATEGORIAS.map((c) => ({ valor: c, label: c }))} />
                  </div>
                  <label className="whitespace-nowrap text-rotulo sm:pt-1.5">Situação *</label>
                  <div className="min-w-0 flex-1">
                    <Select {...campo('status')} vazio={null} opcoes={OPCOES_SITUACAO} />
                  </div>
                </div>
              </Campo>
                <Campo label="Observação">
                  <Texto value={d.observacao ?? ''} onChange={(e) => set('observacao', e.target.value)} max={4000} rows={7} />
                </Campo>
              </Campos>
            </div>

            <FotoDrop
              src={d.foto ? `/api/anexo/${d.foto}?inline=1` : null}
              uploading={enviandoFoto}
              onPick={pegarFoto}
              className="h-[92px] w-full shrink-0 sm:w-[136px]"
            />
          </div>

          <Secao>Período previsto</Secao>
          <Campos lbl={104}>
              {/* Cada par rótulo+campo é um grupo indivisível: sem isso o wrap separa
                  "Data fim" do seu input e a linha fica ilegível. */}
              <Campo label="Data início">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <input
                    type="date"
                    className="op-input w-[122px]"
                    value={d.dt_inicio ?? ''}
                    onChange={(e) => set('dt_inicio', e.target.value)}
                  />
                  <span className="flex items-start gap-2">
                    <label className="pt-1.5 whitespace-nowrap text-rotulo">Data fim</label>
                    {/* `min` é o próprio calendário barrando a data inválida antes de
                        ela existir - nativo, e o teclado ainda passa por cima, por isso
                        a checagem continua abaixo. */}
                    <input
                      type="date"
                      className="op-input w-[122px]"
                      min={d.dt_inicio || undefined}
                      value={d.dt_fim ?? ''}
                      onChange={(e) => set('dt_fim', e.target.value)}
                    />
                  </span>
                  {previsto != null && (
                    <span className="pt-1.5 text-[#777]">{plural(previsto, 'mês', 'meses')}</span>
                  )}
                  {erroPrevisto && (
                    <span className="pt-1.5 text-perigo">A data fim não pode ser antes do início.</span>
                  )}
                </div>
              </Campo>
            </Campos>

          {/* Seção própria porque é outro assunto: previsão se calcula (início + duração
              = fim), realidade se observa. Aqui NADA se amarra - duas datas soltas, e a
              duração sai delas, nunca o contrário. Vazio = ainda não aconteceu, que é o
              caso normal numa obra em andamento. */}
          <Secao>Período realizado</Secao>
          <Campos lbl={104}>
              <Campo label="Data início">
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  <input
                    type="date"
                    className="op-input w-[122px]"
                    value={d.dt_inicio_real ?? ''}
                    onChange={(e) => set('dt_inicio_real', e.target.value)}
                  />
                  <span className="flex items-start gap-2">
                    <label className="pt-1.5 whitespace-nowrap text-rotulo">Data fim</label>
                    <input
                      type="date"
                      className="op-input w-[122px]"
                      min={d.dt_inicio_real || undefined}
                      value={d.dt_fim_real ?? ''}
                      onChange={(e) => set('dt_fim_real', e.target.value)}
                    />
                  </span>
                  {erroRealizado && (
                    <span className="pt-1.5 text-perigo">A data fim não pode ser antes do início.</span>
                  )}
                  {realizado && (
                    <span className="pt-1.5 text-[#777]">
                      {plural(realizado.meses, 'mês', 'meses')}
                      {/* Atraso em DIAS, não em meses: "0 mês de atraso" esconderia três
                          semanas estouradas, que é exatamente o que se quer enxergar. */}
                      {realizado.atraso != null && (
                        <b className={realizado.atraso > 0 ? 'text-perigo' : 'text-[#3d833d]'}>
                          {realizado.atraso > 0
                            ? ` · ${plural(realizado.atraso, 'dia', 'dias')} de atraso`
                            : realizado.atraso < 0
                              ? ` · ${plural(-realizado.atraso, 'dia', 'dias')} adiantado`
                              : ' · no prazo'}
                        </b>
                      )}
                    </span>
                  )}
                </div>
              </Campo>
            </Campos>

          <Secao>Outras informações</Secao>
          <Campos lbl={104}>
            <Campo label="CEI"><div className="w-[160px]"><Input {...campo('cei')} /></div></Campo>
          </Campos>
        </>
      )}

      {aba === 'endereco' && <AbaEndereco dados={d} set={set} />}

      {/* A árvore inteira, aqui dentro: escolher de que a obra é feita é assunto da
          obra. O orçamento só recebe o resultado. */}
      {aba === 'fases' && orc !== undefined && (
        <FasesCatalogo
          orcamentoId={orc?.orcamento?.id ?? null}
          garantirOrcamento={async () => (await criarOrcamento(d.id)).id}
          fases={orc?.fases ?? []}
          servicos={orc?.servicos ?? []}
          onSalvo={() => { setOrc(undefined); onCaixaMudou?.() }}
        />
      )}

      {aba === 'orcamento' && orc !== undefined && (
        <OrcamentoObra orcamento={orc} versoes={versoes} onSalvo={() => { setOrc(undefined); onCaixaMudou?.() }} />
      )}

      {aba === 'fluxo' && <FluxoObra obraId={d.id} onFaixa={setFaixa} onMudou={onCaixaMudou} />}

      {aba === 'cliente' && <VisaoCliente obraId={d.id} situacao={SITUACOES[obra?.status]?.label} />}

      {aba === 'diario' && (
        <DiarioObra
          obraId={d.id}
          posts={conteudo?.diario ?? []}
          fases={conteudo?.fases ?? []}
          onMudou={recarregar}
        />
      )}

      {aba === 'galeria' && (
        <GaleriaObra obraId={d.id} arquivos={conteudo?.arquivos ?? []} onMudou={recarregar} />
      )}
    </Registro>
  )
}

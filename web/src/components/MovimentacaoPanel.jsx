import { useRef, useState } from 'react'
import { Save, Trash2, Plus, Minus } from 'lucide-react'
import Registro from '../ui/Registro'
import Combobox from '../ui/Combobox'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import Faixa from '../ui/Faixa'
import Confirm from '../ui/Confirm'
import FileDrop from '../ui/FileDrop'
import { Campos, Campo, Secao, Input, Check } from '../ui/Form'
import { MoneyInput } from '../ui/Numeros'
import ItensEditor, { linhaVazia } from './ItensEditor'
import { hoje, mult, numeroLancamento, formatData } from '../lib/format'
import { ordenarFornecedores, tipoDosItens } from '../lib/historico'

const totalDe = (linhas) => linhas.reduce((s, l) => s + mult(l.qtd, l.valorUnit), 0)

// Um painel só para entrada E saída - nunca dois botões separados. O tipo é um
// seletor no topo e some no modo edição (entrada e saída vivem em tabelas
// diferentes e não se convertem). A fase é obrigatória nos dois.
//
// Ordem dos campos importa, e ela é a da compra: FORNECEDOR → ITENS → valor (que é a
// soma deles) → quando pagar. Já foi "valor primeiro", de quando o valor era digitado.
export default function MovimentacaoPanel({
  mov, tipoInicial = 'saida', faseInicial, fases, servicos = [], insumos, fornecedores, historico, vinculos,
  previstoDaFase, realizadoDaFase, onUpload, onSalvar, onExcluir, onFechar,
  onCriarInsumo, onCriarFornecedor, onPrecoNovo,
}) {
  const edicao = !!mov
  const [tipo, setTipo] = useState(mov?.tipo ?? tipoInicial)
  const [valor, setValor] = useState(mov?.valor ?? 0)
  const [data, setData] = useState(mov?.data ?? hoje())
  const [faseId, setFaseId] = useState(mov?.fase_id ?? faseInicial ?? null)
  // Serviço é opcional: vazio = lançamento da fase inteira, que continua valendo.
  const [servicoId, setServicoId] = useState(mov?.servico_catalogo_id ?? null)
  const [descricao, setDescricao] = useState(mov?.descricao ?? '')
  const [anexo, setAnexo] = useState(mov?.anexo ?? null)
  // O ref carrega o nome original depois de "__" (server.js, /api/anexos): na edição o
  // anexo aparece pelo nome do arquivo, não como "anexo" (rodada 2, A12).
  const [anexoNome, setAnexoNome] = useState(mov?.anexo ? mov.anexo.split('__').slice(1).join('__') || 'anexo' : null)
  const [enviando, setEnviando] = useState(false)
  // Pagar é um check aqui dentro - não existe módulo de contas a pagar. Lançamento
  // novo nasce pago (a rajada normal é nota já paga); desmarcar deixa em aberto.
  const [fornecedorId, setFornecedorId] = useState(mov?.fornecedor_id ?? null)
  const [vencimento, setVencimento] = useState(mov?.vencimento ?? '')
  const [pagoEm, setPagoEm] = useState(mov ? mov.pago_em : hoje())
  const [pagoObs, setPagoObs] = useState(mov?.pago_obs ?? '')
  const [linhas, setLinhas] = useState(
    mov?.itens?.length ? mov.itens.map((l) => ({ ...l })) : [{ ...linhaVazia }],
  )
  // Saída NOVA nasce com a grade de itens aberta: atribuir item/fornecedor/qtd é o
  // lançamento, não um detalhe opcional escondido atrás de um link. Na edição abre como
  // foi lançada - senão a saída sem itens abria com a grade vazia e o valor em 0,00.
  const [mostrarItens, setMostrarItens] = useState(mov ? !!mov.itens?.length : tipo === 'saida')
  const [faixa, setFaixa] = useState(null)
  const [pedindoExcluir, setPedindoExcluir] = useState(false)
  const [seed, setSeed] = useState(0) // remonta o editor de itens depois de limpar
  // Trava de envio: clique duplo em Salvar mandava dois POST e lançava a nota duas vezes.
  // O ref segura o segundo clique antes de o botão desabilitado chegar à tela.
  const salvandoRef = useRef(false)
  const [salvando, setSalvando] = useState(false)

  // Com itens, quem manda no valor é a soma deles - não existe "o valor da nota" e
  // "a soma dos itens" divergindo, isso era uma nota com dois números brigando. Sem
  // itens (check desmarcado), o valor é digitado, que é o caso do serviço avulso.
  const totalItens = totalDe(linhas)
  const itensMandam = tipo === 'saida' && mostrarItens
  const valorFinal = itensMandam ? totalItens : valor

  // Os serviços da fase escolhida, na estimativa viva. O já gravado entra mesmo se saiu
  // da estimativa depois - senão abrir pra editar mostraria o campo vazio e salvar o apagaria.
  const daFase = servicos.filter((s) => s.fase_id === faseId)
  const faseCodigo = fases.find((f) => f.id === faseId)?.codigo
  const opcoesServico = daFase.map((s) => ({
    id: s.id, label: `${faseCodigo}.${s.codigo} - ${s.nome}${s.opcao ? ` (${s.opcao})` : ''}`,
  }))
  if (servicoId && mov?.servico_nome && !daFase.some((s) => s.id === servicoId)) {
    opcoesServico.push({ id: servicoId, label: mov.servico_nome })
  }
  function trocarFase(id) {
    setFaseId(id)
    // Serviço é DA fase: trocar a fase solta o serviço, que não existe na outra.
    if (id !== faseId) setServicoId(null)
  }

  // Fase concluída também só avisa (UPDATE.md §11.2, Dúvida 13): a nota atrasada
  // chega depois de a fase acabar, e ela é da fase mesmo assim.
  const concluidaEm = fases.find((f) => f.id === faseId)?.concluida_em
  // Sinaliza, não bloqueia: estouro pinta de vermelho e salva do mesmo jeito.
  const estouro =
    tipo === 'saida' && faseId && previstoDaFase
      ? realizadoDaFase(faseId) + valorFinal - (mov?.valor ?? 0) > previstoDaFase(faseId)
      : false

  function limpar() {
    setValor(0)
    setDescricao('')
    setAnexo(null)
    setAnexoNome(null)
    setLinhas([{ ...linhaVazia }])
    setMostrarItens(false)
    setSeed((s) => s + 1)
    // O pagamento é DA nota: cada uma recomeça paga hoje, sem vencimento nem observação.
    // Herdar o "Em aberto" da anterior punha nota paga em contas a pagar sem ninguém ver
    // (decidido com o Jean em 17/10/2026, validação rodada 1, A8).
    setPagoEm(hoje())
    setVencimento('')
    setPagoObs('')
    // Fornecedor e serviço NÃO limpam: numa rajada de notas, costumam ser os mesmos da
    // anterior, e é justamente o que ninguém quer redigitar.
  }

  async function pegarAnexo(file) {
    setEnviando(true)
    try {
      setAnexo(await onUpload(file))
      setAnexoNome(file.name)
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível enviar o anexo.' })
    } finally {
      setEnviando(false)
    }
  }

  async function gravar(fechar) {
    if (salvandoRef.current) return
    if (!faseId) return setFaixa({ tipo: 'aviso', texto: 'Escolha a fase.' })
    if (!valorFinal) {
      return setFaixa({
        tipo: 'aviso',
        texto: itensMandam ? 'Lance ao menos um item com valor.' : 'Informe o valor.',
      })
    }
    salvandoRef.current = true
    setSalvando(true)
    try {
      await onSalvar({
        tipo,
        id: mov?.id,
        valor: valorFinal,
        data,
        fase_id: faseId,
        descricao,
        anexo,
        // Entrada não tem fornecedor nem vencimento - é dinheiro do cliente entrando.
        ...(tipo === 'saida'
          ? {
              fornecedor_id: fornecedorId, servico_catalogo_id: servicoId,
              vencimento: vencimento || null, pago_em: pagoEm, pago_obs: pagoObs,
            }
          : {}),
        // A linha sem fornecedor herda o do cabeçalho: é dele o histórico de preço
        // daquele item, e a coluna nem aparece quando o cabeçalho está preenchido.
        itens: tipo === 'saida' && mostrarItens
          ? linhas
              .filter((l) => l.itemId || l.descricao?.trim())
              .map((l) => ({ ...l, fornecedorId: l.fornecedorId ?? fornecedorId ?? null }))
          : [],
      })
      if (fechar) return onFechar()
      // Rajada: limpa e continua aberto, com os números atualizando atrás.
      limpar()
      setFaixa({ tipo: 'sucesso', texto: 'Lançado.' })
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      salvandoRef.current = false
      setSalvando(false)
    }
  }

  return (
    <Registro
      onFechar={onFechar}
      // Com a grade de itens aberta são 5 colunas dentro do painel; em `md` (768px)
      // elas ficam em fresta. Sem itens o formulário é estreito e `md` já sobra.
      largura={itensMandam ? 'xl' : 'md'}
      // Paga/Em aberto mora no título: é a primeira coisa que se procura ao abrir uma
      // saída já lançada, e lá em cima não some quando o corpo do modal rola.
      titulo={
        <span className="flex flex-wrap items-center gap-2">
          {edicao
            ? `Editar ${tipo === 'entrada' ? 'entrada' : 'saída'} ${numeroLancamento(tipo, mov.numero)}`
            : 'Registrar lançamento'}
          {tipo === 'saida' &&
            (pagoEm ? <Badge cor="sucesso">Paga</Badge> : <Badge cor="aviso">Em aberto</Badge>)}
        </span>
      }
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao
          esquerda={
            edicao && (
              <Botao variante="perigo" icone={Trash2} onClick={() => setPedindoExcluir(true)}>Excluir</Botao>
            )
          }
        >
          {!edicao && <Botao variante="acento" icone={Save} disabled={salvando} onClick={() => gravar(false)}>Salvar e continuar</Botao>}
          <Botao variante="acento" icone={Save} disabled={salvando} onClick={() => gravar(true)}>Salvar e fechar</Botao>
        </BarraAcao>
      }
    >
      {!edicao && (
        <div className="mb-3 flex gap-1.5">
          <Botao
            variante={tipo === 'entrada' ? 'acento' : 'neutro'}
            icone={Plus}
            onClick={() => setTipo('entrada')}
          >
            Entrada
          </Botao>
          <Botao
            variante={tipo === 'saida' ? 'acento' : 'neutro'}
            icone={Minus}
            onClick={() => setTipo('saida')}
          >
            Saída
          </Botao>
        </div>
      )}

      {/* A saída começa por QUEM e O QUÊ: fornecedor, depois os itens. O valor vem
          da soma deles, então perguntar o valor antes seria perguntar duas vezes.
          Sem itens (serviço avulso), o valor volta a ser o primeiro campo digitável. */}
      {tipo === 'saida' && (
        <>
          <Campos lbl={90} cols={2}>
            <Campo label="Fornecedor" largo>
              {/* autoFocus só ao lançar: o Combobox focado abre limpo (é o filtro), e
                  numa edição isso faz o fornecedor já escolhido parecer vazio. */}
              <Combobox
                autoFocus={!edicao}
                value={fornecedorId}
                onChange={setFornecedorId}
                options={ordenarFornecedores(
                  fornecedores,
                  historico,
                  linhas.map((l) => l.itemId),
                  vinculos,
                  // Nota só de mão de obra lista prestador primeiro (§10.1).
                  tipoDosItens(insumos, linhas.map((l) => l.itemId)),
                )}
                onCreate={onCriarFornecedor}
                placeholder="Quem cobra (opcional)..."
              />
            </Campo>
          </Campos>

          {/* O check é o "esta nota tem itens?": desmarcado, a grade some e a saída é
              só o valor. Nota de serviço e adiantamento não têm o que detalhar. */}
          <Secao>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={mostrarItens}
                onChange={(e) => setMostrarItens(e.target.checked)}
              />
              Itens
            </label>
          </Secao>
          {mostrarItens && (
            <ItensEditor
              key={seed}
              linhas={linhas}
              onChange={setLinhas}
              insumos={insumos}
              fornecedores={fornecedores}
              historico={historico}
              vinculos={vinculos}
              fornecedorPadrao={fornecedorId}
              onCriarInsumo={onCriarInsumo}
              onCriarFornecedor={onCriarFornecedor}
              onPrecoNovo={onPrecoNovo}
            />
          )}
          <Secao>Lançamento</Secao>
        </>
      )}

      <Campos lbl={90} cols={2}>
        <Campo label="Valor" req>
          <MoneyInput
            autoFocus={tipo === 'entrada'}
            value={valorFinal}
            onChange={setValor}
            readOnly={itensMandam}
            className={itensMandam ? 'bg-[#f4f4f4] text-[#888]' : ''}
            title={itensMandam ? 'Soma dos itens' : undefined}
          />
        </Campo>
        <Campo label="Data" req>
          <input type="date" className="op-input" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
        <Campo label="Fase" req largo>
          <Combobox
            value={faseId}
            onChange={trocarFase}
            options={fases.map((f) => ({
              id: f.id, label: `${f.codigo} - ${f.nome}${f.concluida_em ? ' (concluída)' : ''}`,
            }))}
            placeholder="Escolha a fase..."
          />
        </Campo>
        {/* Só saída, e só quando a fase tem serviço na estimativa: é onde o estimado
            foi dado, e é o que deixa o estimado × realizado descer da fase (§6). */}
        {tipo === 'saida' && opcoesServico.length > 0 && (
          <Campo label="Serviço" largo>
            <Combobox
              value={servicoId}
              onChange={setServicoId}
              options={opcoesServico}
              placeholder="Fase inteira (opcional)..."
            />
          </Campo>
        )}
        <Campo label="Descrição" largo>
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Campo>
        <Campo label="Anexo" largo>
          <FileDrop
            nome={anexoNome}
            href={anexo ? `/api/anexo/${anexo}` : null}
            uploading={enviando}
            onPick={pegarAnexo}
            onRemove={() => { setAnexo(null); setAnexoNome(null) }}
          />
        </Campo>
      </Campos>

      {concluidaEm && (
        <p className="mt-3 flex items-center gap-1.5 text-[#9c6510]">
          Esta fase foi concluída em {formatData(concluidaEm)}. Dá pra lançar assim mesmo.
        </p>
      )}
      {estouro && (
        <p className="mt-3 flex items-center gap-1.5 text-perigo">
          Esta saída passa do previsto da fase. Dá pra salvar assim mesmo.
        </p>
      )}

      {/* Pagamento é o último bloco: quando pagar só interessa depois de saber o que
          se comprou e quanto deu. Baixar e estornar é marcar e desmarcar este check -
          não há tela de contas a pagar pra ir até lá. */}
      {tipo === 'saida' && (
        <>
          <Secao>Pagamento</Secao>
          <Campos lbl={90} cols={2}>
            <Campo label="Vencimento">
              <input
                type="date"
                className="op-input"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                title="Vencimento da saída"
              />
            </Campo>

            {/* O check tem a linha dele: é a pergunta ("já pagou?"), e data e observação
                embaixo são a resposta - só aparecem quando a resposta é sim. Sem texto ao
                lado: o rótulo já diz Pago e o estado está no título do modal. */}
            <Campo label="Pago" largo>
              <div className="pt-1.5">
                <Check checked={!!pagoEm} onChange={(v) => setPagoEm(v ? hoje() : null)} />
              </div>
            </Campo>

            {pagoEm && (
              <>
                {/* Hoje por padrão, mas nota velha se paga com a data dela. */}
                <Campo label="Data do pgto.">
                  <input
                    type="date"
                    className="op-input"
                    value={pagoEm}
                    onChange={(e) => setPagoEm(e.target.value || hoje())}
                  />
                </Campo>
                <Campo label="Observação">
                  <Input
                    value={pagoObs}
                    onChange={(e) => setPagoObs(e.target.value)}
                    placeholder="pix, cheque 4412..."
                  />
                </Campo>
              </>
            )}
          </Campos>
        </>
      )}

      <Confirm
        open={pedindoExcluir}
        title="Excluir este lançamento?"
        message="Não dá pra desfazer."
        onCancel={() => setPedindoExcluir(false)}
        onConfirm={async () => { await onExcluir(mov); setPedindoExcluir(false); onFechar() }}
      />
    </Registro>
  )
}

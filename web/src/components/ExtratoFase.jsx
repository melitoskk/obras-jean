import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import Grid from '../ui/Grid'
import Botao from '../ui/Botao'
import Badge from '../ui/Badge'
import MovimentacaoPanel from './MovimentacaoPanel'
import {
  criarEntrada, patchEntrada, excluirEntrada,
  criarSaida, patchSaida, excluirSaida, criarFornecedor, criarInsumo, patchInsumo,
  salvarVinculos, uploadAnexo,
} from '../lib/api'
import { formatMoeda, formatData, vencimentoTxt } from '../lib/format'
import { usePode } from '../lib/sessao'

// Entradas e saídas de UMA fase na mesma lista, mais o botão que abre o lançamento.
// Vive aqui porque duas telas mostram exatamente isto: Previsto × Realizado (dentro
// do Orçamento) e Fluxo de caixa. `dados` é o payload de /realizado ou /fluxo - o
// mesmo dos dois lados, que é o que permite um componente só.
export default function ExtratoFase({
  dados, setDados, recarregar, fases, ativa, previstoDaFase, realizadoDaFase, onFaixa,
}) {
  const [lancando, setLancando] = useState(null) // {} = novo, objeto = editar
  // Registrar, editar e excluir é de `lancar` (19/10/2026); sem ela o extrato só se lê.
  const lanca = usePode()('lancar')

  // Ordem de LANÇAMENTO, do último pro primeiro. Por `criado_em` e não por `data`
  // (que é a data da nota, igual na rajada inteira) nem por `id` - entrada e saída
  // têm contadores separados, e comparar um com o outro embaralhava a lista.
  // `?? data` cobre o que foi lançado antes de a coluna existir.
  const quando = (l) => l.criado_em ?? l.data
  const lancamentos = [
    ...dados.entradas.filter((e) => e.fase_id === ativa?.id).map((e) => ({ ...e, tipo: 'entrada' })),
    ...dados.saidas.filter((s) => s.fase_id === ativa?.id).map((s) => ({ ...s, tipo: 'saida' })),
  ].sort((a, b) => quando(b).localeCompare(quando(a)) || b.id - a.id)

  // A descrição da linha se monta: quem cobrou → o que veio → o que a pessoa escreveu.
  // O campo livre continua livre justamente porque diz o que nenhum item diz (nº da
  // nota, frete, adiantamento) - só que agora ele é o complemento, não a linha inteira.
  const nomeFornecedor = (id) => dados.fornecedores.find((f) => f.id === id)?.nome
  // O serviço abre a linha quando existe: é o "onde" do dinheiro, antes do "quem".
  const nomeServico = (l) => {
    if (!l.servico_catalogo_id) return undefined
    const s = dados.servicos.find((x) => x.fase_id === l.fase_id && x.id === l.servico_catalogo_id)
    return s ? `${ativa?.codigo}.${s.codigo} ${s.nome}` : l.servico_nome
  }
  function resumo(l) {
    if (l.tipo === 'entrada') return l.descricao || ''
    const dasLinhas = [...new Set(l.itens?.map((i) => i.fornecedorId).filter(Boolean))]
    const forn = nomeFornecedor(l.fornecedor_id)
      ?? (dasLinhas.length === 1 ? nomeFornecedor(dasLinhas[0]) : undefined)
    const itens = l.itens?.map((i) => i.descricao).filter(Boolean).join(', ')
    return [nomeServico(l), forn, itens, l.descricao].filter(Boolean).join(' · ')
  }

  async function salvar(m) {
    const { tipo, id, ...corpo } = m
    if (tipo === 'entrada') {
      await (id ? patchEntrada(id, corpo) : criarEntrada(dados.obra_id, corpo))
    } else {
      await (id ? patchSaida(id, corpo) : criarSaida(corpo))
    }
    await recarregar()
    onFaixa?.({ tipo: 'sucesso', texto: 'Operação executada com sucesso.' })
  }

  async function excluir(m) {
    await (m.tipo === 'entrada' ? excluirEntrada(m.id) : excluirSaida(m.id))
    await recarregar()
  }

  return (
    <>
      <Grid
        className="flex-1"
        linhas={lancamentos}
        chave={(l) => `${l.tipo}${l.id}`}
        vazio="Nenhum lançamento nesta fase."
        onLinha={lanca ? setLancando : undefined}
        colunas={[
          {
            chave: 'numero', titulo: 'Nº', largura: 82,
            render: (l) => <span className="tabular-nums">{l.numero}</span>,
          },
          { chave: 'data', titulo: 'Data', largura: 84, render: (l) => formatData(l.data) },
          {
            chave: 'tipo', titulo: 'Tipo', largura: 76,
            render: (l) => (l.tipo === 'entrada' ? <Badge cor="sucesso">Entrada</Badge> : <Badge cor="perigo">Saída</Badge>),
          },
          { chave: 'descricao', titulo: 'Descrição', nowrap: false, render: resumo },
          {
            chave: 'valor', titulo: 'Valor (R$)', largura: 108, align: 'right',
            render: (l) => (
              <span className={l.tipo === 'entrada' ? 'text-sucesso' : ''}>
                {l.tipo === 'entrada' ? '+' : '−'} {formatMoeda(l.valor)}
              </span>
            ),
          },
          {
            // Só saída tem situação: entrada é dinheiro que já entrou, não se "baixa".
            chave: 'situacao', titulo: 'Situação', largura: 96,
            render: (l) => (
              l.tipo === 'entrada' ? null
                : l.pago_em ? <Badge cor="sucesso">Paga</Badge>
                // Vencida em vermelho, com há quantos dias (rodada 2, A28).
                : ((v) => <Badge cor={v.vencida ? 'perigo' : 'aviso'}>{v.texto}</Badge>)(vencimentoTxt(l.vencimento))
            ),
          },
          {
            // Um botão só: a linha abre o lançamento, e é lá dentro que se paga e se
            // estorna. Não há atalho de baixa aqui porque não há segunda tela pra evitar.
            chave: 'acoes', titulo: '', largura: 34, align: 'center',
            render: () => <Pencil size={13} className="text-titulo" />,
          },
        ]}
      />
      {lanca && (
        <div className="flex shrink-0 justify-end pt-2">
          <Botao variante="acento" icone={Plus} onClick={() => setLancando({})} disabled={!fases.length}>
            Registrar lançamento
          </Botao>
        </div>
      )}

      {lancando && (
        <MovimentacaoPanel
          mov={lancando.id ? lancando : null}
          faseInicial={ativa?.id}
          fases={fases}
          servicos={dados.servicos}
          insumos={dados.insumos}
          fornecedores={dados.fornecedores}
          historico={dados.historico}
          vinculos={dados.vinculos}
          previstoDaFase={previstoDaFase}
          realizadoDaFase={realizadoDaFase}
          onUpload={uploadAnexo}
          onCriarInsumo={async (nome) => {
            const novo = await criarInsumo(nome)
            setDados((d) => ({ ...d, insumos: [...d.insumos, novo] }))
            return novo.id
          }}
          onCriarFornecedor={async (nome) => {
            const novo = await criarFornecedor(nome)
            setDados((d) => ({ ...d, fornecedores: [...d.fornecedores, novo] }))
            return novo.id
          }}
          onPrecoNovo={async (itemId, fornecedorId, preco) => {
            // Com fornecedor o preço é do PAR (o vínculo da aba Itens dele); sem
            // fornecedor é o preço base do catálogo. O PUT de vínculos troca o
            // conjunto inteiro do fornecedor, então vai junto o que já existia.
            if (fornecedorId) {
              const meus = dados.vinculos.filter((v) => v.fornecedorId === fornecedorId)
              const outros = meus.filter((v) => v.itemId !== itemId)
              await salvarVinculos('fornecedores', fornecedorId, [
                ...outros.map((v) => ({ id: v.itemId, preco: v.preco ?? 0 })),
                { id: itemId, preco },
              ])
              setDados((d) => ({
                ...d,
                vinculos: [
                  ...d.vinculos.filter((v) => !(v.fornecedorId === fornecedorId && v.itemId === itemId)),
                  { itemId, fornecedorId, preco },
                ],
              }))
            } else {
              await patchInsumo(itemId, { preco_base: preco })
              setDados((d) => ({
                ...d,
                insumos: d.insumos.map((i) => (i.id === itemId ? { ...i, preco_base: preco } : i)),
              }))
            }
          }}
          onSalvar={salvar}
          onExcluir={excluir}
          onFechar={() => setLancando(null)}
        />
      )}
    </>
  )
}

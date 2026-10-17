import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Package, Search, Plus, Pencil } from 'lucide-react'
import ItemPanel, { TIPOS } from '../components/ItemPanel'
import PainelModulo from '../ui/PainelModulo'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import { Campos, Campo, Secao, Input, Select, Radios } from '../ui/Form'
import { getInsumos } from '../lib/api'
import { norm, formatData, formatMoeda } from '../lib/format'

// Módulo de Itens (21/08/2026) - a mesma forma da lista de Fornecedores, com menos
// campos. É a tabela `insumo`: o item da linha da saída e o insumo da composição do
// orçamento são a MESMA entidade, e agora ela tem onde ser vista inteira.
// ponytail: filtro client-side, como as outras listas. Vira query no servidor quando
// o catálogo demorar a chegar.
const VAZIO = { nome: '', tipo: '', condicao: 'todos' }

export default function Itens() {
  const [itens, setItens] = useState([])
  const [f, setF] = useState(VAZIO)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }))

  const { id } = useParams()
  const navegar = useNavigate()
  // `/itens/novo?voltar=<de onde veio>` - o `+` do cadastro do outro lado manda pra
  // ca e espera voltar. Fechar volta de maos vazias; salvar volta com `?item=<id>`.
  const voltar = new URLSearchParams(useLocation().search).get('voltar')
  const fechar = () => navegar(voltar || '/itens')
  const editando = id === 'novo' ? {} : itens.find((i) => String(i.id) === id)

  const carregar = useCallback(
    () => getInsumos().then(setItens).catch(() => setItens([])),
    [],
  )
  useEffect(() => { carregar() }, [carregar])

  const linhas = useMemo(
    () =>
      itens.filter(
        (i) =>
          norm(i.nome).includes(norm(f.nome)) &&
          (!f.tipo || i.tipo_custo === f.tipo) &&
          (f.condicao === 'incompletos' ? !!i.incompleto
            : f.condicao === 'sem_fornecedor' ? !i.fornecedores
            : true),
      ),
    [itens, f],
  )

  const incompletos = itens.filter((i) => i.incompleto).length

  return (
    <>
      <PainelModulo titulo="Itens" icone={Package} ajuda="A lista filtra enquanto você digita">
        <div className="p-2.5">
          <Secao>Faça sua pesquisa aqui</Secao>
          <Campos lbl={62}>
            <Campo label="Nome"><Input value={f.nome} onChange={set('nome')} /></Campo>
            <Campo label="Tipo">
              <Select
                value={f.tipo}
                onChange={set('tipo')}
                vazio="Todos"
                opcoes={Object.entries(TIPOS).map(([valor, label]) => ({ valor, label }))}
              />
            </Campo>
            <Campo label="Condição">
              <Radios
                name="cond"
                value={f.condicao}
                onChange={set('condicao')}
                opcoes={[
                  { valor: 'todos', label: 'Todos' },
                  { valor: 'incompletos', label: 'Incompletos' },
                  // O item que ninguém fornece é o que trava o lançamento na hora
                  // errada: some do combobox de fornecedor sem explicar por quê.
                  { valor: 'sem_fornecedor', label: 'Sem fornecedor' },
                ]}
              />
            </Campo>
          </Campos>
          <div className="mt-3 flex justify-end gap-1.5">
            <Botao onClick={() => setF(VAZIO)}>Limpar</Botao>
            <Botao variante="acento" icone={Search}>Pesquisar</Botao>
          </div>
          {/* A fila de pendências: persistente, não um toast que some. */}
          {incompletos > 0 && (
            <button
              type="button"
              onClick={() => setF({ ...VAZIO, condicao: 'incompletos' })}
              className="mt-4 w-full rounded-[2px] border border-[#f3ddb3] bg-[#fdf1dc] px-2 py-1.5 text-left text-[#9c6510]"
            >
              {incompletos} cadastro(s) incompleto(s) - completar
            </button>
          )}
        </div>
      </PainelModulo>

      <Tela titulo="Itens">
        <div className="pb-2 md:hidden">
          <Input placeholder="Pesquisar por nome..." value={f.nome} onChange={set('nome')} />
        </div>

        <Grid
          className="flex-1"
          porPagina={17}
          linhas={linhas}
          vazio="Nenhum item encontrado."
          colunas={[
            {
              chave: 'nome', titulo: 'Nome', nowrap: false,
              render: (i) => (
                <span className="flex items-center gap-1.5">
                  {i.nome}
                  {!!i.incompleto && <Badge cor="aviso">incompleto</Badge>}
                </span>
              ),
            },
            { chave: 'unidade', titulo: 'Unidade', largura: 90 },
            { chave: 'tipo_custo', titulo: 'Tipo', largura: 110, render: (i) => TIPOS[i.tipo_custo] },
            {
              chave: 'preco_base', titulo: 'Preço base', largura: 100, align: 'right',
              render: (i) => (i.preco_base ? formatMoeda(i.preco_base) : '-'),
            },
            // Duas colunas, duas relações: quem DECLAROU que fornece, e o que já foi
            // comprado de fato.
            { chave: 'fornecedores', titulo: 'Fornec.', largura: 64, align: 'right' },
            { chave: 'compras', titulo: 'Compras', largura: 64, align: 'right' },
            { chave: 'ultima', titulo: 'Última', largura: 84, render: (i) => formatData(i.ultima) || '-' },
            // Sem lixeira: item tem composição e linha de saída penduradas.
            {
              chave: 'acoes', titulo: 'Ações', largura: 44, align: 'center',
              render: (i) => (
                <button className="text-titulo" title="Editar" onClick={() => navegar(`/itens/${i.id}`)}>
                  <Pencil size={13} />
                </button>
              ),
            },
          ]}
          onLinha={(i) => navegar(`/itens/${i.id}`)}
        />

        <BarraAcao esquerda={<span className="text-[#777]">{linhas.length} de {itens.length} item(ns)</span>}>
          <Botao variante="acento" icone={Plus} onClick={() => navegar('/itens/novo')}>Novo</Botao>
        </BarraAcao>
      </Tela>

      {editando && (
        <ItemPanel
          key={editando.id ?? 'novo'}
          item={editando.id ? editando : null}
          onFechar={fechar}
          onSalvo={(novoId) => {
            carregar()
            if (voltar) navegar(`${voltar}?item=${novoId}`)
            else fechar()
          }}
        />
      )}
    </>
  )
}

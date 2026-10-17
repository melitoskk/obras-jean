import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Truck, Search, Plus, Pencil } from 'lucide-react'
import FornecedorPanel from '../components/FornecedorPanel'
import CelulaTelefone from '../components/CelulaTelefone'
import { CelulaCopiavel } from '../components/BotaoCopiar'
import PainelModulo from '../ui/PainelModulo'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import { Campos, Campo, Secao, Input, Radios } from '../ui/Form'
import { getFornecedores } from '../lib/api'
import { norm, formatMoeda, formatData } from '../lib/format'

// Módulo de Fornecedores (PROJETO-v3 §7.1) - a mesma forma da lista de Clientes.
// ponytail: filtro client-side, como as outras duas listas. Vira query no servidor
// quando demorar a chegar.
//
// A condição `incompletos` é o que faz esta tela valer: até agora, todo fornecedor
// criado pelo `+ Criar "x"` de dentro de um lançamento nascia marcado e não tinha
// onde ser completado.
const VAZIO = { nome: '', doc: '', tipo: 'todos', condicao: 'ativo' }

// Os dois checks do cadastro (UPDATE.md §10.1). Quem tem os dois aparece nos dois filtros.
const TIPOS = { material: 'fornece_material', servico: 'presta_servico' }
const rotuloTipo = (c) =>
  [c.fornece_material && 'Material', c.presta_servico && 'Serviço'].filter(Boolean).join(' + ')

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([])
  const [f, setF] = useState(VAZIO)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }))

  const { id } = useParams()
  const navegar = useNavigate()
  // `/fornecedores/novo?voltar=<de onde veio>` - o `+` do cadastro do outro lado manda pra
  // ca e espera voltar. Fechar volta de maos vazias; salvar volta com `?fornecedor=<id>`.
  const voltar = new URLSearchParams(useLocation().search).get('voltar')
  const fechar = () => navegar(voltar || '/fornecedores')
  const editando = id === 'novo' ? {} : fornecedores.find((c) => String(c.id) === id)

  const carregar = useCallback(
    () => getFornecedores().then(setFornecedores).catch(() => setFornecedores([])),
    [],
  )
  useEffect(() => { carregar() }, [carregar])

  const linhas = useMemo(
    () =>
      fornecedores.filter(
        (c) =>
          norm(c.nome).includes(norm(f.nome)) &&
          (c.cnpj ?? '').includes(f.doc) &&
          (f.tipo === 'todos' || !!c[TIPOS[f.tipo]]) &&
          (f.condicao === 'ambos' ? true
            : f.condicao === 'incompletos' ? !!c.incompleto
            : !!c.ativo === (f.condicao === 'ativo')),
      ),
    [fornecedores, f],
  )

  const incompletos = fornecedores.filter((c) => c.incompleto).length

  const filtros = (
    <>
      <Campo label="Nome"><Input value={f.nome} onChange={set('nome')} /></Campo>
      <Campo label="CNPJ"><Input value={f.doc} onChange={set('doc')} /></Campo>
      <Campo label="Tipo">
        <Radios
          name="tipo"
          value={f.tipo}
          onChange={set('tipo')}
          opcoes={[
            { valor: 'todos', label: 'Todos' },
            { valor: 'material', label: 'Fornece material' },
            { valor: 'servico', label: 'Presta serviço' },
          ]}
        />
      </Campo>
      <Campo label="Condição">
        <Radios
          name="cond"
          value={f.condicao}
          onChange={set('condicao')}
          opcoes={[
            { valor: 'ativo', label: 'Ativo' },
            { valor: 'inativo', label: 'Inativo' },
            { valor: 'incompletos', label: 'Incompletos' },
            { valor: 'ambos', label: 'Todos' },
          ]}
        />
      </Campo>
    </>
  )

  return (
    <>
      <PainelModulo titulo="Fornecedores" icone={Truck} ajuda="A lista filtra enquanto você digita">
        <div className="p-2.5">
          <Secao>Faça sua pesquisa aqui</Secao>
          <Campos lbl={62}>{filtros}</Campos>
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

      <Tela titulo="Fornecedores">
        <div className="pb-2 md:hidden">
          <Input placeholder="Pesquisar por nome..." value={f.nome} onChange={set('nome')} />
        </div>

        <Grid
          className="flex-1"
          porPagina={17}
          linhas={linhas}
          vazio="Nenhum fornecedor encontrado."
          colunas={[
            {
              chave: 'nome', titulo: 'Nome', nowrap: false,
              render: (c) => (
                <span className="flex items-center gap-1.5">
                  {c.nome}
                  {!!c.incompleto && <Badge cor="aviso">incompleto</Badge>}
                </span>
              ),
            },
            {
              chave: 'cnpj', titulo: 'CNPJ', largura: 160,
              render: (f) => <CelulaCopiavel texto={f.cnpj} title="Copiar CNPJ" />,
            },
            { chave: 'tipo', titulo: 'Tipo', largura: 120, render: (c) => rotuloTipo(c) || '-' },
            { chave: 'cidade', titulo: 'Cidade/UF', largura: 140, render: (c) => [c.cidade, c.uf].filter(Boolean).join('/') },
            { chave: 'celular', titulo: 'Celular', largura: 150, render: (c) => <CelulaTelefone registro={c} /> },
            // As três colunas que só existem porque a relação emerge do histórico.
            { chave: 'compras', titulo: 'Compras', largura: 64, align: 'right' },
            { chave: 'total', titulo: 'Total (R$)', largura: 110, align: 'right', render: (c) => formatMoeda(c.total) },
            { chave: 'ultima', titulo: 'Última', largura: 84, render: (c) => formatData(c.ultima) || '-' },
            // Sem lixeira: fornecedor tem saída pendurada. Aposenta pelo botão Ativo.
            {
              chave: 'acoes', titulo: 'Ações', largura: 44, align: 'center',
              render: (c) => (
                <button className="text-titulo" title="Editar" onClick={() => navegar(`/fornecedores/${c.id}`)}>
                  <Pencil size={13} />
                </button>
              ),
            },
          ]}
          onLinha={(c) => navegar(`/fornecedores/${c.id}`)}
        />

        <BarraAcao esquerda={<span className="text-[#777]">{linhas.length} de {fornecedores.length} fornecedor(es)</span>}>
          <Botao variante="acento" icone={Plus} onClick={() => navegar('/fornecedores/novo')}>Novo</Botao>
        </BarraAcao>
      </Tela>

      {editando && (
        <FornecedorPanel
          key={editando.id ?? 'novo'}
          fornecedor={editando.id ? editando : null}
          onFechar={fechar}
          onSalvo={(novoId) => {
            carregar()
            if (voltar) navegar(`${voltar}?fornecedor=${novoId}`)
            else fechar()
          }}
        />
      )}
    </>
  )
}

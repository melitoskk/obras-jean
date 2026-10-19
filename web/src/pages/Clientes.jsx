import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Users, Search, Plus, Pencil, Download } from 'lucide-react'
import ClientePanel from '../components/ClientePanel'
import { UFS } from '../components/AbaEndereco'
import CelulaTelefone from '../components/CelulaTelefone'
import { CelulaCopiavel } from '../components/BotaoCopiar'
import PainelModulo from '../ui/PainelModulo'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import { Campos, Campo, Secao, Input, Select, Radios } from '../ui/Form'
import { getClientes } from '../lib/api'
import { norm, casaBusca } from '../lib/format'

// Módulo de Clientes, no molde de Obra-Prima-Tutorial-min.png: painel de pesquisa à
// esquerda, grid de resultados à direita.
// ponytail: filtro é client-side. É rede interna com centenas de clientes, não
// milhares; vira query no servidor quando a lista demorar pra chegar.
const VAZIO = { nome: '', doc: '', uf: '', cidade: '', tipo: 'todos', condicao: 'ativo' }

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [f, setF] = useState(VAZIO)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }))

  // A rota manda no painel: /clientes/novo cria, /clientes/12 edita, /clientes fecha.
  const { id } = useParams()
  const navegar = useNavigate()
  // `/clientes/novo?voltar=/obras/nova` - o `+` do campo Cliente da obra manda pra cá
  // e espera voltar. Fechar volta de mãos vazias; salvar volta com `?cliente=<id>`.
  const voltar = new URLSearchParams(useLocation().search).get('voltar')
  const fechar = () => navegar(voltar || '/clientes')
  const editando = id === 'novo' ? {} : clientes.find((c) => String(c.id) === id)

  const carregar = useCallback(() => getClientes().then(setClientes).catch(() => setClientes([])), [])
  useEffect(() => { carregar() }, [carregar])

  const linhas = useMemo(
    () =>
      clientes.filter(
        (c) =>
          casaBusca(c.nome, f.nome) &&
          (c.cpf_cnpj ?? '').includes(f.doc) &&
          norm(c.cidade).includes(norm(f.cidade)) &&
          (!f.uf || c.uf === f.uf) &&
          (f.tipo === 'todos' || c.tipo === f.tipo) &&
          (f.condicao === 'ambos' || !!c.ativo === (f.condicao === 'ativo')),
      ),
    [clientes, f],
  )

  const filtros = (
    <>
      <Campo label="Tipo">
        <Radios
          name="tipo"
          value={f.tipo}
          onChange={set('tipo')}
          opcoes={[{ valor: 'fisica', label: 'F. Física' }, { valor: 'juridica', label: 'F. Jurídica' }, { valor: 'todos', label: 'Todos' }]}
        />
      </Campo>
      <Campo label="Nome"><Input value={f.nome} onChange={set('nome')} /></Campo>
      <Campo label="CPF/CNPJ"><Input value={f.doc} onChange={set('doc')} /></Campo>
      <Campo label="Estado">
        <Select value={f.uf} onChange={set('uf')} opcoes={UFS.map((u) => ({ valor: u, label: u }))} />
      </Campo>
      <Campo label="Cidade"><Input value={f.cidade} onChange={set('cidade')} /></Campo>
      <Campo label="Condição">
        <Radios
          name="cond"
          value={f.condicao}
          onChange={set('condicao')}
          opcoes={[{ valor: 'ativo', label: 'Ativo' }, { valor: 'inativo', label: 'Inativo' }, { valor: 'ambos', label: 'Ambos' }]}
        />
      </Campo>
    </>
  )

  return (
    <>
      <PainelModulo titulo="Clientes" icone={Users} ajuda="A lista filtra enquanto você digita">
        <div className="p-2.5">
          <Secao>Faça sua pesquisa aqui</Secao>
          <Campos lbl={62}>{filtros}</Campos>
          <div className="mt-3 flex justify-end gap-1.5">
            <Botao onClick={() => setF(VAZIO)}>Limpar</Botao>
            <Botao variante="acento" icone={Search}>Pesquisar</Botao>
          </div>
        </div>
      </PainelModulo>

      <Tela titulo="Clientes">
        {/* O painel de pesquisa some abaixo de md:; sem isto o celular fica sem filtro. */}
        <div className="pb-2 md:hidden">
          <Input placeholder="Pesquisar por nome..." value={f.nome} onChange={set('nome')} />
        </div>

        <Grid
          className="flex-1"
          porPagina={17}
          linhas={linhas}
          vazio="Nenhum cliente encontrado."
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
              chave: 'cpf_cnpj', titulo: 'CPF/CNPJ', largura: 150,
              render: (c) => <CelulaCopiavel texto={c.cpf_cnpj} title="Copiar CPF/CNPJ" />,
            },
            { chave: 'cidade', titulo: 'Cidade/UF', largura: 150, render: (c) => [c.cidade, c.uf].filter(Boolean).join('/') },
            { chave: 'celular', titulo: 'Celular', largura: 150, render: (c) => <CelulaTelefone registro={c} /> },
            {
              chave: 'email', titulo: 'E-mail', largura: 200,
              render: (c) => <CelulaCopiavel texto={c.email} title="Copiar e-mail" />,
            },
            { chave: 'obras', titulo: 'Obras', largura: 58, align: 'right' },
            // Sem lixeira: cliente não se apaga (tem obra pendurada). Aposenta-se pelo
            // botão Ativo do cadastro, e o filtro Condição já sabe escondê-lo.
            {
              chave: 'acoes', titulo: 'Ações', largura: 44, align: 'center',
              render: (c) => (
                <button className="text-titulo" title="Editar" onClick={() => navegar(`/clientes/${c.id}`)}>
                  <Pencil size={13} />
                </button>
              ),
            },
          ]}
          onLinha={(c) => navegar(`/clientes/${c.id}`)}
        />

        {/* Na referência as ações do módulo ficam ABAIXO do grid, não no cabeçalho. */}
        <BarraAcao esquerda={<span className="text-[#777]">{linhas.length} de {clientes.length} cliente(s)</span>}>
          <Botao icone={Download}>Exportar</Botao>
          <Botao variante="acento" icone={Plus} onClick={() => navegar('/clientes/novo')}>Novo</Botao>
        </BarraAcao>
      </Tela>

      {editando && (
        <ClientePanel
          // key: trocar de cliente com o painel aberto precisa remontar o estado local,
          // senão o formulário fica com os dados do anterior.
          key={editando.id ?? 'novo'}
          cliente={editando.id ? editando : null}
          onFechar={fechar}
          onSalvo={(novoId) => {
            carregar()
            if (voltar) navegar(`${voltar}?cliente=${novoId}`)
            else fechar()
          }}
        />
      )}
    </>
  )
}

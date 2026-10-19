import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import UsuarioPanel from '../components/UsuarioPanel'
import PerfilPanel from '../components/PerfilPanel'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import { Check } from '../ui/Form'
import { getUsuarios, getObras, getPerfis } from '../lib/api'

// Usuários e perfis (UPDATE.md §5) - só quem tem a permissão `usuarios` chega aqui. Sem
// painel de pesquisa: são poucas pessoas, a lista inteira cabe na tela.
// Mesma regra de rota de Clientes: /usuarios/novo cria, /usuarios/3 edita. A aba Perfis
// fica na query (?aba=perfis) e o perfil aberto também (&perfil=2 / novo).
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [obras, setObras] = useState([])
  const [{ catalogo, perfis }, setPerfis] = useState({ catalogo: [], perfis: [] })
  const [inativos, setInativos] = useState(false)
  const { id } = useParams()
  const [busca, setBusca] = useSearchParams()
  const aba = busca.get('aba') === 'perfis' ? 'perfis' : 'usuarios'
  const navegar = useNavigate()
  const fechar = () => navegar('/usuarios')
  const editando = id === 'novo' ? {} : usuarios.find((u) => String(u.id) === id)
  const perfilAberto = busca.get('perfil')
  const editandoPerfil = perfilAberto === 'novo' ? {} : perfis.find((p) => String(p.id) === perfilAberto)
  const irPerfis = (perfil) => setBusca(perfil ? { aba: 'perfis', perfil } : { aba: 'perfis' })

  const carregar = useCallback(() => {
    getUsuarios().then(setUsuarios).catch(() => setUsuarios([]))
    getPerfis().then(setPerfis).catch(() => {})
  }, [])
  useEffect(() => { carregar() }, [carregar])
  // As obras são as opções de atribuição de quem não tem "Todas as obras".
  useEffect(() => { getObras().then(setObras).catch(() => {}) }, [])

  const nomeObra = useMemo(() => Object.fromEntries(obras.map((o) => [o.id, o.nome])), [obras])
  const nomePerfil = useMemo(() => Object.fromEntries(perfis.map((p) => [p.id, p.nome])), [perfis])
  const rotulo = useMemo(() => Object.fromEntries(catalogo.map((p) => [p.id, p.rotulo])), [catalogo])
  const linhas = usuarios.filter((u) => inativos || u.ativo)

  const abas = (
    <div className="flex gap-1 pb-2">
      {[['usuarios', 'Usuários'], ['perfis', 'Perfis']].map(([a, label]) => (
        <button
          key={a}
          onClick={() => (a === 'perfis' ? irPerfis() : navegar('/usuarios'))}
          className={`border px-3 py-1 ${aba === a ? 'border-acento bg-[#eaf3fa] text-titulo' : 'border-grade-linha hover:bg-[#f7f7f7]'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <>
      <Tela titulo="Usuários">
        {abas}
        {aba === 'usuarios' ? (
          <>
            <div className="pb-2">
              <Check checked={inativos} onChange={setInativos}>Mostrar inativos</Check>
            </div>
            <Grid
              className="flex-1"
              linhas={linhas}
              vazio="Nenhum usuário."
              colunas={[
                {
                  chave: 'nome', titulo: 'Usuário', nowrap: false,
                  render: (u) => (
                    <span className="flex items-center gap-1.5">
                      {u.nome}
                      {!u.ativo && <Badge>inativo</Badge>}
                    </span>
                  ),
                },
                {
                  chave: 'perfil', titulo: 'Perfil', largura: 150,
                  render: (u) => (u.permissoes ? <span>{nomePerfil[u.perfil_id]} <Badge>personalizado</Badge></span> : nomePerfil[u.perfil_id] ?? '-'),
                },
                {
                  // Só quem não tem "Todas as obras" tem recorte por obra.
                  chave: 'obras', titulo: 'Obras', nowrap: false,
                  render: (u) => !u.efetivas.includes('todas_obras')
                    ? (u.obras.length
                        ? u.obras.map((o) => nomeObra[o] ?? `#${o}`).join(', ')
                        : <span className="text-perigo">nenhuma - não vê obra alguma</span>)
                    : <span className="text-[#999]">todas</span>,
                },
                {
                  chave: 'acoes', titulo: 'Ações', largura: 44, align: 'center',
                  render: (u) => (
                    <button className="text-titulo" title="Editar" onClick={() => navegar(`/usuarios/${u.id}`)}>
                      <Pencil size={13} />
                    </button>
                  ),
                },
              ]}
              onLinha={(u) => navegar(`/usuarios/${u.id}`)}
            />
            <BarraAcao esquerda={<span className="text-[#777]">{linhas.length} de {usuarios.length} usuário(s)</span>}>
              <Botao variante="acento" icone={Plus} onClick={() => navegar('/usuarios/novo')}>Novo</Botao>
            </BarraAcao>
          </>
        ) : (
          <>
            <Grid
              className="flex-1"
              linhas={perfis}
              vazio="Nenhum perfil."
              colunas={[
                { chave: 'nome', titulo: 'Perfil', largura: 160 },
                {
                  chave: 'permissoes', titulo: 'Permissões', nowrap: false,
                  render: (p) => (p.permissoes.length === catalogo.length && catalogo.length
                    ? <span className="text-[#777]">todas</span>
                    : p.permissoes.map((x) => rotulo[x] ?? x).join(', ') || <span className="text-perigo">nenhuma</span>),
                },
                { chave: 'usuarios', titulo: 'Usuários', largura: 80, align: 'right' },
              ]}
              onLinha={(p) => irPerfis(String(p.id))}
            />
            <BarraAcao esquerda={<span className="text-[#777]">{perfis.length} perfil(is)</span>}>
              <Botao variante="acento" icone={Plus} onClick={() => irPerfis('novo')}>Novo perfil</Botao>
            </BarraAcao>
          </>
        )}
      </Tela>

      {aba === 'usuarios' && editando && perfis.length > 0 && (
        <UsuarioPanel
          key={editando.id ?? 'novo'}
          usuario={editando.id ? editando : null}
          obras={obras}
          perfis={perfis}
          catalogo={catalogo}
          onFechar={fechar}
          onSalvo={() => { carregar(); fechar() }}
        />
      )}
      {aba === 'perfis' && editandoPerfil && (
        <PerfilPanel
          key={editandoPerfil.id ?? 'novo'}
          perfil={editandoPerfil.id ? editandoPerfil : null}
          catalogo={catalogo}
          onFechar={() => irPerfis()}
          onSalvo={() => { carregar(); irPerfis() }}
        />
      )}
    </>
  )
}

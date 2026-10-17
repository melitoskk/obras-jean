import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import UsuarioPanel from '../components/UsuarioPanel'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import { Check } from '../ui/Form'
import { getUsuarios, getObras } from '../lib/api'
import { PAPEIS } from '../lib/sessao'

// Cadastro de usuários (UPDATE.md §5) - só o administrador chega aqui. Sem painel de
// pesquisa: são poucas pessoas, a lista inteira cabe na tela.
// Mesma regra de rota de Clientes: /usuarios/novo cria, /usuarios/3 edita.
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [obras, setObras] = useState([])
  const [inativos, setInativos] = useState(false)
  const { id } = useParams()
  const navegar = useNavigate()
  const fechar = () => navegar('/usuarios')
  const editando = id === 'novo' ? {} : usuarios.find((u) => String(u.id) === id)

  const carregar = useCallback(() => getUsuarios().then(setUsuarios).catch(() => setUsuarios([])), [])
  useEffect(() => { carregar() }, [carregar])
  // As obras são as opções de atribuição do papel Campo.
  useEffect(() => { getObras().then(setObras).catch(() => {}) }, [])

  const nomeObra = useMemo(() => Object.fromEntries(obras.map((o) => [o.id, o.nome])), [obras])
  const linhas = usuarios.filter((u) => inativos || u.ativo)

  return (
    <>
      <Tela titulo="Usuários">
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
            { chave: 'papel', titulo: 'Papel', largura: 130, render: (u) => PAPEIS[u.papel] ?? u.papel },
            {
              // Só o campo tem recorte por obra; os outros papéis veem todas.
              chave: 'obras', titulo: 'Obras', nowrap: false,
              render: (u) => u.papel === 'campo'
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
      </Tela>

      {editando && (
        <UsuarioPanel
          key={editando.id ?? 'novo'}
          usuario={editando.id ? editando : null}
          obras={obras}
          onFechar={fechar}
          onSalvo={() => { carregar(); fechar() }}
        />
      )}
    </>
  )
}

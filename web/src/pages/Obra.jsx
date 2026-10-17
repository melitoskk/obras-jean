import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ObraPanel from '../components/ObraPanel'
import Tela from '../ui/Tela'
import EmptyState from '../ui/EmptyState'
import { getObras, getClientes } from '../lib/api'
import { useSessao } from '../lib/sessao'

// A obra é uma TELA, não um modal: clicar na lista traz pra cá. O conteúdo é o
// mesmo ObraPanel de sempre - só a moldura muda (`pagina`). Criar obra continua
// em modal na lista: formulário em branco não tem `:id` pra virar rota.
export default function Obra() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [obra, setObra] = useState(undefined) // undefined = carregando, null = não achou
  const [clientes, setClientes] = useState([])
  const campo = useSessao().papel === 'campo'

  // Vem da LISTA, não de GET /api/obra/:id: a lista traz `o.*` e o detalhe devolve
  // só um recorte (sem categoria, observação, datas, endereço) - o formulário
  // abriria com metade dos campos vazios.
  const carregar = useCallback(
    () => getObras()
      .then((t) => setObra(t.find((o) => String(o.id) === id) ?? null))
      .catch(() => setObra(null)),
    [id],
  )
  useEffect(() => { carregar() }, [carregar])
  // Campo não edita o cadastro da obra - não há Combobox de cliente pra abastecer.
  useEffect(() => { if (!campo) getClientes().then(setClientes).catch(() => {}) }, [campo])

  if (obra === undefined) return <Tela titulo="Obra" />
  if (!obra) return <Tela titulo="Obra"><EmptyState titulo="Obra não encontrada." /></Tela>

  return (
    <ObraPanel
      pagina
      obra={obra}
      clientes={clientes}
      onClienteCriado={(c) => setClientes((s) => [...s, c])}
      onFechar={() => navegar('/obras')}
      onSalvo={carregar}
      onCaixaMudou={carregar}
    />
  )
}

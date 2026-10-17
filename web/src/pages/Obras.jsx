import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, Search, Plus, Pencil } from 'lucide-react'
import ObraPanel, { SITUACOES } from '../components/ObraPanel'
import PainelModulo from '../ui/PainelModulo'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Botao, { BarraAcao } from '../ui/Botao'
import Badge from '../ui/Badge'
import Barra from '../ui/Barra'
import { Campos, Campo, Secao, Input, Select } from '../ui/Form'
import { getObras, getClientes } from '../lib/api'
import { formatMoeda, norm, pct } from '../lib/format'
import { useSessao } from '../lib/sessao'

// Mesmo molde do módulo de Clientes.
const VAZIO = { nome: '', cliente: '', situacao: 'todas' }


// Uma lista só. Houve uma segunda cópia desta tela em `/fluxo`, que só trocava o
// destino do clique; morreu quando o caixa virou aba da obra - a linha já leva
// pra lá, e a coluna Caixa aqui do lado já responde "e a obra tal?".
export default function Obras() {
  const [obras, setObras] = useState([])
  const [clientes, setClientes] = useState([])
  const [f, setF] = useState(VAZIO)
  // Campo (UPDATE.md §5): a lista são as obras dele, sem coluna de dinheiro e sem
  // criar obra - a API nem manda os números.
  const campo = useSessao().papel === 'campo'
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  // A rota manda no painel - mas aqui só sobrou o de CRIAR: obra existente virou
  // tela própria (`/obra/:id`), não overlay da lista.
  // Pelo PATHNAME, não por `useParams`: a rota é a literal `/obras/nova`, sem
  // parâmetro nenhum, então `params.id` vinha sempre undefined e o painel de criar
  // não abria. Rota literal se testa como literal.
  // `/obras/nova?cliente=3` abre com o cliente preenchido - quem lê a query é o
  // próprio ObraPanel, porque `/obra/:id` precisa do mesmo atalho na volta do
  // cadastro de cliente.
  const { pathname } = useLocation()
  const criando = pathname === '/obras/nova'
  const navegar = useNavigate()
  const fechar = () => navegar('/obras')
  const abrir = (o) => navegar(`/obra/${o.id}`)

  const carregar = useCallback(() => getObras().then(setObras).catch(() => setObras([])), [])
  useEffect(() => { carregar() }, [carregar])
  // Clientes ficam carregados pro Combobox do cadastro abrir sem esperar.
  useEffect(() => { if (!campo) getClientes().then(setClientes).catch(() => {}) }, [campo])

  const linhas = useMemo(
    () =>
      obras.filter(
        (o) =>
          norm(o.nome).includes(norm(f.nome)) &&
          norm(o.cliente).includes(norm(f.cliente)) &&
          (f.situacao === 'todas' || o.status === f.situacao),
      ),
    [obras, f],
  )


  return (
    <>
      <PainelModulo titulo="Obras" icone={Building2}>
        <div className="p-2.5">
          <Secao>Faça sua pesquisa aqui</Secao>
          <Campos lbl={62}>
            <Campo label="Obra"><Input value={f.nome} onChange={set('nome')} /></Campo>
            <Campo label="Cliente"><Input value={f.cliente} onChange={set('cliente')} /></Campo>
            <Campo label="Situação">
              <Select
                value={f.situacao}
                onChange={set('situacao')}
                vazio={null}
                opcoes={[
                  ...Object.entries(SITUACOES).map(([valor, s]) => ({ valor, label: s.label })),
                  { valor: 'todas', label: 'Todas' },
                ]}
              />
            </Campo>
          </Campos>
          <div className="mt-3 flex justify-end gap-1.5">
            <Botao onClick={() => setF(VAZIO)}>Limpar</Botao>
            <Botao variante="acento" icone={Search}>Pesquisar</Botao>
          </div>
        </div>
      </PainelModulo>

      <Tela titulo="Obras">
        <div className="pb-2 md:hidden">
          <Input placeholder="Pesquisar obra..." value={f.nome} onChange={set('nome')} />
        </div>

        <Grid
          className="flex-1"
          porPagina={17}
          linhas={linhas}
          vazio="Nenhuma obra encontrada."
          colunas={[
            { chave: 'nome', titulo: 'Obra', nowrap: false },
            { chave: 'cliente', titulo: 'Cliente', largura: 180 },
            { chave: 'cidade', titulo: 'Cidade', largura: 130 },
            {
              chave: 'status', titulo: 'Situação', largura: 110,
              render: (o) => <Badge cor={SITUACOES[o.status]?.cor}>{SITUACOES[o.status]?.label ?? o.status}</Badge>,
            },
            ...(campo ? [] : [
              { chave: 'orcado', titulo: 'Estimado (R$)', largura: 105, align: 'right', render: (o) => formatMoeda(o.orcado) },
              { chave: 'gasto', titulo: 'Gasto (R$)', largura: 105, align: 'right', render: (o) => formatMoeda(o.gasto) },
              {
                chave: 'consumo', titulo: 'Consumo', largura: 110,
                // Sinaliza, não bloqueia: acima do orçado a barra fica vermelha e salva igual.
                render: (o) => {
                  const p = pct(o.gasto, o.orcado)
                  return <Barra pct={p} cor={p > 100 ? 'perigo' : p > 80 ? 'aviso' : 'sucesso'} altura={12} />
                },
              },
              {
                // A pagar = gasto − pago: o que foi lançado e ainda não teve o check Pago
                // marcado. Âmbar quando há algo em aberto, sem cor por urgência - vencimento
                // é por lançamento, não por obra.
                chave: 'aPagar', titulo: 'A pagar (R$)', largura: 105, align: 'right',
                render: (o) => <span className={o.aPagar > 0 ? 'text-laranja' : ''}>{formatMoeda(o.aPagar)}</span>,
              },
              {
                chave: 'caixa', titulo: 'Caixa (R$)', largura: 105, align: 'right',
                render: (o) => <span className={o.caixa < 0 ? 'text-perigo' : ''}>{formatMoeda(o.caixa)}</span>,
              },
            ]),
            // Sem lixeira: obra tem fases, lançamentos e arquivos pendurados. Aposenta-se
            // marcando a situação como Concluída, que o filtro já esconde.
            {
              chave: 'acoes', titulo: 'Ações', largura: 44, align: 'center',
              render: (o) => (
                <button className="text-titulo" title="Editar" onClick={() => abrir(o)}>
                  <Pencil size={13} />
                </button>
              ),
            },
          ]}
          onLinha={abrir}
        />

        <BarraAcao esquerda={<span className="text-[#777]">{linhas.length} de {obras.length} obra(s)</span>}>
          {!campo && <Botao variante="acento" icone={Plus} onClick={() => navegar('/obras/nova')}>Nova obra</Botao>}
        </BarraAcao>
      </Tela>

      {criando && !campo && (
        <ObraPanel
          obra={null}
          clientes={clientes}
          onClienteCriado={(c) => setClientes((s) => [...s, c])}
          onFechar={fechar}
          onSalvo={() => { carregar(); fechar() }}
        />
      )}
    </>
  )
}

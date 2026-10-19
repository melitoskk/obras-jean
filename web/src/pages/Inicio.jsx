import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Building2, Plus, Receipt } from 'lucide-react'
import Tela from '../ui/Tela'
import Grid from '../ui/Grid'
import Barra from '../ui/Barra'
import Botao from '../ui/Botao'
import { getObras, getClientes, getContasAPagar } from '../lib/api'
import { usePode } from '../lib/sessao'
import { formatMoeda, pct, duracaoEntre, hoje, vencimentoTxt } from '../lib/format'

// Início é atalho, não dashboard. Gráfico e painel geral estão fora do escopo
// (PROJETO-v2 §7) - aqui só as contagens que já existem, as obras que estão
// rodando e o caminho pros módulos. A lista é a mesma de /obras, sem filtro e
// sem paginação: as ativas cabem numa tela, e quem quer o resto clica no atalho.
export default function Inicio() {
  const navegar = useNavigate()
  const [obras, setObras] = useState([])
  const [clientes, setClientes] = useState([])
  const [contas, setContas] = useState([])
  // Clientes e Nova obra são de `cadastros` (19/10/2026); o Início, de quem vê valores.
  const cadastra = usePode()('cadastros')

  useEffect(() => {
    getObras().then(setObras).catch(() => {})
    if (cadastra) getClientes().then(setClientes).catch(() => {})
    getContasAPagar({}).then(setContas).catch(() => {})
  }, [cadastra])
  const vencidas = contas.filter((c) => vencimentoTxt(c.vencimento).vencida)
  const somaDe = (ls) => ls.reduce((a, c) => a + c.valor, 0)

  // Mais consumida primeiro: quem está estourando o orçamento é quem precisa de olho.
  const ativas = obras
    .filter((o) => o.status === 'ativa')
    .sort((a, b) => pct(b.gasto, b.orcado) - pct(a.gasto, a.orcado))

  return (
    <Tela titulo="Início">
      <div className="grid max-w-4xl gap-2 pb-3 sm:grid-cols-3">
        <Atalho icone={Building2} titulo="Obras" onClick={() => navegar('/obras')}>
          <b className="text-[22px] text-titulo">{ativas.length}</b> em andamento de {obras.length}
        </Atalho>
        {/* Contas a pagar de todas as obras (rodada 2, A5): o vencido primeiro, em vermelho. */}
        <Atalho icone={Receipt} titulo="Contas a pagar" onClick={() => navegar('/relatorios?r=apagar')}>
          <b className="text-[22px] text-laranja">R$ {formatMoeda(somaDe(contas))}</b> em {contas.length} conta(s),
          de todas as obras (também as paralisadas)
          <div className={`mt-1 ${vencidas.length ? 'font-semibold text-perigo' : 'text-[#777]'}`}>
            {vencidas.length ? `${vencidas.length} vencida(s): R$ ${formatMoeda(somaDe(vencidas))}` : 'nenhuma vencida'}
          </div>
        </Atalho>
        {cadastra && (
          <Atalho icone={Users} titulo="Clientes" onClick={() => navegar('/clientes')}>
            <b className="text-[22px] text-titulo">{clientes.length}</b> cadastrados
            <div className="mt-1 text-[#777]">
              {clientes.filter((c) => c.incompleto).length} com cadastro incompleto
            </div>
          </Atalho>
        )}
      </div>

      <Grid
        className="flex-1"
        linhas={ativas}
        vazio="Nenhuma obra em andamento."
        onLinha={(o) => navegar(`/obra/${o.id}`)}
        colunas={[
          { chave: 'nome', titulo: 'Obra em andamento', nowrap: false },
          { chave: 'cliente', titulo: 'Cliente', largura: 180 },
          {
            chave: 'consumo', titulo: 'Consumo', largura: 110,
            // Sinaliza, não bloqueia: acima do orçado a barra fica vermelha e salva igual.
            render: (o) => {
              const p = pct(o.gasto, o.orcado)
              return <Barra pct={p} cor={p > 100 ? 'perigo' : p > 80 ? 'aviso' : 'sucesso'} altura={12} />
            },
          },
          {
            // A única leitura que a lista de obras não dá: consumo COM prazo do lado.
            // 70% do orçamento é ótimo com 90% do prazo e péssimo com 20%. Sem as duas
            // datas não há denominador - traço, que é diferente de 0%.
            chave: 'prazo', titulo: 'Prazo', largura: 110,
            render: (o) => {
              if (!o.dt_inicio || !o.dt_fim) return <span className="text-[#bbb]">-</span>
              const total = duracaoEntre(o.dt_inicio, o.dt_fim, 'dias')
              const p = pct(duracaoEntre(o.dt_inicio, hoje(), 'dias'), total)
              return <Barra pct={p} cor={p > 100 ? 'perigo' : 'acento'} altura={12} />
            },
          },
          {
            chave: 'aPagar', titulo: 'A pagar (R$)', largura: 105, align: 'right',
            render: (o) => <span className={o.aPagar > 0 ? 'text-laranja' : ''}>{formatMoeda(o.aPagar)}</span>,
          },
          {
            chave: 'caixa', titulo: 'Caixa (R$)', largura: 105, align: 'right',
            render: (o) => <span className={o.caixa < 0 ? 'text-perigo' : ''}>{formatMoeda(o.caixa)}</span>,
          },
        ]}
      />

      {cadastra && (
        <div className="flex justify-end pt-2">
          <Botao variante="acento" icone={Plus} onClick={() => navegar('/obras/nova')}>Nova obra</Botao>
        </div>
      )}
    </Tela>
  )
}

const Atalho = ({ icone: Icone, titulo, onClick, children }) => (
  <button
    onClick={onClick}
    className="border border-grade-linha bg-white p-3 text-left hover:border-acento hover:bg-[#f7fbfd]"
  >
    <div className="mb-1 flex items-center gap-1.5 font-semibold text-titulo">
      <Icone size={15} /> {titulo}
    </div>
    {children}
  </button>
)

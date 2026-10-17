import { useEffect, useMemo, useState } from 'react'
import { Download, Paperclip } from 'lucide-react'
import Grid, { TotalGrid } from '../ui/Grid'
import Botao from '../ui/Botao'
import Badge from '../ui/Badge'
import { Select } from '../ui/Form'
import { getExtratoCredor } from '../lib/api'
import { formatMoeda, formatData, numeroLancamento, hoje } from '../lib/format'

// Extrato do credor (UPDATE.md §10.2): tudo que foi lançado pra ele, em todas as obras,
// com o comprovante de cada linha. É o que se manda pro credor conferir - daí o CSV.
// A tela carrega tudo e filtra a obra aqui (o combo lista só as obras em que ele tem
// lançamento); o CSV leva o mesmo filtro pro servidor, que monta o arquivo.
export default function ExtratoCredor({ fornecedorId }) {
  const [todas, setTodas] = useState(null)
  const [obra, setObra] = useState('')

  useEffect(() => { getExtratoCredor(fornecedorId).then(setTodas).catch(() => setTodas([])) }, [fornecedorId])

  const obras = useMemo(
    () => [...new Map((todas ?? []).map((l) => [l.obra_id, l.obra])).entries()]
      .map(([valor, label]) => ({ valor: String(valor), label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [todas],
  )
  const linhas = (todas ?? []).filter((l) => !obra || String(l.obra_id) === obra)
  const lancado = linhas.reduce((s, l) => s + l.valor, 0)
  const pago = linhas.filter((l) => l.pago_em).reduce((s, l) => s + l.valor, 0)

  if (todas === null) return null

  return (
    <div className="flex h-full min-h-[360px] flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[260px]">
          <Select vazio="Todas as obras" opcoes={obras} value={obra} onChange={(e) => setObra(e.target.value)} />
        </div>
        <Botao
          className="ml-auto"
          icone={Download}
          disabled={!linhas.length}
          onClick={() => window.open(`/api/fornecedores/${fornecedorId}/extrato.csv${obra ? `?obra=${obra}` : ''}`)}
        >
          Exportar CSV
        </Botao>
      </div>

      <Grid
        className="flex-1"
        linhas={linhas}
        vazio="Nenhum lançamento para este credor."
        colunas={[
          {
            chave: 'numero', titulo: 'Nº', largura: 82,
            render: (l) => <span className="tabular-nums">{numeroLancamento('saida', l.numero)}</span>,
          },
          { chave: 'data', titulo: 'Data', largura: 80, render: (l) => formatData(l.data) },
          { chave: 'obra', titulo: 'Obra', largura: 150, nowrap: false },
          {
            chave: 'fase', titulo: 'Fase / serviço', largura: 190, nowrap: false,
            render: (l) => (
              <>
                {l.fase_codigo} - {l.fase}
                {l.servico && <div className="text-[#777]">{l.fase_codigo}.{l.servico_codigo} {l.servico}</div>}
              </>
            ),
          },
          {
            chave: 'descricao', titulo: 'Descrição', nowrap: false,
            render: (l) => [...l.itens, l.descricao].filter(Boolean).join(' · '),
          },
          { chave: 'valor', titulo: 'Valor (R$)', largura: 100, align: 'right', render: (l) => formatMoeda(l.valor) },
          {
            // Vencida e em aberto é o que o credor vai cobrar: vermelho.
            chave: 'vencimento', titulo: 'Vencimento', largura: 84,
            render: (l) => (
              <span className={!l.pago_em && l.vencimento && l.vencimento < hoje() ? 'text-perigo' : ''}>
                {formatData(l.vencimento) || '-'}
              </span>
            ),
          },
          {
            chave: 'pago_em', titulo: 'Pago em', largura: 92,
            render: (l) => (l.pago_em
              ? <span title={l.pago_obs ?? undefined}>{formatData(l.pago_em)}</span>
              : <Badge cor="aviso">Em aberto</Badge>),
          },
          {
            chave: 'anexo', titulo: '', largura: 30, align: 'center',
            render: (l) => l.anexo && (
              <a href={`/api/anexo/${l.anexo}`} target="_blank" rel="noreferrer" title="Abrir comprovante" className="text-titulo">
                <Paperclip size={13} />
              </a>
            ),
          },
        ]}
        rodape={
          <TotalGrid>
            Total lançado: <b>R$ {formatMoeda(lancado)}</b>
            <span className="mx-3 text-[#bbb]">|</span>
            Pago: R$ {formatMoeda(pago)}
            <span className="mx-3 text-[#bbb]">|</span>
            Em aberto: <b className={lancado - pago > 0 ? 'text-perigo' : ''}>R$ {formatMoeda(lancado - pago)}</b>
          </TotalGrid>
        }
      />
    </div>
  )
}

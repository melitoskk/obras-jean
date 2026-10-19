import { useState } from 'react'
import { Plus, Trash2, Pencil, Save } from 'lucide-react'
import Botao from '../ui/Botao'
import Combobox from '../ui/Combobox'
import Confirm from '../ui/Confirm'
import EmptyState from '../ui/EmptyState'
import { Input, Check } from '../ui/Form'
import { criarPendencia, patchPendencia, excluirPendencia } from '../lib/api'
import { formatData, hoje } from '../lib/format'
import { usePode } from '../lib/sessao'

// Pendências da obra (rodada 1, A11): o que falta fazer - "comprar impermeabilizante
// antes de subir a alvenaria" -, com fase, responsável e prazo. Uma lista de checagem,
// não um gerenciador de tarefas: abertas em cima, pelo prazo; o prazo vencido em
// vermelho; feitas embaixo, riscadas. Quem lança diário cria e marca (`diario`).
const rotuloFase = (f) => (f?.codigo ? `${f.codigo} - ${f.nome}` : f?.nome)

export default function PendenciasObra({ obraId, pendencias, fases, onMudou }) {
  const lanca = usePode()('diario')
  const [editando, setEditando] = useState(null) // {} = nova, objeto = editar
  const [excluir, setExcluir] = useState(null)
  const [verFeitas, setVerFeitas] = useState(false)
  const abertas = pendencias.filter((p) => !p.feita_em)
  const feitas = pendencias.filter((p) => p.feita_em)

  const marcar = async (p, feita) => { await patchPendencia(p.id, { feita }); onMudou() }

  const linha = (p) => {
    const vencida = !p.feita_em && p.prazo && p.prazo < hoje()
    return (
      <div key={p.id} className="group flex items-start gap-2 border border-grade-linha bg-white px-2.5 py-2">
        <div className="pt-0.5">
          {lanca
            ? <Check checked={!!p.feita_em} onChange={(v) => marcar(p, v)} />
            : <input type="checkbox" checked={!!p.feita_em} disabled readOnly />}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`whitespace-pre-wrap ${p.feita_em ? 'text-[#999] line-through' : 'text-[#333]'}`}>{p.texto}</p>
          <p className="text-[11px] text-[#888]">
            {[
              p.fase_id && rotuloFase(fases.find((f) => f.id === p.fase_id)),
              p.responsavel,
              p.feita_em && `feita em ${formatData(p.feita_em)}`,
            ].filter(Boolean).join(' · ')}
            {p.prazo && !p.feita_em && (
              <span className={vencida ? 'font-semibold text-perigo' : ''}>
                {' · '}{vencida ? `prazo vencido em ${formatData(p.prazo)}` : `até ${formatData(p.prazo)}`}
              </span>
            )}
          </p>
        </div>
        {lanca && !p.feita_em && (
          <button onClick={() => setEditando(p)} title="Editar" className="p-1.5 text-titulo">
            <Pencil size={15} />
          </button>
        )}
        {p.editavel && (
          <button onClick={() => setExcluir(p)} title="Excluir" className="p-1.5 text-perigo">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <span className="text-[#777]">{abertas.length} aberta(s)</span>
        {lanca && !editando?.novo && (
          <Botao variante="acento" icone={Plus} className="ml-auto" onClick={() => setEditando({ novo: true })}>
            Nova pendência
          </Botao>
        )}
      </div>

      {editando && (
        <FormPendencia
          obraId={obraId}
          pendencia={editando}
          fases={fases}
          onFechar={() => setEditando(null)}
          onSalvo={() => { setEditando(null); onMudou() }}
        />
      )}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {pendencias.length === 0 && !editando && (
          <EmptyState titulo="Nenhuma pendência." texto="O que falta fazer na obra entra aqui." />
        )}
        {abertas.map(linha)}
        {feitas.length > 0 && (
          <div className="pt-1">
            <Check checked={verFeitas} onChange={setVerFeitas}>Mostrar as {feitas.length} feita(s)</Check>
          </div>
        )}
        {verFeitas && feitas.map(linha)}
      </div>

      <Confirm
        open={!!excluir}
        title="Excluir a pendência?"
        message={excluir?.texto}
        onCancel={() => setExcluir(null)}
        onConfirm={async () => { await excluirPendencia(excluir.id); setExcluir(null); onMudou() }}
      />
    </div>
  )
}

// Formulário em linha, em cima da lista: uma pendência é uma frase, não pede modal.
function FormPendencia({ obraId, pendencia, fases, onFechar, onSalvo }) {
  const [texto, setTexto] = useState(pendencia.texto ?? '')
  const [faseId, setFaseId] = useState(pendencia.fase_id ?? null)
  const [responsavel, setResponsavel] = useState(pendencia.responsavel ?? '')
  const [prazo, setPrazo] = useState(pendencia.prazo ?? '')
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!texto.trim()) return setErro('Escreva o que falta fazer.')
    setSalvando(true)
    try {
      const corpo = { texto, fase_id: faseId, responsavel, prazo: prazo || null }
      if (pendencia.id) await patchPendencia(pendencia.id, corpo)
      else await criarPendencia({ ...corpo, obra_id: obraId })
      onSalvo()
    } catch (e) {
      setErro(e.erro ? `Não foi possível salvar: ${e.erro}.` : 'Não foi possível salvar.')
      setSalvando(false)
    }
  }

  return (
    <div className="mb-2 shrink-0 space-y-1.5 border border-acento bg-[#f7fbfd] p-2.5">
      <Input
        autoFocus
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') salvar() }}
        placeholder="O que falta fazer (ex.: comprar impermeabilizante antes de subir a alvenaria)"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[230px]">
          <Combobox
            value={faseId}
            onChange={setFaseId}
            options={fases.map((f) => ({ id: f.id, label: rotuloFase(f) }))}
            placeholder="Fase (opcional)"
          />
        </div>
        <div className="w-[170px]">
          <Input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Responsável (opcional)" />
        </div>
        <label className="flex items-center gap-1.5 text-[#777]">
          Prazo
          <input type="date" className="op-input w-[150px]" value={prazo} min="2000-01-01" max="2100-12-31" onChange={(e) => setPrazo(e.target.value)} />
        </label>
        <span className="ml-auto flex gap-1.5">
          <Botao onClick={onFechar}>Cancelar</Botao>
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </span>
      </div>
      {erro && <p className="text-perigo">{erro}</p>}
    </div>
  )
}

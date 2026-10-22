import { useEffect, useState } from 'react'
import { Plus, ChevronDown, X } from 'lucide-react'
import Confirm from './Confirm'
import { norm, casaBusca } from '../lib/format'

// O componente que faz "nada de cadastro obrigatório" funcionar.
// Teclado: ↑↓ move, Enter seleciona, Esc fecha, Tab confirma e vai pro próximo campo.
// Não bate com nada -> última linha é `+ Criar "texto"`, que confirma num diálogo,
// cria só com o nome e já seleciona - sem sair do formulário.
// options: [{ id, label, nota?, sublabel?, oculto? }] - já vêm na ordem que devem
// aparecer (relevância). `nota` sai entre parênteses ao lado do nome (o preço, no
// caso do fornecedor). `oculto` só aparece quando a pessoa digita: serve pra lista
// que se estreita por contexto sem sumir com o resto do cadastro.
// onCreate(texto) cria a entidade e RETORNA o novo id (ou uma Promise dele).
export default function Combobox({
  value,
  onChange,
  options = [],
  onCreate,
  placeholder = 'Selecione...',
  autoFocus,
  disabled,
  limpavel = true,
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [pendente, setPendente] = useState(null) // texto aguardando confirmação

  const selected = options.find((o) => o.id === value)
  const q = query.trim()
  // O que já está escolhido nunca fica oculto: estreitar a lista não pode esconder a
  // própria seleção de quem abriu o campo pra conferir.
  // Palavras soltas (rodada 1, A16): "cp ii" acha "CP-II".
  const filtered = options.filter((o) => (q ? casaBusca(o.label, q) : !o.oculto || o.id === value))
  const showCreate = onCreate && q && !options.some((o) => norm(o.label) === norm(q))
  const rows = showCreate ? [...filtered, { create: true }] : filtered

  // Abre com o valor atual destacado, não com a primeira linha. Sem isto, o Tab que
  // só PASSA pelo campo (ele confirma o destaque) trocava a escolha pelo topo da
  // lista - abrir um lançamento pra editar e tabular já mudava item e fornecedor.
  useEffect(() => {
    setHi(q ? 0 : Math.max(0, filtered.findIndex((o) => o.id === value)))
  }, [query, open, value])

  // Abrir limpando o filtro (mostra tudo). Precisa rodar no foco E no clique: depois de
  // selecionar com o mouse o input segue focado, e sem isto a lista não reabriria.
  // Sem nada escolhido, o que se digitou fica (rodada 4, A5): a pergunta do preço tirava o
  // foco no meio da digitação do item seguinte e, na volta, o campo estava vazio. Com algo
  // escolhido, abrir limpa o filtro pra mostrar a lista toda, como antes.
  const abrir = () => { if (!disabled) { setFocused(true); setOpen(true); if (selected) setQuery('') } }
  const fechar = () => { setQuery(''); setFocused(false); setOpen(false) }

  const choose = (row) => {
    if (!row) return
    if (row.create) return setPendente(q)
    onChange(row.id)
    fechar()
  }

  const confirmarCriacao = async () => {
    const id = await onCreate(pendente)
    if (id != null) onChange(id)
    setPendente(null)
    fechar()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, rows.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(rows[hi]) }
    // Esc com a lista aberta fecha SÓ a lista: o preventDefault avisa o Registro em volta,
    // que senão fechava o modal inteiro e levava o lançamento digitado junto. O foco e o
    // texto ficam (rodada 2, A8): sair do campo trocava o digitado pela seleção, vazia.
    // Com a lista já fechada, o Esc sai do campo e segue pro modal.
    else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setOpen(false) } else e.currentTarget.blur()
    }
    else if (e.key === 'Tab' && open) { choose(rows[hi]) } // sem preventDefault: o Tab segue
  }

  return (
    <div className="relative">
      <input
        autoFocus={autoFocus}
        disabled={disabled}
        // Digitado e não escolhido aparece em cinza: é texto, ainda não é o item.
        value={focused ? query : (selected?.label ?? query)}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={abrir}
        onClick={abrir}
        onBlur={() => { setFocused(false); setOpen(false) }}
        onKeyDown={onKeyDown}
        className={`op-input pr-12 ${!focused && !selected && query ? 'text-[#999] italic' : ''}`}
      />
      {/* `× ⌄` no canto: é assim que o select da referência aparece quando tem valor. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1.5 text-[#888]">
        {limpavel && selected && !disabled && (
          <button
            type="button"
            title="Limpar"
            onMouseDown={(e) => { e.preventDefault(); onChange(null) }}
            className="pointer-events-auto hover:text-[#333]"
          >
            <X size={13} />
          </button>
        )}
        <ChevronDown size={13} />
      </div>

      {open && rows.length > 0 && (
        <ul className="absolute z-30 mt-px max-h-64 w-full overflow-y-auto rounded-[2px] border border-borda bg-white shadow-lg">
          {rows.map((row, i) => (
            <li
              key={row.create ? '__create' : row.id}
              // onMouseDown antes do blur, com preventDefault pra não perder o foco.
              onMouseDown={(e) => { e.preventDefault(); choose(row) }}
              onMouseEnter={() => setHi(i)}
              className={`cursor-pointer px-2 py-1.5 ${i === hi ? 'bg-[#fbdccb]' : ''}`}
            >
              {row.create ? (
                <span className="flex items-center gap-1 text-titulo">
                  <Plus size={13} /> Criar "{q}"
                </span>
              ) : (
                <>
                  <div>
                    {row.label}
                    {row.nota && <span className="text-[#666]"> ({row.nota})</span>}
                  </div>
                  {row.sublabel && <div className="text-[11px] text-[#888]">{row.sublabel}</div>}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Confirm
        open={pendente != null}
        title={`Criar "${pendente}"?`}
        message="Entra como cadastro incompleto."
        confirmLabel="Criar"
        danger={false}
        onConfirm={confirmarCriacao}
        onCancel={() => setPendente(null)}
      />
    </div>
  )
}

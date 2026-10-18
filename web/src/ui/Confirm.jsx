import { useEffect } from 'react'
import Botao from './Botao'

// Diálogo de confirmação. Este SIM escurece a tela: é uma parada deliberada
// ("tem certeza?"), não um fluxo de trabalho. Esc cancela. z-50 fica ACIMA do
// Registro (z-40) - sempre se confirma de dentro de um formulário.
// `focoNoCancelar`: quando o caso comum é o "não" e o Enter não pode mudar cadastro
// (a pergunta do preço, rodada 3, A17).
export default function Confirm({ open, onConfirm, onCancel, title, message, confirmLabel = 'Excluir', cancelLabel = 'Cancelar', danger = true, focoNoCancelar = false }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" onMouseDown={onCancel}>
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white shadow-2xl">
        <h2 className="px-4 pt-3 pb-2 text-[16px] font-bold text-titulo">{title}</h2>
        {message && <p className="px-4 pb-4 text-[#555]">{message}</p>}
        <div className="flex justify-end gap-1.5 border-t border-grade-linha bg-[#f7f7f7] px-3 py-2">
          <Botao autoFocus={focoNoCancelar} onClick={onCancel}>{cancelLabel}</Botao>
          <Botao autoFocus={!focoNoCancelar} variante={danger ? 'perigo' : 'acento'} onClick={onConfirm}>
            {confirmLabel}
          </Botao>
        </div>
      </div>
    </div>
  )
}

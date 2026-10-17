import { useEffect } from 'react'
import { Check, AlertTriangle } from 'lucide-react'

// "✓ Operação executada com sucesso." - faixa de largura total logo acima da barra de
// ação. É o feedback de salvar da referência: não é toast flutuante, é uma faixa que
// mora no rodapé do registro.
const CORES = { sucesso: 'bg-sucesso', erro: 'bg-perigo', aviso: 'bg-laranja' }

export default function Faixa({ tipo = 'sucesso', children, onFim, ms = 4000 }) {
  useEffect(() => {
    if (!onFim) return
    const t = setTimeout(onFim, ms)
    return () => clearTimeout(t)
  }, [onFim, ms, children])

  if (!children) return null
  return (
    <div className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-white ${CORES[tipo]}`} role="status">
      {tipo === 'sucesso' ? <Check size={14} /> : <AlertTriangle size={14} />}
      {children}
    </div>
  )
}

// O losango laranja com "!" que a referência põe ao lado de campos com ressalva
// (CPF em Cadastro-Cliente, Tipo em Contas-a-pagar). É marcador, não bloqueio.
export function Losango({ title, tamanho = 18 }) {
  return (
    <span
      title={title}
      className="inline-flex shrink-0 rotate-45 items-center justify-center rounded-[2px] bg-laranja"
      style={{ width: tamanho, height: tamanho }}
    >
      <span className="-rotate-45 text-[11px] leading-none font-bold text-white">!</span>
    </span>
  )
}

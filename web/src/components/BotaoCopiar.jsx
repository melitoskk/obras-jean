import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

// Copiar SEM depender da Clipboard API: `navigator.clipboard` só existe em contexto
// seguro (https ou localhost), e este sistema roda na rede interna acessado por IP -
// onde ele simplesmente não existe. O fallback do textarea + execCommand é obsoleto e
// é o único que funciona em http://192.168.x.x. Sem ele o botão falharia calado
// justamente na máquina de todo mundo, menos na de quem desenvolve.
async function copia(texto) {
  try {
    if (window.isSecureContext && navigator.clipboard) {
      return await navigator.clipboard.writeText(texto)
    }
  } catch { /* permissão negada: cai no fallback */ }
  const ta = document.createElement('textarea')
  ta.value = texto
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
}

// Botão de copiar de célula de grid. stopPropagation porque a linha inteira abre o
// cadastro, e copiar não pode arrastar o formulário junto.
export default function BotaoCopiar({ texto, title = 'Copiar' }) {
  const [copiado, setCopiado] = useState(false)

  async function clicou(e) {
    e.stopPropagation()
    await copia(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={clicou}
      title={title}
      className="shrink-0 text-[#aaa] hover:text-acento"
    >
      {copiado ? <Check size={12} className="text-[#128c39]" /> : <Copy size={12} />}
    </button>
  )
}

// Célula "texto + copiar" das listas: e-mail, CPF/CNPJ. Vazio não vira célula com
// botão pendurado no nada. O telefone NÃO usa esta - ele vira link do WhatsApp e
// escolhe entre celular e fixo, que é regra demais pra caber aqui.
export function CelulaCopiavel({ texto, title }) {
  if (!texto) return null
  return (
    <span className="flex items-center gap-1">
      <span className="truncate">{texto}</span>
      <BotaoCopiar texto={texto} title={title} />
    </span>
  )
}

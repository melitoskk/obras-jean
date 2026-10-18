import { useEffect, useRef, useState } from 'react'
import { formatMoeda, formatPct, formatQtd, lerQtd, lerColado, teclaCorrida } from '../lib/format'

// Digitação corrida: os dígitos escorrem da direita pra esquerda até as casas decimais.
// 12345 -> 123,45. Entrega sempre o INTEIRO de dígitos; quem chama decide o que ele
// significa (centavos ou ponto-base). É o fallback do teclado que não manda a tecla.
function corrida(texto, onChange) {
  const digitos = texto.replace(/\D/g, '').slice(0, 15)
  onChange(digitos ? parseInt(digitos, 10) : 0)
}

const base = 'op-input text-right tabular-nums'

// A corrida pela TECLA, não pelo texto: o dígito entra sempre no fim, esteja o cursor
// onde estiver. Pelo texto, clicar no meio de "0,00" e digitar 450 dava 4.500,00, e
// corrigir "0,50" digitando 50,00 dava 50.050,00 (rodada 1, A3). Com tudo selecionado,
// o dígito recomeça do zero, como numa planilha. A conta é `teclaCorrida` (format.js,
// testada); aqui só o que é do campo: a seleção e as casas depois da vírgula.
//
// Focar seleciona tudo, pro próximo dígito substituir o valor em vez de somar a ele. Mas
// a seleção só chega no quadro seguinte (o rAF passa do mouseup, que senão a desfaz). Quem digita rápido manda o primeiro dígito antes dela, e
// o segundo achava tudo selecionado e recomeçava: 3500000 virava 5.000,00 (rodada 2, A6).
// Por isso a primeira tecla depois do foco conta como "tudo selecionado", e a seleção
// atrasada não acontece mais se alguém já digitou.
//
// Teclado que não manda a tecla (Android, ditado) e texto que entra de uma vez
// (preenchimento automático) chegam pelo `beforeinput`, com o que foi inserido em
// `data`: um caractere segue a mesma corrida; mais de um é número escrito e se lê como
// colado. Pelo `onChange` sobrava só o texto inteiro, e "1.234,5" virava 123,45 (rodada
// 3, A11). O `onChange` fica de rede pro que nem o `beforeinput` traz.
function Corrida({ value, onChange, formatar, cel, className, ...props }) {
  const sessao = useRef({ casas: null, recemFocado: false })
  const campo = useRef(null)
  // O listener nativo é registrado uma vez; lê o valor e o onChange da renderização atual.
  const atual = useRef({ value, onChange })
  atual.current = { value, onChange }

  // Uma tecla da corrida. true = tratou (quem chamou cancela o evento).
  function aplicar(el, t) {
    const { value: v, onChange: muda } = atual.current
    const tudo = sessao.current.recemFocado || (el.selectionStart === 0 && el.selectionEnd === el.value.length)
    const novo = teclaCorrida({ valor: v, casas: sessao.current.casas }, t, tudo)
    if (!novo) return false
    sessao.current = { casas: novo.casas, recemFocado: false }
    if (novo.valor !== v) muda(novo.valor)
    return true
  }
  function tecla(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.currentTarget.readOnly) return
    if (aplicar(e.currentTarget, e.key)) e.preventDefault()
  }
  useEffect(() => {
    const el = campo.current
    const antes = (ev) => {
      if (el.readOnly) return
      if (ev.inputType === 'insertText' && ev.data) {
        ev.preventDefault()
        if (ev.data.length === 1) return aplicar(el, ev.data)
        sessao.current = { casas: null, recemFocado: false }
        atual.current.onChange(lerColado(ev.data))
      } else if (ev.inputType === 'deleteContentBackward' || ev.inputType === 'deleteContentForward') {
        ev.preventDefault()
        aplicar(el, 'Backspace')
      }
    }
    el.addEventListener('beforeinput', antes)
    return () => el.removeEventListener('beforeinput', antes)
  }, [])
  function focar(e) {
    const el = e.currentTarget
    sessao.current = { casas: null, recemFocado: true }
    requestAnimationFrame(() => {
      if (sessao.current.recemFocado && document.activeElement === el) el.select()
    })
  }
  return (
    <input
      ref={campo}
      inputMode="decimal"
      value={formatar(value)}
      onKeyDown={tecla}
      onChange={(e) => corrida(e.target.value, onChange)}
      // Colado é número escrito (rodada 2, A16): "1.234,5" é 1.234,50, não 123,45.
      onPaste={(e) => { e.preventDefault(); sessao.current = { casas: null, recemFocado: false }; onChange(lerColado(e.clipboardData.getData('text'))) }}
      onFocus={focar}
      onBlur={() => { sessao.current = { casas: null, recemFocado: false } }}
      className={`${base} ${cel ? 'op-cel' : ''} ${className}`}
      {...props}
    />
  )
}

// Dinheiro em centavos inteiros. `cel` usa a métrica de dentro de célula de grid.
export function MoneyInput({ value = 0, className = '', ...props }) {
  return <Corrida value={value} formatar={formatMoeda} className={className} {...props} />
}

// Quantidade em 2 casas, guardada como REAL - não é dinheiro. NÃO é corrida: "50" são
// 50 sacos, não 0,50. Enquanto o campo está focado vale o texto digitado; ao sair,
// volta formatado.
//
// A mesma corrida do foco do dinheiro (rodada 2, A6): a seleção chega um quadro depois, e
// "10" digitado logo ao tocar virava "0" - o 1 entrava, a seleção atrasada pegava ele e o
// 0 substituía (rodada 3, A12). O primeiro caractere depois do foco seleciona antes de entrar.
export function QtdInput({ value = 0, onChange, cel, className = '', ...props }) {
  const [texto, setTexto] = useState(null) // null = fora de edição, mostra formatado
  const recemFocado = useRef(false)
  const primeiro = (e) => {
    if (!recemFocado.current) return
    recemFocado.current = false
    e.currentTarget.select()
  }
  return (
    <input
      inputMode="decimal"
      value={texto ?? formatQtd(value)}
      onFocus={(e) => {
        setTexto(value ? formatQtd(value) : '')
        recemFocado.current = true
        const el = e.currentTarget
        requestAnimationFrame(() => { if (recemFocado.current && document.activeElement === el) el.select() })
      }}
      onKeyDown={(e) => { if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) primeiro(e) }}
      onBeforeInput={primeiro}
      onChange={(e) => { setTexto(e.target.value); onChange(lerQtd(e.target.value)) }}
      onBlur={() => setTexto(null)}
      className={`${base} ${cel ? 'op-cel' : ''} ${className}`}
      {...props}
    />
  )
}

// Percentual em ponto-base (1500 = 15,00%). Mesma digitação corrida do dinheiro.
export function PctInput({ value = 0, className = '', ...props }) {
  return <Corrida value={value} formatar={formatPct} className={className} {...props} />
}

import { useRef, useState } from 'react'
import { formatMoeda, formatPct, formatQtd, lerQtd, lerColado, teclaCorrida } from '../lib/format'

// Digitação corrida: os dígitos escorrem da direita pra esquerda até as casas decimais.
// 12345 -> 123,45. Entrega sempre o INTEIRO de dígitos; quem chama decide o que ele
// significa (centavos ou ponto-base). É o fallback do teclado que não manda a tecla.
function corrida(texto, onChange) {
  const digitos = texto.replace(/\D/g, '').slice(0, 15)
  onChange(digitos ? parseInt(digitos, 10) : 0)
}

// A corrida pela TECLA, não pelo texto: o dígito entra sempre no fim, esteja o cursor
// onde estiver. Pelo texto, clicar no meio de "0,00" e digitar 450 dava 4.500,00, e
// corrigir "0,50" digitando 50,00 dava 50.050,00 (rodada 1, A3). Com tudo selecionado,
// o dígito recomeça do zero, como numa planilha. A conta é `teclaCorrida` (format.js,
// testada); aqui só o que é do campo: a seleção e as casas depois da vírgula.
//
// Focar seleciona tudo, mas a seleção só chega no quadro seguinte (o rAF passa do
// mouseup, que senão a desfaz). Quem digita rápido manda o primeiro dígito antes dela, e
// o segundo achava tudo selecionado e recomeçava: 3500000 virava 5.000,00 (rodada 2, A6).
// Por isso a primeira tecla depois do foco conta como "tudo selecionado", e a seleção
// atrasada não acontece mais se alguém já digitou.
// Focar seleciona tudo: o próximo dígito substitui o valor em vez de somar a ele.
// O rAF passa do mouseup, que senão desfaz a seleção do clique.
const selecionar = (e) => {
  const el = e.currentTarget
  requestAnimationFrame(() => document.activeElement === el && el.select())
}

const base = 'op-input text-right tabular-nums'

function Corrida({ value, onChange, formatar, cel, className, ...props }) {
  const sessao = useRef({ casas: null, recemFocado: false })
  function tecla(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.currentTarget.readOnly) return
    const el = e.currentTarget
    const tudo = sessao.current.recemFocado || (el.selectionStart === 0 && el.selectionEnd === el.value.length)
    const novo = teclaCorrida({ valor: value, casas: sessao.current.casas }, e.key, tudo)
    if (!novo) return
    e.preventDefault()
    sessao.current = { casas: novo.casas, recemFocado: false }
    if (novo.valor !== value) onChange(novo.valor)
  }
  function focar(e) {
    const el = e.currentTarget
    sessao.current = { casas: null, recemFocado: true }
    requestAnimationFrame(() => {
      if (sessao.current.recemFocado && document.activeElement === el) el.select()
    })
  }
  return (
    <input
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
export function QtdInput({ value = 0, onChange, cel, className = '', ...props }) {
  const [texto, setTexto] = useState(null) // null = fora de edição, mostra formatado
  return (
    <input
      inputMode="decimal"
      value={texto ?? formatQtd(value)}
      onFocus={(e) => { setTexto(value ? formatQtd(value) : ''); selecionar(e) }}
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

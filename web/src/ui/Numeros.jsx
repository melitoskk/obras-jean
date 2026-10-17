import { formatMoeda, formatPct, formatQtd } from '../lib/format'

// Digitação corrida: os dígitos escorrem da direita pra esquerda até as casas decimais.
// 12345 -> 123,45. Entrega sempre o INTEIRO de dígitos; quem chama decide o que ele
// significa (centavos, ponto-base, ou décimos-de-milésimo no caso da quantidade).
function corrida(texto, onChange) {
  const digitos = texto.replace(/\D/g, '').slice(0, 15)
  onChange(digitos ? parseInt(digitos, 10) : 0)
}

// ponytail: o cursor sempre pula pro fim a cada tecla. Aceitável em campo numérico
// alinhado à direita, que é como todos aparecem na referência.
const base = 'op-input text-right tabular-nums'

// Dinheiro em centavos inteiros. `cel` usa a métrica de dentro de célula de grid.
export function MoneyInput({ value = 0, onChange, cel, className = '', ...props }) {
  return (
    <input
      inputMode="numeric"
      value={formatMoeda(value)}
      onChange={(e) => corrida(e.target.value, onChange)}
      className={`${base} ${cel ? 'op-cel' : ''} ${className}`}
      {...props}
    />
  )
}

// Quantidade em 2 casas, guardada como REAL - não é dinheiro. Os dígitos ainda
// escorrem, então o estado sai de inteiro/100 e não acumula erro de float na digitação.
export function QtdInput({ value = 0, onChange, cel, className = '', ...props }) {
  return (
    <input
      inputMode="numeric"
      value={formatQtd(value)}
      onChange={(e) => corrida(e.target.value, (n) => onChange(n / 100))}
      className={`${base} ${cel ? 'op-cel' : ''} ${className}`}
      {...props}
    />
  )
}

// Percentual em ponto-base (1500 = 15,00%). Mesma digitação corrida do dinheiro.
export function PctInput({ value = 0, onChange, cel, className = '', ...props }) {
  return (
    <input
      inputMode="numeric"
      value={formatPct(value)}
      onChange={(e) => corrida(e.target.value, onChange)}
      className={`${base} ${cel ? 'op-cel' : ''} ${className}`}
      {...props}
    />
  )
}

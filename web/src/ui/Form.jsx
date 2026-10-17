import { Children } from 'react'

// Primitivos de formulário. O traço mais reconhecível dos cadastros da referência é o
// label CINZA, ALINHADO À DIREITA, à ESQUERDA do campo - nunca acima dele.
// `Campos` fixa a largura da coluna de labels via CSS var, e é isso que faz uma região
// inteira alinhar sem cada campo saber da largura.

export function Campos({ lbl = 96, cols = 1, className = '', children }) {
  return (
    <div
      style={{ '--lbl': `${lbl}px` }}
      className={`grid gap-x-6 gap-y-2 ${cols === 2 ? 'sm:grid-cols-2' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function Campo({ label, req, largo, children }) {
  // Valor de texto puro nao tem os 30px do input: sem o mesmo pt do label ele sobe e desalinha.
  const texto = Children.toArray(children).every((c) => typeof c !== 'object')
  return (
    <div className={`flex items-start gap-2 ${largo ? 'sm:col-span-2' : ''}`}>
      {/* nowrap: "Data fim" quebrando em duas linhas desalinha a régua inteira. */}
      {label != null && (
        <label className="w-[var(--lbl)] shrink-0 pt-1.5 text-right whitespace-nowrap text-rotulo">
          {label}
          {req && ' *'}
        </label>
      )}
      <div className={`min-w-0 flex-1 ${texto ? 'pt-1.5' : ''}`}>{children}</div>
    </div>
  )
}

// Régua de seção: rótulo cinza + linha fina até a borda ("Título", "Período", "Contato").
export function Secao({ children }) {
  return (
    <div className="mt-5 mb-2 flex items-center gap-2 first:mt-0">
      <span className="text-rotulo">{children}</span>
      <div className="h-px flex-1 bg-grade-linha" />
    </div>
  )
}

export function Input(props) {
  return <input className="op-input" {...props} />
}

export function Select({ opcoes = [], vazio = 'Selecione...', ...props }) {
  return (
    <select className="op-input" {...props}>
      {vazio != null && <option value="">{vazio}</option>}
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// Textarea com o contador de restantes que a referência mostra abaixo, à direita.
export function Texto({ value = '', max, rows = 4, ...props }) {
  return (
    <>
      <textarea
        rows={rows}
        maxLength={max}
        value={value}
        className="op-input h-auto resize-y py-1.5 leading-snug"
        {...props}
      />
      {max && (
        <div className="mt-0.5 text-right text-[11px] text-[#999]">
          {(max - value.length).toLocaleString('pt-BR')} caracteres restantes
        </div>
      )}
    </>
  )
}

// `Tipo ( ) Pessoa física ( ) Pessoa jurídica` - sempre em linha, nativo.
export function Radios({ name, value, onChange, opcoes = [] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1.5">
      {opcoes.map((o) => (
        <label key={o.valor} className="flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name={name}
            checked={value === o.valor}
            onChange={() => onChange(o.valor)}
            className="accent-acento"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}

export function Check({ checked, onChange, children }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="accent-acento" />
      {children}
    </label>
  )
}

import marca from './marca/oak-marca.svg?raw'
import horizontal from './marca/oak-horizontal.svg?raw'
import vertical from './marca/oak-vertical.svg?raw'

// Logo da Oak, vetores tirados do brand board. Os SVGs pintam com `currentColor`, então
// a cor vem do `text-*` de quem usa (laranja da marca por padrão, branco sobre laranja).
// Inline, e não <img>, justamente por isso. A altura manda e a largura acompanha.
// variante: 'marca' (só o símbolo), 'horizontal' (símbolo + nome ao lado), 'vertical'.
const SVGS = { marca, horizontal, vertical }

export default function Logo({ variante = 'marca', className = 'h-10 text-marca' }) {
  return (
    <span
      role="img"
      aria-label="Oak Construtora & Incorporadora"
      className={`inline-block [&>svg]:h-full [&>svg]:w-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: SVGS[variante] }}
    />
  )
}

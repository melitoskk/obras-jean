import { useEffect, useRef } from 'react'

// Moldura de navegação da referência: barra navy no topo e rail navy de ícones à
// esquerda, cada módulo com ícone acima e rótulo em caixa alta de 9px.
// modulos: [{ id, label, icone, disabled }] - quem sabe quais módulos existem é o
// domínio; aqui só se desenha o que chega por prop.

export function BarraTopo({ logo, children }) {
  return (
    <header className="flex h-[62px] shrink-0 items-center gap-3 bg-rail px-3 text-white">
      <div className="flex items-center">{logo}</div>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  )
}

export function Rail({ modulos = [], ativo, onIr }) {
  return (
    <nav className="hidden w-[88px] shrink-0 flex-col overflow-y-auto bg-rail md:flex">
      {modulos.map((m) => {
        const on = m.id === ativo
        return (
          <button
            key={m.id}
            type="button"
            disabled={m.disabled}
            title={m.disabled ? `${m.label} - fora desta rodada` : m.label}
            onClick={() => onIr(m.id)}
            // Ativo é BRANCO com texto navy na referência, não um navy mais claro.
            className={`flex h-[58px] shrink-0 flex-col items-center justify-center gap-0.5 border-b border-rail-borda px-1 ${
              on ? 'bg-white text-rail' : m.disabled ? 'text-white opacity-35' : 'text-white hover:bg-rail-ativo'
            }`}
          >
            <m.icone size={20} strokeWidth={1.6} />
            <span className="text-center text-[9px] leading-tight font-semibold tracking-wide uppercase">{m.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// No celular 88px de rail em 390px de tela é caro demais e a lista fica longa.
// Vira barra inferior com os módulos habilitados. z-30 fica ABAIXO do Registro (z-40)
// de propósito: formulário aberto cobre a navegação.
//
// Ela ROLA na horizontal em vez de espremer: a partir do 5º módulo, dividir 390px em
// partes iguais deixa "FORNECEDORES" ilegível. Nenhuma função some no celular (§11) -
// o `min-w` garante o rótulo inteiro e o excedente sai rolando.
export function BarraInferior({ modulos = [], ativo, onIr }) {
  const uteis = modulos.filter((m) => !m.disabled)
  // A barra rola, então o módulo ativo pode nascer fora da tela (Fluxo, Relatórios
  // ficam à direita). Traz ele pro centro quando muda - senão o "você está aqui" some.
  const refAtivo = useRef(null)
  useEffect(() => { refAtivo.current?.scrollIntoView({ inline: 'center', block: 'nearest' }) }, [ativo])
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto bg-rail md:hidden">
      {uteis.map((m) => (
        <button
          key={m.id}
          type="button"
          ref={m.id === ativo ? refAtivo : undefined}
          onClick={() => onIr(m.id)}
          // `grow shrink-0` + largura pelo conteúdo: `flex-1` (basis 0) fazia o rótulo
          // vazar do botão e "ORÇAMENTOS" encostar em "FORNECEDORES".
          className={`flex min-w-[64px] shrink-0 grow flex-col items-center gap-0.5 px-2 py-1.5 whitespace-nowrap text-white ${m.id === ativo ? 'bg-rail-ativo' : ''}`}
        >
          <m.icone size={19} strokeWidth={1.6} />
          <span className="text-[9px] font-semibold uppercase">{m.label}</span>
        </button>
      ))}
    </nav>
  )
}

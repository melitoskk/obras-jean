import { useEffect, useRef, useState } from 'react'
import { CircleUserRound, LogOut } from 'lucide-react'

// Ícone de usuário no topo que abre um menu: quem está logado em cima, ações embaixo.
// itens: [{ label, icone, onClick }] - o Sair entra sempre por último, separado.
export default function MenuUsuario({ usuario, perfil, itens = [], onSair }) {
  const [aberto, setAberto] = useState(false)
  const ref = useRef(null)

  // Fecha ao clicar fora ou apertar Esc - menu que só fecha no próprio botão irrita.
  useEffect(() => {
    if (!aberto) return
    const fora = (e) => { if (!ref.current?.contains(e.target)) setAberto(false) }
    const esc = (e) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberto])

  const acao = (fn) => () => { setAberto(false); fn() }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        title={usuario}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className={`flex h-9 w-9 items-center justify-center rounded-full ${aberto ? 'bg-rail-ativo text-white' : 'text-white/80 hover:bg-rail-ativo hover:text-white'}`}
      >
        <CircleUserRound size={22} strokeWidth={1.6} />
      </button>

      {aberto && (
        <div role="menu" className="absolute top-full right-0 z-50 mt-1.5 w-56 border border-grade-linha bg-white py-1 text-titulo shadow-lg">
          <div className="border-b border-grade-linha px-3 py-2">
            <div className="truncate font-semibold">{usuario}</div>
            <div className="truncate text-[12px] text-[#777]">{perfil}</div>
          </div>
          {itens.map((i) => (
            <Item key={i.label} icone={i.icone} onClick={acao(i.onClick)}>{i.label}</Item>
          ))}
          <div className={itens.length ? 'mt-1 border-t border-grade-linha pt-1' : ''}>
            <Item icone={LogOut} onClick={acao(onSair)}>Sair</Item>
          </div>
        </div>
      )}
    </div>
  )
}

const Item = ({ icone: Icone, onClick, children }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#f7fbfd]"
  >
    <Icone size={15} className="text-[#777]" /> {children}
  </button>
)

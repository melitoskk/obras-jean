import { useState } from 'react'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'

// Segunda coluna da referência: cabeçalho azul em caixa alta com "?" à direita, e o
// conteúdo do módulo abaixo (filtros de pesquisa ou submenu). A alça de recolher fica
// grudada na borda direita, na altura do meio - é o `‹` da imagem Relatorios-min.
export default function PainelModulo({ titulo, icone: Icone, ajuda, children }) {
  const [aberto, setAberto] = useState(true)

  return (
    <div className="relative hidden shrink-0 md:block">
      <aside
        className={`h-full overflow-hidden border-r border-grade-linha bg-white transition-[width] duration-150 ${
          aberto ? 'w-[240px]' : 'w-0'
        }`}
      >
        <div className="flex h-full w-[240px] flex-col">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-grade-linha px-2.5 py-2">
            {Icone && <Icone size={15} className="text-titulo" />}
            <h2 className="flex-1 font-bold tracking-wide text-titulo uppercase">{titulo}</h2>
            {ajuda && (
              <button type="button" title={ajuda} className="text-[#9bbfd8] hover:text-titulo">
                <HelpCircle size={15} />
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        title={aberto ? 'Recolher painel' : 'Expandir painel'}
        className="absolute top-1/2 -right-3 z-20 flex h-12 w-3.5 -translate-y-1/2 items-center justify-center rounded-r bg-acento text-white"
      >
        {aberto ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </div>
  )
}

export function ItemMenu({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full border-l-[3px] px-3 py-1.5 text-left leading-snug ${
        ativo ? 'border-acento bg-[#eeeeee] text-[#333]' : 'border-transparent text-[#555] hover:bg-[#f5f5f5]'
      }`}
    >
      {children}
    </button>
  )
}

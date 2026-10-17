import { ChevronLeft, ChevronRight } from 'lucide-react'

// Área de conteúdo: título azul à esquerda, ações à direita.
// A caixa alta é do TEXTO, não do componente: a referência tem "RELATÓRIO ORÇAMENTO DE
// CUSTO" gritando e "Orçamento: 000002 • Cliente: …" em caixa mista, no mesmo lugar.
export default function Tela({ titulo, acoes, children }) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-3 px-3 pt-3 pb-2">
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-bold text-titulo">{titulo}</h1>
        <div className="flex items-center gap-1.5">{acoes}</div>
      </div>
      {/* pb-14 no celular: a barra inferior é `fixed` e cobriria a última linha. */}
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-14 md:pb-3">{children}</div>
    </main>
  )
}

// `‹  4 - FUNDAÇÕES - INFRA ESTRUTURA  ›` - o cabeçalho de navegação do master-detail
// do Orçamento. Setas azuis nas pontas, título centralizado.
export function Navegador({ titulo, onAnterior, onProximo }) {
  return (
    <div className="flex shrink-0 items-center gap-2 pb-1.5">
      <Seta Icone={ChevronLeft} onClick={onAnterior} rotulo="Anterior" />
      <div className="flex-1 truncate text-center font-bold text-[#555]">{titulo}</div>
      <Seta Icone={ChevronRight} onClick={onProximo} rotulo="Próximo" />
    </div>
  )
}

const Seta = ({ Icone, onClick, rotulo }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    title={rotulo}
    className="flex h-[26px] w-[38px] shrink-0 items-center justify-center rounded-[2px] bg-acento text-white disabled:bg-[#cccccc]"
  >
    <Icone size={16} />
  </button>
)

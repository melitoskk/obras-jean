// Barra de progresso da Medição: trilho cinza, preenchimento colorido e o percentual
// em negrito SEMPRE CENTRADO NA BARRA INTEIRA - mesmo com preenchimento mínimo.
// A cor é do chamador de propósito: em medição mais é bom (verde), em consumo de
// orçamento mais é ruim (vermelho). `ui/` não sabe qual dos dois é.
const CORES = { sucesso: 'bg-sucesso', aviso: 'bg-laranja', perigo: 'bg-perigo', acento: 'bg-acento' }

export default function Barra({ pct = 0, cor = 'sucesso', altura = 14, rotulo }) {
  const cheio = Math.max(0, Math.min(100, pct))
  const texto = rotulo ?? `${pct.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  return (
    <div className="relative w-full overflow-hidden rounded-[2px] bg-[#dddddd]" style={{ height: altura }}>
      <div className={`h-full ${CORES[cor]}`} style={{ width: `${cheio}%` }} />
      {/* ponytail: pílula cinza translúcida atrás do texto - destaque igual sobre o trilho e sobre qualquer cor de preenchimento. */}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-[2px] bg-black/35 px-1 text-[9px] leading-none font-bold whitespace-nowrap text-white">
          {texto}
        </span>
      </span>
    </div>
  )
}

// Faixa de abas. Ativa = fundo branco + texto laranja + sublinhado laranja de 3px.
// Aba desabilitada é cinza-claro e não clica - a própria referência faz isso em
// `Nova obra` (Dia a dia, Galeria, Atendimento e Configurações nascem cinzas).
// Rola na horizontal quando não cabe; no celular é a única saída.
export default function Abas({ abas = [], ativa, onChange }) {
  return (
    <div className="flex shrink-0 overflow-x-auto border-b border-grade-linha bg-[#f5f5f5]">
      {abas.map((a) => {
        const on = a.id === ativa
        return (
          <button
            key={a.id}
            type="button"
            disabled={a.disabled}
            onClick={() => onChange(a.id)}
            className={`h-[34px] shrink-0 border-b-[3px] px-6 whitespace-nowrap ${
              on
                ? 'border-titulo bg-white text-titulo'
                : a.disabled
                  ? 'border-transparent text-[#bbb]'
                  : 'border-transparent text-[#777] hover:text-[#333]'
            }`}
          >
            {a.label}
          </button>
        )
      })}
      <div className="flex-1 border-b-[3px] border-transparent" />
    </div>
  )
}

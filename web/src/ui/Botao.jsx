// Botões e a barra de ação do rodapé. As variantes saem direto das referências:
// `Salvar` é azul sólido, e `Ativo`/`Relatórios`/`Ações` são pílulas de contorno
// azul-claro.

const VARIANTES = {
  acento: 'bg-acento text-white border-acento hover:brightness-110',
  perigo: 'bg-perigo text-white border-perigo hover:brightness-110',
  pilula: 'bg-white text-acento border-[#bcd7ea] hover:bg-[#eaf3fa]',
  neutro: 'bg-white text-[#555] border-borda hover:bg-[#f2f2f2]',
}

export default function Botao({ variante = 'neutro', icone: Icone, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex h-7 items-center gap-1.5 rounded-[3px] border px-2.5 text-xs whitespace-nowrap disabled:cursor-default disabled:opacity-50 disabled:hover:brightness-100 ${VARIANTES[variante]} ${className}`}
      {...props}
    >
      {Icone && <Icone size={13} className="shrink-0" />}
      {children}
    </button>
  )
}

// Rodapé de ações, alinhado à direita. Em todas as telas de registro da referência.
export function BarraAcao({ children, esquerda }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5 border-t border-grade-linha bg-[#f7f7f7] px-3 py-2">
      {esquerda}
      <div className="ml-auto flex items-center gap-1.5">{children}</div>
    </div>
  )
}

// Botão-texto azul: "Expandir tudo", "Pesquisa avançada", "Editar Fase/Serviço".
export function Link({ icone: Icone, children, ...props }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 text-titulo hover:underline" {...props}>
      {Icone && <Icone size={13} className="shrink-0" />}
      {children}
    </button>
  )
}

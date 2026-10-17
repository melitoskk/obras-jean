import Botao from './Botao'

// Toda lista vazia usa este. Ícone + frase + ação - nada de ilustração elaborada.
export default function EmptyState({ icone: Icone, titulo, texto, acao, onAcao, iconeAcao }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
      {Icone && <Icone size={40} strokeWidth={1.2} className="text-[#cccccc]" />}
      <p className="text-[14px] text-[#666]">{titulo}</p>
      {texto && <p className="max-w-md text-[#999]">{texto}</p>}
      {acao && (
        <Botao variante="acento" icone={iconeAcao} onClick={onAcao} className="mt-1.5">
          {acao}
        </Botao>
      )}
    </div>
  )
}

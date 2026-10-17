// Etiqueta de status. Nas referências os status aparecem como texto colorido discreto
// (Não iniciada, Em andamento…), não como pílula berrante.
const CORES = {
  neutro: 'bg-[#eeeeee] text-[#666] border-[#dddddd]',
  acento: 'bg-[#e3eff8] text-titulo border-[#bcd7ea]',
  sucesso: 'bg-[#e4f3e4] text-[#3d833d] border-[#c3e2c3]',
  aviso: 'bg-[#fdf1dc] text-[#9c6510] border-[#f3ddb3]',
  perigo: 'bg-[#fbe6e5] text-[#a63d3a] border-[#f0c7c5]',
}

export default function Badge({ cor = 'neutro', children }) {
  return (
    <span className={`inline-flex items-center rounded-[2px] border px-1.5 py-px text-[11px] ${CORES[cor]}`}>
      {children}
    </span>
  )
}

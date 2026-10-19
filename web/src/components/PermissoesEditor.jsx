import { Check } from '../ui/Form'

// As caixinhas de permissão, uma por item do catálogo (api/auth.js PERMISSOES), com a
// explicação embaixo. Marcar puxa o que ela `requer` (lançar puxa ver valores);
// desmarcar solta quem dependia dela - a mesma regra que o servidor aplica ao gravar.
export default function PermissoesEditor({ catalogo, valor = [], onChange, disabled }) {
  const marcar = (id, sim) => {
    if (sim) {
      const requer = catalogo.find((p) => p.id === id)?.requer ?? []
      return onChange(catalogo.map((p) => p.id).filter((p) => p === id || requer.includes(p) || valor.includes(p)))
    }
    const dependem = catalogo.filter((p) => p.requer?.includes(id)).map((p) => p.id)
    onChange(valor.filter((p) => p !== id && !dependem.includes(p)))
  }
  return (
    <div className="flex flex-col gap-1.5">
      {catalogo.map((p) => (
        <div key={p.id}>
          {disabled
            ? <span className={valor.includes(p.id) ? 'text-[#333]' : 'text-[#bbb] line-through'}>{p.rotulo}</span>
            : <Check checked={valor.includes(p.id)} onChange={(sim) => marcar(p.id, sim)}>{p.rotulo}</Check>}
          <p className="pl-5 text-[11px] text-[#888]">{p.descricao}</p>
        </div>
      ))}
    </div>
  )
}

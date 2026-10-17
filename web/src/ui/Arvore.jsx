import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, X, Rows3, Rows2 } from 'lucide-react'
import { Link } from './Botao'

// Árvore de dois níveis com checkbox - o modal "Editar fases e serviços".
// nos: [{ id, label, filhos: [{ id, label }] }]
// `marcados` é um Set de ids (pai e filho no mesmo Set); a regra de marcar o pai ao
// marcar um filho é do domínio e fica no chamador - aqui só se desenha e se avisa.
export default function Arvore({ nos = [], marcados, onMarcar, onMarcarVarios }) {
  const [abertos, setAbertos] = useState(() => new Set())
  const toggle = (id) =>
    setAbertos((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const todos = nos.flatMap((n) => [n.id, ...(n.filhos ?? []).map((f) => f.id)])

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-4 border-b border-grade-linha pb-2">
        <Link icone={Rows3} onClick={() => setAbertos(new Set(nos.map((n) => n.id)))}>Expandir tudo</Link>
        <Link icone={Rows2} onClick={() => setAbertos(new Set())}>Retrair tudo</Link>
        <Link icone={Check} onClick={() => onMarcarVarios(todos, true)}>Selecionar tudo</Link>
        <Link icone={X} onClick={() => onMarcarVarios(todos, false)}>Deselecionar tudo</Link>
      </div>

      <ul>
        {nos.map((n) => {
          const aberto = abertos.has(n.id)
          const filhos = n.filhos ?? []
          return (
            <li key={n.id}>
              <div className="flex items-center gap-1.5 py-1">
                <button
                  type="button"
                  onClick={() => toggle(n.id)}
                  disabled={filhos.length === 0}
                  className="text-[#666] disabled:opacity-25"
                  title={aberto ? 'Retrair' : 'Expandir'}
                >
                  {aberto ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
                <label className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={marcados.has(n.id)}
                    onChange={(e) => onMarcar(n, e.target.checked)}
                    className="accent-acento"
                  />
                  {n.label}
                </label>
              </div>
              {aberto && (
                <ul className="ml-[26px]">
                  {filhos.map((f) => (
                    <li key={f.id}>
                      <label className="flex cursor-pointer items-center gap-1.5 py-1 text-[#555]">
                        <input
                          type="checkbox"
                          checked={marcados.has(f.id)}
                          onChange={(e) => onMarcar(f, e.target.checked, n)}
                          className="accent-acento"
                        />
                        {f.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

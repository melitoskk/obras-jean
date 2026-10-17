import { useEffect, useState } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

// Tabela densa da referência: cabeçalho cinza, linhas de 25px, zebra, números à direita.
// Sem ordenação e sem virtualização - só estrutura e estilo (regra do PROJETO).
// colunas: [{ chave, titulo, largura, align, render(linha, i) }]
// A paginação é client-side de propósito: o grid recebe a lista inteira e fatia.
// ponytail: vira paginação de servidor quando uma lista passar de alguns milhares.
export default function Grid({
  colunas = [],
  linhas = [],
  chave = (l) => l.id,
  porPagina = 0,
  vazio = 'Nenhum registro.',
  onLinha,
  ativa,
  zebra = true,
  classeLinha,
  rodape,
  className = '',
}) {
  const [pag, setPag] = useState(0)
  const [tam, setTam] = useState(porPagina || 17)

  const paginado = porPagina > 0
  const paginas = paginado ? Math.max(1, Math.ceil(linhas.length / tam)) : 1
  useEffect(() => { if (pag > paginas - 1) setPag(paginas - 1) }, [paginas, pag])
  const visiveis = paginado ? linhas.slice(pag * tam, pag * tam + tam) : linhas

  const alinha = (c) => (c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left')

  return (
    <div className={`flex min-h-0 flex-col border border-grade-linha ${className}`}>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-grade-head">
              {colunas.map((c, i) => (
                <th
                  key={c.chave ?? i}
                  style={c.largura ? { width: c.largura } : undefined}
                  className={`h-[22px] border-r border-white/70 px-1.5 font-normal text-[#333] last:border-r-0 ${alinha(c)}`}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={colunas.length} className="px-2 py-6 text-center text-[#999]">
                  {vazio}
                </td>
              </tr>
            )}
            {visiveis.map((l, i) => {
              const id = chave(l)
              const selecionada = ativa != null && id === ativa
              return (
                <tr
                  key={id ?? i}
                  onClick={onLinha ? () => onLinha(l) : undefined}
                  className={`border-b border-grade-linha ${
                    selecionada ? 'bg-[#dceaf5]' : zebra && i % 2 ? 'bg-grade-zebra' : 'bg-white'
                  } ${onLinha ? 'cursor-pointer hover:bg-[#eaf3fa]' : ''} ${classeLinha?.(l) ?? ''}`}
                >
                  {colunas.map((c, j) => (
                    <td
                      key={c.chave ?? j}
                      className={`h-[25px] border-r border-grade-linha px-1.5 last:border-r-0 ${alinha(c)} ${c.nowrap === false ? '' : 'whitespace-nowrap'}`}
                    >
                      {c.render ? c.render(l, pag * tam + i) : l[c.chave]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rodape}

      {paginado && (
        <div className="flex shrink-0 items-center gap-2 border-t border-grade-linha bg-[#f7f7f7] px-2 py-1.5">
          <span className="text-[#666]">{linhas.length} registros</span>
          <div className="ml-auto flex items-center gap-1">
            <Nav Icone={ChevronsLeft} onClick={() => setPag(0)} off={pag === 0} rotulo="Primeira" />
            <Nav Icone={ChevronLeft} onClick={() => setPag((p) => p - 1)} off={pag === 0} rotulo="Anterior" />
            <span className="min-w-8 rounded-[2px] border border-borda bg-white px-2 py-0.5 text-center">{pag + 1}</span>
            <Nav Icone={ChevronRight} onClick={() => setPag((p) => p + 1)} off={pag >= paginas - 1} rotulo="Próxima" />
            <Nav Icone={ChevronsRight} onClick={() => setPag(paginas - 1)} off={pag >= paginas - 1} rotulo="Última" />
            <select
              value={tam}
              onChange={(e) => { setTam(+e.target.value); setPag(0) }}
              className="ml-1 h-[22px] rounded-[2px] border border-borda bg-white px-1"
            >
              {[17, 30, 50, 100].map((n) => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

const Nav = ({ Icone, onClick, off, rotulo }) => (
  <button type="button" onClick={onClick} disabled={off} title={rotulo} className="p-0.5 text-acento disabled:text-[#ccc]">
    <Icone size={15} />
  </button>
)

// Rodapé cinza de total, alinhado à direita: "Total da obra: R$ 631.200,00".
export function TotalGrid({ children }) {
  return (
    <div className="shrink-0 border-t border-grade-linha bg-barra px-2 py-1.5 text-right text-[#444]">{children}</div>
  )
}

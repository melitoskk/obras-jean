import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Combobox from '../ui/Combobox'
import Botao, { Link } from '../ui/Botao'
import Confirm from '../ui/Confirm'
import { MoneyInput, QtdInput } from '../ui/Numeros'
import { formatBRL, formatMoeda, mult } from '../lib/format'
import { itensSugeridos, ordenarFornecedores, precoSugerido, tipoDosItens } from '../lib/historico'

export const linhaVazia = { descricao: '', itemId: null, fornecedorId: null, qtd: 1, valorUnit: 0 }

// As linhas da saída, em grid denso como o resto do sistema.
// Escolher o insumo reordena os fornecedores para quem já forneceu AQUELE insumo e
// mostra o último preço na sublinha - e vice-versa. A relação nasce do lançamento.
//
// `fornecedorPadrao` é o fornecedor do cabeçalho: com ele preenchido a coluna
// Fornecedor SOME. A nota tem um emitente só, e escolher o mesmo nome duas vezes
// (uma no pagamento, outra em cada linha) é digitação pura. A linha herda o do
// cabeçalho na hora de salvar; a coluna volta se o cabeçalho estiver vazio.
export default function ItensEditor({ linhas, onChange, insumos, fornecedores, historico, vinculos, fornecedorPadrao, onCriarInsumo, onCriarFornecedor, onPrecoNovo }) {
  // Preço digitado diferente do base pergunta: é só desta nota ou o item mudou de preço?
  // Sem isso o preço base envelhece calado e a sugestão passa a mentir toda vez.
  const [perguntando, setPerguntando] = useState(null)
  const jaPerguntado = useRef(new Set()) // "quem já respondeu não é perguntado de novo"

  // Saiu do valor CLICANDO em outra coisa ("Adicionar linha", "Pago"): o blur vem no
  // mousedown, a pergunta abria por cima e o clique terminava nela e se perdia (rodada 3,
  // A3). Com o botão apertado, a pergunta espera o clique acabar; pelo Tab, abre na hora.
  const apertado = useRef(false)
  useEffect(() => {
    const desce = () => { apertado.current = true }
    const sobe = () => { apertado.current = false }
    document.addEventListener('pointerdown', desce, true)
    document.addEventListener('pointerup', sobe, true)
    return () => {
      document.removeEventListener('pointerdown', desce, true)
      document.removeEventListener('pointerup', sobe, true)
    }
  }, [])
  const depoisDoClique = (fn) => {
    if (!apertado.current) return fn()
    // O click sai logo depois do pointerup, na mesma volta; o setTimeout passa dele.
    document.addEventListener('pointerup', () => setTimeout(fn, 0), { once: true })
  }

  const set = (i, patch) => onChange(linhas.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  const add = () => onChange([...linhas, { ...linhaVazia }])
  const remove = (i) => onChange(linhas.length > 1 ? linhas.filter((_, idx) => idx !== i) : [{ ...linhaVazia }])

  const fornDa = (l) => l.fornecedorId ?? fornecedorPadrao ?? null
  const opcoesInsumo = (l) => itensSugeridos(insumos, historico, fornDa(l), vinculos)
  const sugerir = (itemId, fornecedorId) =>
    precoSugerido({ historico, vinculos, itens: insumos, itemId, fornecedorId })

  // Escolher insumo ou fornecedor re-sugere o valor unitário - trocar de fornecedor
  // TEM que trocar o preço, senão a sugestão do primeiro fica valendo pelo segundo.
  // Só que sobrescrever preço digitado à mão é hostil: escreve quando o campo está
  // zerado ou quando o que está lá é exatamente a sugestão anterior.
  const escolher = (i, patch) => {
    const l = linhas[i]
    const de = (k) => (k in patch ? patch[k] : (k === 'fornecedorId' ? fornDa(l) : l[k]))
    const agora = sugerir(de('itemId'), de('fornecedorId'))
    const automatico = !l.valorUnit || l.valorUnit === sugerir(l.itemId, fornDa(l))
    set(i, { ...patch, ...(agora && automatico ? { valorUnit: agora } : {}) })
  }

  // Ao sair do campo de valor, não no meio da digitação: 8500 passa por 8, 85, 850.
  // Com fornecedor escolhido o preço em jogo é o DELE (o vínculo); sem fornecedor, o
  // preço base do catálogo. Preço combinado em 0 é "nunca informado" - é justamente
  // aí que perguntar mais rende, então 0 pergunta igual.
  const conferirPreco = (l) => {
    const it = insumos.find((x) => x.id === l.itemId)
    const forn = fornDa(l)
    if (!onPrecoNovo || !it || !l?.valorUnit) return false
    // Valor que veio do prefill não foi digitado por ninguém: perguntar sobre ele
    // seria interromper quem só passou pelo campo.
    if (l.valorUnit === sugerir(it.id, forn)) return false
    const combinado = forn
      ? (vinculos.find((v) => v.itemId === it.id && v.fornecedorId === forn)?.preco ?? 0)
      : (it.preco_base ?? 0)
    if (l.valorUnit === combinado) return false
    const chave = `${it.id}:${forn}:${l.valorUnit}`
    if (jaPerguntado.current.has(chave)) return false
    jaPerguntado.current.add(chave)
    setPerguntando({
      itemId: it.id,
      fornecedorId: forn,
      nome: it.nome,
      unidade: it.unidade,
      quem: fornecedores.find((f) => f.id === forn)?.nome,
      combinado,
      valor: l.valorUnit,
    })
    return true
  }

  // A pergunta espera o foco sair pra algo que não é campo de digitação (botão, Pago,
  // fora da nota). Saindo do valor direto pra quantidade, ela abria por cima e comia o
  // dígito, no celular sobretudo (rodada 3, A12). A fila guarda o índice da linha e lê
  // a linha de agora: o valor pode ter mudado de novo antes de perguntar.
  const fila = useRef([])
  const linhasAgora = useRef(linhas)
  linhasAgora.current = linhas
  const conferirAgora = useRef(conferirPreco)
  conferirAgora.current = conferirPreco
  useEffect(() => {
    const digitando = (el) => el?.tagName === 'TEXTAREA' ||
      (el?.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(el.type))
    const saiu = (e) => {
      if (!fila.current.length || digitando(e.relatedTarget)) return
      depoisDoClique(() => {
        while (fila.current.length) {
          if (conferirAgora.current(linhasAgora.current[fila.current.shift()])) break
        }
      })
    }
    document.addEventListener('focusout', saiu)
    return () => document.removeEventListener('focusout', saiu)
  }, [])

  return (
    <div>
      <table className="w-full border-collapse border border-grade-linha">
        <thead>
          <tr className="bg-grade-head">
            <th className="h-[22px] border-r border-white/70 px-1.5 text-left font-normal">Item</th>
            {!fornecedorPadrao && (
              <th className="w-[190px] border-r border-white/70 px-1.5 text-left font-normal">Fornecedor</th>
            )}
            <th className="w-[80px] border-r border-white/70 px-1.5 text-right font-normal">Qtd</th>
            <th className="w-[100px] border-r border-white/70 px-1.5 text-right font-normal">Valor unit.</th>
            <th className="w-[92px] border-r border-white/70 px-1.5 text-right font-normal">Total</th>
            <th className="w-[30px]" />
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => {
            // Sinaliza, não bloqueia: pagar acima do preço base do item pinta o campo
            // de âmbar e diz de quanto era o base. Salva do mesmo jeito.
            const item = insumos.find((x) => x.id === l.itemId)
            const base = item?.preco_base ?? 0
            // A unidade junto do preço (rodada 3, A18): "0,78 por Quilos" não confunde com o saco.
            const porUnidade = item?.unidade ? ` por ${item.unidade}` : ''
            const acima = base > 0 && l.valorUnit > base
            return (
            <tr key={i} className="border-b border-grade-linha">
              <td className="px-1 py-0.5">
                <Combobox
                  value={l.itemId}
                  onChange={(id) => escolher(i, { itemId: id, descricao: insumos.find((x) => x.id === id)?.nome ?? '' })}
                  options={opcoesInsumo(l)}
                  placeholder={l.descricao || 'Item ou serviço...'}
                  onCreate={onCriarInsumo}
                />
              </td>
              {!fornecedorPadrao && (
                <td className="px-1 py-0.5">
                  <Combobox
                    value={l.fornecedorId}
                    onChange={(id) => escolher(i, { fornecedorId: id })}
                    options={ordenarFornecedores(fornecedores, historico, l.itemId, vinculos, tipoDosItens(insumos, l.itemId))}
                    placeholder="Fornecedor..."
                    onCreate={onCriarFornecedor}
                  />
                </td>
              )}
              {/* A unidade do cadastro ao lado da quantidade (rodada 4, A4): o cimento em
                  "Quilos" fazia 50 sacos virarem 50 kg sem ninguém ver. */}
              <td className="px-1 py-0.5">
                <div className="flex items-center gap-1">
                  <QtdInput value={l.qtd} onChange={(v) => set(i, { qtd: v })} />
                  {item?.unidade && <span className="shrink-0 text-[11px] text-[#888]" title="Unidade do cadastro do item">{item.unidade}</span>}
                </div>
              </td>
              <td className="px-1 py-0.5">
                <MoneyInput
                  value={l.valorUnit}
                  onChange={(v) => set(i, { valorUnit: v })}
                  onBlur={() => { if (!fila.current.includes(i)) fila.current.push(i) }}
                  className={acima ? 'text-laranja' : ''}
                  title={acima ? `Acima do preço base (${formatMoeda(base)}${porUnidade})` : undefined}
                />
              </td>
              <td className="px-1.5 text-right tabular-nums">{formatMoeda(mult(l.qtd, l.valorUnit))}</td>
              <td className="text-center">
                {/* tabIndex -1: digitando a linha no teclado, o foco pararia aqui
                    antes do fornecedor, e um Enter distraído apagaria tudo. */}
                <button
                  onClick={() => remove(i)}
                  tabIndex={-1}
                  title="Remover linha"
                  className="p-1 text-[#bbb] hover:text-perigo"
                >
                  <Trash2 size={13} />
                </button>
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      <div className="pt-1.5">
        <Link icone={Plus} onClick={add}>Adicionar linha</Link>
      </div>

      {/* Sinaliza, não bloqueia: as duas saídas lançam a nota igual, a diferença é só
          se o cadastro aprende o preço novo ou não. */}
      <Confirm
        open={!!perguntando}
        danger={false}
        focoNoCancelar
        title={`${perguntando?.nome} saiu por ${formatBRL(perguntando?.valor ?? 0)}`}
        message={
          perguntando?.combinado
            ? `O preço ${perguntando.quem ? `com ${perguntando.quem}` : 'base'} é ${formatBRL(perguntando.combinado)}${perguntando.unidade ? ` por ${perguntando.unidade}` : ''}.`
            : `Ainda não há preço ${perguntando?.quem ? `combinado com ${perguntando.quem}` : 'base'}.`
        }
        cancelLabel="Só nesta nota"
        confirmLabel={perguntando?.quem ? `Passa a ser o preço de ${perguntando.quem}` : 'Passa a ser o preço base'}
        onCancel={() => setPerguntando(null)}
        onConfirm={async () => {
          await onPrecoNovo(perguntando.itemId, perguntando.fornecedorId, perguntando.valor)
          setPerguntando(null)
        }}
      />
    </div>
  )
}

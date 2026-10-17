import { Trash2, Plus } from 'lucide-react'
import Combobox from '../ui/Combobox'
import Botao from '../ui/Botao'
import { MoneyInput } from '../ui/Numeros'
import { Secao } from '../ui/Form'

// O vínculo declarado insumo↔fornecedor, editado dos DOIS lados pelo mesmo componente:
// é a mesma tabela lida ao contrário (aba Itens do fornecedor, aba Fornecedores do item).
// Não busca nem salva nada - quem tem o `Salvar` é o painel que o hospeda.
//
// `lista` é [{ id, nome, preco }] e `catalogo` é [{ id, nome }]. `onCriar(nome)` cria a
// entidade que falta e devolve a linha nova (o quick-create de sempre: nasce só com o
// nome, incompleta). O preço é o combinado DESTE par - vazio é caso normal.
export default function VinculosEditor({ titulo, lista, onLista, catalogo, onCriar, placeholder, vazio, nota, onNovo, novoLabel }) {
  const juntar = (o) => onLista([...lista, { id: o.id, nome: o.nome, preco: 0 }])
  const preco = (id, v) => onLista(lista.map((x) => (x.id === id ? { ...x, preco: v } : x)))

  return (
    <>
      <Secao>{titulo}</Secao>
      {/* O `+` é o mesmo do campo Cliente da obra: sai daqui pro cadastro COMPLETO do
          outro lado e volta com ele já na lista, levando o rascunho junto. Quem só quer
          o nome usa o `+ Criar` do Combobox, que resolve sem sair. */}
      <div className="flex w-[320px] items-center gap-1.5 pb-2">
        <div className="flex-1">
        <Combobox
          value={null}
          limpavel={false}
          placeholder={placeholder}
          options={catalogo
            .filter((o) => !lista.some((v) => v.id === o.id))
            .map((o) => ({ id: o.id, label: o.nome, sublabel: o.unidade }))}
          onChange={(id) => {
            const o = catalogo.find((x) => x.id === id)
            if (o) juntar(o)
          }}
          // Devolve null de propósito: a linha já entra na lista aqui, e deixar o
          // Combobox "selecionar" o id só faria a caixa de adicionar ficar suja.
          onCreate={async (nome) => { juntar(await onCriar(nome)); return null }}
        />
        </div>
        {onNovo && (
          <Botao variante="acento" icone={Plus} className="px-1.5" title={novoLabel} onClick={onNovo} />
        )}
      </div>

      {lista.length === 0 ? (
        <div className="py-2 text-[#777]">{vazio}</div>
      ) : (
        <ul className="border border-grade-linha">
          <li className="flex items-center gap-2 border-b border-grade-linha bg-grade-head px-2 py-0.5">
            <span className="flex-1" />
            <span className="w-[110px] text-right">Preço combinado</span>
            <span className="w-[21px]" />
          </li>
          {lista.map((o) => (
            <li key={o.id} className="flex items-center gap-2 border-b border-grade-linha px-2 py-1 last:border-b-0">
              <span className="flex-1">{o.nome}</span>
              {/* Vazio é caso normal: nem todo par tem preço combinado, e o lançamento
                  cai no último pago ou no preço base sem reclamar. */}
              <div className="w-[110px]">
                <MoneyInput value={o.preco ?? 0} onChange={(v) => preco(o.id, v)} />
              </div>
              <button
                title="Remover"
                className="p-1 text-[#bbb] hover:text-perigo"
                onClick={() => onLista(lista.filter((x) => x.id !== o.id))}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2 text-[11px] text-[#888]">{nota}</div>
    </>
  )
}

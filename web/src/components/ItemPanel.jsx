import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Save } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import { Campos, Campo, Input, Select } from '../ui/Form'
import { MoneyInput } from '../ui/Numeros'
import VinculosEditor from './VinculosEditor'
import { criarFornecedor, criarInsumo, getFornecedores, getVinculos, patchInsumo, salvarVinculos } from '../lib/api'
import { formatData } from '../lib/format'

// Cadastro de item (tabela `insumo` - o item da saída e o insumo do orçamento são a
// MESMA coisa). `item` nulo = criar. É aqui que o `+ Criar "x"` do Combobox, que nasce
// só com o nome, vira cadastro de verdade.
export const TIPOS = { materiais: 'Materiais', mao_de_obra: 'Mão de obra' }

export default function ItemPanel({ item, onFechar, onSalvo }) {
  // Rascunho do `+` da aba Fornecedores - o outro lado da mesma ida-e-volta.
  const [rascunho] = useState(() => JSON.parse(sessionStorage.getItem('item-rascunho') || 'null'))
  useEffect(() => { sessionStorage.removeItem('item-rascunho') }, [])

  const [aba, setAba] = useState(rascunho?.aba ?? 'dados')
  const [d, setD] = useState(() => ({ tipo_custo: 'materiais', ...item, ...rascunho?.d }))
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [catalogo, setCatalogo] = useState([])
  const [forns, setForns] = useState(rascunho?.forns ?? [])

  useEffect(() => { getFornecedores().then(setCatalogo).catch(() => {}) }, [])
  useEffect(() => {
    if (item?.id && !rascunho) getVinculos('insumos', item.id).then(setForns).catch(() => {})
  }, [item?.id, rascunho])

  const navegar = useNavigate()
  const { pathname, search } = useLocation()

  // A volta do cadastro completo: `?fornecedor=3` entra na lista quando o catalogo chega.
  const fornUrl = Number(new URLSearchParams(search).get('fornecedor')) || null
  useEffect(() => {
    const o = fornUrl && catalogo.find((x) => x.id === fornUrl)
    if (o) setForns((l) => (l.some((x) => x.id === o.id) ? l : [...l, { id: o.id, nome: o.nome, preco: 0 }]))
  }, [fornUrl, catalogo])

  const irCriarFornecedor = () => {
    sessionStorage.setItem('item-rascunho', JSON.stringify({ d, forns, aba }))
    navegar(`/fornecedores/novo?voltar=${encodeURIComponent(pathname)}`)
  }

  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const campo = (k) => ({ value: d[k] ?? '', onChange: (e) => set(k, e.target.value) })

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    setSalvando(true)
    try {
      // Mesmo caminho do quick-create (POST só com o nome) e o PATCH completa - uma
      // gravação só, e o item já nasce sem a marca de incompleto.
      const id = d.id ?? (await criarInsumo(d.nome.trim())).id
      await patchInsumo(id, {
        nome: d.nome.trim(), unidade: d.unidade ?? '', tipo_custo: d.tipo_custo, preco_base: d.preco_base ?? 0,
      })
      await salvarVinculos('insumos', id, forns)
      setFaixa({ tipo: 'sucesso', texto: 'Operação executada com sucesso.' })
      onSalvo?.(id)
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Registro
      onFechar={onFechar}
      largura="md"
      titulo={d.id ? `Item: ${item.nome}` : 'Novo item'}
      aba={aba}
      onAba={setAba}
      abas={[
        { id: 'dados', label: 'Dados' },
        { id: 'fornecedores', label: `Fornecedores (${forns.length})` },
      ]}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao>
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </BarraAcao>
      }
    >
      {aba === 'dados' && (
        <Campos lbl={92} cols={2}>
          <Campo label="Nome" req largo><Input autoFocus {...campo('nome')} /></Campo>
          {/* Unidade é texto livre: m², sc 50kg, vb, diária. Lista fechada de unidade
              é o tipo de cadastro prévio que este sistema não tem. */}
          <Campo label="Unidade"><Input {...campo('unidade')} placeholder="m², kg, un..." /></Campo>
          <Campo label="Tipo">
            <Select
              value={d.tipo_custo}
              vazio={null}
              onChange={(e) => set('tipo_custo', e.target.value)}
              opcoes={Object.entries(TIPOS).map(([valor, label]) => ({ valor, label }))}
            />
          </Campo>
          {/* O padrão do catálogo: chute inicial do lançamento e da composição quando
              não há nada melhor, e a régua que pinta de âmbar quem paga acima. */}
          <Campo label="Preço base">
            <div className="w-[110px]">
              <MoneyInput value={d.preco_base ?? 0} onChange={(v) => set('preco_base', v)} />
            </div>
          </Campo>
          {d.id && (
            <>
              <Campo label="Compras">{d.compras ?? 0}</Campo>
              <Campo label="Última compra">{d.ultima ? formatData(d.ultima) : '-'}</Campo>
            </>
          )}
        </Campos>
      )}

      {aba === 'fornecedores' && (
        <VinculosEditor
          titulo="Quem fornece este item"
          placeholder="Adicionar fornecedor..."
          onNovo={irCriarFornecedor}
          novoLabel="Cadastro completo do fornecedor"
          vazio="Nenhum fornecedor declarado."
          nota="O vínculo vale nos dois sentidos."
          lista={forns}
          onLista={setForns}
          catalogo={catalogo}
          onCriar={async (nome) => {
            const novo = await criarFornecedor(nome)
            setCatalogo((c) => [...c, novo])
            return novo
          }}
        />
      )}
    </Registro>
  )
}

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Save, Ban, CircleCheck } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa, { Losango } from '../ui/Faixa'
import { Campos, Campo, Secao, Input, Texto, Check } from '../ui/Form'
import Confirm from '../ui/Confirm'
import AbaEndereco from './AbaEndereco'
import CampoTelefone from './CampoTelefone'
import VinculosEditor from './VinculosEditor'
import ExtratoCredor from './ExtratoCredor'
import { criarFornecedor, criarInsumo, getInsumos, getVinculos, patchFornecedor, salvarVinculos } from '../lib/api'
import { mascaraDoc, mascaraTel } from '../lib/format'

// Cadastro de fornecedor - o mesmo molde do de cliente, porque é a mesma tela.
// `fornecedor` nulo = criar. Aqui é onde o quick-create do Combobox (que nasce só com
// o nome e marcado incompleto) finalmente vira cadastro de verdade.
export default function FornecedorPanel({ fornecedor, onFechar, onSalvo }) {
  // O rascunho e o que o `+` da aba Itens deixou guardado antes de sair daqui (a mesma
  // ida-e-volta do campo Cliente da obra). So vale pra viagem de volta: apaga na
  // montagem, nao na leitura - o duplo render do StrictMode comeria o rascunho.
  const [rascunho] = useState(() => JSON.parse(sessionStorage.getItem('fornecedor-rascunho') || 'null'))
  useEffect(() => { sessionStorage.removeItem('fornecedor-rascunho') }, [])

  const [aba, setAba] = useState(rascunho?.aba ?? 'dados')
  const [d, setD] = useState(() => ({ ativo: 1, ...fornecedor, ...rascunho?.d }))
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [inativando, setInativando] = useState(false)
  // O que ele fornece: catálogo inteiro pra escolher, e os itens já vinculados.
  const [catalogo, setCatalogo] = useState([])
  const [itens, setItens] = useState(rascunho?.itens ?? [])

  useEffect(() => { getInsumos().then(setCatalogo).catch(() => {}) }, [])
  useEffect(() => {
    // Com rascunho na mao a lista ja e a que estava sendo editada - buscar de novo
    // desfaria o que ainda nao foi salvo.
    if (fornecedor?.id && !rascunho) getVinculos('fornecedores', fornecedor.id).then(setItens).catch(() => {})
  }, [fornecedor?.id, rascunho])

  const navegar = useNavigate()
  const { pathname, search } = useLocation()

  // A volta: `?item=3` e o item recem-cadastrado, que entra na lista assim que o
  // catalogo chega (e dele que sai o nome).
  const itemUrl = Number(new URLSearchParams(search).get('item')) || null
  useEffect(() => {
    const o = itemUrl && catalogo.find((x) => x.id === itemUrl)
    if (o) setItens((l) => (l.some((x) => x.id === o.id) ? l : [...l, { id: o.id, nome: o.nome, preco: 0 }]))
  }, [itemUrl, catalogo])

  // O `+` sai do formulario de proposito: e o cadastro COMPLETO do item (unidade,
  // tipo, preco base), que nao cabe aqui dentro. O que ja foi digitado vai junto no
  // rascunho e volta quando o item for salvo.
  const irCriarItem = () => {
    sessionStorage.setItem('fornecedor-rascunho', JSON.stringify({ d, itens, aba }))
    navegar(`/itens/novo?voltar=${encodeURIComponent(pathname)}`)
  }

  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const campo = (k) => ({ value: d[k] ?? '', onChange: (e) => set(k, e.target.value) })

  // Inativar/Ativar grava na hora (rodada 2, A23): a confirmação diz "some da lista", e
  // esperar um Salvar depois dela mentia. Manda SÓ o `ativo` (rodada 3, A2): o resto do
  // formulário não é revisto aqui, e o servidor tira a marca de incompleto de quem manda
  // campo de cadastro.
  async function mudarAtivo(ativo) {
    set('ativo', ativo)
    try {
      await patchFornecedor(d.id, { ativo })
      onSalvo?.(d.id)
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    }
  }

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    setSalvando(true)
    try {
      // Criar entra pelo mesmo POST do quick-create (só o nome) e o PATCH completa -
      // um caminho de gravação só, e o fornecedor já nasce sem a marca de incompleto.
      const id = d.id ?? (await criarFornecedor(d.nome.trim())).id
      const { id: _, incompleto: __, compras: ___, ultima: ____, total: _____, ...campos } = d
      await patchFornecedor(id, campos)
      await salvarVinculos('fornecedores', id, itens)
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
      // O extrato é grade de 9 colunas; o cadastro, formulário estreito.
      largura={aba === 'extrato' ? 'xl' : 'md'}
      titulo={d.id ? `Fornecedor: ${fornecedor.nome}` : 'Novo fornecedor'}
      aba={aba}
      onAba={setAba}
      abas={[
        { id: 'dados', label: 'Dados' },
        { id: 'endereco', label: 'Endereço' },
        { id: 'itens', label: `Itens (${itens.length})` },
        // Extrato só de quem já existe: cadastro novo não tem lançamento.
        ...(d.id ? [{ id: 'extrato', label: `Extrato (${d.compras ?? 0})` }] : []),
      ]}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao>
          {/* Cadastro novo não tem o que inativar (rodada 2, A31). */}
          {d.id && (
            <Botao
              variante="pilula"
              icone={d.ativo ? Ban : CircleCheck}
              onClick={() => (d.ativo ? setInativando(true) : mudarAtivo(1))}
              title="Some da lista, nada é apagado"
            >
              {d.ativo ? 'Inativar fornecedor' : 'Ativar fornecedor'}
            </Botao>
          )}
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </BarraAcao>
      }
    >
      {aba === 'dados' && (
        <>
          <Campos lbl={92} cols={2}>
            <Campo label="Nome" req largo><Input autoFocus {...campo('nome')} /></Campo>
            <Campo label="CNPJ">
              <div className="flex items-center gap-2">
                <div className="w-[160px]">
                  <Input {...campo('cnpj')} onChange={(e) => set('cnpj', mascaraDoc(e.target.value))} />
                </div>
                {/* Sinaliza, não bloqueia: salva sem documento e diz por que incomoda. */}
                {!d.cnpj && <Losango title="Sem CNPJ não dá pra conferir a nota" />}
              </div>
            </Campo>
            <Campo label="Insc. estadual">
              <div className="w-[160px]"><Input {...campo('ie')} /></div>
            </Campo>
            {/* Dois checks e não um tipo (§10.1): a empreiteira que também vende
                material existe. Nenhum marcado = ainda não classificado. */}
            <Campo label="Tipo" largo>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-1.5">
                <Check checked={d.fornece_material} onChange={(v) => set('fornece_material', v ? 1 : 0)}>
                  Fornece material
                </Check>
                <Check checked={d.presta_servico} onChange={(v) => set('presta_servico', v ? 1 : 0)}>
                  Presta serviço
                </Check>
              </div>
            </Campo>
          </Campos>

          <Secao>Contato</Secao>
          <Campos lbl={92} cols={2}>
            {/* Celular antes do telefone: é o número que se usa. */}
            <Campo label="Celular">
              <CampoTelefone
                valor={d.celular}
                onValor={(v) => set('celular', v)}
                marcado={d.whatsapp_celular}
                onMarcar={(v) => set('whatsapp_celular', v)}
              />
            </Campo>
            <Campo label="Telefone">
              <Input {...campo('telefone')} onChange={(e) => set('telefone', mascaraTel(e.target.value))} />
            </Campo>
            <Campo label="E-mail" largo><Input type="email" {...campo('email')} /></Campo>
            <Campo label="Responsável" largo><Input {...campo('contato')} /></Campo>
          </Campos>

          <Secao>Outras informações</Secao>
          <Campos lbl={92}>
            <Campo label="Observação">
              <Texto value={d.observacao ?? ''} onChange={(e) => set('observacao', e.target.value)} max={4000} rows={5} />
            </Campo>
          </Campos>
        </>
      )}

      {aba === 'endereco' && <AbaEndereco dados={d} set={set} />}

      {/* O que ele fornece, declarado (21/08/2026). Convive com o histórico: a aba
          Compras continua mostrando o que ele DE FATO vendeu; aqui é o que ele
          promete vender, que é o que faz um fornecedor novo sugerir alguma coisa.
          Item que falta se cria aqui mesmo, no `+ Criar` do Combobox. */}
      {aba === 'itens' && (
        <VinculosEditor
          titulo="Itens que este fornecedor fornece"
          placeholder="Adicionar item..."
          onNovo={irCriarItem}
          novoLabel="Cadastro completo do item"
          vazio="Nenhum item declarado."
          nota="O vínculo vale nos dois sentidos. Remover não apaga compra."
          lista={itens}
          onLista={setItens}
          catalogo={catalogo}
          onCriar={async (nome) => {
            const novo = await criarInsumo(nome)
            setCatalogo((c) => [...c, novo])
            return novo
          }}
        />
      )}

      {/* O histórico é a outra metade da relação: o que ele DE FATO vendeu. A aba
          Compras eram três números; o extrato (§10.2) é a lista que os soma. */}
      {aba === 'extrato' && <ExtratoCredor fornecedorId={d.id} />}

      <Confirm
        open={inativando}
        title="Inativar fornecedor?"
        message="Some da lista e do lançamento. As compras ficam no histórico."
        confirmLabel="Inativar"
        onCancel={() => setInativando(false)}
        onConfirm={() => { setInativando(false); mudarAtivo(0) }}
      />
    </Registro>
  )
}

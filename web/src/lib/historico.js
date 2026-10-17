import { formatBRL, diasAtras } from './format.js'

// Regras de relevância que emergem de saida_item - puras, sem React, testáveis.
// historico: [{ itemId, fornecedorId, valorUnit, data, saidaId }] (só linhas com item salvo)

// "Veio depois": data primeiro; empatou (rajada lança tudo no mesmo dia), quem tem
// saidaId maior foi lançado depois. Sem isso o último preço é o primeiro do dia.
const maisNovo = (a, b) => a.data > b.data || (a.data === b.data && (a.saidaId ?? 0) > (b.saidaId ?? 0))

// Último registro (preço + data) do item, de qualquer fornecedor. Alimenta o
// prefill do valor unitário e a sublinha do autocomplete.
export function ultimoDoItem(historico, itemId) {
  let melhor = null
  for (const h of historico) {
    if (h.itemId !== itemId) continue
    if (!melhor || maisNovo(h, melhor)) melhor = h
  }
  return melhor
}

// Itens do catálogo, uso mais recente primeiro, com a sublinha do último preço.
// Com `fornecedorId`, é o espelho de `ordenarFornecedores`: quem ele já vendeu (ou
// declarou na aba Itens) vem primeiro e o resto sai `oculto` - some da lista aberta
// e volta ao digitar, porque escolher fornecedor não pode impedir comprar dele um
// item novo. Item que ninguém dele forneceu ainda: não esconde nada.
export function itensSugeridos(itens, historico, fornecedorId = null, vinculos = []) {
  const ult = new Map()
  for (const h of historico) {
    const prev = ult.get(h.itemId)
    if (!prev || maisNovo(h, prev)) ult.set(h.itemId, h)
  }
  const doForn = new Set(
    fornecedorId == null ? [] : [
      ...historico.filter((h) => h.fornecedorId === fornecedorId).map((h) => h.itemId),
      ...vinculos.filter((v) => v.fornecedorId === fornecedorId).map((v) => v.itemId),
    ],
  )
  const estreitar = itens.some((i) => doForn.has(i.id))
  const quando = (id) => ult.get(id)?.data ?? ''
  return [...itens]
    .sort((a, b) => (doForn.has(b.id) - doForn.has(a.id)) || quando(b.id).localeCompare(quando(a.id)))
    .map((i) => {
      const h = ult.get(i.id)
      return {
        id: i.id,
        label: i.nome,
        sublabel: h ? `último: ${formatBRL(h.valorUnit)} - ${diasAtras(h.data)}` : undefined,
        oculto: estreitar && !doForn.has(i.id),
      }
    })
}

// Fornecedores DESTE item, com o preço em parênteses na linha. Quem nunca forneceu
// o item sai `oculto`: some da lista aberta e volta assim que a pessoa digita o nome
// - esconder de vez faria ela criar um fornecedor duplicado. Sem item escolhido:
// ordem natural do catálogo, ninguém oculto.
// `vinculos` é o cadastro declarado (aba Insumos do fornecedor): quem não tem
// histórico mas se declarou vem logo depois de quem já vendeu - preço praticado
// ganha de promessa, mas os dois ganham do resto do catálogo.
//
// `tipo` ('servico' | 'material', de `tipoDosItens`) é o desempate (UPDATE.md §10.1):
// lançar mão de obra lista prestador primeiro. Desempate e não filtro - quem já
// vendeu o item continua na frente, e ninguém some por não ter o check marcado.
export function ordenarFornecedores(fornecedores, historico, itemId, vinculos = [], tipo = null) {
  const doTipo = (f) => (tipo === 'servico' ? !!f.presta_servico : tipo === 'material' ? !!f.fornece_material : false)
  // `itemId` aceita um id ou uma lista - o fornecedor do CABEÇALHO cobra a nota
  // inteira, então ele se estreita por quem fornece QUALQUER um dos itens dela.
  const ids = [itemId].flat().filter((x) => x != null)
  if (!ids.length) {
    return [...fornecedores].sort((a, b) => doTipo(b) - doTipo(a)).map((f) => ({ id: f.id, label: f.nome }))
  }
  const ultimo = new Map()
  historico.filter((h) => ids.includes(h.itemId)).forEach((h) => {
    const prev = ultimo.get(h.fornecedorId)
    if (!prev || maisNovo(h, prev)) ultimo.set(h.fornecedorId, h)
  })
  const declarados = new Map(
    vinculos.filter((v) => ids.includes(v.itemId)).map((v) => [v.fornecedorId, v.preco ?? 0]),
  )
  const peso = (id) => (ultimo.has(id) ? 2 : declarados.has(id) ? 1 : 0)
  // Item que ninguém forneceu ainda (primeira compra) esconderia a lista inteira.
  // Aí não se esconde nada: o catálogo todo é a melhor sugestão que existe.
  const estreitar = fornecedores.some((f) => peso(f.id) > 0)
  return [...fornecedores]
    .sort((a, b) => peso(b.id) - peso(a.id) || doTipo(b) - doTipo(a))
    .map((f) => {
      const h = ultimo.get(f.id)
      const dec = declarados.get(f.id)
      const preco = h ? h.valorUnit : dec
      return {
        id: f.id,
        label: f.nome,
        // Com vários itens em jogo não existe "o preço": seria o de um item qualquer
        // da nota, e passar isso como preço do fornecedor é pior que não dizer nada.
        nota: preco && ids.length === 1 ? formatBRL(preco) : undefined,
        sublabel: h ? diasAtras(h.data)
          : declarados.has(f.id) ? 'combinado' : undefined,
        oculto: estreitar && peso(f.id) === 0,
      }
    })
}

// O que a nota compra, pelo `tipo_custo` dos itens escolhidos: 'servico' se são todos
// mão de obra, 'material' se são todos material, null se misturou ou não há item -
// aí não há o que priorizar.
export function tipoDosItens(insumos, itemId) {
  const tipos = new Set(
    [itemId].flat().filter((x) => x != null).map((id) => insumos.find((i) => i.id === id)?.tipo_custo),
  )
  if (tipos.size !== 1) return null
  const [t] = tipos
  return t === 'mao_de_obra' ? 'servico' : t === 'materiais' ? 'material' : null
}

// De onde sai o valor unitário sugerido, em ordem de quem sabe mais sobre este par:
//   1. o que já se PAGOU a este fornecedor por este item (fato consumado)
//   2. o preço COMBINADO com ele (aba Itens do fornecedor)
//   3. o último pago por este item, a qualquer fornecedor
//   4. o preço base do item (o padrão do catálogo)
// Zero quando nenhum dos quatro sabe - e aí a pessoa digita, que é o normal.
export function precoSugerido({ historico = [], vinculos = [], itens = [], itemId, fornecedorId }) {
  if (itemId == null) return 0
  if (fornecedorId != null) {
    let doPar = null
    for (const h of historico) {
      if (h.itemId !== itemId || h.fornecedorId !== fornecedorId) continue
      if (!doPar || maisNovo(h, doPar)) doPar = h
    }
    if (doPar) return doPar.valorUnit
    const v = vinculos.find((x) => x.itemId === itemId && x.fornecedorId === fornecedorId)
    if (v?.preco) return v.preco
  }
  return ultimoDoItem(historico, itemId)?.valorUnit || itens.find((i) => i.id === itemId)?.preco_base || 0
}

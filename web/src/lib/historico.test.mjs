// Self-check das regras de relevância. Roda com: node src/lib/historico.test.mjs
import assert from 'node:assert'
import { ordenarFornecedores, itensSugeridos, precoSugerido, ultimoDoItem, tipoDosItens } from './historico.js'

const forns = [{ id: 1, nome: 'São Jorge' }, { id: 2, nome: 'Cruzeiro' }, { id: 3, nome: 'Real' }]
const itens = [{ id: 10, nome: 'Cimento' }, { id: 20, nome: 'Vergalhão' }]
const hist = [
  { itemId: 10, fornecedorId: 2, valorUnit: 3000, data: '2026-06-01', saidaId: 1 },
  { itemId: 10, fornecedorId: 2, valorUnit: 3200, data: '2026-07-01', saidaId: 2 }, // mais recente do Cruzeiro
  { itemId: 10, fornecedorId: 1, valorUnit: 2900, data: '2026-06-15', saidaId: 3 },
]

// Fornecedores de quem já forneceu o item 10 vêm primeiro; o resto depois, oculto
// (some da lista aberta, volta ao digitar o nome).
const fs = ordenarFornecedores(forns, hist, 10)
assert.deepEqual(fs.map((f) => f.id).slice(0, 2).sort(), [1, 2])
assert.equal(fs[2].id, 3)
assert.equal(fs[2].sublabel, undefined)
assert.equal(fs[2].oculto, true)
assert.equal(fs[0].oculto, false)

// Último preço do Cruzeiro é o mais recente (R$ 32,00), não o antigo - em parênteses.
assert.ok(fs.find((f) => f.id === 2).nota.includes('32,00'))

// Item que ninguém forneceu ainda: não esconde ninguém, o catálogo todo é a sugestão.
assert.ok(ordenarFornecedores(forns, hist, 20).every((f) => !f.oculto && !f.nota))

// Cabeçalho: lista de itens da nota. Estreita pra quem fornece QUALQUER um deles,
// e sem preço na linha - com vários itens não existe "o preço do fornecedor".
const varios = ordenarFornecedores(forns, [
  ...hist,
  { itemId: 20, fornecedorId: 3, valorUnit: 5000, data: '2026-07-10', saidaId: 4 },
], [10, 20])
assert.deepEqual(varios.filter((f) => !f.oculto).map((f) => f.id).sort(), [1, 2, 3])
assert.ok(varios.every((f) => !f.nota))
// Um item só na lista: volta a ter preço, igual ao id solto.
assert.ok(ordenarFornecedores(forns, hist, [10]).find((f) => f.id === 2).nota.includes('32,00'))
// Linhas ainda vazias (só nulos): catálogo inteiro, nada oculto.
assert.ok(ordenarFornecedores(forns, hist, [null, null]).every((f) => !f.oculto))

// Sem item escolhido: catálogo intacto, sem sublinha e sem ocultar.
assert.deepEqual(ordenarFornecedores(forns, hist, null).map((f) => f.id), [1, 2, 3])
assert.ok(ordenarFornecedores(forns, hist, null).every((f) => !f.oculto))

// Prestador × fornecedor (UPDATE.md §10.1): o tipo desempata, não filtra.
const tipados = [
  { id: 1, nome: 'São Jorge', fornece_material: 1 },
  { id: 2, nome: 'Cruzeiro', fornece_material: 1 },
  { id: 3, nome: 'Real', presta_servico: 1 },
]
// Sem item: o prestador sobe, ninguém some.
assert.deepEqual(ordenarFornecedores(tipados, hist, null, [], 'servico').map((f) => f.id), [3, 1, 2])
assert.ok(ordenarFornecedores(tipados, hist, null, [], 'servico').every((f) => !f.oculto))
// Com histórico, quem já vendeu continua na frente do prestador que nunca vendeu.
assert.equal(ordenarFornecedores(tipados, hist, 10, [], 'servico')[2].id, 3)
// Sem tipo, ordem de antes.
assert.deepEqual(ordenarFornecedores(tipados, hist, null).map((f) => f.id), [1, 2, 3])

const insTipo = [
  { id: 10, tipo_custo: 'materiais' }, { id: 20, tipo_custo: 'mao_de_obra' }, { id: 30, tipo_custo: 'mao_de_obra' },
]
assert.equal(tipoDosItens(insTipo, 20), 'servico')
assert.equal(tipoDosItens(insTipo, [20, 30, null]), 'servico')
assert.equal(tipoDosItens(insTipo, [10]), 'material')
assert.equal(tipoDosItens(insTipo, [10, 20]), null) // misturou: nada a priorizar
assert.equal(tipoDosItens(insTipo, [null]), null)

// Itens sugeridos: usado mais recente primeiro, com o último preço geral do item.
const is = itensSugeridos(itens, hist)
assert.equal(is[0].id, 10)
assert.ok(is.find((x) => x.id === 10).sublabel.includes('32,00'))
assert.equal(is.find((x) => x.id === 20).sublabel, undefined)
assert.ok(is.every((x) => !x.oculto)) // sem fornecedor: catálogo inteiro

// Com fornecedor: só os itens dele aparecem na lista aberta (o resto volta ao digitar).
const doCruzeiro = itensSugeridos(itens, hist, 2)
assert.equal(doCruzeiro[0].id, 10)
assert.equal(doCruzeiro.find((x) => x.id === 20).oculto, true)
// Item declarado (aba Itens do fornecedor) conta igual a vendido.
assert.equal(itensSugeridos(itens, hist, 2, [{ itemId: 20, fornecedorId: 2 }])
  .find((x) => x.id === 20).oculto, false)
// Fornecedor que nunca vendeu nada: não esconde o catálogo dele.
assert.ok(itensSugeridos(itens, hist, 99).every((x) => !x.oculto))

// Último do item, de qualquer fornecedor.
assert.equal(ultimoDoItem(hist, 10).valorUnit, 3200)
assert.equal(ultimoDoItem(hist, 999), null)

// Rajada: várias notas no MESMO dia. Vale a lançada por último (saidaId maior),
// não a primeira do dia - em item, em fornecedor e no prefill.
const mesmoDia = [
  { itemId: 10, fornecedorId: 1, valorUnit: 3200, data: '2026-07-27', saidaId: 5 },
  { itemId: 10, fornecedorId: 1, valorUnit: 3300, data: '2026-07-27', saidaId: 11 },
]
assert.equal(ultimoDoItem(mesmoDia, 10).valorUnit, 3300)
assert.ok(itensSugeridos(itens, mesmoDia).find((i) => i.id === 10).sublabel.includes('33,00'))
assert.ok(ordenarFornecedores(forns, mesmoDia, 10)[0].nota.includes('33,00'))

// Vínculo declarado: o Real nunca vendeu nada, mas se declarou fornecedor do item 10.
// Fica atrás de quem tem preço praticado e à frente de quem não tem nada.
const forns4 = [...forns, { id: 4, nome: 'Ipê' }]
const dec = ordenarFornecedores(forns4, hist, 10, [{ itemId: 10, fornecedorId: 3 }])
assert.deepEqual(dec.map((f) => f.id).slice(0, 2).sort(), [1, 2])
assert.equal(dec[2].id, 3)
assert.equal(dec[2].sublabel, 'combinado')
assert.equal(dec[2].oculto, false) // declarado também é "quem tem o item"
assert.equal(dec[3].id, 4)
assert.equal(dec[3].oculto, true)
// Vínculo de OUTRO item não mexe na ordem.
assert.equal(ordenarFornecedores(forns4, hist, 10, [{ itemId: 20, fornecedorId: 4 }])[3].id, 4)

// Preço combinado aparece em parênteses pra quem nunca vendeu; sem preço, só a promessa.
const comPreco = ordenarFornecedores(forns4, hist, 10, [
  { itemId: 10, fornecedorId: 3, preco: 2800 },
  { itemId: 10, fornecedorId: 4, preco: 0 },
])
assert.ok(comPreco.find((f) => f.id === 3).nota.includes('28,00'))
assert.equal(comPreco.find((f) => f.id === 4).nota, undefined)
assert.equal(comPreco.find((f) => f.id === 4).sublabel, 'combinado')

// A cascata do preço sugerido, do que sabe mais pro que sabe menos.
const cat = [{ id: 10, nome: 'Cimento', preco_base: 2500 }, { id: 20, nome: 'Vergalhão' }]
const vinc = [{ itemId: 10, fornecedorId: 3, preco: 2800 }]
const p = (itemId, fornecedorId) => precoSugerido({ historico: hist, vinculos: vinc, itens: cat, itemId, fornecedorId })
assert.equal(p(10, 2), 3200)   // 1. já pagou 32,00 ao Cruzeiro
assert.equal(p(10, 3), 2800)   // 2. nunca comprou do Real, mas combinou 28,00
assert.equal(p(10, 4), 3200)   // 3. Ipê não tem nada: cai no último do item
assert.equal(p(10, null), 3200)
assert.equal(p(20, 1), 0)      // Vergalhão não tem histórico nem preço base
assert.equal(p(10, 4) && precoSugerido({ itens: cat, itemId: 10 }), 2500) // 4. só o base
assert.equal(precoSugerido({ itens: cat, itemId: null }), 0)

console.log('ok')

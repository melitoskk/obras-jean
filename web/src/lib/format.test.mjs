// docker compose run --rm web node src/lib/format.test.mjs
// Cobre dinheiro (qtd real × centavos), máscaras e a aritmética de período.
// O resto é Intl e não vale teste.
import assert from 'node:assert/strict'
import {
  mult, formatQtd, formatMoeda, lerQtd, lerColado, teclaCorrida,
  mascaraDoc, mascaraCep, mascaraTel, duracaoEntre, linkWhats, plural,
} from './format.js'

// A linha 4.2 da referência: 100 × 5.145,00 = 514.500,00
assert.equal(mult(100, 514500), 51450000)
assert.equal(mult(100, 5500), 550000)

// Fração de quantidade não pode vazar float pro estado.
assert.equal(mult(1.5, 333), 500) // 499,5 -> 500
assert.equal(mult(0.1, 3), 0) // 0,3 centavo -> 0
assert.equal(mult(120, 2000), 240000) // Cimento: 120 × R$ 20,00 = R$ 2.400,00

// Meio-para-cima simétrico: Math.round(-0.5) daria -0.
assert.equal(mult(-1.5, 333), -500)
assert.equal(mult(0, 999), 0)
assert.equal(mult(undefined, 999), 0)

assert.equal(formatQtd(1300), '1.300,00')
assert.equal(formatMoeda(51450000), '514.500,00')

// Máscaras: parcial enquanto digita, e CPF vira CNPJ ao passar de 11 dígitos.
assert.equal(mascaraDoc('123'), '123')
assert.equal(mascaraDoc('12345678901'), '123.456.789-01')
assert.equal(mascaraDoc('18207000000151'), '18.207.000/0001-51')
assert.equal(mascaraDoc('182070000001519999'), '18.207.000/0001-51') // trunca em 14
assert.equal(mascaraDoc(''), '')
assert.equal(mascaraDoc(null), '')
assert.equal(mascaraCep('80010000'), '80010-000')
assert.equal(mascaraTel('4133412587'), '(41) 3341-2587')
assert.equal(mascaraTel('41988887777'), '(41) 98888-7777')

// Período: o caso da referência (02/11/2017 a 02/11/2018 = 12 meses).
assert.equal(duracaoEntre('2017-11-02', '2018-11-02', 'meses'), 12)
assert.equal(duracaoEntre('2017-11-02', '2017-12-02', 'dias'), 30)

// Mês só conta com o dia cumprido.
assert.equal(duracaoEntre('2017-11-02', '2018-11-01', 'meses'), 11)
assert.equal(duracaoEntre('2017-11-02', '', 'meses'), '')

// Atraso do período realizado: fim previsto → fim real, em dias, e negativo adianta.
assert.equal(duracaoEntre('2026-08-01', '2026-08-13', 'dias'), 12)
assert.equal(duracaoEntre('2026-08-01', '2026-07-25', 'dias'), -7)

// WhatsApp: o wa.me exige DDI, e o número na tela está mascarado.
assert.equal(linkWhats('(51) 99876-5432'), 'https://wa.me/5551998765432')
assert.equal(linkWhats('(51) 3333-4444'), 'https://wa.me/555133334444')   // fixo entra igual
assert.equal(linkWhats('55 51 99876-5432'), 'https://wa.me/5551998765432') // não duplica o DDI
assert.equal(linkWhats('99876-5432'), null)  // sem DDD não dá pra discar
assert.equal(linkWhats(''), null)
assert.equal(linkWhats(null), null)

// Plural: só o 1 é singular. Zero é plural em português.
assert.equal(plural(1, 'mês', 'meses'), '1 mês')
assert.equal(plural(12, 'mês', 'meses'), '12 meses')
assert.equal(plural(0, 'dia', 'dias'), '0 dias')

console.log('format ok')

// Quantidade se digita como se fala: "50" são 50 sacos, não 0,50 (rodada 1, A3).
assert.equal(lerQtd(''), 0)
assert.equal(lerQtd('50'), 50)
assert.equal(lerQtd('50,00'), 50)
assert.equal(lerQtd('8,5'), 8.5)
assert.equal(lerQtd('1.234,5'), 1234.5)
assert.equal(lerQtd('1.300,00'), 1300) // o que o campo mostra volta igual ao focar
assert.equal(lerQtd('1234.56'), 1234.56) // ponto decimal de quem vem do teclado americano
assert.equal(lerQtd('1.234'), 1234) // ponto com 3 casas é milhar no pt-BR
assert.equal(lerQtd('1.5'), 1.5)
assert.equal(lerQtd('1.234.567'), 1234567)
assert.equal(lerQtd('R$ 1 234,56'), 1234.56)
assert.equal(lerQtd('0,333'), 0.33) // 2 casas, como o campo mostra
assert.equal(lerQtd('abc'), 0)

// Dinheiro e % colados (rodada 2, A16): o texto colado é um número escrito, não uma
// sequência de teclas de caixa eletrônico. Centésimos inteiros (centavo ou ponto-base).
assert.equal(lerColado('1.234,5'), 123450)
assert.equal(lerColado('1234.56'), 123456)
assert.equal(lerColado('R$ 1 234,56'), 123456)
assert.equal(lerColado('1234'), 123400) // da planilha: R$ 1.234,00, não 12,34
assert.equal(lerColado('abc'), 0)

// Digitação corrida pela tecla. Sem vírgula, caixa eletrônico (Jean, 17/10/2026):
// 450 = 4,50. Com vírgula, o que veio antes são reais e o que vem depois, centavos:
// "1.234,5" digitado dá 1.234,50 (rodada 2, A16), não 123,45. O ponto é de milhar.
const digita = (teclas, ini = { valor: 0, casas: null }) =>
  [...teclas].reduce((e, t) => teclaCorrida(e, t === '<' ? 'Backspace' : t, false), ini)
assert.equal(digita('450').valor, 450)
assert.equal(digita('45000').valor, 45000)
assert.equal(digita('1.234,5').valor, 123450)
assert.equal(digita('1.234,56').valor, 123456)
assert.equal(digita('1.234,567').valor, 123456) // terceira casa não entra
assert.equal(digita('10,').valor, 1000) // 10,00 (% ou R$)
assert.equal(digita(',5').valor, 50)
assert.equal(digita('12,3,4').valor, 1234) // segunda vírgula não faz nada
assert.equal(digita('12,34<').valor, 1230)
assert.equal(digita('12,34<<').valor, 1200)
// Depois da vírgula o Backspace só apaga dígito, nunca volta pro caixa eletrônico no
// meio da edição (rodada 3, A1): "1.234,5" + 2 Backspaces era 12,34.
assert.equal(digita('1.234,5<').valor, 123400)
assert.equal(digita('1.234,5<<').valor, 12300) // apagou o 4: 123,00
assert.equal(digita('1.234,5<<,7').valor, 12370)
assert.equal(digita('12,34<<<').valor, 100) // 12,30 → 12,00 → 1,00
assert.equal(digita('12,34<<<5').valor, 150) // segue nos centavos: 1,50
assert.equal(digita('12,<<<').valor, 0)
assert.equal(digita('123<').valor, 12)
// Tudo selecionado: a primeira tecla recomeça do zero.
assert.equal(teclaCorrida({ valor: 99900, casas: null }, '7', true).valor, 7)
assert.equal(teclaCorrida({ valor: 99900, casas: 2 }, ',', true).casas, 0)
assert.equal(teclaCorrida({ valor: 99900, casas: null }, 'Backspace', true).valor, 0)
// Tecla que não é da corrida devolve null: o campo deixa passar (Tab, setas).
assert.equal(teclaCorrida({ valor: 1, casas: null }, 'Tab', false), null)

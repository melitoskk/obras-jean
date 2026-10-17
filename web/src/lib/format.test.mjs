// docker compose run --rm web node src/lib/format.test.mjs
// Cobre dinheiro (qtd real × centavos), máscaras e a aritmética de período.
// O resto é Intl e não vale teste.
import assert from 'node:assert/strict'
import {
  mult, formatQtd, formatMoeda,
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

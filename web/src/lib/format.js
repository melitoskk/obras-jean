// Dinheiro é SEMPRE centavos inteiros no estado; quantidade é REAL (não é dinheiro).
// Só vira string na hora de mostrar.

const f2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// "631.200,00" - o que os grids da referência mostram (sem R$ na célula).
export const formatMoeda = (centavos) => f2.format((centavos ?? 0) / 100)

// "R$ 631.200,00" - títulos, KPIs e rodapés de total.
export const formatBRL = (centavos) =>
  ((centavos ?? 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// "1.300,00" - quantidade em 2 casas, que é como se compra e se mede.
export const formatQtd = (qtd) => f2.format(qtd ?? 0)

// O que se digitou no campo de quantidade -> número com 2 casas. Vírgula é a decimal; sem
// vírgula, ponto com 3 dígitos depois é milhar ("1.234") e com outro tanto é decimal
// ("1234.56", teclado americano). Qualquer outra coisa (R$, espaço, letra) é ignorada.
export function lerQtd(texto) {
  let t = (texto ?? '').replace(/[^\d.,]/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.').replace(/,/g, '')
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '')
  const n = parseFloat(t)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

// Dinheiro e % COLADOS (rodada 2, A16): o texto vem escrito, então lê como número -
// "1.234,5" é 1.234,50 e "1234" da planilha é 1.234,00. Centésimos inteiros: centavo
// no dinheiro, ponto-base no %.
export const lerColado = (texto) => Math.round(lerQtd(texto) * 100)

// Digitação corrida, uma tecla por vez. `valor` em centésimos; `casas` é null antes da
// vírgula (caixa eletrônico: 450 = 4,50 - decidido com o Jean em 17/10/2026) e 0-2
// depois dela, quando o que veio antes vira reais e cada dígito preenche um centavo:
// "1.234,5" = 1.234,50 (rodada 2, A16). O ponto é de milhar e não faz nada. `tudo` =
// conteúdo selecionado: recomeça do zero. Devolve null pra tecla que não é da corrida.
export function teclaCorrida(estado, tecla, tudo) {
  const { valor, casas } = tudo ? { valor: 0, casas: null } : estado
  if (/^\d$/.test(tecla)) {
    const d = Number(tecla)
    if (casas === null) return String(valor * 10 + d).length <= 15 ? { valor: valor * 10 + d, casas } : estado
    if (casas === 0) return { valor: valor + d * 10, casas: 1 }
    if (casas === 1) return { valor: valor + d, casas: 2 }
    return { valor, casas }
  }
  if (tecla === ',') return casas === null ? { valor: valor * 100, casas: 0 } : { valor, casas }
  if (tecla === '.') return { valor, casas }
  if (tecla === 'Backspace' || tecla === 'Delete') {
    if (tudo) return { valor: 0, casas: null }
    if (casas === 2) return { valor: valor - (valor % 10), casas: 1 }
    if (casas === 1) return { valor: valor - (valor % 100), casas: 0 }
    if (casas === 0) return { valor: valor / 100, casas: null }
    return { valor: Math.floor(valor / 10), casas }
  }
  return null
}

// Meio-para-cima, simétrico no negativo. Math.round sozinho erra em -0,5.
const round = (x) => (x < 0 ? -Math.round(-x) : Math.round(x))

// qtd (real) × preço unitário (centavos) -> centavos inteiros. Todo total do
// orçamento passa por aqui; é o único lugar onde real encosta em dinheiro.
export const mult = (qtd, centavos) => round((qtd ?? 0) * (centavos ?? 0))

// Datas em ISO (YYYY-MM-DD) no estado; só formata na exibição.
export const hoje = () => new Date().toISOString().slice(0, 10)

// `S-000412` - o número do lançamento como se cita (UPDATE.md §9). Prefixo por tipo
// porque entrada e saída têm contadores separados; 6 dígitos como o da estimativa.
export const numeroLancamento = (tipo, n) =>
  n == null ? '' : `${tipo === 'entrada' ? 'E' : 'S'}-${String(n).padStart(6, '0')}`

export const formatData = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '')

// "hoje" / "ontem" / "há N dias" - sublinha do combobox de fornecedor.
export const diasAtras = (iso) => {
  const dias = Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000)
  return dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`
}

// Ponto-base (1500) -> "15,00". Percentual guardado inteiro, mesmo motivo do centavo.
export const formatPct = (pontoBase) => f2.format((pontoBase ?? 0) / 100)

// Percentual numérico. Total zero não vira NaN: sem base não há percentual.
export const pct = (parte, total) => (total > 0 ? (parte / total) * 100 : 0)

// Normaliza pra busca: sem acento, sem case.
export const norm = (s) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Máscaras ────────────────────────────────────────────────────────────────────
// Aplicam enquanto se digita e guardam o texto formatado - é o que a referência
// mostra no grid, e reformatar na exibição custaria uma volta a mais por célula.
const aplica = (digitos, molde) => {
  let saida = ''
  let i = 0
  for (const c of molde) {
    if (i >= digitos.length) break
    if (c === '#') saida += digitos[i++]
    else saida += c
  }
  return saida
}

// CPF até 11 dígitos, CNPJ a partir daí. O tipo do cliente não decide: quem digita
// 14 dígitos quer CNPJ, e travar pelo radio só cria campo que "não aceita".
export const mascaraDoc = (v) => {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 14)
  return aplica(d, d.length <= 11 ? '###.###.###-##' : '##.###.###/####-##')
}

export const mascaraCep = (v) => aplica((v ?? '').replace(/\D/g, '').slice(0, 8), '#####-###')

// 8 dígitos = fixo, 9 = celular.
export const mascaraTel = (v) => {
  const d = (v ?? '').replace(/\D/g, '').slice(0, 11)
  return aplica(d, d.length <= 10 ? '(##) ####-####' : '(##) #####-####')
}

// Link do WhatsApp. O wa.me quer só dígitos e COM DDI - sem o 55 ele abre a conversa
// errada (ou nenhuma). Fixo de 8 dígitos entra igual: quem marcou o número como zap
// sabe se aquele fixo tem conta, e não é o sistema que vai duvidar.
// Devolve null quando não dá pra montar um número plausível - aí o botão nem aparece.
export function linkWhats(tel) {
  let d = (tel ?? '').replace(/\D/g, '')
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2) // já veio com DDI
  if (d.length !== 10 && d.length !== 11) return null // sem DDD não dá pra discar
  return `https://wa.me/55${d}`
}

// "1 mês" / "12 meses" - o "mês(es)" de formulário é rótulo de sistema, não frase.
// Zero é plural em português ("0 meses"), então só o 1 é caso especial.
export const plural = (n, um, muitos) => `${n} ${n === 1 ? um : muitos}`

// ── Período ─────────────────────────────────────────────────────────────────────
// `somaDuracao` (data início + duração = data fim) saiu em 14/08/2026 junto com o
// campo de duração do cadastro de obra: sem campo pra calcular, era código morto.
//
// Quantas unidades cabem entre as duas datas. Mês só conta quando o dia já passou -
// 02/11/2017 a 01/11/2018 são 11 meses, não 12.
export function duracaoEntre(inicio, fim, unidade) {
  if (!inicio || !fim) return ''
  const [a1, m1, d1] = inicio.split('-').map(Number)
  const [a2, m2, d2] = fim.split('-').map(Number)
  if (unidade === 'dias') {
    return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000)
  }
  return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

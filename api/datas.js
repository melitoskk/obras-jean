// Data de calendário que o servidor aceita (rodada 1, A18): AAAA-MM-DD que exista de
// verdade (sem 31/02) e com ano entre 2000 e 2100 - "62027" digitado no campo de data
// passava e quebrava relatório, prazo e ordenação.
export function dataValida(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const [a, m, d] = s.split('-').map(Number)
  if (a < 2000 || a > 2100) return false
  const dt = new Date(Date.UTC(a, m - 1, d))
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

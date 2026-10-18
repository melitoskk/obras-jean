// CSV que abre no Excel-BR sem ninguém mexer em nada: BOM + separador ";" + decimal
// com vírgula. Usam o export.csv da obra e o extrato do credor - fica separado porque a
// regra do Excel-BR não é assunto de rota.

export const csvCampo = (v) => {
  const s = String(v ?? '')
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const reais = (centavos) => ((centavos ?? 0) / 100).toFixed(2).replace('.', ',')

export function enviarCsv(res, nome, cabecalho, linhas) {
  const csv = [cabecalho.join(';'), ...linhas.map((l) => l.map(csvCampo).join(';'))].join('\r\n')
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  // `filename*` leva o nome com acento (rodada 3, A16); `filename` é o reserva ASCII de
  // navegador antigo, sem acento em vez de com "_" no lugar da letra.
  const ascii = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '_')
  res.setHeader('Content-Disposition',
    `attachment; filename="${ascii}.csv"; filename*=UTF-8''${encodeURIComponent(`${nome}.csv`)}`)
  res.send('﻿' + csv) // BOM explícito: sem ele o Excel-BR come os acentos
}

// `S-000412` - o número do lançamento como se cita (UPDATE.md §9). Mesmo formato de
// numeroLancamento em web/src/lib/format.js; os CSVs são o único lugar do servidor que o escreve.
export const numeroLancamento = (tipo, n) =>
  n == null ? '' : `${tipo === 'entrada' ? 'E' : 'S'}-${String(n).padStart(6, '0')}`

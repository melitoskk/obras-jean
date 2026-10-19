import { Link } from 'react-router-dom'
import { formatMoeda } from '../lib/format'

// O número que se procura primeiro ao abrir a obra (UPDATE.md §11.1), em cima das
// abas - vale pra todas. São DOIS números, lado a lado e cada um com a sua conta
// escrita embaixo, porque saldo e caixa usam as mesmas parcelas e trocar um pelo
// outro dá um valor plausível e errado (o mesmo motivo de fluxo.test.mjs existir).
// Saldo primeiro e maior: é a pergunta "a obra está no azul?".
export default function DestaqueSaldo({ obraId, saldo = 0, caixa = 0, aPagar = 0, aReceber = 0, taxaDevida = 0 }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2 pb-2">
      <Indicador rotulo="Saldo" conta="entradas − tudo lançado" valor={saldo} grande />
      <Indicador rotulo="Caixa" conta="entradas − só o que foi pago" valor={caixa} />
      {/* A diferença entre os dois, quando existe: é ela que explica por que não batem. */}
      {/* Clica e vê as contas, por vencimento (rodada 2, A5). */}
      {aPagar > 0 && (
        <Link
          to={`/relatorios?r=apagar${obraId ? `&obra=${obraId}` : ''}`}
          title="Ver as contas a pagar por vencimento"
          className="flex min-w-[140px] flex-col justify-center border border-grade-linha bg-[#fdf6ea] px-3 py-1.5 hover:border-laranja"
        >
          <span className="text-rotulo">A pagar</span>
          <b className="text-[17px] leading-tight tabular-nums text-laranja">R$ {formatMoeda(aPagar)}</b>
          <span className="text-[11px] text-[#888]">lançado, ainda sem o Pago · ver contas</span>
        </Link>
      )}
      {/* A taxa de administração já devida, das fases concluídas (Jean, 18/10/2026). */}
      {taxaDevida > 0 && (
        <div className="flex min-w-[140px] flex-col justify-center border border-grade-linha px-3 py-1.5">
          <span className="text-rotulo">Taxa devida</span>
          <b className="text-[17px] leading-tight tabular-nums text-[#333]">R$ {formatMoeda(taxaDevida)}</b>
          <span className="text-[11px] text-[#888]">fases concluídas</span>
        </div>
      )}
      {/* Quanto o cliente ainda deve - previsão fase a fase (relatorio.js aReceberPrevisto),
          e por isso a conta embaixo. */}
      {aReceber > 0 && (
        <div className="flex min-w-[140px] flex-col justify-center border border-grade-linha bg-[#f4f8fc] px-3 py-1.5">
          <span className="text-rotulo">A receber (previsto)</span>
          <b className="text-[17px] leading-tight tabular-nums text-titulo">R$ {formatMoeda(aReceber)}</b>
          <span className="text-[11px] text-[#888]">custo previsto + taxa − recebido</span>
        </div>
      )}
    </div>
  )
}

// Sinal claro: verde no azul, vermelho no negativo, e o sinal escrito - cor sozinha
// some na tela projetada e em quem não distingue vermelho de verde.
function Indicador({ rotulo, conta, valor, grande }) {
  const negativo = valor < 0
  return (
    <div
      className={`flex min-w-[170px] flex-col justify-center border px-3 py-1.5 ${
        negativo ? 'border-[#f0c7c5] bg-[#fbe6e5]' : 'border-[#c3e2c3] bg-[#eef8ee]'
      }`}
    >
      <span className="text-rotulo">{rotulo}</span>
      <b className={`leading-tight tabular-nums ${grande ? 'text-[24px]' : 'text-[17px]'} ${negativo ? 'text-perigo' : 'text-[#3d833d]'}`}>
        {negativo ? '− ' : '+ '}R$ {formatMoeda(Math.abs(valor))}
      </b>
      <span className="text-[11px] text-[#888]">{conta}</span>
    </div>
  )
}

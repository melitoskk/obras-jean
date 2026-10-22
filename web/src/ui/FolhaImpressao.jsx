import Logo from './Logo'

// Dados do cartão CNPJ (emitido em 21/10/2026). Mudou endereço ou telefone, é aqui.
const EMPRESA = {
  razao: 'Oak Construtora e Incorporadora Ltda',
  cnpj: '69.728.191/0001-09',
  endereco: 'R. Dona Carlinda, 500, sala 22 · Centro · Canela/RS · CEP 95680-224',
  email: 'arquitetojeanrosa@hotmail.com',
  telefone: '(54) 8418-8413',
}

// A folha que vira PDF (o "Salvar como PDF" do navegador - ver o @media print do
// index.css). O rodapé da empresa sai em TODA página: na impressão ele é `fixed`, que o
// Chrome repete por página, e o `tfoot` vazio - que a tabela também repete - reserva a
// altura dele no pé de cada uma, senão o conteúdo correria por baixo. Na tela, o rodapé
// fica só no fim e o espaçador some.
export default function FolhaImpressao({ className = '', children }) {
  return (
    <div className={`folha-impressao ${className}`}>
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="p-0 align-top">
              <div className="flex flex-col gap-4">{children}</div>
            </td>
          </tr>
        </tbody>
        <tfoot className="hidden print:table-footer-group">
          <tr><td className="p-0"><div className="h-[17mm]" /></td></tr>
        </tfoot>
      </table>
      <Rodape />
    </div>
  )
}

// O texto é centrado na logo pelas LETRAS, não pela caixa da linha: o `text-box` corta
// a linha na altura das maiúsculas e na linha de base. Sem isso, a Segoe UI (Windows)
// sobra espaço embaixo da letra e o texto parece subir em relação ao meio da logo.
const LINHAS = 'flex flex-col gap-[7px] [&>p]:[text-box:trim-both_cap_alphabetic]'

function Rodape() {
  return (
    <footer className="mt-4 flex items-center gap-3 border-t-2 border-marca bg-white pt-2 text-[10px] text-[#555] print:fixed print:inset-x-0 print:bottom-0 print:mt-0">
      <Logo className="h-8 shrink-0 text-marca [&>svg]:block" />
      <div className={`min-w-0 flex-1 ${LINHAS}`}>
        <p><b className="uppercase text-[#333]">{EMPRESA.razao}</b> · CNPJ {EMPRESA.cnpj}</p>
        <p>{EMPRESA.endereco}</p>
      </div>
      <div className={`items-end ${LINHAS}`}>
        <p>{EMPRESA.email}</p>
        <p>{EMPRESA.telefone}</p>
      </div>
    </footer>
  )
}

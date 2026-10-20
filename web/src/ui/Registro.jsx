import { useEffect } from 'react'
import { X, ArrowLeft } from 'lucide-react'
import Abas from './Abas'
import Tela from './Tela'
import Botao from './Botao'

// O modal-registro da referência: título azul em negrito, × à direita, faixa de abas,
// corpo rolável e barra de ação colada no rodapé. `destaque` fica entre o título e as
// abas: é o que vale pra todas elas (o saldo da obra, UPDATE.md §11.1). Substitui o SidePanel - os cadastros
// da referência são todos assim.
// Esc fecha. Clique fora NÃO fecha: é formulário, não menu, e perder o preenchido por
// um clique torto é o tipo de coisa que ninguém perdoa.
// Registros abertos, do de baixo pro de cima. Um pode abrir sobre outro (o perfil por
// cima do usuário): Esc fecha só o de cima, não a pilha inteira.
const pilha = []

const LARGURAS = { md: 'max-w-3xl', lg: 'max-w-5xl', xl: 'max-w-7xl', full: 'max-w-none' }

export default function Registro({
  aberto = true,
  onFechar,
  titulo,
  abas,
  aba,
  onAba,
  largura = 'lg',
  faixa,
  acoes,
  destaque,
  pagina = false,
  children,
}) {
  useEffect(() => {
    // Em página, Esc não fecha: não há overlay pra dispensar, e "Esc me joga pra
    // lista" no meio de um formulário é o mesmo estrago que o clique fora.
    if (!aberto || !onFechar || pagina) return
    // `defaultPrevented`: um campo dentro já usou o Esc (a lista do Combobox, por exemplo).
    const eu = {}
    pilha.push(eu)
    const onKey = (e) => e.key === 'Escape' && !e.defaultPrevented && pilha.at(-1) === eu && onFechar()
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); pilha.splice(pilha.indexOf(eu), 1) }
  }, [aberto, onFechar, pagina])

  if (!aberto) return null

  // O mesmo registro, sem overlay: cabeçalho, abas, corpo e ações do jeito que já
  // são - só a moldura muda. É o que deixa a Obra ser tela sem duplicar o painel.
  if (pagina) {
    // Voltar colado no título, não na ponta direita: quem lê "Obra: X" já tem a
    // saída ao lado do olho, sem varrer a tela inteira.
    return (
      <Tela
        titulo={
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate">{titulo}</span>
            {onFechar && (
              <Botao className="shrink-0" icone={ArrowLeft} onClick={onFechar}>Voltar</Botao>
            )}
          </span>
        }
      >
        {destaque}
        {abas && <Abas abas={abas} ativa={aba} onChange={onAba} />}
        <div className="min-h-0 flex-1 overflow-auto pt-3">{children}</div>
        {faixa}
        {acoes}
      </Tela>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-center bg-black/25 p-0 sm:p-4">
      <div className={`flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-full ${LARGURAS[largura]}`}>
        <header className="flex shrink-0 items-start gap-3 px-4 pt-3 pb-2">
          <h1 className="min-w-0 flex-1 text-[19px] leading-tight font-bold text-titulo">{titulo}</h1>
          {onFechar && (
            <button type="button" onClick={onFechar} title="Fechar" className="mt-0.5 text-[#5b9bd5] hover:text-titulo">
              <X size={18} />
            </button>
          )}
        </header>

        {destaque && <div className="px-4">{destaque}</div>}
        {abas && <Abas abas={abas} ativa={aba} onChange={onAba} />}

        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>

        {faixa}
        {acoes}
      </div>
    </div>
  )
}

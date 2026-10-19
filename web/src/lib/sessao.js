import { createContext, useContext } from 'react'

// Quem está logado, o perfil e as permissões (UPDATE.md §5). A tela só ESCONDE o que o
// servidor já recusaria - quem decide é api/auth.js. As permissões são as do perfil do
// usuário, ou as personalizadas dele (19/10/2026).
export const Sessao = createContext({ usuario: null, perfil: null, permissoes: [] })
export const useSessao = () => useContext(Sessao)
// `pode('lancar')` - a mesma pergunta que o servidor faz, com o mesmo nome.
export const usePode = () => {
  const { permissoes = [] } = useSessao()
  return (p) => permissoes.includes(p)
}

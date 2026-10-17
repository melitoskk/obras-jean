import { createContext, useContext } from 'react'

// Quem está logado e com que papel (UPDATE.md §5). A tela só ESCONDE o que o
// servidor já recusaria - quem decide é api/auth.js.
export const Sessao = createContext({ usuario: null, papel: null })
export const useSessao = () => useContext(Sessao)
export const PAPEIS = {
  admin: 'Administrador',
  escritorio: 'Escritório',
  campo: 'Campo',
}

import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { login } from '../lib/api'
import Botao from '../ui/Botao'
import Logo from '../ui/Logo'
import { Campos, Campo, Input } from '../ui/Form'

// Gate de rede interna: um formulário centralizado, nada mais. Sem "esqueci a senha",
// sem cadastro - usuário se cria na tela de Usuários, pelo administrador.
export default function Login({ onEntrar }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function entrar(e) {
    e.preventDefault()
    setErro('')
    try {
      onEntrar(await login(usuario, senha))
    } catch {
      setErro('Usuário ou senha inválidos.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececee] p-4">
      <form onSubmit={entrar} className="w-full max-w-[340px] border border-grade-linha bg-white shadow-lg">
        <div className="flex flex-col items-center gap-2 bg-rail px-5 py-6">
          <Logo variante="vertical" className="h-28 text-marca" />
        </div>

        <div className="px-5 py-5">
          <Campos lbl={56}>
            <Campo label="Usuário">
              <Input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus autoComplete="username" />
            </Campo>
            <Campo label="Senha">
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
            </Campo>
          </Campos>
          {erro && <p className="mt-2 text-perigo">{erro}</p>}
        </div>

        <div className="flex justify-end border-t border-grade-linha bg-[#f7f7f7] px-3 py-2">
          <Botao type="submit" variante="acento" icone={LogIn}>Entrar</Botao>
        </div>
      </form>
    </div>
  )
}

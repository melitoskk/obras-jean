import { useState } from 'react'
import { KeyRound, LogOut, Save } from 'lucide-react'
import { trocarMinhaSenha } from '../lib/api'
import Botao, { BarraAcao } from '../ui/Botao'
import Logo from '../ui/Logo'
import Registro from '../ui/Registro'
import Faixa from '../ui/Faixa'
import { Campos, Campo, Input } from '../ui/Form'

// Troca da própria senha, em dois lugares: a tela obrigatória de quem entrou com senha
// provisória (conta nova ou redefinida pelo administrador) e o "Trocar senha" do menu.
// Na provisória a atual não é pedida - acabou de ser digitada no login.
function useTroca(provisoria, onTrocada) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function salvar(e) {
    e?.preventDefault()
    setErro('')
    if (nova !== confirma) return setErro('A confirmação não bate com a nova senha.')
    setSalvando(true)
    try {
      onTrocada(await trocarMinhaSenha(provisoria ? undefined : atual, nova))
    } catch (err) {
      setErro(err.erro ? `${err.erro[0].toUpperCase()}${err.erro.slice(1)}.` : 'Não foi possível trocar a senha.')
    } finally {
      setSalvando(false)
    }
  }

  const campos = (
    <Campos lbl={112}>
      {!provisoria && (
        <Campo label="Senha atual">
          <Input type="password" autoFocus value={atual} onChange={(e) => setAtual(e.target.value)} autoComplete="current-password" />
        </Campo>
      )}
      <Campo label="Nova senha">
        <Input type="password" autoFocus={provisoria} value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" placeholder="Ao menos 6 caracteres" />
      </Campo>
      <Campo label="Confirmar">
        <Input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
      </Campo>
    </Campos>
  )
  return { campos, erro, setErro, salvar, salvando }
}

// Tela cheia, no lugar do sistema: não há como seguir sem trocar (a API também barra).
export default function TrocarSenha({ usuario, onTrocada, onSair }) {
  const { campos, erro, salvar, salvando } = useTroca(true, onTrocada)
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#ececee] p-4">
      <form onSubmit={salvar} className="w-full max-w-[380px] border border-grade-linha bg-white shadow-lg">
        <div className="flex flex-col items-center gap-2 bg-rail px-5 py-6">
          <Logo variante="vertical" className="h-28 text-marca" />
        </div>
        <div className="px-5 py-5">
          <p className="pb-4 text-[#555]">
            Olá, <b className="text-titulo">{usuario}</b>. Sua senha é provisória: crie uma senha sua para continuar.
          </p>
          {campos}
          {erro && <p className="mt-2 text-perigo">{erro}</p>}
        </div>
        <div className="flex justify-between border-t border-grade-linha bg-[#f7f7f7] px-3 py-2">
          <Botao icone={LogOut} onClick={onSair}>Sair</Botao>
          <Botao type="submit" variante="acento" icone={KeyRound} disabled={salvando}>Trocar e entrar</Botao>
        </div>
      </form>
    </div>
  )
}

// O "Trocar senha" do menu do usuário: pede a atual.
export function TrocarSenhaPanel({ onFechar }) {
  const [ok, setOk] = useState(false)
  const { campos, erro, setErro, salvar, salvando } = useTroca(false, () => setOk(true))
  return (
    <Registro
      onFechar={onFechar}
      largura="md"
      titulo="Trocar senha"
      faixa={
        (erro && <Faixa tipo="erro" onFim={() => setErro('')}>{erro}</Faixa>)
        || (ok && <Faixa tipo="sucesso" ms={1500} onFim={onFechar}>Senha trocada.</Faixa>)
      }
      acoes={
        <BarraAcao>
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando || ok}>Salvar</Botao>
        </BarraAcao>
      }
    >
      <form onSubmit={salvar} className="max-w-md">
        {campos}
        {/* Enter num campo salva, como num formulário comum. */}
        <button type="submit" hidden />
      </form>
    </Registro>
  )
}

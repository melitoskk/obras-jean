import { useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import Confirm from '../ui/Confirm'
import { Campos, Campo, Secao, Input } from '../ui/Form'
import PermissoesEditor from './PermissoesEditor'
import { criarPerfil, patchPerfil, excluirPerfil } from '../lib/api'

// Perfil = um nome e as permissões dele (19/10/2026: o administrador cria os perfis em
// tempo de uso). Mudar as permissões vale na hora pra todo usuário do perfil que não
// tem permissões próprias. `perfil` nulo = criar.
export default function PerfilPanel({ perfil, catalogo, onFechar, onSalvo }) {
  const [d, setD] = useState(() => ({ nome: '', permissoes: [], ...perfil }))
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    setSalvando(true)
    try {
      const dados = { nome: d.nome, permissoes: d.permissoes }
      if (d.id) await patchPerfil(d.id, dados)
      else await criarPerfil(dados)
      onSalvo?.()
    } catch (e) {
      setFaixa({ tipo: 'erro', texto: e.erro ? `Não foi possível salvar: ${e.erro}.` : 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setExcluindo(false)
    try {
      await excluirPerfil(d.id)
      onSalvo?.()
    } catch (e) {
      setFaixa({ tipo: 'erro', texto: e.erro ? `Não foi possível excluir: ${e.erro}.` : 'Não foi possível excluir.' })
    }
  }

  return (
    <Registro
      onFechar={onFechar}
      largura="md"
      titulo={d.id ? `Perfil: ${perfil.nome}` : 'Novo perfil'}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao>
          {/* Perfil em uso não se exclui: o servidor recusa, e o botão nem aparece. */}
          {d.id && !perfil.usuarios && (
            <Botao variante="pilula" icone={Trash2} onClick={() => setExcluindo(true)}>Excluir perfil</Botao>
          )}
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </BarraAcao>
      }
    >
      <Campos lbl={92}>
        <Campo label="Nome" req>
          <Input autoFocus value={d.nome} onChange={(e) => setD((s) => ({ ...s, nome: e.target.value }))} />
        </Campo>
      </Campos>
      {d.id && perfil.usuarios > 0 && (
        <p className="pt-2 text-[#777]">{perfil.usuarios} usuário(s) usam este perfil: a mudança vale pra eles ao salvar.</p>
      )}
      <Secao>Permissões</Secao>
      <PermissoesEditor catalogo={catalogo} valor={d.permissoes} onChange={(permissoes) => setD((s) => ({ ...s, permissoes }))} />

      <Confirm
        open={excluindo}
        title={`Excluir o perfil ${perfil?.nome}?`}
        message="Nenhum usuário usa este perfil."
        onCancel={() => setExcluindo(false)}
        onConfirm={excluir}
      />
    </Registro>
  )
}

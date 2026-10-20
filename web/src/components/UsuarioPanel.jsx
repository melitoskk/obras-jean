import { useState } from 'react'
import { Save, Ban, CircleCheck, Pencil, Plus } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import { Campos, Campo, Secao, Input, Select, Check } from '../ui/Form'
import PermissoesEditor from './PermissoesEditor'
import PerfilPanel from './PerfilPanel'
import { criarUsuario, patchUsuario } from '../lib/api'
import { norm } from '../lib/format'
import { useSessao } from '../lib/sessao'

// `usuario` nulo = criar. Senha em branco na edição = manter a atual.
// O acesso vem do PERFIL ou de permissões específicas do usuário, no lugar das do perfil
// (19/10/2026: o administrador define as permissões em tempo de uso). As obras só valem
// pra quem não tem "Todas as obras".
export default function UsuarioPanel({ usuario, obras = [], perfis = [], catalogo = [], onFechar, onSalvo, onPerfilSalvo }) {
  const [d, setD] = useState(() => ({
    ativo: 1, obras: [], perfil_id: perfis.find((p) => p.nome === 'Escritório')?.id ?? perfis[0]?.id ?? '',
    permissoes: null, ...usuario, senha: '',
  }))
  const [faixa, setFaixa] = useState(null)
  const eu = useSessao().usuario === usuario?.nome
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState('')
  // Perfil aberto por cima deste painel: o objeto do perfil, {} pra novo, null fechado.
  const [perfilAberto, setPerfilAberto] = useState(null)
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const marcar = (obraId, sim) =>
    set('obras', sim ? [...d.obras, obraId] : d.obras.filter((o) => o !== obraId))

  const perfil = perfis.find((p) => p.id === Number(d.perfil_id))
  const proprias = d.permissoes != null
  const efetivas = proprias ? d.permissoes : perfil?.permissoes ?? []
  const porObra = !efetivas.includes('todas_obras')

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    if (!d.id && !d.senha) return setFaixa({ tipo: 'erro', texto: 'A senha é obrigatória.' })
    if (!d.perfil_id) return setFaixa({ tipo: 'erro', texto: 'Escolha um perfil.' })
    setSalvando(true)
    try {
      const { id, nome, ativo, senha, perfil_id, permissoes } = d
      const dados = { nome, ativo, perfil_id: Number(perfil_id), permissoes, obras: porObra ? d.obras : [] }
      if (senha) dados.senha = senha
      if (id) await patchUsuario(id, dados)
      else await criarUsuario(dados)
      onSalvo?.()
    } catch (e) {
      // A frase do servidor diz o motivo (nome repetido, último administrador).
      setFaixa({ tipo: 'erro', texto: e.erro ? `Não foi possível salvar: ${e.erro}.` : 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  const visiveis = obras.filter((o) => norm(o.nome).includes(norm(filtro)))

  return (
    <Registro
      onFechar={onFechar}
      largura="md"
      titulo={d.id ? `Usuário: ${usuario.nome}` : 'Novo usuário'}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao>
          {/* Inativar em vez de excluir: o nome segue como autor no Diário de obra.
              Só vale ao salvar, como o resto do formulário. */}
          {d.id && (
            <Botao
              variante="pilula"
              icone={d.ativo ? Ban : CircleCheck}
              onClick={() => set('ativo', d.ativo ? 0 : 1)}
              title="Inativo não entra no sistema; nada é apagado"
            >
              {d.ativo ? 'Inativar usuário' : 'Ativar usuário'}
            </Botao>
          )}
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </BarraAcao>
      }
    >
      <Campos lbl={92}>
        <Campo label="Usuário" req>
          <Input autoFocus value={d.nome ?? ''} onChange={(e) => set('nome', e.target.value)} autoComplete="off" />
        </Campo>
        <Campo label={d.id ? 'Nova senha' : 'Senha'} req={!d.id}>
          <Input
            type="password"
            value={d.senha}
            onChange={(e) => set('senha', e.target.value)}
            autoComplete="new-password"
            placeholder={d.id ? 'Em branco mantém a atual' : ''}
          />
          {/* Senha posta por outra pessoa é provisória: ela troca no próximo login. A própria, não. */}
          {d.senha && !eu && <p className="pt-1 text-[11px] text-[#888]">Provisória: o usuário cria uma senha própria no próximo login.</p>}
        </Campo>
      </Campos>

      {!d.ativo && <p className="pt-2 text-perigo">Inativo: não consegue entrar no sistema.</p>}

      <Secao>Acesso</Secao>
      {/* Ir pra "específicas" copia as do perfil pra começar; voltar pra "perfil" descarta
          as próprias. O perfil_id segue gravado nos dois modos - o servidor exige um. */}
      <div className="mb-3 inline-flex border border-grade-linha">
        {[[false, 'Usar perfil'], [true, 'Permissões específicas']].map(([modo, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => modo !== proprias && set('permissoes', modo ? [...(perfil?.permissoes ?? [])] : null)}
            className={`px-3 py-1 ${modo === proprias ? 'bg-acento text-white' : 'bg-white hover:bg-[#f7f7f7]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {proprias ? (
        <PermissoesEditor catalogo={catalogo} valor={d.permissoes} onChange={(permissoes) => set('permissoes', permissoes)} />
      ) : (
        <Campos lbl={92}>
          <Campo label="Perfil" req>
            {/* Ver/editar o perfil escolhido ou criar um, sem sair do usuário - o mesmo
                atalho do cliente na obra. */}
            <div className="flex items-center gap-1.5">
              <div className="min-w-0 flex-1">
                <Select
                  vazio={null}
                  value={d.perfil_id ?? ''}
                  onChange={(e) => set('perfil_id', Number(e.target.value))}
                  opcoes={perfis.map((p) => ({ valor: p.id, label: p.nome }))}
                />
              </div>
              {perfil && (
                <Botao icone={Pencil} className="px-1.5" title={`Ver e editar o perfil ${perfil.nome}`} onClick={() => setPerfilAberto(perfil)} />
              )}
              <Botao variante="acento" icone={Plus} className="px-1.5" title="Novo perfil" onClick={() => setPerfilAberto({})} />
            </div>
          </Campo>
          <p className="pl-[calc(var(--lbl)+0.5rem)] text-[11px] text-[#888]">
            {catalogo.filter((c) => efetivas.includes(c.id)).map((c) => c.rotulo).join(' · ') || 'Nenhuma permissão.'}
          </p>
        </Campos>
      )}

      {porObra && (
        <>
          <Secao>Obras em que trabalha ({d.obras.length})</Secao>
          {obras.length > 8 && (
            <div className="pb-2">
              <Input placeholder="Filtrar obras..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
            </div>
          )}
          <div className="flex flex-col gap-1">
            {visiveis.map((o) => (
              <Check key={o.id} checked={d.obras.includes(o.id)} onChange={(sim) => marcar(o.id, sim)}>
                {o.nome}
                {o.cliente && <span className="text-[#999]"> · {o.cliente}</span>}
              </Check>
            ))}
          </div>
          {!d.obras.length && (
            <p className="pt-2 text-laranja">Sem obra marcada, este usuário entra e não vê nada.</p>
          )}
        </>
      )}

      {perfilAberto && (
        <PerfilPanel
          perfil={perfilAberto.id ? perfilAberto : null}
          catalogo={catalogo}
          onFechar={() => setPerfilAberto(null)}
          onSalvo={(id) => { setPerfilAberto(null); if (id) set('perfil_id', id); onPerfilSalvo?.() }}
        />
      )}
    </Registro>
  )
}

import { useState } from 'react'
import { Save, Ban, CircleCheck } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa from '../ui/Faixa'
import { Campos, Campo, Secao, Input, Radios, Check } from '../ui/Form'
import { criarUsuario, patchUsuario } from '../lib/api'
import { PAPEIS } from '../lib/sessao'
import { norm } from '../lib/format'

// O que cada papel alcança, dito na tela que o escolhe - é a tabela de UPDATE.md §5.
const ALCANCE = {
  admin: 'Tudo, inclusive cadastrar usuários.',
  escritorio: 'Cadastros, estimativa, lançamentos e relatórios. Não cadastra usuário.',
  campo: 'Só Diário de obra e Galeria, das obras marcadas abaixo. Não vê valores.',
}

// `usuario` nulo = criar. Senha em branco na edição = manter a atual.
export default function UsuarioPanel({ usuario, obras = [], onFechar, onSalvo }) {
  const [d, setD] = useState(() => ({ papel: 'escritorio', ativo: 1, obras: [], ...usuario, senha: '' }))
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [filtro, setFiltro] = useState('')
  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const marcar = (obraId, sim) =>
    set('obras', sim ? [...d.obras, obraId] : d.obras.filter((o) => o !== obraId))

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    if (!d.id && !d.senha) return setFaixa({ tipo: 'erro', texto: 'A senha é obrigatória.' })
    setSalvando(true)
    try {
      const { id, nome, papel, ativo, senha } = d
      const dados = { nome, papel, ativo, obras: papel === 'campo' ? d.obras : [] }
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
              Só vale ao salvar, como o resto do formulário - igual ao de Clientes. */}
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
        </Campo>
        <Campo label="Papel" req>
          <Radios
            name="papel"
            value={d.papel}
            onChange={(v) => set('papel', v)}
            opcoes={Object.entries(PAPEIS).map(([valor, label]) => ({ valor, label }))}
          />
          <p className="pt-1 text-[#777]">{ALCANCE[d.papel]}</p>
        </Campo>
      </Campos>

      {!d.ativo && <p className="pt-2 text-perigo">Inativo: não consegue entrar no sistema.</p>}

      {d.papel === 'campo' && (
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
    </Registro>
  )
}

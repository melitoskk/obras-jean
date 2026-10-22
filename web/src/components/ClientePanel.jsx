import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Ban, CircleCheck, Building2, Plus } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Faixa, { Losango } from '../ui/Faixa'
import { Campos, Campo, Secao, Input, Select, Texto, Radios } from '../ui/Form'
import Confirm from '../ui/Confirm'
import EmptyState from '../ui/EmptyState'
import FileDrop from '../ui/FileDrop'
import Badge from '../ui/Badge'
import AbaEndereco from './AbaEndereco'
import CampoTelefone from './CampoTelefone'
import ListaArquivos from './ListaArquivos'
import { SITUACOES } from './ObraPanel'
import {
  criarCliente, patchCliente, getArquivosCliente, criarArquivo, excluirArquivo, uploadAnexo,
  getObras,
} from '../lib/api'
import { mascaraDoc, mascaraTel } from '../lib/format'

// Cadastro de cliente - Obra-Prima-Cadastro-Cliente.png.
// `cliente` nulo = criar. Três abas: Dados, Endereço e Anexos. Atendimento e Portal,
// que a referência mostra cinzas, saíram em 14/08/2026 - aba que nunca acende promete
// tela que não existe (Portal é portal do cliente, fora do escopo desde a v1).
//
// Anexos são documentos DO CLIENTE (contrato, procuração, RG), na mesma tabela
// `arquivo` da Galeria, com `cliente_id` no lugar de `obra_id`. Sem pasta: cliente não
// tem canteiro. E sem os arquivos das obras dele - pra isso existe a Galeria da obra,
// que é onde se procura foto de obra.
const CATEGORIAS = ['Particular', 'Construtora', 'Incorporadora', 'Órgão público', 'Outro']

export default function ClientePanel({ cliente, onFechar, onSalvo }) {
  const [aba, setAba] = useState('dados')
  const [d, setD] = useState(() => ({ tipo: 'fisica', ativo: 1, ...cliente }))
  const [faixa, setFaixa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  // Confirma só o lado que tira da lista. Reativar é inofensivo e não merece parada.
  const [inativando, setInativando] = useState(false)
  const [arquivos, setArquivos] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [excluirArq, setExcluirArq] = useState(null)
  const [obras, setObras] = useState(null) // null = ainda não buscou
  const navegar = useNavigate()

  // Carrega os anexos uma vez, só quando o cliente já existe. Cliente novo não tem
  // id pra pendurar arquivo - a aba nem aparece.
  useEffect(() => {
    if (d.id) getArquivosCliente(d.id).then(setArquivos)
  }, [d.id])

  // As obras do cliente saem da lista que o módulo de Obras já usa, filtrada aqui.
  // São dezenas, não milhares: uma rota nova no servidor só pra isso seria consulta
  // a mais pra responder o que uma já responde. Busca só quando a aba abre.
  useEffect(() => {
    if (aba === 'obras' && d.id && obras === null) {
      getObras().then((t) => setObras(t.filter((o) => o.cliente_id === d.id))).catch(() => setObras([]))
    }
  }, [aba, d.id, obras])

  const set = (k, v) => setD((s) => ({ ...s, [k]: v }))
  const campo = (k) => ({ value: d[k] ?? '', onChange: (e) => set(k, e.target.value) })

  // Inativar/Ativar grava na hora (rodada 2, A23): a confirmação diz "some da lista", e
  // esperar um Salvar depois dela mentia. Manda SÓ o `ativo` (rodada 3, A2): o resto do
  // formulário não é revisto aqui, e o servidor tira a marca de incompleto de quem manda
  // campo de cadastro.
  async function mudarAtivo(ativo) {
    set('ativo', ativo)
    try {
      await patchCliente(d.id, { ativo })
      onSalvo?.(d.id)
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    }
  }

  async function salvar() {
    if (!d.nome?.trim()) return setFaixa({ tipo: 'erro', texto: 'O nome é obrigatório.' })
    setSalvando(true)
    try {
      // Criar entra pelo mesmo POST do quick-create (só o nome) e o PATCH completa -
      // um caminho de gravação só, e o cliente já nasce sem a marca de incompleto.
      const id = d.id ?? (await criarCliente(d.nome.trim())).id
      const { id: _, obras: __, incompleto: ___, ...campos } = d
      await patchCliente(id, campos)
      setFaixa({ tipo: 'sucesso', texto: 'Operação executada com sucesso.' })
      // Devolve o id: quem chegou aqui vindo de um formulário de obra precisa saber
      // quem foi criado pra já selecionar na volta.
      onSalvo?.(id)
    } catch {
      setFaixa({ tipo: 'erro', texto: 'Não foi possível salvar.' })
    } finally {
      setSalvando(false)
    }
  }

  // Anexo grava na hora, diferente do resto do formulário: o arquivo já subiu pro
  // servidor: segurá-lo esperando um clique em Salvar seria inventar um rascunho de
  // upload. É o mesmo comportamento da Galeria e do Dia a dia.
  async function subirAnexo(file) {
    setEnviando(true)
    try {
      await criarArquivo({ cliente_id: d.id, nome: file.name, ref: await uploadAnexo(file) })
      setArquivos(await getArquivosCliente(d.id))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Registro
      onFechar={onFechar}
      largura="md"
      // Inativo diz no título (rodada 3, A8): o botão "Ativar" sozinho não avisava.
      titulo={d.id ? `Cliente: ${cliente.nome}${d.ativo ? '' : ' · inativo'}` : 'Novo cliente'}
      aba={aba}
      onAba={setAba}
      abas={[
        { id: 'dados', label: 'Dados' },
        { id: 'endereco', label: 'Endereço' },
        { id: 'obras', label: 'Obras', disabled: !d.id },
        { id: 'anexos', label: 'Anexos', disabled: !d.id },
      ]}
      faixa={faixa && <Faixa tipo={faixa.tipo} onFim={() => setFaixa(null)}>{faixa.texto}</Faixa>}
      acoes={
        <BarraAcao>
          {/* Rótulo é a AÇÃO, não o estado: "Inativar cliente" diz o que o clique faz, e
              o estado atual se lê por inversão (e na coluna Condição da lista). Grava
              na hora, junto com o formulário (rodada 2, A23). */}
          {/* Cadastro novo não tem o que inativar (rodada 2, A31). */}
          {d.id && (
            <Botao
              variante="pilula"
              icone={d.ativo ? Ban : CircleCheck}
              onClick={() => (d.ativo ? setInativando(true) : mudarAtivo(1))}
              title="Some da lista, nada é apagado"
            >
              {d.ativo ? 'Inativar cliente' : 'Ativar cliente'}
            </Botao>
          )}
          <Botao variante="acento" icone={Save} onClick={salvar} disabled={salvando}>Salvar</Botao>
        </BarraAcao>
      }
    >
      {aba === 'dados' && (
        <>
          <Campos lbl={92} cols={2}>
            <Campo label="Nome" req largo><Input autoFocus {...campo('nome')} /></Campo>
            <Campo label="Tipo">
              <Radios
                name="tipo"
                value={d.tipo}
                onChange={(v) => set('tipo', v)}
                opcoes={[{ valor: 'fisica', label: 'Pessoa física' }, { valor: 'juridica', label: 'Pessoa jurídica' }]}
              />
            </Campo>
            <Campo label="Categoria">
              <Select {...campo('categoria')} opcoes={CATEGORIAS.map((c) => ({ valor: c, label: c }))} />
            </Campo>
            <Campo label={d.tipo === 'juridica' ? 'CNPJ' : 'CPF'}>
              <div className="flex items-center gap-2">
                <div className="w-[150px]">
                  <Input {...campo('cpf_cnpj')} onChange={(e) => set('cpf_cnpj', mascaraDoc(e.target.value))} />
                </div>
                {/* Sinaliza, não bloqueia: salva sem documento e avisa por quê incomoda. */}
                {!d.cpf_cnpj && <Losango title="Sem documento não dá pra emitir nota" />}
              </div>
            </Campo>
            <Campo label={d.tipo === 'juridica' ? 'Insc. estadual' : 'RG'}>
              <div className="w-[150px]"><Input {...campo('rg')} /></div>
            </Campo>
            <Campo label={d.tipo === 'juridica' ? 'Fundação' : 'Dt. nasc.'}>
              <div className="w-[150px]"><input type="date" className="op-input" {...campo('dt_nasc')} /></div>
            </Campo>
          </Campos>

          <Secao>Contato</Secao>
          <Campos lbl={92} cols={2}>
            {/* Celular antes do telefone: é o número que se usa. */}
            <Campo label="Celular">
              <CampoTelefone
                valor={d.celular}
                onValor={(v) => set('celular', v)}
                marcado={d.whatsapp_celular}
                onMarcar={(v) => set('whatsapp_celular', v)}
              />
            </Campo>
            <Campo label="Telefone">
              <Input {...campo('telefone')} onChange={(e) => set('telefone', mascaraTel(e.target.value))} />
            </Campo>
            <Campo label="E-mail" largo><Input type="email" {...campo('email')} /></Campo>
          </Campos>

          <Secao>Outras informações</Secao>
          <Campos lbl={92}>
            <Campo label="Observação">
              <Texto value={d.observacao ?? ''} onChange={(e) => set('observacao', e.target.value)} max={4000} rows={6} />
            </Campo>
          </Campos>
        </>
      )}

      {aba === 'endereco' && <AbaEndereco dados={d} set={set} />}

      {/* Lista, não grid: são poucas linhas e o destino é sempre o mesmo - abrir a obra.
          Grid com filtro e paginação aqui seria o módulo de Obras de novo, menor. */}
      {aba === 'obras' && (
        obras?.length ? (
          <div className="flex flex-col">
            {obras.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => navegar(`/obra/${o.id}`)}
                className="flex items-center gap-2 border-b border-grade-linha px-2 py-2 text-left hover:bg-[#fdf0e9]"
              >
                <Building2 size={15} className="shrink-0 text-[#bbb]" />
                <span className="min-w-0 flex-1 truncate">
                  {o.nome}
                  {o.cidade && <span className="text-[#999]"> · {o.cidade}</span>}
                </span>
                <Badge cor={SITUACOES[o.status]?.cor}>{SITUACOES[o.status]?.label ?? o.status}</Badge>
              </button>
            ))}
            <BarraAcao esquerda={<span className="text-[#777]">{obras.length} obra(s)</span>}>
              <Botao variante="acento" icone={Plus} onClick={() => navegar(`/obras/nova?cliente=${d.id}`)}>
                Nova obra
              </Botao>
            </BarraAcao>
          </div>
        ) : (
          // `obras === null` é "ainda buscando": some sem piscar EmptyState de mentira.
          obras && (
            <EmptyState
              icone={Building2}
              titulo="Este cliente ainda não tem obra."
              texto="A obra nasce já com ele preenchido."
              acao="Nova obra"
              iconeAcao={Plus}
              onAcao={() => navegar(`/obras/nova?cliente=${d.id}`)}
            />
          )
        )
      )}

      {aba === 'anexos' && (
        <div className="flex flex-col gap-2">
          <FileDrop uploading={enviando} onPick={subirAnexo} />
          {arquivos.length === 0 ? (
            <EmptyState
              titulo="Nenhum documento."
              texto="Arraste um arquivo acima."
            />
          ) : (
            <ListaArquivos arquivos={arquivos} onExcluir={setExcluirArq} />
          )}
        </div>
      )}

      <Confirm
        open={!!excluirArq}
        title={`Excluir ${excluirArq?.nome}?`}
        message="Não dá pra desfazer."
        onCancel={() => setExcluirArq(null)}
        onConfirm={async () => {
          await excluirArquivo(excluirArq.id)
          setExcluirArq(null)
          setArquivos(await getArquivosCliente(d.id))
        }}
      />

      <Confirm
        open={inativando}
        title="Inativar cliente?"
        message="Some da lista, nada é apagado. As obras continuam."
        confirmLabel="Inativar"
        onCancel={() => setInativando(false)}
        onConfirm={() => { setInativando(false); mudarAtivo(0) }}
      />
    </Registro>
  )
}

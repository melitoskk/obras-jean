import { useState } from 'react'
import { Plus, Trash2, Pencil, Paperclip, User } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Combobox from '../ui/Combobox'
import Confirm from '../ui/Confirm'
import EmptyState from '../ui/EmptyState'
import FileDrop from '../ui/FileDrop'
import { Campos, Campo, Texto } from '../ui/Form'
import { criarDiario, patchDiario, excluirDiario, uploadAnexo } from '../lib/api'
import { formatData } from '../lib/format'

// Aba Dia a dia - o registro do que aconteceu na obra. Quem usa está EM PÉ NO
// CANTEIRO com o celular na mão: é a tela mais mobile do sistema.
// `escrevendo` guarda o post em edição, ou `true` pra um novo - mesmo formulário
// nos dois casos, só muda o que ele recebe de partida e pra onde ele salva.
export default function DiarioObra({ obraId, posts, fases, onMudou }) {
  const [escrevendo, setEscrevendo] = useState(null)
  const [excluir, setExcluir] = useState(null)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <span className="text-[#777]">{posts.length} registro(s)</span>
        <Botao variante="acento" icone={Plus} className="ml-auto" onClick={() => setEscrevendo({})}>
          Registrar
        </Botao>
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {posts.length === 0 && (
          <EmptyState titulo="Nada registrado ainda." texto="O que acontece na obra entra aqui." />
        )}
        {posts.map((p) => (
          <article key={p.id} className="group border border-grade-linha bg-white p-2.5">
            <header className="flex items-center gap-1.5 text-[#777]">
              <User size={13} />
              <b className="text-[#333]">{p.autor}</b>
              <span>· {formatData(p.criado_em)}</span>
              {p.fase_id && <span>· {fases.find((f) => f.id === p.fase_id)?.nome}</span>}
              {/* Celular não tem hover: visível no toque, discreto no mouse. `editavel` vem
                  do servidor: o campo vê todos os posts, mas só mexe nos que escreveu. */}
              {p.editavel && <span className="ml-auto flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                <button onClick={() => setEscrevendo(p)} title="Editar" className="text-titulo">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setExcluir(p)} title="Excluir" className="text-perigo">
                  <Trash2 size={13} />
                </button>
              </span>}
            </header>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#333]">{p.texto}</p>
            {p.anexos?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {p.anexos.map((a) => (
                  <a
                    key={a.id}
                    href={`/api/anexo/${a.ref}`}
                    download
                    className="flex items-center gap-1 border border-grade-linha px-1.5 py-0.5 text-titulo hover:bg-[#eaf3fa]"
                  >
                    <Paperclip size={11} /> {a.nome}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {escrevendo && (
        <FormPost
          key={escrevendo.id}
          obraId={obraId}
          post={escrevendo}
          fases={fases}
          onFechar={() => setEscrevendo(null)}
          onSalvo={() => { setEscrevendo(null); onMudou() }}
        />
      )}

      <Confirm
        open={!!excluir}
        title="Excluir este registro?"
        message="O texto e os anexos somem junto."
        onCancel={() => setExcluir(null)}
        onConfirm={async () => { await excluirDiario(excluir.id); setExcluir(null); onMudou() }}
      />
    </div>
  )
}

function FormPost({ obraId, post, fases, onFechar, onSalvo }) {
  const [texto, setTexto] = useState(post.texto || '')
  const [faseId, setFaseId] = useState(post.fase_id ?? null)
  const [anexos, setAnexos] = useState(post.anexos || [])
  const [enviando, setEnviando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function anexar(file) {
    setEnviando(true)
    try {
      const ref = await uploadAnexo(file)
      setAnexos((a) => [...a, { nome: file.name, ref }])
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Registro
      onFechar={onFechar}
      titulo={post.id ? 'Editar registro' : 'Novo registro'}
      largura="md"
      acoes={
        <BarraAcao>
          <Botao
            variante="acento"
            icone={post.id ? Pencil : Plus}
            disabled={!texto.trim() || salvando}
            onClick={async () => {
              setSalvando(true)
              const corpo = { obra_id: obraId, fase_id: faseId, texto, anexos }
              await (post.id ? patchDiario(post.id, corpo) : criarDiario(corpo))
              onSalvo()
            }}
          >
            {post.id ? 'Salvar' : 'Registrar'}
          </Botao>
        </BarraAcao>
      }
    >
      <Campos lbl={70}>
        <Campo label="O que houve" req>
          <Texto autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} rows={6} max={4000} />
        </Campo>
        <Campo label="Fase">
          <Combobox
            value={faseId}
            onChange={setFaseId}
            options={fases.map((f) => ({ id: f.id, label: f.nome }))}
            placeholder="Opcional"
          />
        </Campo>
        <Campo label="Anexos">
          {/* Vários por post: a lista mostra os escolhidos e um FileDrop vazio
              embaixo soma o próximo. Sem `capture`, pra o celular oferecer câmera
              E galeria - `capture` tranca no obturador. */}
          <div className="space-y-1.5">
            {anexos.map((a, i) => (
              <FileDrop key={i} nome={a.nome} onRemove={() => setAnexos((s) => s.filter((_, j) => j !== i))} />
            ))}
            <FileDrop uploading={enviando} onPick={anexar} />
          </div>
        </Campo>
      </Campos>
    </Registro>
  )
}

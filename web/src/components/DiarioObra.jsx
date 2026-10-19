import { useState } from 'react'
import { Plus, Trash2, Pencil, Paperclip, User } from 'lucide-react'
import Registro from '../ui/Registro'
import Botao, { BarraAcao } from '../ui/Botao'
import Combobox from '../ui/Combobox'
import Confirm from '../ui/Confirm'
import EmptyState from '../ui/EmptyState'
import FileDrop from '../ui/FileDrop'
import { Campos, Campo, Texto, Input } from '../ui/Form'
import { criarDiario, patchDiario, excluirDiario, uploadAnexo } from '../lib/api'
import { formatData, hoje } from '../lib/format'
import { usePode } from '../lib/sessao'

// Aba Dia a dia - o registro do que aconteceu na obra. Quem usa está EM PÉ NO
// CANTEIRO com o celular na mão: é a tela mais mobile do sistema.
// `escrevendo` guarda o post em edição, ou `true` pra um novo - mesmo formulário
// nos dois casos, só muda o que ele recebe de partida e pra onde ele salva.
// Só imagem rasterizada vira miniatura - a mesma regra de ListaArquivos (SVG fora: carrega script).
const IMAGEM = /\.(png|jpe?g|gif|webp|avif)$/i
// "4 - FUNDAÇÕES", como no lançamento (rodada 2, A15).
const rotuloFase = (f) => (f?.codigo ? `${f.codigo} - ${f.nome}` : f?.nome)

export default function DiarioObra({ obraId, posts, fases, onMudou }) {
  const [escrevendo, setEscrevendo] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const lanca = usePode()('diario')

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <span className="text-[#777]">{posts.length} registro(s)</span>
        {/* Registrar é de `diario` (19/10/2026); sem ela o diário só se lê. */}
        {lanca && (
          <Botao variante="acento" icone={Plus} className="ml-auto" onClick={() => setEscrevendo({})}>
            Registrar
          </Botao>
        )}
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
              <span>· {formatData(p.data ?? p.criado_em)}</span>
              {p.fase_id && <span>· {rotuloFase(fases.find((f) => f.id === p.fase_id))}</span>}
              {/* Celular não tem hover: visível no toque, discreto no mouse. `editavel` vem
                  do servidor: o campo vê todos os posts, mas só mexe nos que escreveu. */}
              {p.editavel && <span className="ml-auto flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100">
                {/* p-1.5: alvo de toque de ~28px, e não os 13px do ícone (rodada 2, A29). */}
                <button onClick={() => setEscrevendo(p)} title="Editar" className="p-1.5 text-titulo">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setExcluir(p)} title="Excluir" className="p-1.5 text-perigo">
                  <Trash2 size={15} />
                </button>
              </span>}
            </header>
            <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#333]">{p.texto}</p>
            {p.anexos?.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {/* Foto aparece como foto (rodada 1, A17); o resto, como o nome do arquivo. */}
                {p.anexos.map((a) => (IMAGEM.test(a.nome) ? (
                  <a key={a.id} href={`/api/anexo/${a.ref}?inline=1`} target="_blank" rel="noreferrer" title={a.nome}>
                    <img src={`/api/anexo/${a.ref}?inline=1`} alt={a.nome} className="h-[72px] w-[96px] border border-grade-linha object-cover" />
                  </a>
                ) : (
                  <a
                    key={a.id}
                    href={`/api/anexo/${a.ref}`}
                    download
                    className="flex items-center gap-1 border border-grade-linha px-1.5 py-0.5 text-titulo hover:bg-[#eaf3fa]"
                  >
                    <Paperclip size={11} /> {a.nome}
                  </a>
                )))}
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
  // O dia do que aconteceu (rodada 2, A24): à noite se registra o de ontem.
  const [data, setData] = useState(post.data ?? hoje())
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
              const corpo = { obra_id: obraId, fase_id: faseId, texto, anexos, data }
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
        <Campo label="Data" req>
          {/* Diário é do que já aconteceu: não passa de hoje. */}
          <Input type="date" value={data} min="2000-01-01" max={hoje()} onChange={(e) => setData(e.target.value)} className="op-input w-[150px]" />
        </Campo>
        <Campo label="Fase">
          <Combobox
            value={faseId}
            onChange={setFaseId}
            options={fases.map((f) => ({ id: f.id, label: rotuloFase(f) }))}
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

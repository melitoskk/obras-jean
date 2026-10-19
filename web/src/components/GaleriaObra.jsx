import { useState } from 'react'
import { Folder, Download } from 'lucide-react'
import Botao from '../ui/Botao'
import Confirm from '../ui/Confirm'
import EmptyState from '../ui/EmptyState'
import FileDrop from '../ui/FileDrop'
import ListaArquivos from './ListaArquivos'
import { criarArquivo, excluirArquivo, uploadAnexo } from '../lib/api'
import { usePode } from '../lib/sessao'

// Aba Galeria - a visão por pasta do mesmo acervo que o Dia a dia alimenta.
// Pastas são FIXAS: árvore de diretórios é um produto inteiro e não é este.
// `dia_a_dia` é só leitura aqui e no servidor - quem escreve nela é POST /api/diario.
const PASTAS = [
  { id: 'dia_a_dia', nome: 'Diário de obra', somenteLeitura: true },
  { id: 'fotos', nome: 'Fotos' },
  { id: 'documentos', nome: 'Documentos' },
  { id: 'projetos', nome: 'Projetos' },
]

export default function GaleriaObra({ obraId, arquivos, onMudou }) {
  // Documentos (contrato, cronograma) é de `documentos`; enviar Fotos e Projetos, de
  // `diario` (19/10/2026). O servidor já não manda a pasta pra quem não pode vê-la.
  const pode = usePode()
  const pastas = PASTAS.filter((p) => p.id !== 'documentos' || pode('documentos'))
  const envia = (id) => (id === 'documentos' ? pode('documentos') : pode('diario'))
  const [pasta, setPasta] = useState('fotos')
  const [enviando, setEnviando] = useState(false)
  const [excluir, setExcluir] = useState(null)

  const atual = PASTAS.find((p) => p.id === pasta)
  const doFolder = arquivos.filter((a) => a.pasta === pasta)

  async function subir(file) {
    setEnviando(true)
    try {
      await criarArquivo({ obra_id: obraId, pasta, nome: file.name, ref: await uploadAnexo(file) })
      onMudou()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-[180px] sm:flex-col sm:overflow-visible">
        {pastas.map((p) => {
          const n = arquivos.filter((a) => a.pasta === p.id).length
          return (
            <button
              key={p.id}
              onClick={() => setPasta(p.id)}
              className={`flex shrink-0 items-center gap-1.5 border px-2 py-1.5 text-left ${
                pasta === p.id ? 'border-acento bg-[#eaf3fa] text-titulo' : 'border-grade-linha hover:bg-[#f7f7f7]'
              }`}
            >
              <Folder size={14} /> {p.nome}
              <span className="ml-auto text-[#999]">{n}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        {!atual.somenteLeitura && envia(pasta) && (
          <div className="pb-2"><FileDrop uploading={enviando} onPick={subir} /></div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto border border-grade-linha p-2">
          {doFolder.length === 0 ? (
            <EmptyState
              titulo={`Nada em ${atual.nome}.`}
              texto={atual.somenteLeitura ? 'Alimentada pelos anexos do Diário de obra.' : 'Arraste um arquivo acima.'}
            />
          ) : (
            <ListaArquivos arquivos={doFolder} onExcluir={setExcluir} />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-2 text-[#777]">
          {doFolder.length} arquivo(s) em {atual.nome}
          {doFolder.length > 0 && (
            <Botao
              icone={Download}
              className="ml-auto"
              onClick={() => doFolder.forEach((a) => window.open(`/api/anexo/${a.ref}`, '_blank'))}
            >
              Baixar todos
            </Botao>
          )}
        </div>
      </div>

      <Confirm
        open={!!excluir}
        title={`Excluir ${excluir?.nome}?`}
        message={
          excluir?.diario_id
            ? 'Sai do post do Diário de obra. O texto continua.'
            : 'Não dá pra desfazer.'
        }
        onCancel={() => setExcluir(null)}
        onConfirm={async () => { await excluirArquivo(excluir.id); setExcluir(null); onMudou() }}
      />
    </div>
  )
}

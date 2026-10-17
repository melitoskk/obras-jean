import { useState } from 'react'
import { Paperclip, X, Loader2, Camera } from 'lucide-react'

// Arrastar-soltar de anexo. UI burra: recebe `nome`/`href` pra exibir e dispara
// `onPick` com o File. Quem faz upload e resolve o ref é o componente de domínio.
// Sem `capture`: `capture` tranca no obturador e some com a opção de galeria. Um
// <input type="file"> limpo já oferece câmera E galeria no celular.
export default function FileDrop({ nome, href, uploading, onPick, onRemove, accept }) {
  const [over, setOver] = useState(false)
  const pick = (files) => { const f = files?.[0]; if (f) onPick(f) }

  if (uploading)
    return (
      <div className="flex items-center gap-1.5 rounded-[2px] border border-borda px-2 py-1.5 text-[#888]">
        <Loader2 size={13} className="animate-spin" /> Enviando…
      </div>
    )

  if (nome)
    return (
      <div className="flex items-center justify-between rounded-[2px] border border-borda px-2 py-1.5">
        {href ? (
          <a href={href} download className="flex items-center gap-1.5 text-titulo hover:underline">
            <Paperclip size={13} /> {nome}
          </a>
        ) : (
          <span className="flex items-center gap-1.5 text-[#555]"><Paperclip size={13} /> {nome}</span>
        )}
        <button type="button" onClick={onRemove} title="Remover" className="text-[#999] hover:text-perigo">
          <X size={14} />
        </button>
      </div>
    )

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files) }}
      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-[2px] border border-dashed px-2 py-3 text-[#999] ${
        over ? 'border-acento bg-[#eaf3fa]' : 'border-borda'
      }`}
    >
      <Paperclip size={13} /> Arraste um anexo ou clique
      <input type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files)} />
    </label>
  )
}

// O quadrado cinza com ícone de câmera do Cadastro-Obra. Mesmo upload, outra forma.
export function FotoDrop({ src, uploading, onPick, className = 'h-[92px] w-[136px]' }) {
  const pick = (files) => { const f = files?.[0]; if (f) onPick(f) }
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files) }}
      title="Foto da obra"
      className={`relative flex cursor-pointer items-center justify-center overflow-hidden bg-[#c9c9c9] ${className}`}
    >
      {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {uploading ? (
        <Loader2 size={26} className="animate-spin text-white" />
      ) : (
        !src && <Camera size={30} className="text-white/85" strokeWidth={1.5} />
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files)} />
    </label>
  )
}

import { FileText, Trash2 } from 'lucide-react'

// Grade de arquivos - a mesma na Galeria da obra e nos anexos do cliente. Extraída
// quando o segundo consumidor apareceu, não antes. Recebe a lista e devolve pixels;
// quem confirma e apaga é o dono da tela.
//
// Só imagem rasterizada ganha miniatura. SVG fica de fora DE PROPÓSITO: SVG carrega
// script, e servir inline na origem do app seria XSS armazenado.
const IMAGEM = /\.(png|jpe?g|gif|webp|avif)$/i

export default function ListaArquivos({ arquivos, onExcluir }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {arquivos.map((a) => (
        <figure key={a.id} className="group relative border border-grade-linha">
          <a href={`/api/anexo/${a.ref}`} download className="block">
            {IMAGEM.test(a.nome) ? (
              // inline=1: a rota normal responde Content-Disposition: attachment,
              // que não serve pra <img>.
              <img src={`/api/anexo/${a.ref}?inline=1`} alt="" className="h-[86px] w-full object-cover" />
            ) : (
              <div className="grid h-[86px] place-items-center bg-[#f4f4f4]">
                <FileText size={28} className="text-[#bbb]" strokeWidth={1.3} />
              </div>
            )}
            <figcaption className="truncate border-t border-grade-linha px-1.5 py-1 text-[11px]" title={a.nome}>
              {a.nome}
            </figcaption>
          </a>
          {/* sm:opacity-0 e não opacity-0: celular não tem hover, e invisível-mas-clicável
              é pior que sempre visível. `editavel` vem do servidor na Galeria (excluir é
              de quem enviou, 19/10/2026); documento de cliente não traz, e mostra. */}
          {a.editavel !== false && <button
            onClick={() => onExcluir(a)}
            title="Excluir"
            className="absolute top-1 right-1 rounded-[2px] bg-white/90 p-1 text-perigo sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>}
        </figure>
      ))}
    </div>
  )
}

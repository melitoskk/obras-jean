import { ExternalLink } from 'lucide-react'
import { Input, Check } from '../ui/Form'
import { mascaraTel, linkWhats } from '../lib/format'

// Telefone com marca de WhatsApp. Quatro usos: telefone e celular, em cliente e
// fornecedor. A marca é um dado do cadastro (`whatsapp_telefone`/`whatsapp_celular`),
// não um palpite: nem todo celular tem conta e nem todo fixo deixa de ter.
//
// O botão de abrir a conversa só aparece com a marca ligada E com número discável
// (`linkWhats` devolve null sem DDD). Sem isso o botão levaria pra uma conversa vazia.
export default function CampoTelefone({ valor, onValor, marcado, onMarcar }) {
  const link = linkWhats(valor)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Input value={valor ?? ''} onChange={(e) => onValor(mascaraTel(e.target.value))} />
        {marcado && link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir conversa no WhatsApp"
            className="shrink-0 rounded-[3px] border border-[#25d366] bg-[#25d366]/10 p-1.5 text-[#128c39] hover:bg-[#25d366]/20"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {/* A caixa some com o campo vazio: marcar zap de número que não existe não quer
          dizer nada, e a linha some junto em vez de ficar ocupando espaço morto. */}
      {valor && (
        <Check checked={marcado} onChange={(v) => onMarcar(v ? 1 : 0)}>
          <span className="text-rotulo">Esse número também é WhatsApp</span>
        </Check>
      )}
    </div>
  )
}

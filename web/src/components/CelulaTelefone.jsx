import BotaoCopiar from './BotaoCopiar'
import { linkWhats } from '../lib/format'

// Célula de telefone das listas de cliente e fornecedor. Mostra o CELULAR; sem ele, o
// telefone; sem os dois, o contato (que é nome de pessoa, não número - por isso não
// ganha link nem botão). Só o celular vira link: a marca de WhatsApp é dele.
export default function CelulaTelefone({ registro: r }) {
  const [tel, zap] = r.celular ? [r.celular, r.whatsapp_celular] : [r.telefone, 0]

  if (!tel) return r.contato || null
  const link = zap ? linkWhats(tel) : null

  return (
    <span className="flex items-center gap-1">
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title="Abrir conversa no WhatsApp"
          className="text-[#128c39] underline"
        >
          {tel}
        </a>
      ) : (
        tel
      )}
      <BotaoCopiar texto={tel} title="Copiar número" />
    </span>
  )
}

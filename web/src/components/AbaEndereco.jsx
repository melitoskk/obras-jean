import { useRef, useState } from 'react'
import { Campos, Campo, Select, Input } from '../ui/Form'
import { mascaraCep } from '../lib/format'
import { buscaCep } from '../lib/cep'

// Aba Endereço - idêntica em Cliente, Obra e Fornecedor. Extraída porque eram dois
// consumidores com duplicação exata, não porque um terceiro possa aparecer (e aí veio).
export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO']

export default function AbaEndereco({ dados, set }) {
  const campo = (k) => ({ value: dados[k] ?? '', onChange: (e) => set(k, e.target.value) })
  const [estado, setEstado] = useState(null) // null | 'buscando' | 'nao-achou'
  const ultimo = useRef('')

  // Busca ao completar os 8 dígitos, não no blur: quem digita CEP já espera o
  // preenchimento acontecer sozinho. `ultimo` evita repetir a chamada a cada tecla
  // depois do oitavo dígito (apagar e redigitar o mesmo CEP busca de novo, de propósito).
  async function mudaCep(valor) {
    const cep = mascaraCep(valor)
    set('cep', cep)
    const digitos = cep.replace(/\D/g, '')
    if (digitos.length < 8) { ultimo.current = ''; setEstado(null); return }
    if (digitos === ultimo.current) return
    ultimo.current = digitos
    setEstado('buscando')
    try {
      const achado = await buscaCep(digitos)
      if (!achado) return setEstado('nao-achou')
      for (const [k, v] of Object.entries(achado)) set(k, v)
      setEstado(null)
    } catch {
      setEstado(null) // sem internet: não é erro do usuário, não vira aviso vermelho
    }
  }

  return (
    <Campos lbl={92} cols={2}>
      <Campo label="CEP">
        <div className="flex items-center gap-2">
          <div className="w-[110px]">
            <Input {...campo('cep')} onChange={(e) => mudaCep(e.target.value)} />
          </div>
          {estado === 'buscando' && <span className="text-rotulo">buscando…</span>}
          {estado === 'nao-achou' && <span className="text-rotulo text-amber-600">CEP não encontrado</span>}
        </div>
      </Campo>
      <Campo label="Estado">
        <div className="w-[90px]">
          <Select {...campo('uf')} opcoes={UFS.map((u) => ({ valor: u, label: u }))} />
        </div>
      </Campo>
      <Campo label="Logradouro" largo><Input {...campo('logradouro')} /></Campo>
      <Campo label="Número">
        <div className="w-[110px]"><Input {...campo('numero')} /></div>
      </Campo>
      <Campo label="Complemento"><Input {...campo('complemento')} /></Campo>
      <Campo label="Bairro"><Input {...campo('bairro')} /></Campo>
      <Campo label="Cidade"><Input {...campo('cidade')} /></Campo>
    </Campos>
  )
}

// ViaCEP: gratuito, sem chave, manda `Access-Control-Allow-Origin: *` - dá pra chamar
// direto do navegador, sem proxy e sem dependência (`fetch` é nativo).
// ponytail: se a rede do escritório bloquear o acesso externo, o conserto é uma rota
// /api/cep no servidor repetindo este mesmo fetch - a tela não muda.
export async function buscaCep(digitos) {
  const r = await fetch(`https://viacep.com.br/ws/${digitos}/json/`)
  const e = await r.json()
  if (e.erro) return null // CEP inexistente responde 200 com {"erro":"true"}, não 404
  // CEP de cidade inteira (final -000 de município pequeno) vem com logradouro e bairro
  // vazios: devolve só o que veio preenchido, pra não apagar o que já estava na tela.
  return Object.fromEntries(
    [['logradouro', e.logradouro], ['bairro', e.bairro], ['cidade', e.localidade], ['uf', e.uf]]
      .filter(([, v]) => v),
  )
}

// docker compose run --rm web node src/lib/cep.test.mjs
// Sem rede: o fetch é trocado por respostas gravadas do ViaCEP. O que se testa é o
// mapeamento (localidade→cidade) e as duas armadilhas: erro vem com HTTP 200, e CEP
// de município pequeno vem sem logradouro/bairro.
import assert from 'node:assert/strict'
import { buscaCep } from './cep.js'

const responde = (corpo) => { globalThis.fetch = async () => ({ json: async () => corpo }) }

responde({ logradouro: 'Rua Vitorino Carmilo', bairro: 'Barra Funda', localidade: 'São Paulo', uf: 'SP' })
assert.deepEqual(await buscaCep('01153000'), {
  logradouro: 'Rua Vitorino Carmilo', bairro: 'Barra Funda', cidade: 'São Paulo', uf: 'SP',
})

// CEP inexistente: 200 com erro. "true" é string na resposta atual do ViaCEP.
responde({ erro: 'true' })
assert.equal(await buscaCep('99999999'), null)

// Município sem logradouro: só cidade e UF, e nada de chave vazia sobrescrevendo a tela.
responde({ logradouro: '', bairro: '', localidade: 'Bofete', uf: 'SP' })
assert.deepEqual(await buscaCep('18590000'), { cidade: 'Bofete', uf: 'SP' })

console.log('ok')

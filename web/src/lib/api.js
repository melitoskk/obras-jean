// Todas as chamadas HTTP num arquivo só. O front chama /api/... - o Vite repassa
// pra http://api:7100. Ninguém aqui conhece a URL real da API.

async function req(metodo, url, body) {
  const r = await fetch(url, {
    method: metodo,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) {
    // `erro` é a frase do servidor ("já existe usuário com esse nome"), quando houver -
    // a tela mostra ela em vez do genérico.
    const e = new Error(`${metodo} ${url} → ${r.status}`)
    e.erro = (await r.json().catch(() => null))?.erro
    throw e
  }
  return r.json()
}

export const getEu = () => req('GET', '/api/eu')
export const login = (usuario, senha) => req('POST', '/api/login', { usuario, senha })
export const logout = () => req('POST', '/api/logout')

// Cadastro de usuários - só o administrador (UPDATE.md §5). PATCH parcial; senha
// vazia mantém a atual. `obras` só vale pra quem não tem "Todas as obras".
export const getUsuarios = () => req('GET', '/api/usuarios')
export const criarUsuario = (dados) => req('POST', '/api/usuarios', dados)
export const patchUsuario = (id, dados) => req('PATCH', `/api/usuarios/${id}`, dados)
// Perfis: `{ catalogo, perfis }` - o catálogo de permissões vem junto, é dele que a
// tela monta as caixinhas.
export const getPerfis = () => req('GET', '/api/perfis')
export const criarPerfil = (dados) => req('POST', '/api/perfis', dados)
export const patchPerfil = (id, dados) => req('PATCH', `/api/perfis/${id}`, dados)
export const excluirPerfil = (id) => req('DELETE', `/api/perfis/${id}`)

export const getObras = () => req('GET', '/api/obras')
export const criarObra = (dados) => req('POST', '/api/obras', dados)
export const patchObra = (id, dados) => req('PATCH', `/api/obras/${id}`, dados)
export const getObra = (id) => req('GET', `/api/obra/${id}`)

export const getClientes = () => req('GET', '/api/clientes')
export const criarCliente = (nome) => req('POST', '/api/clientes', { nome })
// PATCH parcial: manda só o que mudou. Salvar a aba Endereço não reenvia o resto.
export const patchCliente = (id, dados) => req('PATCH', `/api/clientes/${id}`, dados)
export const getArquivosCliente = (id) => req('GET', `/api/clientes/${id}/arquivos`)

export const getOrcamentos = () => req('GET', '/api/orcamentos')
export const criarOrcamento = (obra_id) => req('POST', '/api/orcamentos', { obra_id })
export const getOrcamento = (id) => req('GET', `/api/orcamento/${id}`)
export const patchOrcamento = (id, dados) => req('PATCH', `/api/orcamento/${id}`, dados)
export const getCatalogo = () => req('GET', '/api/catalogo')
// Devolve { ok, mantidas: [nome] } - o que ele se recusou a excluir por ter conteúdo.
export const salvarFases = (id, fases, servicos) =>
  req('PUT', `/api/orcamento/${id}/fases`, { fases, servicos })
export const salvarServicos = (id, servicos) =>
  req('PUT', `/api/orcamento/${id}/servicos`, { servicos })
// Valor direto na fase (vira um serviço "Geral" no servidor). Leva o orçamento porque
// a fase é da obra: o valor dela é de UMA versão, não da fase.
export const salvarOrcadoFase = (orcamentoId, faseId, valor) =>
  req('PUT', `/api/orcamento/${orcamentoId}/fase/${faseId}/orcado`, { valor })
// Guarda o estado atual numa versão inativa e nomeada (o histórico).
export const versionarOrcamento = (id, nome) =>
  req('POST', `/api/orcamento/${id}/versao`, { nome })
// Arquivada ou viva: some o documento e os valores dele. Fase e lançamento são da obra
// e ficam, então não há o que travar.
export const excluirOrcamento = (id) => req('DELETE', `/api/orcamento/${id}`)

export const getInsumos = () => req('GET', '/api/insumos')
export const getFluxo = (id) => req('GET', `/api/obra/${id}/fluxo`)
// Visão do cliente (UPDATE.md §12): só somas por fase e por mês, e fotos.
export const getVisao = (id) => req('GET', `/api/obra/${id}/visao`)
// `taxa` = { taxa_tipo, taxa_valor }: a taxa de administração escolhida ao concluir.
export const concluirFase = (id, concluida_em, taxa = {}) => req('PATCH', `/api/fases/${id}`, { concluida_em, ...taxa })
// Percentual de referência da fase (UPDATE.md §2), ponto-base; null = padrão do catálogo.
export const patchFase = (id, dados) => req('PATCH', `/api/fases/${id}`, dados)
export const criarInsumo = (nome, tipo_custo) => req('POST', '/api/insumos', { nome, tipo_custo })
export const patchInsumo = (id, dados) => req('PATCH', `/api/insumos/${id}`, dados)

export const criarEntrada = (obra_id, e) => req('POST', '/api/entradas', { obra_id, ...e })
export const patchEntrada = (id, e) => req('PATCH', `/api/entradas/${id}`, e)
export const excluirEntrada = (id) => req('DELETE', `/api/entradas/${id}`)

export const criarSaida = (s) => req('POST', '/api/saidas', s)
export const patchSaida = (id, s) => req('PATCH', `/api/saidas/${id}`, s)
export const excluirSaida = (id) => req('DELETE', `/api/saidas/${id}`)

export const criarDiario = (d) => req('POST', '/api/diario', d)
export const patchDiario = (id, d) => req('PATCH', `/api/diario/${id}`, d)
export const excluirDiario = (id) => req('DELETE', `/api/diario/${id}`)
// Pendências (rodada 1, A11). PATCH com `{ feita }` marca e desmarca.
export const criarPendencia = (p) => req('POST', '/api/pendencias', p)
export const patchPendencia = (id, p) => req('PATCH', `/api/pendencias/${id}`, p)
export const excluirPendencia = (id) => req('DELETE', `/api/pendencias/${id}`)

export const criarArquivo = (a) => req('POST', '/api/arquivos', a)
export const excluirArquivo = (id) => req('DELETE', `/api/arquivos/${id}`)

export const getFornecedores = () => req('GET', '/api/fornecedores')
export const criarFornecedor = (nome) => req('POST', '/api/fornecedores', { nome })
export const patchFornecedor = (id, dados) => req('PATCH', `/api/fornecedores/${id}`, dados)
// Extrato do credor (UPDATE.md §10.2): as saídas dele em todas as obras.
// O CSV é link direto (`/api/fornecedores/:id/extrato.csv?obra=`), não passa por aqui.
export const getExtratoCredor = (id) => req('GET', `/api/fornecedores/${id}/extrato`)
// Relatórios (UPDATE.md §11.3). Vêm sempre no nível do lançamento; sintético e
// analítico são a mesma lista agrupada na tela. `filtros` vazios não vão na URL.
const query = (filtros) => {
  const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v))
  return q.size ? `?${q}` : ''
}
export const getRelPagamentos = (filtros) => req('GET', `/api/relatorios/pagamentos${query(filtros)}`)
// Contas a pagar (rodada 2, A5): sem obra, todas as que a pessoa vê.
export const getContasAPagar = (filtros) => req('GET', `/api/relatorios/contas-a-pagar${query(filtros)}`)
export const getRelEstimado = (obra) => req('GET', `/api/relatorios/estimado?obra=${obra}`)
// Extrato da fase: sem `fase` vem só a obra e as fases dela (o combo).
export const getRelExtratoFase = (filtros) => req('GET', `/api/relatorios/extrato-fase${query(filtros)}`)
// Vínculo insumo↔fornecedor, a mesma rota pelos dois lados (`lado` = fornecedores|insumos).
// PUT manda o conjunto inteiro: a aba edita uma lista, não um par de cada vez.
// Cada vínculo é { id, preco } - o preço combinado com AQUELE par (0 = não informado).
export const getVinculos = (lado, id) => req('GET', `/api/${lado}/${id}/vinculos`)
export const salvarVinculos = (lado, id, vinculos) => req('PUT', `/api/${lado}/${id}/vinculos`, { vinculos })

// Não há rota de contas a pagar: `pago_em` é campo da própria saída e vai no
// PATCH/POST dela, como qualquer outro.

// Upload cru (sem multipart): o corpo é o arquivo, o nome vai no header. Devolve o
// ref que se grava em `anexo` - o download sai de /api/anexo/<ref>.
export const uploadAnexo = async (file) => {
  const r = await fetch('/api/anexos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-Nome': encodeURIComponent(file.name) },
    body: file,
  })
  if (!r.ok) throw new Error(`upload → ${r.status}`)
  return (await r.json()).ref
}

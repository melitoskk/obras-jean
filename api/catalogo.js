// Catálogo de fases e serviços - a semente do modal "Editar fases e serviços"
// (Obra-Prima-Fases-do-orcamento.png). Revisado na reunião de apresentação (UPDATE.md
// §1, 03/10/2026): 21 fases - a antiga 13 (PORTAS DE MADEIRA E FERRAGENS) foi absorvida
// por ESQUADRIAS e as de baixo subiram um número.
//
// É conteúdo, não código: mexer aqui não quebra nada. Mas só vale com banco novo - a
// semente roda uma vez, no primeiro boot (UPDATE.md §1.16).
//
// [nome da fase, [serviços], unidade padrão dos serviços]
//
// O serviço é uma string, ou `{ nome, opcoes, unidade }` quando tem SUBOPÇÃO (a lista
// de onde se escolhe o material - `Calçada · basalto`) ou foge da unidade da fase.
// A subopção não é um terceiro nível: a árvore continua fase → serviço. Lista fixa
// aqui, sem tela de edição (Dúvida 17). `outros` deixa digitar uma palavra.
//
// Toda fase termina com `Outros` (Dúvida 7) - em SERVIÇOS quem cumpre o papel é o
// `Outros serviços` que já existia.
const MATERIAL_ESQUADRIA = ['madeira', 'PVC', 'alumínio', 'outros']
const MATERIAL_REVESTIMENTO = ['porcelanato', 'cerâmica', 'azulejo', 'outros']

export const CATALOGO = [
  ['SERVIÇOS',
    ['Serviços técnicos', 'Limpeza do lote', 'Acesso ao lote', 'Sondagem', 'Outros serviços'], 'VB'],
  ['INSTALAÇÕES DO CANTEIRO DE OBRA',
    ['Barracão de obra', 'Placa de obra', 'Tapume', 'Ligação de água', 'Ligação de energia', 'Outros'], 'M2'],
  // `Limpeza do terreno` saiu: é a `Limpeza do lote` da fase 1 (Dúvida 1).
  ['TERRAPLANAGEM', ['Escavação mecanizada', 'Aterro compactado', 'Bota-fora', 'Outros'], 'M3'],
  // Na sequência executiva: escavação → estaca/sapata → arranque.
  ['FUNDAÇÕES - INFRA ESTRUTURA',
    ['Embasamento em Pedra', 'Escavação para blocos e baldrames', 'Estaqueamento',
      'Sapatas e arranques', 'Cortinas dos Sub-Solos - Concreto', 'Outros'], 'M3'],
  ['ESTRUTURA', ['Pilares', 'Vigas', 'Lajes', 'Escadas', 'Outros'], 'M3'],
  // Toda impermeabilização mora aqui - inclusive a de contrapiso, e não em PISOS.
  ['IMPERMEABILIZAÇÕES',
    ['Impermeabilização de baldrames', 'Impermeabilização de lajes', 'Impermeabilização de box',
      'Impermeabilização de contrapiso', 'Impermeabilizações gerais', 'Outros'], 'M2'],
  ['ALVENARIA', ['Alvenaria de vedação', 'Vergas e contravergas', 'Encunhamento', 'Outros'], 'M2'],
  ['COBERTURA', ['Estrutura de madeira', 'Estrutura metálica', 'Telhamento', 'Calhas e rufos', 'Outros'], 'M2'],
  ['FORRO', ['Forro de gesso', 'Forro de PVC', 'Forro de madeira', 'Sancas', 'Outros'], 'M2'],
  // Azulejo, porcelanato e cerâmica viraram subopção do revestimento (Dúvida 2).
  ['REVESTIMENTOS',
    ['Chapisco', 'Emboço', 'Reboco', 'Gesso liso',
      { nome: 'Revestimento externo', opcoes: MATERIAL_REVESTIMENTO },
      { nome: 'Revestimento interno', opcoes: MATERIAL_REVESTIMENTO }, 'Outros'], 'M2'],
  // Recebe a antiga fase 13; `Porta de madeira` é `Portas · madeira`.
  ['ESQUADRIAS',
    [{ nome: 'Janelas', opcoes: MATERIAL_ESQUADRIA }, { nome: 'Portas', opcoes: MATERIAL_ESQUADRIA },
      { nome: 'Batentes e guarnições', unidade: 'UN' }, { nome: 'Ferragens', unidade: 'UN' },
      'Grades e portões', 'Outros'], 'M2'],
  ['PISOS, LADRILHOS, PEITORIS, SOLEIRAS E RODAPÉS',
    ['Contrapiso', 'Piso cerâmico', 'Piso porcelanato', 'Soleiras e peitoris', 'Rodapés', 'Outros'], 'M2'],
  // `Pavimento intertravado` saiu: é `Calçada · bloqueto`.
  ['PAVIMENTAÇÃO',
    [{ nome: 'Calçada', opcoes: ['basalto', 'tijolo maciço', 'bloqueto', 'concreto', 'outros'] },
      { nome: 'Meio-fio', opcoes: ['in loco', 'comprado'], unidade: 'M' }, 'Outros'], 'M2'],
  ['INSTALAÇÕES ELÉTRICAS',
    ['Eletrodutos', 'Fiação', 'Quadro de distribuição', 'Tomadas e interruptores', 'Luminárias', 'Outros'], 'M'],
  ['INSTALAÇÕES HIDRÁULICAS', ['Água fria', 'Esgoto', 'Águas pluviais', 'Louças e metais', 'Outros'], 'M'],
  // Renomeada porque o guarda-corpo pode não ser de vidro (Dúvida 4).
  ['VIDROS E GUARDA-CORPOS',
    ['Vidro temperado', 'Vidro comum',
      { nome: 'Guarda-corpo', opcoes: ['vidro', 'metálico', 'outros'] }, 'Outros'], 'M2'],
  // Selador antes da massa: é a ordem de aplicação.
  ['PINTURA',
    ['Selador', 'Massa corrida', 'Pintura acrílica interna', 'Pintura acrílica externa',
      'Stain impregnante', 'Outros'], 'M2'],
  ['ELEVADORES', ['Fornecimento e instalação', 'Casa de máquinas', 'Outros'], 'UN'],
  // `Sondagem` subiu pra fase 1: é decisão de projeto, não ensaio do executado.
  ['CONTROLE TECNOLÓGICO', ['Ensaio de concreto', 'Ensaio de solo', 'Outros'], 'UN'],
  ['DIVERSOS', ['Serviços não previstos', 'Locação de equipamentos', 'Outros'], 'VB'],
  // As ligações definitivas são a `Ligação de água/energia` da fase 2.
  ['FINALIZAÇÃO DE OBRA',
    ['Limpeza final', 'Desmobilização do canteiro', 'Habite-se', 'Paisagismo e ajardinamento', 'Outros'], 'VB'],
]

// Percentual de referência de cada fase no total da obra (UPDATE.md §2), em ponto-base
// (1200 = 12,00%). É CONFERÊNCIA, não gera valor (Dúvida 6): a tela de Estimativa mostra
// ao lado do % real pra dizer "a fundação tá pesando mais que o normal". Soma 10000.
// Distribuição de partida de residencial - RASCUNHO a revisar pela engenharia
// (Dúvida 19). Fundação 12% e estrutura 18% são os números ditos na reunião.
// Por nome, não por posição: é lido a cada boot e não depende de recriar o banco.
export const PERCENTUAL_PADRAO = {
  'SERVIÇOS': 300,
  'INSTALAÇÕES DO CANTEIRO DE OBRA': 200,
  'TERRAPLANAGEM': 150,
  'FUNDAÇÕES - INFRA ESTRUTURA': 1200,
  'ESTRUTURA': 1800,
  'IMPERMEABILIZAÇÕES': 200,
  'ALVENARIA': 700,
  'COBERTURA': 500,
  'FORRO': 200,
  'REVESTIMENTOS': 1000,
  'ESQUADRIAS': 600,
  'PISOS, LADRILHOS, PEITORIS, SOLEIRAS E RODAPÉS': 600,
  'PAVIMENTAÇÃO': 100,
  'INSTALAÇÕES ELÉTRICAS': 500,
  'INSTALAÇÕES HIDRÁULICAS': 500,
  'VIDROS E GUARDA-CORPOS': 250,
  'PINTURA': 500,
  'ELEVADORES': 200,
  'CONTROLE TECNOLÓGICO': 50,
  'DIVERSOS': 250,
  'FINALIZAÇÃO DE OBRA': 200,
}

// Insumos de partida. Os quatro primeiros são os de Obra-Prima-Orcamento-Insumos.png.
export const INSUMOS = [
  ['Areia lavada tipo media', 'Metro Cúbico', 'materiais'],
  ['Pedra britada 1', 'Metro Cúbico', 'materiais'],
  ['Cimento portland cp ii-e-32', 'Quilos', 'materiais'],
  ['Tijolo ceramico furado de vedacao', 'Unidades', 'materiais'],
  ['Aço CA-50 10mm', 'Quilos', 'materiais'],
  ['Concreto usinado fck 25', 'Metro Cúbico', 'materiais'],
  ['Cal hidratada', 'Quilos', 'materiais'],
  ['Servente', 'Hora', 'mao_de_obra'],
  ['Pedreiro', 'Hora', 'mao_de_obra'],
  ['Carpinteiro', 'Hora', 'mao_de_obra'],
  ['Armador', 'Hora', 'mao_de_obra'],
  ['Encanador', 'Hora', 'mao_de_obra'],
  ['Eletricista', 'Hora', 'mao_de_obra'],
  ['Pintor', 'Hora', 'mao_de_obra'],
]

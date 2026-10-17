# UPDATE - apontamentos da reunião de apresentação

Lista de trabalho saída da reunião. Duas partes independentes:

- **§1 Catálogo de fases e serviços** - revisão de engenharia dos itens 1 a 22 de
  [api/catalogo.js](api/catalogo.js). É conteúdo, não código: a numeração abaixo é a
  posição na lista (fase 1 = `SERVIÇOS`, fase 22 = `FINALIZAÇÃO DE OBRA`).
- **§2 a §12 Produto** - funcionalidades e nomenclatura.

As fases **3, 7, 19 e 21** (TERRAPLANAGEM, ALVENARIA, ELEVADORES, DIVERSOS) não foram
apontadas: ficam como estão.

### Decisões já tomadas (03/10/2026)

- **"Subtítulo" é uma subopção do serviço, não um terceiro nível na árvore.** A árvore
  segue com dois níveis (fase → serviço). O serviço ganha uma **lista de opções** da qual
  se escolhe uma - "é calçada, daí uma subopção do material". Detalhe em
  [§1.11](#111-fase-14---pavimentação).
- **O banco pode ser zerado.** Tudo que está lá é semente / dado falso, nenhuma obra real.
  A revisão do catálogo é editar [api/catalogo.js](api/catalogo.js) e recriar o banco -
  sem migração ([§1.16](#116-migração-do-catálogo)).
- **Login de cliente fica fora desta rodada.** A visão nível cliente é uma tela do
  escritório, apresentada por quem atende ([§12](#12-visualização-nível-cliente)).

Cada item traz **o que muda**, **onde** e, quando existe, a **dúvida** que precisa de
resposta antes de implementar. As dúvidas estão todas reunidas em [§13](#13-dúvidas-a-responder).

---

## 1. Catálogo de fases e serviços ✔ entregue

### 1.1 Fase 1 - SERVIÇOS ✔ entregue

Hoje: `Serviços técnicos`, `Outros serviços`.

- **Adicionar** `Limpeza do lote` e `Acesso ao lote`. São os preliminares que vêm antes
  de qualquer coisa chegar no terreno - o caminhão precisa entrar.
- **Adicionar** `Sondagem`, vinda da fase 20 (ver [§1.13](#114-fase-20---controle-tecnológico)).
  Sondagem acontece no começo da obra, não no controle tecnológico do fim.

> **Dúvida 1:** `Limpeza do lote` aqui convive com `3.1 - Limpeza do terreno`
> (TERRAPLANAGEM). São serviços diferentes (uma é roçada/bota-fora de entulho antes de
> entrar, outra é a limpeza mecanizada da terraplanagem) ou a da fase 3 deve sair?

- *Decidido em 03/10/2026:* `Limpeza do terreno` sai da fase 3. Ordem da fase 1: `Serviços técnicos`, `Limpeza do lote`, `Acesso ao lote`, `Sondagem`, `Outros serviços` (este último é o `Outros` da fase, ver Dúvida 7).

### 1.2 Fase 2 - INSTALAÇÕES DO CANTEIRO DE OBRA ✔ entregue

- `Ligação provisória de água` → **`Ligação de água`**
- `Ligação provisória de energia` → **`Ligação de energia`**

Motivo: nem sempre é provisória. Em muita obra a ligação já entra definitiva e o
serviço é o mesmo. Se for preciso distinguir, a distinção vai na descrição do
lançamento, não em dois serviços de catálogo.

### 1.3 Fase 4 - FUNDAÇÕES - INFRA ESTRUTURA ✔ entregue

| Ação | Serviço |
|---|---|
| **Remover** | `Concreto Ciclópico` |
| **Substituir** | `Escavação de Tubulão` → **`Estaqueamento`** |
| **Adicionar** | **`Sapatas e arranques`** |

Resultado: `Cortinas dos Sub-Solos - Concreto`, `Embasamento em Pedra`, `Estaqueamento`,
`Escavação para blocos e baldrames`, `Sapatas e arranques`.

> **Atenção à ordem:** definir em que posição entram `Estaqueamento` e `Sapatas e
> arranques`. A sequência executiva é escavação → estaca/sapata → arranque, e o código
> do serviço (`4.1`, `4.2`...) é o que a pessoa lê na árvore.

- *Decidido em 03/10/2026:* sequência executiva - `Embasamento em Pedra`, `Escavação para blocos e baldrames`, `Estaqueamento`, `Sapatas e arranques`, `Cortinas dos Sub-Solos - Concreto`, `Outros`.

### 1.4 Fase 5 - ESTRUTURA ✔ entregue

- **Remover** `5.5 - Armação de aço CA-50` - é redundante, o aço já está dentro de
  pilar, viga e laje.
- **Adicionar** **`Outros`** no lugar dele, como última linha da fase.

Padrão: toda fase ganha uma linha `Outros` no fim? Ver [Dúvida 7](#13-dúvidas-a-responder).

- *Decidido em 03/10/2026:* **toda fase** termina com `Outros` - inclusive DIVERSOS. Em SERVIÇOS o `Outros serviços` existente cumpre o papel e não ganhou um segundo.

### 1.5 Fase 6 - IMPERMEABILIZAÇÕES ✔ entregue

- **Adicionar** **`Impermeabilizações gerais`**.
- **Adicionar** **`Impermeabilização de contrapiso`** (item 12 da reunião, que pediu
  pra avaliar onde cabia). Decisão proposta: **cabe aqui**, não na fase 12 - toda
  impermeabilização mora numa fase só, senão o orçamento tem o mesmo serviço em dois
  lugares e ninguém sabe em qual lançar.

### 1.6 Fase 8 - COBERTURA ✔ entregue

- **Adicionar** **`Estrutura metálica`**, ao lado de `Estrutura de madeira`. São duas
  linhas, não uma com material escolhido: o custo e o fornecedor são de mundos
  diferentes.

### 1.7 Fase 9 - FORRO ✔ entregue

- **Adicionar** **`Forro de madeira`** (hoje só tem gesso e PVC).

### 1.8 Fase 10 - REVESTIMENTOS ✔ entregue

Hoje: `Chapisco`, `Emboço`, `Reboco`, `Azulejo`, `Gesso liso`.

- **Adicionar** **`Porcelanato`** e **`Cerâmica`**.
- **Adicionar** **`Revestimento externo`** e **`Revestimento interno`** - linhas
  genéricas onde o material vai na **descrição** do serviço/lançamento, porque a
  combinação de materiais varia obra a obra e não dá pra enumerar no catálogo.

> **Dúvida 2:** `Revestimento externo/interno` são linhas genéricas **além** de
> porcelanato/cerâmica/azulejo, ou são elas que devem **substituir** as específicas?
> Como está escrito, as duas coisas convivem e há sobreposição: porcelanato interno
> pode ser lançado em `Porcelanato` ou em `Revestimento interno`.

- *Decidido em 03/10/2026:* substituem, com subopção. Saem `Azulejo`, `Porcelanato` e `Cerâmica`; ficam `Revestimento externo` e `Revestimento interno`, cada um com subopção `porcelanato`, `cerâmica`, `azulejo`, `outros`.

### 1.9 Fase 11 - ESQUADRIAS ✔ entregue

- `Janelas de alumínio` → **`Janelas`**
- `Portas de alumínio` → **`Portas`**
- `Grades e portões` fica.
- **Receber** a fase 13 inteira (ver [§1.10](#110-fase-13---portas-de-madeira-e-ferragens)):
  **`Batentes e guarnições`** e **`Ferragens`**.

O material deixa de estar no nome e vira **subopção** do serviço, no padrão de
[§1.11](#111-fase-14---pavimentação):

| Serviço | Subopções |
|---|---|
| `Janelas` | madeira, PVC, alumínio, outros |
| `Portas` | madeira, PVC, alumínio, outros |

- *Decidido em 03/10/2026 (não previsto):* `Batentes e guarnições` e `Ferragens` mantêm a unidade `UN` da antiga fase 13 - o catálogo passou a aceitar `unidade` por serviço, além da da fase. Ordem: `Janelas`, `Portas`, `Batentes e guarnições`, `Ferragens`, `Grades e portões`, `Outros`.

### 1.10 Fase 13 - PORTAS DE MADEIRA E FERRAGENS ✔ entregue

**A fase deixa de existir.** Os três serviços (`Porta de madeira`, `Batentes e
guarnições`, `Ferragens`) condensam dentro de ESQUADRIAS (fase 11): `Porta de madeira`
é absorvida por `Portas`, e os outros dois viram serviços de lá.

Consequência: **as fases de 14 a 22 renumeram para 13 a 21**, e o catálogo passa a ter
21 fases. Com o banco zerável ([§1.16](#116-migração-do-catálogo)), a renumeração é só a
nova ordem no arquivo - não há obra carregando o código antigo.

### 1.11 Fase 14 - PAVIMENTAÇÃO ✔ entregue

Esta é a fase que define o padrão de **subopção** - o único pedaço do item 1 a 22 que
mexe em estrutura, e não só em texto:

| Serviço | Subopções |
|---|---|
| `Calçada` | basalto, tijolo maciço, bloqueto, concreto, outros |
| `Meio-fio` | in loco, comprado |

`Pavimento intertravado` (14.3) **sai**: é a mesma coisa que calçada de bloqueto, que
agora é uma subopção da calçada.

#### Como a subopção funciona

Decidido em 03/10/2026: **a subopção é uma descrição escolhida de uma lista, dentro do
serviço - não um terceiro nível de árvore.** A hierarquia continua sendo fase → serviço
(PROJETO-v2 §3: "não existe sub-fase"), e nada muda em orçamento, lançamento ou extrato
além de um campo a mais.

O que isso pede:

1. **No catálogo** ([api/catalogo.js](api/catalogo.js)): o serviço passa a poder declarar
   a sua lista de opções. Hoje a linha é `[nome, [serviços], unidade]`, com serviço como
   string - alguns serviços passam a ser `{ nome, opcoes: [...] }`. Em
   `servico_catalogo`, uma coluna com as opções (JSON, como a semente já é conteúdo) ou
   uma tabela `servico_catalogo_opcao` se for pra editar pela tela.
2. **No serviço da obra** (`servico`): uma coluna de texto com a opção escolhida. Texto,
   não id - a lista é sugestão, e `outros` tem que poder virar uma palavra digitada.
3. **Na tela**: um `select` ao lado do nome, só nos serviços que têm lista. Exibição
   `Calçada · basalto`, numa linha só - a subopção não ganha linha própria na árvore.
4. **Nos relatórios**: dá pra somar por material, porque a opção é campo e não texto
   solto no meio da descrição.

O mesmo padrão atende o material de esquadria ([§1.9](#19-fase-11---esquadrias)) e o do
guarda-corpo ([§1.12](#112-fase-17---vidros)).

> **Dúvida 17:** a lista de opções é **fixa no catálogo** (só o escritório muda, mexendo
> no arquivo), ou **editável na tela** de fases e serviços? A primeira é bem mais simples;
> a segunda exige a tabela de opções do passo 1.

- *Decidido em 03/10/2026:* **fixa no catálogo**. Coluna `servico_catalogo.opcoes` (JSON) e `servico.opcao` (texto); sem tabela de opções, sem tela de edição.
- *Decidido em 03/10/2026 (Dúvida 18):* `Meio-fio` é **metro linear** (`M`), não mais o `M2` da fase. Banco já semeado é acertado no boot ([api/db.js](api/db.js)), no catálogo e nos serviços de estimativa que tinham copiado o `M2`.
- *Implementado em 03/10/2026:* o select fica na aba **Orçamento** da obra, ao lado do nome do serviço; `outros` abre um campo "Qual?" e grava a palavra digitada. Versão arquivada mostra `Calçada · basalto`. A árvore "Editar fases e serviços" não mostra subopção (é escolha de serviço, não de material).

### 1.12 Fase 17 - VIDROS ✔ entregue

- `Espelhos` → **`Outros`**.
- **Adicionar** **`Guarda-corpo`**, com subopção de material (`vidro`, `metálico`,
  `outros`), no padrão de [§1.11](#111-fase-14---pavimentação). Pode ser de vidro ou
  não, e quando é de vidro é aqui que mora.

> **Dúvida 4:** se guarda-corpo metálico também é lançado em VIDROS, a fase está mal
> nomeada. Ou o guarda-corpo não-vidro vai pra outra fase (qual?), ou a fase 17 vira
> algo como `VIDROS E GUARDA-CORPOS`.

- *Decidido em 03/10/2026:* a fase é renomeada para **`VIDROS E GUARDA-CORPOS`**. Serviços: `Vidro temperado`, `Vidro comum`, `Guarda-corpo` (vidro, metálico, outros), `Outros`.

### 1.13 Fase 18 - PINTURA ✔ entregue

- **Inverter** `18.1 Massa corrida` e `18.2 Selador`: **selador vem primeiro**, é o que
  se aplica antes da massa.
- **Remover** `Pintura látex`, **substituída** por **`Pintura acrílica interna`**
  (`Pintura acrílica externa` continua).
- `Verniz` → **`Stain impregnante`**.

Resultado na ordem: `Selador`, `Massa corrida`, `Pintura acrílica interna`,
`Pintura acrílica externa`, `Stain impregnante`.

### 1.14 Fase 20 - CONTROLE TECNOLÓGICO ✔ entregue

- **Remover** `Sondagem` - ela sobe pra fase 1, SERVIÇOS ([§1.1](#11-fase-1---serviços)).
  Sondagem é decisão de projeto, feita antes da obra começar; controle tecnológico é
  ensaio do que já foi executado.
- Ficam `Ensaio de concreto` e `Ensaio de solo`.

### 1.15 Fase 22 - FINALIZAÇÃO DE OBRA ✔ entregue

- `Habite-se e ligações definitivas` → **`Habite-se`** (as ligações definitivas saem
  daqui: com a fase 2 deixando de dizer "provisória", a ligação é um serviço só, lá).
- **Adicionar** **`Paisagismo e ajardinamento`**.

### 1.16 Migração do catálogo ✔ entregue

**Não há migração.** Confirmado em 03/10/2026: não existe obra real no banco - é tudo
semente e dado falso. Então a entrega do §1 é:

1. Editar [api/catalogo.js](api/catalogo.js) com as 21 fases revisadas, na ordem nova.
2. Acrescentar o suporte a subopção no catálogo e em `servico_catalogo`
   ([§1.11](#111-fase-14---pavimentação)).
3. **Recriar o banco** - apagar o arquivo `.db` do volume e subir. A semente roda sozinha
   no primeiro boot (`if (SELECT COUNT(*) FROM fase_catalogo) === 0`), e o usuário
   `admin/admin` volta com ela.

Nada de catálogo versionado, nada de renomear no lugar, nada de coluna `inativo`: tudo
isso existiria só pra proteger dado real, que não há.

- *Feito em 03/10/2026:* o `.db` antigo **não foi apagado**: foi renomeado para `/data/obras.db.antes-catalogo-2026-10-03` no volume `obras_jean_obras-data`. O banco novo foi repovoado com `semear.js` (13 obras de demonstração) para dar tela. Pode apagar o backup quando quiser. Check novo: `api/catalogo.test.mjs`.

> **A partir da primeira obra de verdade, isso muda.** Quando houver obra em produção,
> revisar catálogo passa a exigir: versão gravada, renomeação no lugar (pra `catalogo_id`
> sobreviver), inativação em vez de exclusão (serviço que já recebeu lançamento não pode
> desaparecer) e as obras existentes mantendo o próprio `codigo` de fase. Vale registrar
> isso como dívida conhecida - a próxima revisão de catálogo não vai ser de graça.

---

## 2. Percentual por fase ✔ entregue

Cada fase ganha um **percentual do total da obra**, com valor **estipulado por padrão**
(sugerido pelo sistema) e **editável** pelo usuário.

- O padrão nasce do catálogo: uma distribuição típica (ex. fundação 12%, estrutura 18%...)
  que soma 100%, gravada junto da fase de catálogo.
- Ao criar as fases de uma obra, cada fase recebe o percentual padrão; a tela de
  Orçamento permite editar, e mostra o quanto falta pra fechar 100%.
- O percentual é **sinalizador, não travão** - se a soma não dá 100%, avisa e salva
  (mesmo princípio do estouro de orçamento em
  [MovimentacaoPanel.jsx](web/src/components/MovimentacaoPanel.jsx), que pinta de vermelho
  e salva).

> **Dúvida 6:** o percentual é só **referência de conferência** ("minha fundação tá
> pesando mais que o normal"), ou ele **gera valor** - digito o total da obra e o sistema
> distribui o orçamento por fase? Os dois são úteis, mas o segundo muda quem é a fonte
> do valor orçado e precisa decidir quem ganha quando os dois divergem.

- *Decidido em 03/10/2026:* **só conferência** (Dúvida 6). O valor continua vindo dos serviços; a Estimativa mostra `% real` (custo da fase ÷ custo da obra, laranja quando passa da referência) ao lado de `% ref.` editável, e o rodapé diz quanto falta/passa de 100%.
- *Decidido em 03/10/2026:* o padrão mora em `PERCENTUAL_PADRAO` ([api/catalogo.js](api/catalogo.js)), relido a cada boot - mexer nele não exige recriar o banco. `fase.percentual` NULL = segue o padrão; só grava número quando alguém edita. É da **fase** (da obra), então vale pra todas as versões da estimativa.
- *Decidido em 03/10/2026:* a distribuição de partida é um **rascunho** (fundação 12% e estrutura 18% da reunião; o resto, distribuição típica de residencial) - revisar na Dúvida 19.

---

## 3. Nomenclatura: "orçamento" → "estimativa" ✔ entregue

Trocar o termo na interface. "Orçamento" promete preço fechado; o que o escritório
entrega nessa fase é **estimativa**.

- **Troca na tela:** aba `Orçamento` da obra, títulos, botões, rótulos de relatório,
  mensagens. Grep inicial: `web/src/components/OrcamentoObra.jsx`,
  `web/src/components/ObraPanel.jsx`, `web/src/App.jsx`, `web/src/ui/Tela.jsx`.
- **Não troca no código:** tabela `orcamento`, rotas `/api/orcamento/...`, nomes de
  arquivo e variáveis. Renomear coluna pra ganhar sinônimo é churn, e o próprio
  PROJETO-v2 já registra essa decisão pra `status`/`situacao`.
- **Cuidado com "orçado × realizado"** ([§11](#11-relatórios)): ali "orçado" é o par
  canônico de "realizado". Decidir se vira **"estimado × realizado"** - preferível, pra
  não ter os dois termos na mesma tela.
- *Decidido em 03/10/2026:* vira **"Estimado"** (coluna `Estimado (R$)` e rodapé do Fluxo). O nome da versão semeada passou a `Estimativa executiva`, em `semear.js` e no banco atual (13 linhas).

---

## 4. Administração: despesa sem cadastro ✔ entregue

Deve ser possível lançar uma despesa de **administração** sem passar por cadastro de
insumo nem de fornecedor.

- Hoje a saída já aceita linha avulsa (`saida_item.descricao` sem `item_id`), mas o
  painel abre com a grade de itens aberta e empurra pra escolher insumo e fornecedor.
- O que falta: um caminho de lançamento de **despesa administrativa** - valor, data,
  descrição, fase (ou obra, sem fase) - que não peça nada de catálogo.
- Esse lançamento precisa ser **identificável** como administração, porque é ele que
  alimenta o foco em taxa de administração dos relatórios ([§11](#11-relatórios)).

> **Dúvida 8:** administração é um **tipo de lançamento** (uma marca na saída), uma
> **fase** do catálogo, ou a **taxa de administração** já prevista em
> `orcamento.taxa_adm`? A frase "despesa que não depende de cadastro" sugere a primeira,
> mas o relatório pedido sugere ligação com a terceira.

- *Decidido em 03/10/2026:* administração é a **taxa de administração** (Dúvida 8): um % único por estimativa (`orcamento.taxa_adm`, agora em ponto-base, não mais centavos) sobre o custo de cada fase. Fica em **linha à parte** no rodapé da Estimativa - Custo + Administração = Total -, sem entrar no custo da fase. Previsto = taxa × estimado; realizado = taxa × gasto, que é o que o relatório 5 da [§11.3](#113-relatórios) vai usar.
- *Decidido em 17/10/2026 (validação, rodada 1, A2):* a taxa **devida** é **por fase** e se escolhe **ao concluir a fase**: valor fixo (ex.: R$ 5.000 na fundação) ou percentual **sobre o que foi pago** na fase. Fase em andamento não deve taxa. Grava em `fase.taxa_tipo` (`fixo`/`pct`) e `fase.taxa_valor` (centavos ou ponto-base); a conta é `taxaDevida` em [api/rotas/relatorio.js](api/rotas/relatorio.js). O % único da estimativa continua como **previsão** (rodapé da Estimativa e coluna "Adm. prevista") e é a sugestão no quadro de concluir. O relatório 5 troca "Adm. realizada" (taxa × lançado) por Pago, Taxa da fase e Taxa devida.
- *Decidido em 03/10/2026:* o **lançamento de despesa sem cadastro sai desta rodada**. A saída já aceita linha avulsa (descrição sem insumo); o atalho no painel de lançamento não foi feito.

---

## 5. Usuários e permissionamento ✔ entregue

Hoje: tabela `usuario` com `nome` e `senha`, semeada com `admin/admin`, e usuário novo
só por linha de comando (`api/criar-usuario.js`). Login é um gate único - quem entra,
pode tudo.

O que entra:

- **Tela de cadastro de usuários** - criar, editar, inativar, trocar senha.
- **Permissionamento por papel.** Coluna `papel` em `usuario`, verificada no servidor
  (não só esconder botão na tela), aplicada no middleware que já existe
  (`exigirLogin` em [api/auth.js](api/auth.js)).

Papéis prováveis, a confirmar:

| Papel | Pode |
|---|---|
| Administrador | tudo, incluindo cadastrar usuário |
| Escritório | cadastros, estimativa, lançamentos, relatórios |
| Campo | diário de obra e galeria da obra em que está |

**Cliente não entra nesta lista.** Decidido em 03/10/2026: o cliente **não tem login**
por ora. A visão nível cliente ([§12](#12-visualização-nível-cliente)) é tela do
escritório, aberta por quem está apresentando. Isso poupa a parte caríssima da entrega -
login de cliente exigiria isolamento por obra em toda rota da API.

Quando o login de cliente entrar, o papel `Cliente` se encaixa aqui, e o isolamento por
obra é o trabalho de verdade - não a tela.

> **Dúvida 9:** confirmar os três papéis acima e o que cada um pode. Em especial: o papel
> de campo vê **valores** (quanto custou a fase) ou só diário e galeria?

- *Decidido em 03/10/2026 (Dúvida 9):* os três papéis valem como na tabela. O campo vê **só Diário de obra e Galeria**, sem nenhum valor, e **só das obras atribuídas a ele**.
- *Decidido em 03/10/2026:* colunas `usuario.papel` (`admin`/`escritorio`/`campo`) e `usuario.ativo`; vínculo `usuario_obra`. Quem já existia no banco ficou `admin` (era o "pode tudo" de antes). A permissão é por rota em `autorizado` ([api/auth.js](api/auth.js)): o campo tem **lista branca**, e rota nova nasce fechada pra ele. O recorte por obra fica nas rotas que ele alcança: obra de outro canteiro responde 404. Para o campo, `GET /api/obras` vem sem somas e `GET /api/obra/:id` vem sem lançamentos, insumos e fornecedores.
- *Decidido em 03/10/2026:* o cookie de sessão passa a selar o **id** e a assinatura cobre o hash da senha. Trocar a senha derruba as sessões abertas, e inativar também, porque o usuário é relido a cada requisição. As sessões antigas (seladas pelo nome) caíram uma vez.
- *Decidido em 03/10/2026:* tela **Usuários** no rail, só para o administrador ([Usuarios.jsx](web/src/pages/Usuarios.jsx)): cria, edita, troca senha, inativa e marca as obras do campo. Usuário se inativa, não se exclui, porque o nome é o autor no diário. O servidor recusa deixar o sistema sem administrador ativo. `criar-usuario.js` fica como saída de emergência.
- *Decidido em 03/10/2026 (Dúvida 20):* o campo **vê todos** os posts do diário da obra, mas **edita e exclui só os que ele escreveu** (403 no servidor, e os botões somem na tela). Escritório e administrador seguem mexendo em qualquer post. A autoria é pela coluna nova `diario.autor_id` e não pelo nome, porque o nome se troca na tela de Usuários. Os posts antigos foram ligados ao autor pelo nome atual; os que não casaram com usuário nenhum (70 de 97 no banco de hoje, todos da semente) ficam sem dono e só o escritório mexe neles.
- *Registrado em 03/10/2026:* o download de anexo (`GET /api/anexo/:ref`) não é recortado por obra. O ref é aleatório e o campo não recebe refs de nota fiscal, mas quem tiver o ref de um anexo consegue baixá-lo. Fechar isso exige guardar de qual obra é cada ref. Fica pro login de cliente, que vai precisar do mesmo isolamento.

---

## 6. Subitem no formulário de lançamento ✔ entregue

Hoje o lançamento aponta pra **fase** (`entrada.fase_id`, `saida.fase_id`). Precisa
apontar também pro **serviço** (o subitem, `1.1`, `4.2`).

- Coluna `servico_id` em `saida` (e em `entrada`, se aporte também se destina a serviço).
- No painel de lançamento, um segundo combo abaixo de Fase, filtrado pelos serviços
  daquela fase, **opcional** - lançamento de fase inteira continua valendo.
- Com isso o confronto estimado × realizado passa a existir **no nível do serviço**, que
  é onde o valor foi estimado. Hoje ele só fecha por fase.
- Cuidado: `servico` pertence a um **orçamento** (`servico.orcamento_id`). Quando a
  estimativa é versionada, o `servico_id` do lançamento aponta pra uma versão. Decidir se
  o vínculo é com o serviço da versão viva, ou com o serviço **de catálogo**
  (`catalogo_id`), que atravessa versões - **esta segunda é a recomendação**.
- *Decidido em 03/10/2026:* a coluna é `saida.servico_catalogo_id` (catálogo, como recomendado); o estimado do serviço é o que a versão viva diz para (fase, catálogo). **Só saída** - entrada é aporte do cliente na fase, não pagamento de serviço. Serviço avulso (o `Geral` do valor direto na fase) não aparece no combo: lançar nele é lançar na fase inteira. O combo só aparece em saída e quando a fase tem serviço na estimativa; trocar a fase limpa o serviço; o servidor recusa serviço de outra fase (400).
- *Registrado em 03/10/2026:* o dado do confronto por serviço já existe (realizado por `servico_catalogo_id`); a **tela** que o mostra é o relatório 2 de [§11.3](#113-relatórios), não esta entrega. No extrato da fase o serviço aparece no começo da descrição.

---

## 7. Ordenação

Revisar o comportamento de ordenação nas listas. O apontamento é genérico, então o
primeiro passo é levantar **onde** incomodou.

Pontos conhecidos que valem conferir:

- **Extrato de fase** - entrada e saída em tabelas diferentes, ordem resolvida por
  `criado_em` (backfill sintético em [api/db.js](api/db.js)). Conferir se a ordem exibida
  é a esperada quando há vários lançamentos no mesmo dia.
- **Fases e serviços** - `fase.ordem`/`codigo` e `servico.ordem`/`codigo`: qual manda
  quando divergem?
- **Listas de cadastro** (clientes, fornecedores, itens) - ordem padrão e se o clique no
  cabeçalho ordena.

> **Dúvida 10:** qual lista ordenou errado na apresentação? Com o caso concreto isso é
> um ajuste; sem ele, é uma auditoria de todas as listas.

- *Adiado em 03/10/2026:* ninguém lembra qual lista era. A §7 fica pra depois; volta como ajuste se o caso reaparecer em uso, ou como auditoria se pedirem.

---

## 8. "Dia a dia" → "Diário de obra" ✔ entregue

Renomear a aba e tudo que a nomeia na interface. `Diário de obra` é o termo que o
escritório usa e tem peso documental - "dia a dia" soa informal.

- Tela: [web/src/components/DiarioObra.jsx](web/src/components/DiarioObra.jsx), a aba em
  [ObraPanel.jsx](web/src/components/ObraPanel.jsx), e o rótulo da galeria que fala
  "dia a dia".
- **Não mexer** na tabela `diario` nem na pasta `dia_a_dia` de `arquivo.pasta`: é dado
  gravado, e o componente já se chama `DiarioObra`.

> **Dúvida 11:** junto do nome muda a **forma**? "Diário de obra" normalmente é um
> documento com um registro **por dia** (data, clima, efetivo, atividades, ocorrências),
> enquanto hoje é um feed de posts com hora. Se a ideia é o documento, vira entrega
> grande e precisa de um relatório imprimível.

- *Decidido em 03/10/2026 (Dúvida 11):* só o nome. A forma "um registro por dia" fica fora desta rodada; se for pedida, é item novo.

---

## 9. Número do lançamento ✔ entregue

Cada lançamento ganha um **número visível e sequencial**, pra ser citado ("confere o
lançamento 0412").

- Entrada e saída são tabelas separadas, cada uma com seu `id` - o número precisa ser
  **um só, sem colisão**. Duas saídas: numeração global compartilhada, ou prefixo por
  tipo (`E-0231` / `S-0412`). **Recomendação: prefixo** - é a opção legível e não exige
  contador compartilhado.
- O número aparece no extrato, no painel do lançamento, no extrato de fornecedor
  ([§10](#10-fornecedores)) e nos relatórios. O padrão de 6 dígitos de
  `orcamento.numero` já é o jeito da casa.
- Número **não se reaproveita** quando o lançamento é excluído.
- *Decidido em 03/10/2026:* prefixo, `E-000231` / `S-000412` (6 dígitos). Coluna `numero` em `entrada` e `saida`, preenchida por **trigger** a partir da tabela `sequencia`, que só anda pra frente - não é o `id`, que o SQLite reaproveita quando a última linha é excluída. Lançamentos existentes foram numerados na ordem de `criado_em`; `semear.js --limpar` zera o contador. Aparece no extrato da fase (coluna `Nº`), no título do painel ao editar e no CSV da obra. Extrato do fornecedor e relatórios ainda não existem: levam o número quando forem feitos (§10.2, §11.3).

---

## 10. Fornecedores ✔ entregue

### 10.1 Prestador ou fornecedor ✔ entregue

O cadastro passa a distinguir **fornecedor** (vende material) de **prestador** (vende
serviço/mão de obra), com **filtro** na listagem.

- Coluna `tipo` em `fornecedor`. Um cadastro pode ser os dois - então ou duas flags, ou
  um campo que aceita ambos. **Recomendação: dois checks** (`fornece material`,
  `presta serviço`), porque a empreiteira que também vende material existe.
- O filtro entra na barra da listagem em
  [web/src/pages/Fornecedores.jsx](web/src/pages/Fornecedores.jsx) e nos combos de
  lançamento (lançar mão de obra lista prestadores primeiro).
- *Decidido em 03/10/2026:* dois checks, colunas `fornecedor.fornece_material` e `fornecedor.presta_servico` (os dois desmarcados = não classificado). Filtro `Tipo` e coluna `Tipo` na lista. No lançamento o tipo **desempata, não filtra**: quem já vendeu o item continua na frente, e o tipo vem do `tipo_custo` dos itens (linha, ou nota inteira no cabeçalho) - nota sem item ou misturando material e mão de obra não prioriza ninguém. A semente classifica pelo que cada fornecedor declara fornecer.

### 10.2 Extrato do fornecedor / credor ✔ entregue

Uma visão por credor: **tudo que foi lançado pra ele**, em todas as obras.

- Linhas: data, número do lançamento ([§9](#9-número-do-lançamento)), obra, fase/serviço,
  descrição, valor, vencimento, pago em.
- Totais: total lançado, total pago, **em aberto**.
- **Com comprovantes**: cada linha mostra e deixa abrir o anexo (`saida.anexo` já existe).
  O extrato é o documento que se manda pro credor conferir.
- Exportável (CSV já existe em [api/csv.js](api/csv.js); PDF se for pra enviar).

> **Dúvida 12:** "extrato do fornecedor" e "extrato do credor" são o mesmo relatório com
> dois nomes, ou "credor" é mais amplo (inclui quem não é fornecedor cadastrado, tipo
> banco ou prefeitura)? Estou tratando como o mesmo.

- *Decidido em 03/10/2026 (Dúvida 12):* mesmo relatório - credor é fornecedor cadastrado; banco e prefeitura entram como cadastro, sem tipo marcado. Formato desta entrega: **tela + CSV**; PDF espera o MIV e a Dúvida 15.
- *Decidido em 03/10/2026:* quanto de cada saída é de quem - com fornecedor no cabeçalho, a nota inteira é dele (mesmo com linha de outro fornecedor dentro); sem cabeçalho, cada fornecedor das linhas leva a soma das linhas dele; saída sem fornecedor nenhum não entra em extrato. A regra mora na view `saida_credor` ([api/db.js](api/db.js)), lida também pela lista de Fornecedores - que antes somava só `saida_item` e deixava de fora empreita sem itens, então Compras/Total da lista mudaram de valor.
- *Decidido em 03/10/2026:* o extrato é a aba `Extrato` do cadastro do fornecedor (substitui a aba `Compras`, que eram três números), com filtro de obra, situação vencida em vermelho, clipe que abre o comprovante e CSV ([api/rotas/fornecedor.js](api/rotas/fornecedor.js)) com os totais no pé e o nome do arquivo do comprovante.

---

## 11. Saldo, conclusão de fase e relatórios

### 11.1 Destacar o saldo ✔ entregue

O saldo precisa ter destaque visual - é o número que se procura primeiro ao abrir a obra.

- Hoje ele é uma coluna de grid e um trecho de rodapé em
  [FluxoObra.jsx](web/src/components/FluxoObra.jsx), do mesmo tamanho do resto.
- Virar **indicador em destaque** no topo da obra, com sinal claro de positivo/negativo
  (o vermelho de `text-perigo` já existe).
- Lembrar que saldo e caixa são números diferentes e já têm teste
  ([api/fluxo.test.mjs](api/fluxo.test.mjs)): o destaque precisa deixar explícito **qual
  dos dois** está na tela.
- *Decidido em 03/10/2026:* os dois, lado a lado, entre o título da obra e as abas (vale pra todas): **Saldo** maior (entradas − tudo lançado), **Caixa** ao lado (entradas − só o pago), cada um com a conta escrita embaixo, sinal `+`/`−` e verde/vermelho; **A pagar** em laranja quando houver. Vem de `GET /api/obras` (campo novo `saldo`) e recarrega a cada lançamento no Fluxo. Componente [DestaqueSaldo.jsx](web/src/components/DestaqueSaldo.jsx).

### 11.2 Check de fase concluída ✔ entregue

- Cada fase ganha um **marcador de concluída** (data de conclusão - há `avanco.concluido_em`,
  avaliar se serve ou se a marca é na própria fase).
- Ao concluir, o sistema **pergunta pra qual fase ir em seguida**, e já abre essa fase.
  É o fluxo de quem está no canteiro: terminou fundação, agora é estrutura.
- Fase concluída aparece diferente nas listas e pode ser recolhida por padrão.

> **Dúvida 13:** concluir a fase **bloqueia** lançamento nela (nota atrasada chega
> depois) ou é só marca? Recomendo só marca, com aviso ao lançar em fase concluída.

- *Decidido em 03/10/2026 (Dúvida 13):* só marca, com aviso ao lançar em fase concluída - não bloqueia.
- *Decidido em 03/10/2026:* a marca é a coluna `fase.concluida_em` (data). `avanco.concluido_em` não serve: é por mês e por tipo (planejado/medido). Rota `PATCH /api/fases/:id` (`{ concluida_em: 'AAAA-MM-DD' | null }`). No Fluxo de caixa, `Concluir fase` / `Reabrir fase` em cima do extrato; ao concluir, pergunta a próxima (sugere a primeira em andamento depois dela na ordem) e abre. O grid do Fluxo esconde as concluídas por padrão (check `Mostrar fases concluídas (n)`), mas o rodapé continua somando todas; na Estimativa a fase leva o selo `Concluída` (lá as fases já abrem recolhidas). No lançamento, a fase aparece como `(concluída)` no combo e o painel avisa em amarelo.

### 11.3 Relatórios

A tela existe vazia por decisão registrada ("volta quando o escritório disser QUAL
relatório precisa" - [Relatorios.jsx](web/src/pages/Relatorios.jsx)). A reunião disse.

**Operacionais (escritório):**

1. **Quanto já foi pago em X / para quem** - total por insumo, por serviço, por fase e
   por credor, com filtro de período e obra.
2. **Estimado × realizado** - por fase e, com [§6](#6-subitem-no-formulário-de-lançamento),
   por serviço. Diferença em R$ e em %, estouro destacado.
3. **Extrato do credor com comprovantes** - [§10.2](#102-extrato-do-fornecedor--credor).
4. **Sintético e analítico** - o mesmo relatório em duas profundidades: sintético é uma
   linha por fase; analítico desce até o lançamento. Vale pra 1 e 2.
5. **Foco na taxa de administração** - quanto a administração representa, previsto contra
   realizado. Definido em [§4](#4-administração-despesa-sem-cadastro): taxa × estimado
   contra taxa × gasto, por fase.

**Para o cliente (enviáveis):**

6. **Pizza por fase** - participação de cada fase no total; e os gráficos equivalentes
   (realizado no tempo, estimado × realizado).
7. Enviáveis **seguem o MIV** - capa, cores, logo, tipografia, cabeçalho e rodapé do
   escritório, em tudo que sai do sistema pro cliente.

> **Dúvida 14:** confirmo que **MIV = Manual de Identidade Visual** do escritório. Se
> sim, **preciso do arquivo** (cores em hex, logo em vetor, fontes) - sem ele os
> enviáveis saem no visual atual do sistema.
>
> **Dúvida 15:** os enviáveis são **PDF** (anexar em e-mail/WhatsApp) ou **link/tela**
> que se abre com o cliente? PDF é entrega maior; a tela de [§12](#12-visualização-nível-cliente)
> talvez já resolva.

- *Decidido em 03/10/2026:* a §11.3 foi partida em duas entregas. **8a - operacionais (itens 1 a 5) ✔ entregue**; **8b - enviáveis (itens 6 e 7)** fica junto da [§12](#12-visualização-nível-cliente), esperando a Dúvida 15 e o arquivo do MIV. Por isso o título desta seção ainda não leva ✔.
- *Decidido em 03/10/2026:* tela [Relatorios.jsx](web/src/pages/Relatorios.jsx) com quatro abas (Pagamentos, Estimado × realizado, Extrato do credor, Taxa de administração); relatório e filtros moram na query (`?r=&obra=&por=&de=&ate=&nivel=`). Rotas em [api/rotas/relatorio.js](api/rotas/relatorio.js), fechadas pro campo (fora da lista branca dele).
- *Decidido em 03/10/2026:* **sintético × analítico (item 4) é agrupamento na tela, não consulta**: o servidor devolve sempre no nível do lançamento e a tela agrupa, então os dois níveis não têm como fechar totais diferentes. Vale pros relatórios 1 e 2; o 5 é por fase.
- *Decidido em 03/10/2026:* **relatório 1** agrupa por fase, serviço, insumo ou credor, com obra (ou todas) e período pela **data da nota**; mostra lançado, pago e em aberto. O total é sempre a soma das saídas filtradas: o que não tem dono na dimensão vai pra um grupo próprio (`Sem itens (valor direto)`, `Sem insumo cadastrado`, `Sem credor`). Com todas as obras, fase e serviço agrupam pelo **nome**, porque `fase.codigo` é a posição da fase na obra e muda de uma pra outra. Credor usa a view `saida_credor`, a mesma do extrato.
- *Decidido em 03/10/2026:* **relatórios 2 e 5 são de uma obra por vez** (o estimado é o da estimativa viva). No 2, diferença = realizado − estimado, e o positivo (estouro) fica em vermelho; o analítico desce fase → serviço → lançamento. O `Geral` e a saída sem serviço ficam juntos em `Fase inteira (sem serviço)`, e lançamento em serviço que a estimativa não tem aparece com estimado 0 (`sem estimado`). O 5 usa o mesmo payload com a taxa aplicada (`mult(taxa, valor)`, a mesma conta do rodapé da Estimativa), e o rodapé diz quanto a administração pesa no total.
- *Decidido em 03/10/2026 (Dúvida 15):* o **item 6** (pizza por fase, realizado no tempo, estimado × realizado) é entregue pela [§12](#12-visualização-nível-cliente): tela + imprimir. O **item 7** (seguir o MIV) ainda não: o arquivo não veio (Dúvida 14) e a folha sai no visual atual do sistema - por isso o título desta seção continua sem ✔.
- *Decidido em 03/10/2026:* o **relatório 3** reaproveita o extrato do credor da [§10.2](#102-extrato-do-fornecedor--credor), com o CSV dele. Os relatórios 1, 2 e 5 **não têm CSV** nesta entrega: a seção não pede, e vira uma rota por relatório quando pedirem.

### 11.4 Extrato da fase ✔ entregue

Pedido em 03/10/2026, fora da reunião: escolher a obra e a fase e ver o **extrato** dela,
"com cara de extrato" - cabeçalho, rodapé, nome da obra, fase, entradas e saídas.

- *Decidido em 03/10/2026:* quinta aba de [Relatorios.jsx](web/src/pages/Relatorios.jsx) (`?r=fase&obra=&fase=`), rota `GET /api/relatorios/extrato-fase` em [api/rotas/relatorio.js](api/rotas/relatorio.js) (fechada pro campo, como os outros relatórios; sem `fase` devolve só as fases da obra, pro combo). Trocar a obra limpa a fase.
- *Decidido em 03/10/2026:* **cara de extrato de banco** - Data, Nº, Histórico, Entrada, Saída, Saldo, da mais antiga pra mais nova pela **data da nota**, mesmo dia na ordem em que foi lançado, com o **saldo correndo** linha a linha. Saldo = entradas − tudo lançado, a mesma conta do Saldo do topo (§11.1). O histórico da saída é o do extrato do Fluxo (serviço · fornecedor · itens · descrição), e saída não paga leva `em aberto, vence dd/mm` em laranja. Embaixo, quadro com total de entradas, de saídas (e quanto delas em aberto) e saldo da fase.
- *Decidido em 03/10/2026:* é uma **folha imprimível**, como a Visão do cliente: cabeçalho com logo, obra, cliente, fase, período e data de emissão; rodapé com a conta do saldo; `Imprimir / salvar PDF` usa o CSS de impressão que já existia, e o cabeçalho da tabela se repete em cada página. Sem filtro de período e sem CSV - não foram pedidos.

---

## 12. Visualização nível cliente ✔ entregue

Um **painel/dashboard da obra na visão do cliente**, mais apresentável que as telas
operacionais. Uso declarado: *"cliente chegou, vamos olhar"* - é tela de reunião,
projetada ou no notebook em cima da mesa.

Características que isso implica:

- **Números grandes e poucos.** Investido, executado, saldo, % de avanço. Nada de grid
  denso.
- **Gráficos:** pizza de participação por fase, barra de estimado × realizado, avanço no
  tempo.
- **Fotos.** A galeria é o que o cliente quer ver - obra em foto, por fase/data.
- **Sem dado interno:** margem, custo de fornecedor e nome de concorrente não aparecem.
  Essa é a regra que decide o que entra na tela.
- Segue o MIV ([Dúvida 14](#13-dúvidas-a-responder)).

**É uma aba da obra, aberta pelo escritório** - decidido em 03/10/2026. Sem login de
cliente ([§5](#5-usuários-e-permissionamento)), nenhuma rota nova de autenticação e
nenhum isolamento por obra: é a mesma API que o escritório já consome, numa tela
desenhada pra ser olhada junto com o cliente.

Consequência prática boa: como quem abre é o escritório, a regra "sem dado interno" é
**de desenho da tela**, não de segurança. Dá pra entregar a tela antes de resolver
permissionamento.

- *Decidido em 03/10/2026 (Dúvida 15):* **tela + imprimir**. A aba `Visão do cliente` da obra ([VisaoCliente.jsx](web/src/components/VisaoCliente.jsx)) é ao mesmo tempo a tela de mesa e o enviável: `Imprimir / salvar PDF` chama o navegador, e o CSS de impressão ([index.css](web/src/index.css)) imprime só a folha (cabeçalho com logo, obra, cliente e data; números; gráficos; fotos; rodapé), em A4. Sem gerador de PDF no servidor.
- *Decidido em 03/10/2026:* o "sem dado interno" é garantido **na rota**, não só na tela: `GET /api/obra/:id/visao` ([api/rotas/visao.js](api/rotas/visao.js)) devolve só somas por fase e por mês, e fotos - descrição de lançamento, fornecedor, insumo e margem não saem ([api/visao.test.mjs](api/visao.test.mjs) confere). Estimado × executado por fase reaproveita o cálculo do relatório 2, então os dois nunca divergem. A rota é fechada pro campo (fora da lista branca) e a aba não aparece pra ele.
- *Decidido em 03/10/2026:* os números são **Investido** (entradas), **Executado** (tudo lançado), **Saldo** (o mesmo do topo, §11.1) e **Executado do estimado** (executado ÷ estimado da estimativa viva, com "n de m fases concluídas" embaixo). O "% de avanço" saiu **financeiro**, porque a medição física (`avanco`) não tem tela nem dado - ver Dúvida 21. O estimado é o **custo** (sem a taxa de administração), o mesmo número contra o qual o executado é lançado.
- *Decidido em 03/10/2026 (Dúvida 21):* o % de avanço **fica financeiro**. Segundo a reunião, gasto e avanço físico andam juntos, então a tela de Medição (tabela `avanco`) não entra.
- *Registrado em 03/10/2026:* o bullet "Segue o MIV" desta seção fica com o item 7 da [§11.3](#113-relatórios): a tela está entregue no visual atual, e trocar cores, logo e fontes é o que falta quando o arquivo chegar (Dúvida 14).
- *Decidido em 03/10/2026:* gráficos em SVG próprio (o projeto não tem biblioteca de gráfico): **pizza** da participação de cada fase no estimado (no executado, se não houver estimativa), até 8 fases com cor e o resto em `Outras fases`; **barras** estimado × executado por fase, com `▲ acima do estimado` escrito; **linhas** de investido e executado acumulados por mês, com o estimado total tracejado. **Fotos**: imagens da pasta Fotos e do Diário de obra (com a fase do post), filtro por fase só na tela.

---

## 13. Dúvidas a responder

Resolvidas em 03/10/2026, registradas no topo do documento:

| # | Era | Resposta |
|---|---|---|
| ~~3~~ | O que é "subtítulo" no sistema | Subopção descritiva dentro do serviço, sem terceiro nível ([§1.11](#111-fase-14---pavimentação)) |
| ~~5~~ | Existe obra real no banco | Não, tudo semente - banco pode ser recriado ([§1.16](#116-migração-do-catálogo)) |
| ~~16~~ | Visão do cliente é aba ou acesso | Aba do escritório; login de cliente fica pra depois ([§12](#12-visualização-nível-cliente)) |
| ~~17~~ | Lista de subopções fixa ou editável | Fixa no catálogo ([§1.11](#111-fase-14---pavimentação)) |
| ~~1~~ | `Limpeza do lote` convive com `Limpeza do terreno` | Não - a da fase 3 sai ([§1.1](#11-fase-1---serviços)) |
| ~~2~~ | Revestimento externo/interno convivem ou substituem | Substituem, com subopção de material ([§1.8](#18-fase-10---revestimentos)) |
| ~~4~~ | Guarda-corpo não-vidro | Fase renomeada `VIDROS E GUARDA-CORPOS` ([§1.12](#112-fase-17---vidros)) |
| ~~7~~ | `Outros` em toda fase | Sim, toda fase ([§1.4](#14-fase-5---estrutura)) |
| ~~11~~ | "Diário de obra" muda a forma | Não - só o nome, nesta rodada ([§8](#8-dia-a-dia--diário-de-obra)) |
| ~~12~~ | Extrato do fornecedor e do credor são o mesmo | Sim - credor é fornecedor cadastrado; tela + CSV por ora ([§10.2](#102-extrato-do-fornecedor--credor)) |
| ~~13~~ | Fase concluída bloqueia lançamento | Não - só marca, com aviso ao lançar ([§11.2](#112-check-de-fase-concluída)) |
| ~~6~~ | Percentual por fase: conferência ou gera valor | Só conferência ([§2](#2-percentual-por-fase)) |
| ~~9~~ | Papéis de usuário; o campo vê valores? | Os três papéis confirmados; campo só diário e galeria, sem valores, só das obras atribuídas ([§5](#5-usuários-e-permissionamento)) |
| ~~15~~ | Enviáveis em PDF ou em tela | Tela + imprimir: a aba Visão do cliente, com `Salvar como PDF` do navegador ([§12](#12-visualização-nível-cliente)) |
| ~~18~~ | Unidade do `Meio-fio` | Metro linear, `M` ([§1.11](#111-fase-14---pavimentação)) |
| ~~20~~ | Campo edita post do diário de outra pessoa | Não: vê todos, edita e exclui só os próprios ([§5](#5-usuários-e-permissionamento)) |
| ~~21~~ | % de avanço financeiro ou físico | Financeiro; gasto e físico andam juntos ([§12](#12-visualização-nível-cliente)) |
| ~~8~~ | O que é "administração" | A taxa de administração, % único sobre o custo de cada fase, linha à parte; despesa sem cadastro sai da rodada ([§4](#4-administração-despesa-sem-cadastro)) |

Em aberto, por impacto:

| # | Dúvida | Trava |
|---|---|---|
| 10 | Qual lista ordenou errado na apresentação? *(03/10/2026: ninguém lembra - §7 adiada)* | §7 |
| 14 | MIV = Manual de Identidade Visual? Pode mandar o arquivo? *(03/10/2026: confirmado que é o Manual; o arquivo ainda não veio e fica pra depois. Até ele chegar, vale o visual atual do sistema)* | §11.3 (7) - trocar cores, logo e fontes das folhas impressas (Visão do cliente e Extrato da fase) |
| 19 | A distribuição padrão do % por fase (`PERCENTUAL_PADRAO` em catalogo.js) está boa? Só fundação 12% e estrutura 18% vieram da reunião *(03/10/2026: validar numa reapresentação)* | §2 |

As de 1 a 7 e 17 são respondíveis na mesa, em minutos (1, 2, 4, 7 e 17 respondidas em 03/10/2026). As de 9 a 15 podem ser resolvidas
quando a respectiva entrega chegar a vez.

---

## 14. Ordem sugerida de execução

Agrupada por dependência, não por tamanho:

1. **Catálogo** (§1) - desbloqueado: subopção definida e banco zerável. Só precisa das
   dúvidas 1, 2, 4, 7 e 17, que são conversa de mesa. ✔ entregue
2. **Nomenclatura** (§3, §8) - troca de rótulo, risco baixo, melhora a próxima demo. ✔ entregue
3. **Rastreabilidade do lançamento** (§6 subitem, §9 número) - é base dos relatórios.
   Sem subitem, estimado × realizado não desce de fase. ✔ entregue
4. **Fornecedor prestador/fornecedor** (§10.1) e **extrato do credor** (§10.2). ✔ entregue
5. **Saldo em destaque** (§11.1) e **check de fase concluída** (§11.2). ✔ entregue
6. **Administração** (§4) e **percentual por fase** (§2) - dependem de decisão. ✔ entregue
7. **Usuários e permissionamento** (§5) - entrega fechada em si. Deixou de ser
   pré-requisito da visão do cliente, agora que o cliente não tem login. ✔ entregue
8. **Relatórios** (§11.3) e **visão do cliente** (§12) - por último, porque consomem
   tudo acima e precisam do MIV. A visão do cliente pode adiantar: sendo aba do
   escritório, não espera permissionamento. Partido em 03/10/2026:
   - **8a - Relatórios operacionais** (§11.3, itens 1 a 5) - não dependem do MIV nem do formato. ✔ entregue
   - **8b - Visão do cliente** (§12) **e enviáveis** (§11.3, itens 6 e 7) - §12 e item 6 ✔ entregue
     (Dúvida 15 = tela + imprimir). **Falta o item 7**, aplicar o MIV: espera o arquivo (Dúvida 14).
9. **Extrato da fase** (§11.4) - pedido avulso de 03/10/2026, entrou depois do 8. ✔ entregue

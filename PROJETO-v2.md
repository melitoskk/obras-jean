# Refatoração completa - alinhar às referências

Plano de reconstrução do sistema para reproduzir, o mais perto possível, as telas em
[obra_prima_referencias/](obra_prima_referencias/).

**Status: entregue.** As fases 6.1 a 6.11 estão implementadas e rodando. Falta a sua
validação - ver [COMO-USAR.md](COMO-USAR.md).

Decisões tomadas sem consulta durante a execução, porque travavam o resto (todas reversíveis):

- **`fase.orcado` legado virou um serviço "Geral"** em vez de a árvore ficar perguntando "tem
  serviço? então usa orcado". Uma migração, e o caso especial some pra sempre.
- **A tabela `item` foi fundida em `insumo`** (rebuild de `saida_item`). Deixar as duas
  conviverem daria dois catálogos na cara do usuário: cadastra o insumo no orçamento e ele não
  aparece na saída.
- **O módulo Orçamento em tela cheia foi apagado** (22/08/2026). Composição de insumo, custo ×
  venda com margem, Insumos agregados, Planejamento, Medição física e Previsto × Realizado eram
  de uma dinâmica que não se usava: na prática o orçamento é uma linha por serviço com um valor
  digitado. Sobrou a aba Orçamento da obra, e ela basta. Foi-se junto a rota `/orcamento/:id` -
  o orçamento não é lugar do sistema, é aba do cadastro da obra.

Proposta original abaixo. Aprovado isto, este documento substitui
[PROJETO.md](PROJETO.md) e as regras 4 e 6 do [CLAUDE.md](CLAUDE.md) precisam ser emendadas (§9).

Escopo decidido com o usuário:

- **Vai:** shell ERP + módulo **Orçamento** inteiro (Fase → Serviço → Composição de insumos,
  custo × venda com margem, Insumos agregados, Planejamento, Medição física, Previsto × Realizado)
  + cadastros de Cliente e Obra. *(O que sobrou disso é Fase → Serviço → valor; o resto foi
  apagado em 22/08/2026 - ver o topo do documento.)*
- **Preserva:** caixa/entradas/saídas, Dia a dia, Galeria e Pendências - reaproveitados como
  abas dentro do visual novo (§6.8, §6.9).
- **Fica de fora desta rodada:** Financeiro / Contas a pagar, Compras / Cotação, Apropriação,
  Mão de obra, Relatórios. São 5 módulos do rail; entram como itens desabilitados, exatamente
  como a própria referência desabilita abas que ainda não valem.

---

## 1. O que as imagens realmente pedem

Não é um tema visual em cima do que existe. É outro produto:

| Referência | O que introduz |
|---|---|
| `Relatorios-min`, `Tutorial-min` | O **shell**: rail navy de 10 módulos + painel de módulo + grid + paginação |
| `Cadastro-Cliente`, `Cadastro-Obra` | **Modal-registro** com abas, label à esquerda do campo, barra de ação no rodapé |
| `Orcamento` | **Orçamento** como entidade numerada; master-detail fase ⇄ serviços ~~; linhas Mão de obra / Materiais~~ |
| `Fases-do-orcamento` | **Catálogo** de 22 fases com serviços, seleção por checkbox |
| ~~`Preco-de-venda`~~ | ~~Margem % por linha; totais Custo / Venda / Taxa Adm~~ - **apagado 22/08/2026** |
| ~~`Orcamento-Insumos`~~ | ~~Agregação de insumos do orçamento inteiro~~ - **apagado 22/08/2026** |
| ~~`Nova-Cotacao`~~ | ~~Composição de custo unitário~~ - **apagado 22/08/2026** |
| ~~`Planejamento`~~ | ~~Matriz fase × período, % e $~~ - **apagado 22/08/2026** |
| `Contas-a-pagar` | Financeiro - **fora desta rodada** |

O modelo de dados atual (obra → fase → entrada/saída) não sobrevive: falta serviço, falta
composição, falta custo × venda, falta período. Reconstrução de schema, não migração.

---

## 2. Design system - extraído das imagens

Sem biblioteca de componentes. Tokens em `web/src/index.css` via `@theme` (Tailwind v4 já está
instalado). Isto é uma UI de ERP densa de ~12px, não o Tailwind moderno de hoje - a maior parte
do "1:1" mora aqui.

### Cores

| Token | Valor | Onde |
|---|---|---|
| `--color-rail` | `#2a4a6b` | rail lateral, barra superior |
| `--color-rail-ativo` | `#3a5f85` | módulo selecionado no rail |
| `--color-titulo` | `#2e6da4` | títulos de tela e de modal, links, aba ativa |
| `--color-acento` | `#337ab7` | botão Salvar, cabeçalho de navegação de fase |
| `--color-laranja` | `#ef9c1e` | Aviso: "a pagar", "alterações não salvas", losango de alerta |
| `--color-sucesso` | `#5cb85c` | faixa "Operação executada com sucesso", barra de progresso |
| `--color-perigo` | `#d9534f` | excluir, estouro de orçamento |
| `--color-grade-head` | `#d8d8d8` | cabeçalho de tabela |
| `--color-grade-zebra` | `#f4f4f4` | linha par |
| `--color-borda` | `#cccccc` | borda de input e de célula |

### Métrica

Densidade é metade da identidade visual. Valores medidos nas imagens:

```
fonte base ......... 12px  (títulos de tela/modal: 19px bold)
linha de grid ...... 25px  (cabeçalho 22px)
input .............. 30px de altura, raio 2px, borda 1px
aba ................ 34px de altura, sublinhado 3px quando ativa
rail ............... 88px de largura, item 72px de altura (ícone 22px + rótulo 9px caixa alta)
painel de módulo ... 230px
barra de ação ...... 44px, botões alinhados à direita
```

### Padrões de layout

1. **Formulário com label à esquerda.** `Cliente *` alinhado à direita, campo à direita dele.
   Grid de 2 colunas por região. É o traço mais reconhecível dos cadastros da referência -
   nada de label acima do campo.
2. **Régua de seção.** Rótulo cinza pequeno + linha fina até a borda (`Filtros`, `Título`,
   `Período`, `Contato`, `Outras informações`).
3. **Barra de ação fixa no rodapé**, à direita: `● Ativo · Relatórios · Ações · Salvar`.
4. **Faixa verde de sucesso**, largura total, acima da barra de ação, some sozinha.
5. **Aba desabilitada é cinza e clicável-a-nada** - a referência faz isso em `Nova obra`
   (Dia a dia, Galeria, Atendimento, Configurações cinzas). Vamos usar o mesmo recurso para
   o que ainda não existe.
6. **Números à direita**, quantidade com 4 casas, dinheiro com 2, separador brasileiro.

### `web/src/ui/` - inventário novo

Regra mantida: `ui/` não importa de `components/`, `pages/` nem `lib/api.js`.

| Componente | Papel | Referência |
|---|---|---|
| `Rail` | navegação de módulos | `Relatorios-min` |
| `PainelModulo` | 2ª coluna, com aba de recolher | `Relatorios-min` (a alça `‹`) |
| `Grid` | tabela densa, zebra, cabeçalho cinza, rodapé de paginação | `Relatorios-min` |
| `Registro` | modal de registro: título + `×` + abas + corpo + barra de ação | todos os cadastros |
| `Abas` | faixa de abas, suporta `disabled` | `Cadastro-Obra` |
| `Campo` | label à esquerda + controle + `*` obrigatório | `Contas-a-pagar` |
| `Secao` | régua de seção | `Cadastro-Cliente` |
| `Combobox` | busca + teclado + `+ Criar "x"` - **mantido do sistema atual** | `+` ao lado de Cliente |
| `MoneyInput` | centavos inteiros - **mantido** | grids de valor |
| `QtdInput` | 4 casas decimais | coluna Quantidade |
| `Barra` | progresso com % centrado em branco | `Planejamento` |
| `BarraAcao` | rodapé de botões | todos |
| `Faixa` | faixa verde/vermelha de resultado | `Orcamento`, `Nova-Cotacao` |
| `Arvore` | árvore de 2 níveis com chevron e checkbox | `Fases-do-orcamento` |
| `Confirm`, `FileDrop`, `EmptyState`, `Badge` | **mantidos**, só reestilizados | - |

Aproveitáveis do que existe hoje sem reescrever a lógica: `Combobox`, `MoneyInput`, `Confirm`,
`FileDrop`, `format.js`. O resto de `ui/` é substituído.

---

## 3. Modelo de dados

Dinheiro em **centavos inteiros** (regra 7 do CLAUDE.md, mantida). Quantidade é `REAL` - não é
dinheiro. `total = arredonda(qtd × unit_em_centavos)`, com meio-para-cima, num helper único e
com teste.

```
-- catálogo (semeado, compartilhado por todos os orçamentos)
fase_catalogo      id, codigo, nome
servico_catalogo   id, fase_catalogo_id, codigo, nome, unidade
insumo             id, nome, unidade, tipo_custo   -- materiais | mao_de_obra

-- cadastros
cliente            id, nome, tipo, cpf_cnpj, rg, dt_nasc, categoria, telefone, celular,
                   email, observacao, ativo, incompleto
                   + endereco_* (cep, logradouro, numero, complemento, bairro, cidade, uf)
obra               id, cliente_id, nome, categoria, situacao, observacao, foto,
                   dt_inicio, duracao, duracao_unidade, dt_fim, cei, ativo
                   + endereco_*
                   situacao ∈ { nao_iniciada, em_andamento, paralisada, concluida }

-- orçamento
orcamento          id, numero, obra_id, criado_em, ativo, nome
                     (taxa_adm e observacao existem na tabela mas não têm mais
                     tela nem rota que os escreva - eram da aba Dados)
                     ativo=0 é VERSÃO ARQUIVADA - uma "gaveta" nomeada. O
                     orçamento VIVO (ativo=1) é o da obra: é dele que sai o
                     orçado da home. Todas as versões falam das MESMAS fases da
                     obra - versionar copia só o serviço. Na aba
                     Orçamento da obra são dois botões: `Salvar` sobrepõe o vivo
                     (confirma antes - só pergunta se já há valor gravado) e
                     `Salvar como novo orçamento` arquiva o estado ANTERIOR
                     numa gaveta (POST .../versao) e grava os valores novos no
                     vivo, que assume o nome digitado: o novo é que passa a
                     valer. O vivo nunca troca de id. Gaveta
                     abre em SOMENTE LEITURA. Um menu `⋮` ao lado do seletor
                     renomeia (PATCH) e exclui (DELETE) tanto a gaveta quanto o
                     vivo. DELETE não tem trava: apaga os SERVIÇOS daquela
                     versão e o documento, e não encosta em fase, saída, entrada
                     nem avanço, que são da obra. Excluir o ativo promove a
                     versão mais recente que sobrou - a obra tem sempre um vivo
                     só. Consulta de orçado por obra filtra `orcamento.ativo=1`,
                     senão a gaveta soma junto.
fase               id, obra_id, catalogo_id?, codigo, nome, ordem, inativa
                     DA OBRA, não do orçamento: uma fase por obra, para sempre.
                     Nenhuma operação de orçamento cria, apaga ou repõe fase.
servico            id, orcamento_id, fase_id, catalogo_id?, codigo, nome, unidade,
                   qtd, ordem, custo_mo_unit, custo_mat_unit, margem_mo, margem_mat
                     O valor que UMA versão do orçamento atribui a UMA fase da
                     obra. Fase sem serviço nesta versão vale 0 e continua na
                     lista - a obra não muda de forma por causa de orçamento.
                     Digitando na lista sai sempre qtd=1, mo=0, mat=<valor>: o
                     total do servidor é qtd*(mo+mat), e zerar os outros dois é
                     o que faz o gravado ser o digitado. As colunas margem_* não
                     têm mais escritor (a tela de venda foi apagada).

-- tabelas sem rota desde 22/08/2026: existem, guardam o que já foi gravado, e
-- nada mais as escreve. Dropar é migração à parte, com backup.
composicao         id, servico_id, insumo_id, tipo_custo, qtd, custo_unit
avanco             id, fase_id, ym, tipo, pct, concluido_em?

-- preservado do sistema atual
entrada            id, obra_id, fase_id, valor, data, descricao, anexo
saida              id, fase_id, valor, data, descricao, anexo
saida_item         id, saida_id, item_id, fornecedor_id, descricao, qtd, valor_unit
fornecedor         id, nome, contato, incompleto
diario             id, obra_id, fase_id?, texto, autor, criado_em
arquivo            id, obra_id, pasta, nome, ref, criado_em, diario_id?
```

Decisões que valem discussão antes de virar código:

- **A árvore tem 2 níveis: fase → serviço.** O `1.1 - SERVIÇOS TÉCNICOS` da imagem `Orcamento`
  e o `4.1 - Concreto Ciclópico` são a mesma coisa - serviço. A numeração (`fase.codigo` +
  `.n`) confirma, e o modal `Fases-do-orcamento` é literalmente uma árvore de dois níveis com
  chevron. Nada de sub-fase.
- **Composição é calculadora, não fonte.** `servico.custo_mo_unit` e `custo_mat_unit` são o
  valor gravado e são editáveis direto no grid (na imagem são inputs brancos). Salvar a
  composição **sobrescreve** o campo correspondente com a soma dos seus insumos. Uma regra só,
  sem flag de modo, e explica por que os números da imagem `Nova-Cotacao` (4.440,00) não batem
  com os de `Orcamento` (5.090,00) - são momentos diferentes.
- **Margem em ponto-base inteiro** (`1500` = 15,00%). Mesmo motivo de dinheiro ser centavo.
- **`orcamento.numero`** é sequencial de 6 dígitos zero-à-esquerda (`000002`), gerado no
  servidor. É identidade visual do produto: aparece em todo título de modal.
- **Não existe tabela `item`.** O `insumo` do orçamento e o `item` da saída são a mesma coisa;
  fica `insumo`, e `saida_item.item_id` passa a apontar pra ele. Uma tabela a menos e a relação
  insumo↔fornecedor continua emergindo de `saida_item`, como já era.
- Migração: o banco atual tem só a semente. Schema novo do zero, semente nova.

---

## 4. Rotas

```
/                      Início
/clientes              lista + modal-registro de cliente
/obras                 lista + modal-registro de obra
/obra/:id              a tela da obra (Fases, Orçamento, Dia a dia, Galeria)
```

**Não há `/orcamentos` nem `/orcamento/:id` nem item "Orçamentos" no rail**: desde que a
fase passou a ser da obra (15/08/2026), o orçamento é uma aba dela - uma lista de
orçamentos seria a lista de obras com outro nome. A tela cheia `/orcamento/:id` existiu
até 22/08/2026 pelo que "não cabia na aba" (quantidade, unitário, composição, insumos,
planejamento, medição, previsto × realizado); nada disso se usava, e foi apagada. O
orçamento é uma linha por serviço com um valor digitado, e isso cabe na aba.

Os cadastros da referência são modais sobre a lista. Renderizados como overlay de rota
(`/clientes/:id`) para ganhar voltar, recarregar e link direto de graça. ~~O Orçamento é rota
própria porque é uma sessão de trabalho longa, não um formulário.~~ (Não é: virou aba da obra
em 22/08/2026 - a sessão de trabalho longa é que nunca aconteceu.)

`/obra/:id` deixa de existir como tela separada - vira o modal-registro de obra, com as abas
Dia a dia e Galeria dentro dele, que é exatamente o que `Cadastro-Obra` mostra.

---

## 5. Backend

Continua Node + Express + `node:sqlite` + Docker. Nada novo instalado.

`api/server.js` hoje tem 334 linhas e vai crescer. Quebra em rotas por módulo
(`api/rotas/clientes.js`, `obras.js`, `orcamento.js`, `anexos.js`) quando passar de ~400 -
não antes.

Cálculo (totais de fase, agregação de insumos, medição) roda em **SQL agregado no servidor**,
não em `reduce` no cliente. Um orçamento tem 22 fases × N serviços × M insumos; mandar tudo
pro browser somar é o caminho de a tela travar aos 300 serviços.

---

## 6. Ordem de implementação

Cada fase termina em algo que abre e clica. Nada de infraestrutura por três dias.

### 6.1 - Tokens + `ui/` (nenhum domínio) ✔ entregue

`index.css` com os tokens do §2, e os componentes de `ui/` novos, contra uma `Sandbox.jsx`
reescrita. **É aqui que vale gastar tempo** - se o `Grid`, o `Registro` e o `Campo` saírem
certos, o resto do "1:1" é montagem.

Sandbox em `http://localhost:6100/#<secao>` - `grid`, `tela`, `cadastro`, `arvore`, `custo`,
`medicao`, `campos`, `diversos`. Os números da demo são os das próprias imagens, então
qualquer divergência de cálculo aparece na tela.

Pendências conhecidas, para acertar quando a tela real for montada:

- A matriz de medição do sandbox alinha o rodapé `MEDIDO OBRA` por larguras fixas num flex.
  Na 6.8 tem que virar `<tfoot>` da mesma tabela, senão desalinha com coluna variável.
- Falta o losango laranja ao lado do total da obra na medição.
- `Concluir medição` quebra em duas linhas numa coluna de 100px.

→ *Parada:* comparar a Sandbox lado a lado com `Relatorios-min` e `Contas-a-pagar`.

### 6.2 - Shell ✔ entregue

Rail com os 10 módulos (5 desabilitados), barra superior, `PainelModulo` com alça de recolher,
listas com filtros + grid + paginação. Roteamento. Login reestilizado.

Rotas: `/` `/clientes` `/obras` `/obra/:id` `/orcamento/:id` `/sandbox`. Módulo ativo sai do
`pathname`, então recarregar não perde o destaque - e `/orcamento/12` acende **Obras**, que
é de onde ele vem.

**Nada de tela de lista genérica.** Clientes e Obras são duas listas concretas montadas com
`PainelModulo` + `Grid` + `BarraAcao`. Se a terceira (Orçamentos, 6.4) repetir a mesma forma,
aí extrai - com duas ainda é adivinhação.

O `cliente` ganhou as colunas da referência (identificação, contato, endereço) por `ALTER`
idempotente, no idioma que `db.js` já usa, e o `PATCH /api/clientes/:id` virou **parcial** com
lista branca de campos. O schema grande (`orcamento`/`servico`/`composicao`) continua para 6.4 -
é lá que compensa refazer de uma vez.

Filtro é client-side nas duas listas. Vira query no servidor quando a lista demorar a chegar.

### 6.3 - Cliente e Obra ✔ entregue

Os dois modais-registro com suas abas (`Cadastro-Cliente`, `Cadastro-Obra`). Aba Endereço.
Foto da obra pelo `FileDrop` no quadrado cinza. `Duração` recalcula `Data fim` - e vice-versa.
Abas Atendimento/Portal/Configurações entram **desabilitadas**, como na referência.

**O cadastro é overlay de rota**, como o §4 previa: `/clientes/novo`, `/clientes/12`,
`/obras/nova`, `/obras/3`. Voltar fecha o painel, recarregar reabre, e dá pra mandar link de
um registro. O `key={id}` remonta o formulário ao trocar de registro com o painel aberto.

- `status` da obra **não** virou `situacao`: os dados já estão nele e renomear coluna pra ganhar
  sinônimo é churn. Ganhou o valor `nao_iniciada`, que é o padrão da referência.
- **Sem lixeira nos grids.** Cliente tem obra pendurada; obra tem fase, lançamento e arquivo.
  Cliente aposenta pelo botão `● Ativo` do cadastro (o filtro Condição já o esconde), obra pela
  situação `Concluída`. É o que a referência faz, e evita cascata destrutiva.
- Máscaras (CPF/CNPJ, CEP, telefone) e a aritmética de período moram em `format.js`, com teste.
  `somaDuracao` trava no último dia do mês alvo - 31/01 + 1 mês é 29/02, não 03/03.
- `AbaEndereco` foi extraída porque são **dois** consumidores com duplicação exata.

Faltando de propósito: as setas `‹ ›` de navegar entre registros no título do modal. É paginação
de cadastro, não caminho de trabalho - entra se alguém pedir.

### 6.4 - Orçamento: casca + fases ✔ entregue

Schema novo (`orcamento`, `servico`, `composicao`, `insumo`, `fase_catalogo`, `servico_catalogo`),
lista, `/orcamento/:id` com abas, árvore de fases com totais, e o modal do catálogo.
Rotas do módulo em `api/rotas/orcamento.js` - `server.js` passou de 350 linhas.

> **Desfeito em 22/08/2026.** As seções 6.4 a 6.x abaixo descrevem o módulo em tela cheia,
> que não existe mais. Ficam como registro do que foi construído e por que não vingou; o
> que vale hoje é o topo deste documento e a §4. Não use estas seções como especificação.

- **Numeração** de 6 dígitos, sequencial global, gerada no servidor (`novoOrcamento`).
- **Totais em SQL agregado**, nunca `reduce` no cliente. O total soma as **duas sub-linhas
  arredondadas** (mão de obra e materiais), não o unitário somado - é o que faz as parcelas
  do grid fecharem com o total exibido.
- **Desmarcar no catálogo não destrói trabalho.** Marcar cria a fase na OBRA e o serviço
  NESTE orçamento. Desmarcar só apaga serviço sem valor nem composição, e fase sem serviço
  de orçamento nenhum, sem lançamento e sem post no dia a dia; o resto volta em `mantidas`
  e a tela conta quais foram.
- **O modal só manda no que veio do catálogo.** Fase ou serviço criado fora dele é avulso e
  não some porque um checkbox que nem o representa está desmarcado.
- Fases que existiam antes do Orçamento são **adotadas** por um orçamento automático, com
  código a partir de **100** - o catálogo usa 1..22 e numerá-las como 1 faria duas "1 - …".
- `insumo` substitui `item`: o insumo do orçamento e o item da saída são a mesma entidade.

Pendências anotadas:

- `fase.orcado` das fases legadas ficou **invisível** na árvore, que soma serviços. Reconciliar
  em 6.5/6.9 - ou o legado vira serviço "Geral", ou a árvore cai pra `orcado` quando não há
  serviço. Decidir antes de 6.9.
- `node --watch` não recarrega nada da API de forma confiável em bind mount do Windows
  (inotify não propaga do host pro container): vale pra `rotas/*.js`, `server.js`, `db.js` e
  `auth.js`. Em dev, `docker compose restart api` depois de **qualquer** mexida em `api/`.
  O Vite do front não sofre disso - ele tem watcher próprio com polling.
- "Novo orçamento" só **escolhe** a obra - é o único ponto do sistema sem quick-create, porque
  criar obra é um formulário inteiro (cliente, período, endereço).

### 6.5 - Valores custo ✔ entregue - **parada obrigatória, olhar antes de seguir**

Master-detail editável + Composição de custo unitário. Conferido contra a referência com
os números dela: 4.1 fecha `75,00 + 12.500,00 = 12.575,00`, e 4.2 fecha
`100 × 4.495,00 = 449.500,00` (4.495,00 porque a composição sobrescreveu os materiais).

- **O grid edita em memória e o Salvar grava em lote**, como na referência. `Alterações não
  salvas` aparece na barra de ação enquanto há rascunho; o Salvar fica desabilitado sem ele.
- **A composição é calculadora.** Salvar sobrescreve o custo unitário do serviço com a soma
  dos insumos - mas **só do tipo que tem linha**. Apagar todos os materiais não pode zerar
  uma mão de obra que alguém digitou direto no grid. Verificado: MO seguiu 55,00 enquanto
  materiais virou 4.440,00.
- **`PUT /servicos` só aceita serviço deste orçamento.** O id vem do cliente; sem o vínculo
  dava pra escrever em serviço de outro orçamento mandando outro id.
- Editar linha da composição = tirar da lista e devolver ao formulário. É o lápis da
  referência sem inventar um segundo modo de edição inline.
- A fase selecionada vai pro hash (`/orcamento/1#f10`): dá pra mandar "olha a fase 4".

Ficou faltando, de propósito: `Pesquisa avançada` de insumo (desabilitada, como na referência)
e a unidade por serviço no catálogo - hoje é uma unidade por fase, então 4.2 aparece como M3
onde a referência diz M2. É conteúdo de `catalogo.js`, não código.

### 6.6 - Valores venda ✔ entregue

Mesmo master-detail com coluna Margem (%), tree com Custo/(%)/Venda, rodapé
`Custo · Venda (+x%) · Taxa Adm · Venda + taxas`, e o botão laranja **Definir margens venda**
(aplica margem em lote por fase). Reusa o componente de grid do 6.5 com colunas diferentes.

### 6.7 - Insumos ✔ entregue

Agregação por insumo de todo o orçamento, busca, checkbox `Mostrar insumos agrupados`
(desmarcado = uma linha por ocorrência), total, botão laranja `Adicionar insumo`.

### 6.8 - Planejamento e Medição física ✔ entregue

Uma matriz fase × período serve as duas abas - mesma componente, tabelas diferentes
(`planejado` / `medido`). Linhas % e $, barra de progresso por fase, seletores
`Medir por: Custo|Venda` e `Exibir: Porcentagem|Valor`, navegação de período, rodapé
`MEDIDO OBRA` e `Concluir medição` por coluna.

### 6.9 - Previsto × Realizado ✔ entregue

A aba que já existe no tabstrip da referência é o lugar natural do caixa atual: previsto = a
fase orçada, realizado = as `saida`s lançadas nela. O `MovimentacaoPanel`, o extrato e as
pendências migram pra cá, com o visual novo.

### 6.10 - Dia a dia e Galeria ✔ entregue

Portados como abas do modal-registro de Obra - que é onde a referência os coloca. Lógica
preservada, casca nova.

### 6.11 - Responsivo ✔ entregue

Por último e de propósito: o trabalho de layout se faz **uma vez** sobre o conjunto final.

Este é o ponto mais duro do plano e merece franqueza: **a referência é uma UI de desktop de
2013 e não tem contraparte mobile.** Um grid de 6 colunas com master-detail não vira celular
sem deixar de ser 1:1. A regra 8 do CLAUDE.md ("uma base, dois tamanhos") sobrevive assim:

- Rail vira barra inferior (já é assim hoje).
- Cadastros (Cliente, Obra, Dia a dia, Galeria) empilham e ficam **plenamente usáveis** - é o
  que se faz no canteiro.
- Orçamento (custo, venda, medição) rola na horizontal dentro do container e assume ser
  desktop. Consultável no celular, editável na mesa. Perda conhecida e aceita.

---

## 7. O que não construir

Fora desta rodada, e nem "deixar preparado": Financeiro / Contas a pagar (`Contas-a-pagar.png`),
Compras, Apropriação, Mão de obra, Relatórios, Pesquisa avançada de insumo, Portal do cliente,
Atendimento, PDF, permissão por usuário, notificações, gráficos.

Os 5 módulos ficam **visíveis e desabilitados** no rail. Custa 5 linhas, mantém a silhueta da
referência e deixa explícito onde entram depois.

---

## 8. Dependências

**Nenhuma nova.** React 18 + Vite + Tailwind v4 + lucide-react + react-router cobrem tudo
acima. Se em algum ponto parecer que falta biblioteca - de tabela, de máscara, de data - paro
e pergunto. As máscaras (CPF/CNPJ, CEP, moeda, qtd 4 casas) são `Intl.NumberFormat` mais uma
função de ~10 linhas cada.

`<input type="date">` nativo para datas, `<details>`/CSS onde couber, agregação em SQL.

---

## 9. O que isto quebra no CLAUDE.md

Preciso da sua confirmação nestes três antes de escrever código:

1. **Regra 6 - "A Obra é uma tela só".** Morre. Orçamento é um registro separado da Obra na
   referência, com tela própria e ciclo de vida próprio (uma obra pode ter vários orçamentos -
   a lista em `Relatorios-min` mostra 000001 e 000002 para clientes/obras distintos).
   *Proposta de emenda:* "O Orçamento é uma tela só. `/orcamento/:id` não ganha rota filha;
   módulo novo vira aba dentro dele."
   *Superado em 22/08/2026:* a regra 6 original estava certa. O orçamento voltou a ser aba
   da obra, `/orcamento/:id` não existe, e a emenda não é mais necessária.

2. **Regra 4 - "Zero cadastro prévio".** Sobrevive, mas convive com catálogo. O sistema passa a
   abrir com 22 fases e um conjunto de serviços já semeados, e ninguém precisa cadastrá-los -
   o que preserva o espírito. O `+ Criar "x"` continua em todo Combobox.
   *Proposta de emenda:* trocar "zero cadastro prévio" por "zero cadastro **obrigatório**: o
   catálogo vem pronto e qualquer coisa que falte se cria de dentro do formulário."

3. **PROJETO.md** vira histórico. Se aprovado, este documento toma o lugar dele e o antigo sai
   ou vira `PROJETO-v1.md`.

---

## 10. Tamanho

| Etapa | Peso |
|---|---|
| 6.1 tokens + ui/ | grande - é o investimento que paga o resto |
| 6.2 shell | médio |
| 6.3 cliente + obra | médio |
| 6.4 orçamento + catálogo | médio |
| **6.5 valores custo + composição** | **o maior item isolado** |
| 6.6 venda | pequeno (reusa 6.5) |
| 6.7 insumos | pequeno |
| 6.8 planejamento + medição | grande |
| 6.9 previsto × realizado | médio (porta o que existe) |
| 6.10 dia a dia + galeria | pequeno (porta o que existe) |
| 6.11 responsivo | médio |

Aproveitado do sistema atual: `Combobox`, `MoneyInput`, `Confirm`, `FileDrop`, `format.js`,
`auth.js`, a lógica de diário/galeria/anexos e o setup de Docker. Descartado: todo o resto de
`ui/`, todo `components/`, todo `pages/`, e o schema.

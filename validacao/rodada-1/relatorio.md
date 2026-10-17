# Rodada 1 - relatório do Jean

## Resumo
Ainda não troco a planilha. Os totais que o sistema mostra batem com a minha conta: fase, obra, caixa, a pagar e consumo. A Visão do cliente é melhor do que qualquer coisa que eu faço hoje. O que pesou foi o seguinte:
- **Lançar com segurança:** clique duplo em Salvar duplicou uma nota. Os campos de valor e de quantidade transformam o que eu digito ("50" vira 0,50, "450" virou 4.500,00, uma correção virou 50.050 sacos e a nota foi para R$ 1,9 milhão) e o sistema não avisa nada.
- **Contrato por administração:** não dá para pôr R$ 5.000 fixos na fundação, então a taxa devida sai diferente do contrato. Também não existe "quanto a cliente ainda me deve".
- **Material × mão de obra:** o sistema não separa.

Uma noite de 4 lançamentos levou uns 25-30 minutos de interação. Na planilha seriam uns 10.

## Missões
| Missão | Resultado | Cliques/telas | Comentário |
|---|---|---|---|
| M1.1 Entrar e trocar senha | ✅ | 6 cliques, 2 telas (Usuários > editar admin) | Achei em Usuários > lápis > "Nova senha". Testei: a senha antiga é recusada e a nova funciona. Não existe "minha conta" no nome do usuário no topo. |
| M1.2 Cadastrar cliente | ✅ | ~8 cliques, 1 modal | CPF e celular com máscara boa, opção de WhatsApp. Clique duplo em Salvar não duplicou (POST + PATCH). |
| M1.3 Cadastrar obra | ⚠️ | ~14 cliques, 2 abas | Funciona, mas depois de salvar o modal fecha e volta para a lista. Tive que reabrir a obra para chegar em Fases. Não há campo de área (m²). A data aceita ano 62027. |
| M1.4 Orçamento (fases + valores) | ⚠️ | ~16 cliques para as fases + 21 valores digitados, 2 abas | Marcar a fase-pai marca todos os serviços (68). O valor vai em cada serviço; não dá para pôr só o total da fase. "18000" digitado virou 180,00. Total final R$ 360.000,00 conferido. |
| M1.5 Taxa de administração | ❌ (lacuna) | - | Só existe um % único para a obra inteira, no rodapé da Estimativa. Coloquei 10 %. Não há onde pôr R$ 5.000 fixos na Fundação. |
| M1.6 Entrada de R$ 50.000 | ⚠️ | 9 cliques | Achei em Fluxo de caixa > Registrar lançamento > Entrada. O campo Fase é obrigatório: a entrada da cliente ficou presa na fase "1 - Serviços". |
| M2.1 Nota Depósito São José (3 itens) | ⚠️ | ~25 interações, 1 modal | Funciona e soma certo (3.400,00). Cada item novo pede 2 cliques de "Criar" e mais 1 no popup de "preço combinado". A quantidade "50" virou 0,50. **Anexo não testado** (ver nota do ambiente). |
| M2.2 Zé Pedreiro R$ 2.800 Pix | ✅ | ~12 interações | O item "Mão de obra" que criei ficou com tipo "Materiais" sem eu perceber. |
| M2.3 Aço Gerdau, boleto 10 dias | ✅ | ~14 interações | "Em aberto" e o vencimento 27/10/2026 aparecem certos. Quando desmarco "Pago" o campo Observação some, então não tenho onde anotar o nº do boleto. |
| M2.4 Caçamba Remove Entulhos | ⚠️ | ~9 interações | "Salvar e continuar" trouxe "Em aberto" + vencimento do lançamento anterior. Digitei 450 e virou 4.500,00. A fase veio pré-preenchida com Fundação. |
| M2.5 Foto + diário | ⚠️ | 6 cliques | O diário funciona. A foto da missão não pôde ser anexada (ambiente). Anexei uma captura de tela no lugar e o upload funcionou. A foto aparece como link com nome do arquivo e a Galeria > Fotos mostra 0. |
| M2.6 Pendência | ❌ (lacuna) | 6 cliques | Não existe pendência. Registrei no diário como "PENDÊNCIA: ...". |
| M2.7 Errar e corrigir | ✅ | 7 cliques | Caçamba lançada com R$ 4.500,00 na Fundação, corrigida para R$ 450,00 no Canteiro. A tela de edição abriu com Valor 0,00 (ver A4). |
| M3.1 Gasto Fundação | ✅ | 2 cliques (Relatórios) ou 0 (Fluxo de caixa) | 10.450,75, bate. |
| M3.2 Material × mão de obra na Fundação | ⚠️ | 4 cliques + conta de cabeça | O sistema não separa. Somei os insumos à mão: material 7.650,75, MO 2.800,00. |
| M3.3 Cimento do Depósito São José | ⚠️ | 2 relatórios | 1.900,00 bate, mas não há filtro fase+insumo+fornecedor nem a quantidade (50 sacos). |
| M3.4 Acima/abaixo do orçado | ✅ | 2 cliques | Fundação 10.450,75 de 48.000 (-78,23 %). Obra 10.900,75 de 360.000 (-96,97 %). Bate, mas não diz se estou acima "para o ponto em que a obra está". |
| M3.5 Pago / falta / caixa | ⚠️ | 1 clique | Pagou 50.000 e caixa 43.350,00: batem. **"Quanto falta" não existe.** |
| M3.6 Taxa devida | ❌ (número diverge do contrato) | 2 cliques | Sistema: R$ 1.090,08. Pelo meu contrato: R$ 45,00 (canteiro) + R$ 5.000 fixos da Fundação. Ver A2. |
| M3.7 A pagar nos próximos dias | ✅ | 0 cliques | O cartão "A pagar R$ 4.250,75" e a linha "Vence 27/10/2026" aparecem. Não há uma lista por vencimento juntando as fases. |

**Tempo estimado para alguém que vem da planilha:** M1 sozinho, sem ajuda, uns 40-60 min. O orçamento por serviço é o que mais demora. Fiquei sem saber o próximo passo em três momentos:
1. depois de salvar a obra (o modal fechou);
2. procurando onde configurar a taxa de administração;
3. na hora de dizer a fase de uma entrada da cliente que é da obra toda.

**A noite (M2):** uns 25-30 min de interação para 4 lançamentos + diário + pendência + correção. São ~90 interações no total. Na planilha seriam ~10 min.

## Achados

### A1 - Clique duplo em "Salvar e fechar" duplica o lançamento
- **Tipo:** bug
- **Gravidade:** alta
- **Onde:** Obra > Fluxo de caixa > Registrar lançamento > "Salvar e fechar"
- **Passos:** 1. Preencher a saída do Depósito São José (3 itens, R$ 3.400,00). 2. Dar clique duplo em "Salvar e fechar".
- **Esperava:** um lançamento.
- **Aconteceu:** dois lançamentos iguais (S-000001 e S-000002). A fase foi para R$ 6.800,00 e o caixa caiu 3.400 a mais. Saíram 2 × `POST /api/saidas` com 200. Apaguei o S-000002 na mão. (No cadastro de cliente o clique duplo não duplicou.)
- **Na planilha eu faria:** veria a linha repetida na hora.
- **Evidência:** `capturas/m2-duplo-clique-duplicou-lancamento.png`, rede: 2 × POST /api/saidas 200
- **Sugestão:** desabilitar o botão enquanto salva, ou o servidor recusar o envio repetido.

### A2 - Taxa de administração: só % único, sem valor fixo por fase. A taxa devida sai diferente do contrato
- **Tipo:** lacuna / número errado
- **Gravidade:** alta
- **Onde:** Obra > Estimativa (rodapé "Administração __ %") e Relatórios > Taxa de administração
- **Passos:** 1. Procurar onde pôr R$ 5.000 fixos na Fundação e 10 % no resto (Fases, Estimativa, Dados, cadastro do cliente). 2. Só existe um % para a obra toda. Pus 10 %. 3. Abrir Relatórios > Taxa de administração.
- **Esperava:** Fundação com taxa fixa de R$ 5.000 e as demais fases com 10 %. Pelo contrato a taxa total prevista é 5.000 + 10 % × 312.000 = **R$ 36.200,00**. Devida hoje: R$ 45,00 (canteiro) + a parte da Fundação (os R$ 5.000 fixos, ou a parte proporcional, conforme eu combinar).
- **Aconteceu:** o relatório mostra Fundação adm prevista 4.800,00, adm realizada 1.045,08 e **total devido R$ 1.090,08**. Prevista total 36.000,00. O texto "(9,09 % do total estimado)" confunde: é 36.000 / 396.000. A taxa também é calculada sobre o lançado, incluindo o boleto da Gerdau ainda não pago. Não há onde dizer "taxa já cobrada / recebida".
- **Na planilha eu faria:** uma coluna "taxa" por fase, com fórmula fixa ou %.
- **Evidência:** relatório Taxa de administração (snapshot), Estimativa com 10,00 %.
- **Sugestão:** taxa por fase (fixo ou %, editável na Estimativa ou em Fases). Mostrar "taxa devida até hoje", "já recebida" e "a receber". Deixar escolher se a base é o lançado ou o pago.

### A3 - Campos de valor e quantidade mudam o que eu digito (máscara de centavos), sem nenhum aviso
- **Tipo:** bug / número errado
- **Gravidade:** alta
- **Onde:** Estimativa (valor do serviço), Registrar lançamento (Qtd, Valor unit., Valor)
- **Passos e resultados:**
  1. Estimativa, serviço 4.3: selecionar tudo e digitar `18000` → ficou **180,00**.
  2. Item Cimento, campo Qtd: digitar `50` → ficou **0,50**. Com `fill` "50" também ficou 0,50.
  3. Corrigir a Qtd clicando e digitando `50,00` → ficou **50.050,00**. Total do item e da nota: **R$ 1.901.900,00**, sem alerta nenhum.
  4. Caçamba, campo Valor: clicar e digitar `450` → ficou **4.500,00**.
- **Esperava:** 50 = 50, 450 = 450,00, 18000 = 18.000,00. Selecionar e digitar deveria substituir o valor.
- **Aconteceu:** cada campo se comporta de um jeito conforme onde está o cursor. Só fica certo se eu digitar com vírgula ("50,00").
- **Na planilha eu faria:** digito 450 e é 450.
- **Evidência:** `capturas/m1-estimativa-18000-virou-180.png`, `capturas/m2-qtd-50-virou-0,50.png`, `capturas/m2-qtd-corrigida-virou-50050-total-1,9mi.png`, `capturas/m2-digitei-450-virou-4500.png`
- **Sugestão:** número inteiro sem vírgula = reais/unidades inteiras. Ao focar, selecionar tudo. Quantidade sem máscara de centavos. Alertar quando o total da nota for muito maior que o normal ou que o estimado da fase.

### A4 - Editar uma saída lançada sem itens abre com "Itens" marcado e Valor 0,00
- **Tipo:** bug
- **Gravidade:** alta (risco direto de zerar um valor)
- **Onde:** Fluxo de caixa > clicar no lançamento S-000005 (caçamba, lançada com "Itens" desmarcado)
- **Passos:** 1. Lançar uma saída com "Itens" desmarcado e valor direto. 2. Clicar na linha para editar.
- **Esperava:** o modal com Valor 4.500,00 e "Itens" desmarcado.
- **Aconteceu:** "Itens" vem marcado, com uma linha de item vazia e "Valor * (Soma dos itens) 0,00". Só quando desmarquei "Itens" o 4.500,00 apareceu. Não salvei nesse estado para não estragar o dado; não sei se salvar zeraria o lançamento.
- **Evidência:** `capturas/m2-editar-saida-sem-itens-abre-valor-zero.png`
- **Sugestão:** abrir a edição do jeito que foi lançada. Nunca mostrar 0,00 quando o valor gravado não é zero.

### A5 - Material × mão de obra: o item criado na hora vira "Materiais" e nenhum relatório separa
- **Tipo:** lacuna / número errado
- **Gravidade:** alta
- **Onde:** Registrar lançamento > Item > Criar "..."; tela Itens; Relatórios
- **Passos:** 1. Lançar o Zé Pedreiro com o item "Mão de obra" (criado ali, o popup diz só "Entra como cadastro incompleto"). 2. Abrir Itens: "Mão de obra" está com Tipo **Materiais**. 3. Procurar nos Relatórios "Na fundação, quanto de material e quanto de mão de obra".
- **Esperava:** escolher o tipo ao criar o item e ter um relatório por tipo.
- **Aconteceu:** não existe agrupamento por tipo. Se existisse, os R$ 2.800 contariam como material. A resposta só sai somando à mão no relatório Por insumo: material 1.900 + 1.120 + 380 + 4.250,75 = **7.650,75**, MO **2.800,00** (total 10.450,75, bate). O catálogo já tem "Pedreiro" (Mão de obra), mas eu digitei "Mão de obra" e criei outro.
- **Evidência:** `capturas/m3-item-mao-de-obra.png` (tela Itens)
- **Sugestão:** perguntar Material/Mão de obra/Equipamento ao criar o item, ou herdar do fornecedor. Adicionar "Por tipo" nos relatórios, com filtro de fase.

### A6 - Cliente: não existe "quanto falta pagar", e a entrada tem que cair numa fase
- **Tipo:** lacuna
- **Gravidade:** alta
- **Onde:** Fluxo de caixa > Registrar lançamento > Entrada (Fase *); Visão do cliente
- **Passos:** 1. Registrar a entrada de R$ 50.000. O campo Fase é obrigatório e não há a opção "obra toda". 2. Procurar quanto a Marina ainda deve.
- **Esperava:** a entrada vale para a obra toda e aparece o saldo do contrato. Pela conta do sistema: 360.000 + 36.000 = 396.000 − 50.000 = 346.000. Pelo meu contrato: 360.000 + 36.200 = 396.200 − 50.000 = **346.200**.
- **Aconteceu:** a entrada ficou na fase Serviços. O fluxo mostra Serviços com saldo **+50.000** e Fundação **−10.450,75** (caixa −6.200), o que confunde quem lê por fase. "Quanto falta" não aparece em lugar nenhum. A Visão do cliente mostra "Investido 50.000" e "estimado 360.000" sem a taxa de administração que ela também paga.
- **Na planilha eu faria:** aba Recebimentos com o total do contrato − recebido.
- **Evidência:** `capturas/m1-entrada-50mil-presa-na-fase-servicos.png`
- **Sugestão:** entrada "geral da obra" (fase opcional), valor do contrato (custo + taxa) e cartão "A receber do cliente".

### A7 - Observação do pagamento ("pix", "pago no balcão") não aparece ao editar
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Registrar lançamento > Pagamento > Observação
- **Passos:** 1. Lançar o Zé Pedreiro com Observação "pix". 2. Reabrir o lançamento.
- **Esperava:** ver "pix".
- **Aconteceu:** o campo vem vazio. Aconteceu com S-000001 ("pago no balcão"), S-000003 e S-000005. Não sei se não grava ou se não carrega. Nas listas a observação também não aparece.
- **Sugestão:** gravar e mostrar a observação. Permitir observação também quando o lançamento ainda não está pago (para o nº do boleto).

### A8 - "Salvar e continuar" carrega o estado de pagamento do lançamento anterior
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** Registrar lançamento > "Salvar e continuar"
- **Passos:** 1. Lançar o aço como "Em aberto", vencimento 27/10. 2. "Salvar e continuar". 3. Lançar a caçamba.
- **Aconteceu:** a caçamba veio "Em aberto" com vencimento 27/10/2026, e a observação "pix" veio do lançamento anterior. Se eu não reparo, a caçamba paga entra como conta a pagar. O lançamento seguinte manteve o vencimento 27/10 mesmo depois de marcado como pago.
- **Sugestão:** manter só a fase (e talvez a data). Voltar Pago/vencimento/observação ao padrão.

### A9 - Relatórios sem filtro combinado (fase + insumo + fornecedor) e sem quantidade
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** Relatórios > Pagamentos (Por insumo) / Extrato do credor
- **Passos:** responder "na Fundação, quanto cimento comprei do Depósito São José".
- **Aconteceu:** o Por insumo não filtra fase nem fornecedor. O Extrato do credor mostra a nota inteira (3.400), não o item. Nenhum dos dois mostra quantidade (50 sacos) nem unidade. Respondi 1.900,00 cruzando os dois relatórios.
- **Na planilha eu faria:** filtro em três colunas.
- **Sugestão:** filtros de fase, fornecedor e insumo no mesmo relatório, com colunas Qtd e Unid.

### A10 - "Acima ou abaixo do orçado" não leva em conta o avanço
- **Tipo:** ideia
- **Gravidade:** média
- **Onde:** Relatórios > Estimado × realizado; Visão do cliente
- **Aconteceu:** a Fundação aparece "-78,23 %" porque comparo o gasto até hoje com o total da fase. Com a fase pela metade isso não diz se vou estourar. As contas batem.
- **Sugestão:** um % de avanço físico por fase (ou a fase concluída) e a projeção "vai fechar em R$ X".

### A11 - Não existe pendência
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** obra inteira e menu
- **Aconteceu:** registrei "PENDÊNCIA: Comprar impermeabilizante..." como texto no diário. Não tem como marcar como feito nem listar o que está aberto.
- **Sugestão:** pendências com status aberta/feita, fase e responsável (o mestre de obras vai usar).

### A12 - Celular: dá para usar, mas o lançamento fica longe
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** 390×844, Obra > Fluxo de caixa
- **Aconteceu:** para chegar em "Registrar lançamento" tenho que rolar a tabela de fases inteira. Dentro do modal, a tabela de itens fica cortada (coluna Item estreita, Fornecedor escondido). O resto do formulário é bom.
- **Evidência:** `capturas/m2-celular-fluxo.png`, `capturas/m2-celular-registrar-lancamento.png`
- **Sugestão:** botão fixo "+ Lançar" no celular. Itens em lista vertical.

### A13 - Esc fecha o modal inteiro (perde o que digitei); o menu "Ações da versão" não fecha com Esc
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento (lista de fases aberta) e Estimativa > Ações da versão
- **Aconteceu:** apertei Esc para fechar a lista de fases e perdi o lançamento todo. Abri "Ações da versão" e o menu ficou na frente do botão Salvar; Esc não fechou e só saiu clicando fora.
- **Sugestão:** Esc fecha só a lista. Perguntar antes de descartar dados digitados.

### A14 - Depois de criar a obra, o modal fecha
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Obras > Nova obra > Salvar
- **Aconteceu:** as abas Fases e Estimativa ficam desabilitadas até salvar. Ao salvar, voltei para a lista sem pista do próximo passo.
- **Sugestão:** depois de salvar, abrir a obra direto na aba Fases.

### A15 - Popup de "preço combinado" a cada item novo
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Valor unit.
- **Aconteceu:** cada item pede "Só nesta nota / Passa a ser o preço de...". São 3 cliques a mais numa nota de 3 itens. Além disso, cada item e fornecedor novo pede "Criar" duas vezes.
- **Sugestão:** padrão "Só nesta nota" sem perguntar. Criar com um clique.

### A16 - Nomes do catálogo não batem com o que eu digito, e isso gera duplicatas
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Item ou serviço (autocomplete)
- **Aconteceu:** digitei "Cimento CP-II" e o sistema só ofereceu "Criar", embora exista "Cimento portland cp ii-e-32". Digitando só "cimento" aparecem os dois. Agora tenho duplicatas: Areia média / Areia lavada tipo media, Aço CA-50 / Aço CA-50 10mm, Mão de obra / Pedreiro.
- **Sugestão:** busca por palavras soltas e sem acento ("cp ii" acha "CP-II"). Avisar "parecido com..." antes de criar.

### A17 - Foto do diário aparece como nome de arquivo e não entra na Galeria
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Diário de obra; Galeria > Fotos
- **Aconteceu:** no diário aparece só o link "m1-usuarios.png", sem miniatura. A Galeria mostra "Fotos 0". Na Visão do cliente a foto aparece com miniatura.
- **Sugestão:** miniatura no diário e foto do diário contando na Galeria.

### A18 - Datas e prazo
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Obra > Dados > Período previsto
- **Aconteceu:** aceitou o ano 62027 e mostrou "720013 meses". De 01/10/2026 a 30/06/2027 mostra "8 meses" (eu conto 9). Neste teste o navegador estava em formato americano (mm/dd/aaaa); isso é do ambiente.
- **Evidência:** `capturas/m1-obra-datas-digitadas.png`
- **Sugestão:** validar o ano (ex.: 2000-2100) e arredondar os meses para cima.

### A19 - Obra sem campo de área (m²)
- **Tipo:** lacuna
- **Gravidade:** baixa
- **Onde:** Obra > Dados
- **Sugestão:** campo de área para calcular R$/m² (o cliente pergunta).

### Nota do ambiente (não é bug do sistema)
O `browser_file_upload` recusou `/validacao/arquivos/...` ("outside allowed roots": as pastas permitidas são /validacao/capturas e a raiz do projeto). Também não achou o arquivo em `/home/melo/apps/obras_jean/validacao/arquivos/`. Por isso **a nota fiscal em PDF e a foto do baldrame não foram anexadas**. Para testar o upload usei uma captura de tela minha (`m1-usuarios.png`): o upload funcionou (`POST /api/anexos` 200). Tentei criar um PDF substituto em `validacao/rodada-1/anexos-substitutos/`, mas o navegador não enxerga esse caminho; o arquivo ficou lá e pode ser apagado. Na próxima rodada, colocar os arquivos dentro de uma pasta permitida.

Console: só os 401 esperados (`/api/eu` antes do login e o login com a senha antiga). Nenhum 4xx/5xx inesperado na rede.

## Dados que eu criei
- **Senha do admin:** trocada de `admin` para **`Jean@Obras2026`**
- **Cliente:** Marina Costa, PF, Particular, CPF 529.982.247-25, celular (11) 98765-4321 (WhatsApp), marina.costa@gmail.com
- **Obra:** "Casa Marina Costa - Rua das Palmeiras, 45", Construção Casa, Em andamento. Obs.: "Casa térrea 120 m², por administração." Previsto 01/10/2026 a 30/06/2027, início real 05/10/2026. Endereço: Rua das Palmeiras, 45, Jardim Primavera, Campinas/SP.
- **Estimativa (custo R$ 360.000,00; adm 10 % = R$ 36.000,00; total R$ 396.000,00):**
  - 1 Serviços 12.000,00 (1.1 Serviços técnicos 7.000,00; 1.4 Sondagem 5.000,00)
  - 2 Canteiro 8.000,00 (2.1 Barracão 4.500,00; 2.3 Tapume 3.500,00)
  - 4 Fundações 48.000,00 (4.2 Escavação blocos/baldrames 9.500,00; 4.3 Estaqueamento 18.000,00; 4.4 Sapatas e arranques 20.500,00)
  - 5 Estrutura 85.000,00 (5.1 Pilares 25.000,00; 5.2 Vigas 30.000,00; 5.3 Lajes 30.000,00)
  - 7 Alvenaria 35.000,00 (7.1 Vedação)
  - 8 Cobertura 40.000,00 (8.1 Estr. madeira 18.000,00; 8.3 Telhamento 22.000,00)
  - 10 Revestimentos 55.000,00 (10.3 Reboco 25.000,00; 10.6 Revest. interno 30.000,00)
  - 14 Elétrica 27.000,00 (14.2 Fiação)
  - 15 Hidráulica 25.000,00 (15.1 Água fria 12.000,00; 15.2 Esgoto 13.000,00)
  - 17 Pintura 20.000,00 (17.3 Acrílica interna)
  - 21 Finalização 5.000,00 (21.1 Limpeza final)
  - Os demais serviços dessas fases ficaram selecionados com 0,00.
- **Lançamentos:**
  - E-000001, 05/10/2026, Entrada R$ 50.000,00, fase 1 Serviços, "Entrada Marina Costa - assinatura do contrato (TED)"
  - S-000001, 17/10/2026, Depósito São José, Fundação / 4.2. Itens: Cimento CP-II 50 × 38,00 = 1.900,00; Areia média 8 × 140,00 = 1.120,00; Bloco cerâmico 200 × 1,90 = 380,00. Total 3.400,00, paga.
  - S-000002, duplicata criada pelo clique duplo, **excluída**.
  - S-000003, 17/10/2026, Zé Pedreiro, Fundação. Item "Mão de obra" 1 × 2.800,00 = 2.800,00, paga, obs. "pix" (não persistiu).
  - S-000004, 17/10/2026, Gerdau Distribuidora, Fundação. Item "Aço CA-50" 1 × 4.250,75 = 4.250,75, **em aberto**, vence 27/10/2026.
  - S-000005, 17/10/2026, Remove Entulhos, "Caçamba de entulho", sem itens. Lançada **errada** com 4.500,00 na Fundação e corrigida para **450,00 no Canteiro**, paga.
- **Fornecedores criados no lançamento:** Depósito São José, Zé Pedreiro, Gerdau Distribuidora, Remove Entulhos (todos "incompleto")
- **Itens criados no lançamento:** Cimento CP-II, Areia média, Bloco cerâmico, Mão de obra (ficou tipo Materiais), Aço CA-50 (todos "incompleto")
- **Diário:**
  - "Baldrame concretado, choveu à tarde, equipe parou às 15h", fase Fundação, anexo substituto `m1-usuarios.png`
  - "PENDÊNCIA: Comprar impermeabilizante antes de subir a alvenaria", fase Alvenaria
- **Conferência à mão (todos batem com o sistema):**
  - Saídas 3.400 + 2.800 + 4.250,75 + 450 = **10.900,75**
  - Pago 6.650,00, em aberto **4.250,75**
  - Saldo 50.000 − 10.900,75 = **39.099,25**
  - Caixa 50.000 − 6.650 = **43.350,00**
  - Fundação **10.450,75** (paga 6.200,00), Canteiro **450,00**
  - Consumo 10.900,75 / 360.000 = **3,03 %**
  - Taxa pelo sistema (10 %) **1.090,08**. Pelo meu contrato a taxa diverge (ver A2).
- **Arquivo de apoio** (não é do sistema, pode apagar): `validacao/rodada-1/anexos-substitutos/nota-fiscal-deposito.pdf`

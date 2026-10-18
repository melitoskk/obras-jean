# Rodada 2 - relatório do Jean

## Verificação das correções da rodada 1

| # | Correção | Resultado | O que eu vi |
|---|----------|-----------|-------------|
| 1 | Clique duplo em "Salvar e fechar" | ✅ corrigido | Duplo clique na nota do Depósito São José: saiu um único `POST /api/saidas` (200) e a lista mostra só a S-000001. |
| 2 | Observação do pagamento | ✅ corrigido | Zé Pedreiro pago com obs "pix" (S-000002). Abri e a obs estava lá; salvei sem mexer, reabri e continuava "pix". A nota do Depósito também manteve "dinheiro". |
| 3 | Editar saída sem itens | ✅ corrigido | Caçamba (S-000004) lançada sem itens: ao editar mostrou R$ 4.500,00 (meu erro proposital); corrigi para R$ 450,00, reabri e mostrou 450,00. |
| 4 | "Salvar e continuar" | ✅ corrigido | Gerdau lançada com vencimento 28/10, não paga e obs digitada: a nota seguinte voltou paga, data do pgto. hoje, sem vencimento, sem obs, sem descrição e valor 0,00. Só o fornecedor (Gerdau) ficou. Ver A9 sobre a obs de nota não paga. |
| 5 | Esc com lista aberta | ⚠️ parcial | Lista de **fase** aberta: o Esc fecha só a lista e o lançamento continua aberto, com valor e descrição. Lista de **fornecedor** com "Depósito São José" digitado: o Esc fecha a lista, o lançamento continua aberto, mas **apaga o que eu digitei** no campo (A8). |
| 6 | Digitação de valores | ✅ corrigido (com ressalva) | 1200000 dá 12.000,00; 450000 dá 4.500,00; 45000 dá 450,00; 425075 dá 4.250,75. Ao clicar, o conteúdo fica selecionado e o dígito novo substitui tudo. Com a seta pra esquerda no meio do número, o dígito entrou no fim. Quantidade: "50" dá 50,00, "8" dá 8,00, "200" dá 200,00 e "8,5" dá 8,50. Ressalvas em A6 (o primeiro dígito some quando se digita logo ao entrar no campo) e A7 (clicar de novo no mesmo campo de quantidade não seleciona, e o valor é arredondado sem aviso). |
| 7 | Taxa de administração por fase ao concluir | ✅ corrigido | Fluxo de caixa > Fundação > "Concluir fase" abre a escolha: percentual sobre o pago, valor fixo ou sem taxa. Escolhi valor fixo R$ 5.000,00. A fase mostra "Concluída em 18/10/2026 · Taxa: R$ 5.000,00" e o relatório Taxa de administração mostra "Valor fixo / 5.000,00" e "Taxa devida (fases concluídas): R$ 5.000,00". Mas a taxa fixa não entra no "A receber (previsto)" (A1) e não aparece nem no topo da obra nem na Visão do cliente (A3). |
| 8 | Cartão "A receber (previsto)" | ⚠️ parcial | A conta bate com a taxa da estimativa: 370.000 + 37.000 (10%) = 407.000; depois da entrada, 407.000 − 50.000 = 357.000. Problemas: o cartão só apareceu depois que recarreguei a página (A10) e, depois de concluir a Fundação com R$ 5.000 fixos, continuou em 357.000 quando devia ir a 357.500 (A1). |

## Resumo
Ainda não troco a planilha, mas está perto. Os lançamentos do dia a dia ficaram confiáveis: as 8 correções da rodada 1 funcionam no essencial e todo número que conferi à mão bateu (gasto por fase, saldo, caixa, a pagar, estimado × realizado, taxa devida). O que mais pesou foi a taxa de administração. Ela só existe na hora de concluir a fase, não dá para configurar no orçamento (R$ 5 mil na fundação e 10% no resto). O cartão "A receber" ignora a taxa fixa já escolhida e fica R$ 500 abaixo da minha conta. E a cliente não enxerga a taxa em lugar nenhum. Também incomoda que a entrada do cliente seja obrigada a cair numa fase, e que não exista uma lista de contas a pagar por vencimento.

## Missões
| Missão | Resultado | Cliques/telas | Comentário |
|--------|-----------|---------------|------------|
| M1 - Primeira obra | ⚠️ cumpri com dificuldade | Senha: 4 cliques. Cliente: ~8 cliques, 1 tela. Obra: ~10 cliques, 2 abas, e depois de salvar ela fecha e tenho de reabrir pela lista. Fases: 11 cliques. Estimativa: ~25 cliques (abrir 11 fases e preencher 1 serviço por fase). Entrada: ~7 cliques. | Uns 35-40 minutos para quem vem da planilha. Fiquei sem saber o próximo passo em dois pontos: (1) depois de salvar a obra nova ela fecha e as abas Fases/Estimativa só existem reabrindo; (2) taxa de administração: só achei "Administração %" único no rodapé da Estimativa. A taxa por fase (R$ 5 mil na fundação) não tem onde configurar antes (A2). Marcar a fase inteira inclui todos os serviços dela (71 serviços para 11 fases). Senha trocada para `Jean@2026`: a senha antiga é recusada e a nova entra. |
| M2 - Fim do dia | ✅ cumpri | Depósito (3 itens novos, fornecedor novo, anexo): ~25 cliques. Zé Pedreiro (sem itens, fornecedor novo): ~8. Gerdau (item do catálogo, a vencer): ~11. Caçamba (via "Salvar e continuar"): ~7. Diário com foto: ~6. Pendência (como nota no diário): ~3. Correção do erro: ~6. Tudo no mesmo modal, sem trocar de tela. | Uns 20-25 minutos na noite toda. Na planilha seriam 4 linhas em uns 5 minutos. O que mais custa: confirmar "Criar?" para cada fornecedor e item novo (A15) e o popup de preço combinado em cada item (já conhecido). Na segunda semana, com fornecedores e itens já cadastrados, deve cair pela metade. |
| M3 - O cliente ligou | ⚠️ cumpri com dificuldade | Fundação: 1 clique (Fluxo de caixa). Cimento: 3 cliques (Relatórios > Por insumo). Estimado × realizado: 3 cliques. Taxa: 3 cliques. A pagar: cartão no topo, e o vencimento só na lista da fase. | Todos os números bateram com a minha conta (tabela abaixo). Não consegui separar material e mão de obra (já conhecido), nem filtrar o cimento por fase e fornecedor juntos (já conhecido). "O que vence nos próximos dias" só achei abrindo fase por fase (A5). |

### Números conferidos (minha conta × sistema)
| Pergunta | Minha conta | Sistema | Onde |
|----------|-------------|---------|------|
| Gasto na Fundação | 3.400,00 + 2.800,00 + 4.250,75 = **10.450,75** | 10.450,75 | Fluxo de caixa, Relatório Pagamentos, Estimado × realizado |
| Material na Fundação | 3.400,00 + 4.250,75 = **7.650,75** | não separa | o relatório "Por insumo" mostra 2.800,00 como "Sem itens (valor direto)", junto com a caçamba (3.250,00) |
| Mão de obra na Fundação | **2.800,00** | não separa | idem |
| Cimento do Depósito São José | 50 × 38,00 = **1.900,00** | 1.900,00 | Relatórios > Por insumo (sem filtro de fase e fornecedor) |
| Fundação × orçado | 45.000 − 10.450,75 = **34.549,25 abaixo** (23,2% gasto) | −34.549,25 / −76,78% | Estimado × realizado |
| Obra × orçado | 370.000 − 10.900,75 = **359.099,25 abaixo** | −359.099,25 / −97,05% | Estimado × realizado |
| Total lançado | 10.450,75 + 450,00 = **10.900,75** | 10.900,75 | topo / fluxo |
| Cliente já pagou | **50.000,00** | 50.000,00 | Fluxo (Entradas), Visão do cliente "Investido" |
| Saldo (entradas − lançado) | 50.000 − 10.900,75 = **39.099,25** | 39.099,25 | cartão Saldo |
| Caixa (entradas − pago) | 50.000 − (3.400 + 2.800 + 450) = **43.350,00** | 43.350,00 | cartão Caixa |
| A pagar | **4.250,75** (Gerdau, vence 28/10) | 4.250,75 | cartão A pagar; vencimento só na lista da fase |
| Taxa devida | **5.000,00** (Fundação concluída, fixo) | 5.000,00 | Relatórios > Taxa de administração |
| Quanto ela ainda deve (previsto) | 370.000 + (5.000 + 10% × 325.000 = 37.500) − 50.000 = **357.500,00** | **357.000,00** | cartão "A receber (previsto)". **Diverge** (A1) |
| % da Fundação no lançado | 10.450,75 / 10.900,75 = **95,87%** | 95,87 | Relatório Pagamentos |

## Achados

### A1 - "A receber (previsto)" ignora a taxa fixa da fase concluída
- **Tipo:** número errado
- **Gravidade:** alta
- **Onde:** obra > cartão "A receber (previsto)" no topo
- **Passos:** 1. Estimativa de R$ 370.000,00 com "Administração 10%". 2. Entrada de R$ 50.000,00. O cartão mostra 357.000,00. 3. Fluxo de caixa > Fundação > Concluir fase > Valor fixo R$ 5.000,00. 4. Recarreguei a obra.
- **Esperava:** 370.000 + taxa (5.000 da Fundação + 10% de 325.000 das outras fases = 37.500) − 50.000 = **R$ 357.500,00**.
- **Aconteceu:** continua **R$ 357.000,00**. O cartão usa 10% sobre tudo (4.500 na Fundação) mesmo depois de eu ter escolhido 5.000 fixos. O relatório de taxa mostra os R$ 5.000,00 certinhos, então o sistema sabe o valor e não usa.
- **Na planilha eu faria:** soma da taxa por fase (fixa ou %) + orçado − recebido.
- **Evidência:** `capturas/r2-m3-concluir-fundacao.png`; relatório Taxa de administração: "Adm. prevista 37.000,00 | Taxa devida 5.000,00".
- **Sugestão:** nas fases concluídas usar a taxa escolhida; nas abertas, a prevista. E de preferência deixar configurar a taxa de cada fase já no orçamento (A2).

### A2 - Não dá para configurar a taxa por fase no orçamento
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** obra > Estimativa (rodapé "Administração %") e Fluxo de caixa > Concluir fase
- **Passos:** 1. Montei a estimativa. 2. Procurei onde dizer "Fundação = R$ 5.000 fixos, demais = 10%".
- **Esperava:** uma coluna ou campo de taxa por fase na Estimativa (ou na aba Fases), que já viesse escolhida na hora de concluir.
- **Aconteceu:** só existe um percentual único da obra inteira. A taxa por fase só aparece no diálogo de concluir, que vem sempre com "Percentual 10%" marcado. Eu é que tenho de lembrar, na hora, que a Fundação era R$ 5.000 fixos. A previsão (relatório e cartão) usa 10% em todas.
- **Na planilha eu faria:** uma coluna "taxa" na aba de resumo por fase, preenchida no contrato.
- **Sugestão:** taxa por fase (fixo ou %) na Estimativa, com o diálogo de concluir já vindo com ela preenchida.

### A3 - Taxa devida não aparece na obra nem para o cliente, e não há como registrar que ela foi paga
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** topo da obra, Visão do cliente, Relatórios > Taxa de administração
- **Passos:** 1. Concluí a Fundação com taxa de R$ 5.000,00. 2. Olhei o topo da obra e a Visão do cliente.
- **Esperava:** ver "Taxa a receber: R$ 5.000,00" na obra, e a cliente ver no extrato dela quanto é taxa. Poder marcar "taxa da fundação recebida".
- **Aconteceu:** a taxa só aparece em Relatórios > Taxa de administração. Na obra aparece só "Taxa: R$ 5.000,00" na própria fase concluída. A Visão do cliente mostra Investido / Executado / Saldo, sem taxa. Não achei como lançar o recebimento da taxa, então "quanto de taxa eu tenho a receber" não tem resposta.
- **Sugestão:** cartão "Taxa a receber" no topo, linha de taxa na Visão do cliente e um jeito de baixar a taxa recebida (talvez uma entrada marcada como "taxa").

### A4 - Entrada do cliente é obrigada a ter fase
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** Registrar lançamento > Entrada > campo "Fase *"
- **Passos:** 1. Entrada de R$ 50.000,00. 2. Limpei a fase e cliquei Salvar. Apareceu "Escolha a fase."
- **Esperava:** a entrada do cliente é da obra, não de uma fase.
- **Aconteceu:** tive de pôr em "1 - SERVIÇOS". Agora o Fluxo de caixa mostra Serviços com caixa +50.000,00 e Fundação −6.200,00, Canteiro −450,00. A coluna Caixa por fase deixa de ter sentido.
- **Na planilha eu faria:** aba de recebimentos separada, sem fase.
- **Sugestão:** entrada sem fase (ou "Obra geral"), e o caixa só no total da obra.

### A5 - Não há lista de contas a pagar por vencimento
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** topo da obra (cartão A pagar), Início, Relatórios > Pagamentos
- **Passos:** 1. Gerdau R$ 4.250,75 vence 28/10. 2. Procurei "o que vence nos próximos dias".
- **Esperava:** uma lista de títulos em aberto com vencimento, de todas as obras.
- **Aconteceu:** o cartão mostra só o total (4.250,75). O vencimento só aparece na lista da fase ("Vence 28/10/2026"). O relatório Pagamentos (analítico) não tem coluna de vencimento nem filtro por situação. Com várias obras e fases, eu teria de abrir uma por uma.
- **Sugestão:** clicar no cartão "A pagar" abre a lista ordenada por vencimento; o mesmo na tela Início, para todas as obras.

### A6 - O primeiro dígito some quando se digita logo ao entrar no campo de valor
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Estimativa > campos "Estimado (R$)" dos serviços
- **Passos:** 1. Estimativa com as fases abertas. 2. Entrei direto no campo de Pilares e digitei 3500000 sem parar. 3. Fiz o mesmo em vários serviços seguidos.
- **Esperava:** 35.000,00.
- **Aconteceu:** ficou **5.000,00**, perdeu o "3". Parece que a seleção automática do campo chega depois do primeiro dígito. No mesmo lote, Pintura acrílica interna ficou 0,00. Só percebi porque o total deu R$ 315.000 em vez de 370.000. Clicando antes e digitando depois, funciona.
- **Evidência:** total da estimativa 315.000,00 antes de eu redigitar os dois campos.
- **Sugestão:** a seleção ao entrar no campo não pode engolir o dígito digitado logo em seguida (também com Tab).

### A7 - Quantidade: clicar de novo no campo não seleciona, e as casas a mais são cortadas sem aviso
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Registrar lançamento > Itens > Qtd
- **Passos:** 1. Na Qtd digitei 1000 por engano. 2. Sem sair do campo, cliquei nele de novo e digitei 8,5. 3. Fui para o valor unitário: 10,00.
- **Esperava:** quantidade 8,5, total 85,00. Ou pelo menos um aviso.
- **Aconteceu:** o texto virou "8,51000" (entrou na frente do que havia) e o sistema arredondou calado para **8,51**, total 85,10. Numa linha nova, "8,5" dá 8,50 certinho.
- **Sugestão:** selecionar tudo em todo clique (como no dinheiro) e não aceitar, ou avisar, quantidade com mais casas do que o campo guarda.

### A8 - Esc na lista de fornecedor apaga o nome digitado
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Fornecedor
- **Passos:** 1. Digitei "Depósito São José" (fornecedor ainda não existe; a lista oferece "Criar"). 2. Esc.
- **Esperava:** fechar a lista e manter o texto.
- **Aconteceu:** a lista fecha (certo), o lançamento continua aberto (certo), mas o campo fica vazio e tenho de redigitar.
- **Sugestão:** manter o texto, ou pelo menos guardar até eu sair do campo.

### A9 - Observação do pagamento some quando a nota não está paga
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Pagamento
- **Passos:** 1. Gerdau, boleto. 2. Desmarquei "Pago". O campo Observação sumiu. 3. Marquei, escrevi "boleto 23793.38128" e desmarquei de novo.
- **Esperava:** um lugar para o número do boleto ou a linha digitável da conta que vou pagar.
- **Aconteceu:** a observação só existe com Pago marcado. Desmarcando, o texto é descartado sem aviso. Coloquei o boleto na descrição.
- **Sugestão:** campo "observação/boleto" também para contas a vencer.

### A10 - Cartões do topo não atualizam depois de salvar a estimativa
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** obra > Estimativa > Salvar
- **Passos:** 1. Salvei a estimativa de R$ 370.000,00 com 10%.
- **Esperava:** o cartão "A receber (previsto)" aparecer na hora com 407.000,00.
- **Aconteceu:** só apareceu depois que recarreguei a página (F5).
- **Sugestão:** atualizar os cartões ao salvar a estimativa e ao concluir uma fase.

### A11 - Concluir fase com conta em aberto não avisa
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Fluxo de caixa > Concluir fase
- **Passos:** 1. Fundação com o boleto Gerdau de R$ 4.250,75 em aberto. 2. Concluir fase.
- **Esperava:** aviso de que há R$ 4.250,75 a pagar na fase. Isso importa porque no percentual a taxa é "sobre o pago": o diálogo mostrava "Pago na fase: R$ 6.200,00 · Taxa devida: R$ 620,00", quando sobre o gasto seriam R$ 1.045,08.
- **Aconteceu:** concluiu sem aviso. Com taxa fixa não fez diferença, mas com percentual eu perderia taxa sem perceber.
- **Sugestão:** avisar das contas em aberto e mostrar as duas bases (pago e lançado).

### A12 - Ao editar, o anexo aparece como "anexo" e não pelo nome
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Editar saída S-000001 > Anexo
- **Passos:** 1. Lancei com `nota-fiscal-deposito.pdf` (no lançamento aparecia o nome). 2. Abri para editar.
- **Aconteceu:** o link aparece só como "anexo".
- **Sugestão:** mostrar o nome do arquivo.

### A13 - Fechar uma edição alterada não pergunta nada
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Editar saída (S-000003) > Fechar
- **Passos:** 1. Abri a Gerdau e marquei "Pago". 2. Cliquei no X.
- **Aconteceu:** fechou sem perguntar. Desta vez era o que eu queria, mas se fosse sem querer eu perderia a alteração sem saber.
- **Sugestão:** "Descartar alterações?" quando algo mudou.

### A14 - Confirmação dupla para criar cada fornecedor ou item
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Fornecedor / Item
- **Passos:** digitar o nome > clicar em "Criar 'X'" > clicar de novo em "Criar" no aviso "Entra como cadastro incompleto".
- **Aconteceu:** 2 cliques a mais por nome novo; na nota do Depósito foram 8 cliques só nisso.
- **Sugestão:** criar direto no primeiro clique (o aviso pode ser um texto pequeno).

### A15 - Detalhes de tela
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** vários
- **Aconteceu:**
  - Relatórios > Pagamentos > Analítico: a coluna "Fase" aparece duas vezes no cabeçalho.
  - Diário de obra: a lista de fases vem sem número ("FUNDAÇÕES - INFRA ESTRUTURA"), e no lançamento vem com número ("4 - FUNDAÇÕES...").
  - Diário de obra: há um botão "Salvar" no rodapé, embora o registro já seja gravado em "Registrar". Fiquei na dúvida se precisava clicar.
  - Obra de 01/10/2026 a 30/06/2027 mostra "8 meses"; são quase 9.
  - Relatórios dizem "Estimativa 000001", e a obra chama a mesma estimativa de "Estimativa viva (atual)".
  - Obra nova: ao salvar, a tela fecha e volta para a lista. Para montar as fases tenho de reabrir a obra.
  - Diário de obra: não tem campo de data. O registro fica com a data de hoje, e não consigo lançar à noite algo que aconteceu ontem.

## Dados que eu criei
- **Usuário:** admin, senha trocada de `admin` para `Jean@2026`.
- **Cliente:** Marina Costa, pessoa física, Particular, CPF 529.982.247-25, celular (11) 98765-4321 (WhatsApp), marina.costa@gmail.com.
- **Obra 1:** "Casa Marina Costa - Rua das Palmeiras, 45", Construção Casa, Em andamento, obs "Casa térrea 120 m², por administração.", previsto 01/10/2026 a 30/06/2027, início real 05/10/2026, Rua das Palmeiras 45, Jardim Primavera, Campinas/SP.
- **Fases (11):** 1 Serviços, 2 Canteiro, 4 Fundações, 5 Estrutura, 7 Alvenaria, 8 Cobertura, 10 Revestimentos, 14 Elétricas, 15 Hidráulicas, 17 Pintura, 21 Finalização (com todos os serviços de cada uma).
- **Estimativa (total R$ 370.000,00, Administração 10% = R$ 37.000,00):** 1.1 Serviços técnicos 8.000; 2.1 Barracão 7.000; 4.2 Escavação 12.000 + 4.4 Sapatas 18.000 + 4.6 Outros 15.000 = 45.000; 5.1 Pilares 35.000 + 5.3 Lajes 50.000 = 85.000; 7.1 Alvenaria de vedação 40.000; 8.3 Telhamento 45.000; 10.2 Emboço 60.000; 14.2 Fiação 25.000; 15.1 Água fria 25.000; 17.3 Pintura acrílica interna 25.000; 21.1 Limpeza final 5.000.
- **Entrada:** R$ 50.000,00 em 17/10/2026, fase 1 - Serviços (obrigatória), "Entrada Marina Costa (transferência)".
- **Fornecedores criados no lançamento:** Depósito São José, Zé Pedreiro, Gerdau Distribuidora, Remove Entulhos.
- **Itens criados:** Cimento CP-II, Areia média m³, Bloco cerâmico 9x19x19. Usei do catálogo: Aço CA-50 10mm.
- **Saídas (todas de 17/10/2026):**
  - S-000001 Depósito São José, Fundação: 50 × 38,00 cimento + 8 × 140,00 areia + 200 × 1,90 blocos = R$ 3.400,00, paga em 17/10, obs "dinheiro", anexo nota-fiscal-deposito.pdf.
  - S-000002 Zé Pedreiro, Fundação, sem itens, R$ 2.800,00, paga em 17/10, obs "pix".
  - S-000003 Gerdau Distribuidora, Fundação, 1 × 4.250,75 Aço CA-50 10mm = R$ 4.250,75, não paga, vence 28/10/2026.
  - S-000004 Remove Entulhos, sem itens, "Caçamba de entulho", paga em 17/10. Lançada errada de propósito (R$ 4.500,00 na Fundação) e corrigida para R$ 450,00 no Canteiro.
- **Diário (18/10/2026):** "Baldrame concretado, choveu à tarde, equipe parou às 15h" (fase Fundações, foto foto-obra-baldrame.jpg); "PENDÊNCIA: Comprar impermeabilizante antes de subir a alvenaria".
- **Fase concluída:** 4 - Fundações em 18/10/2026, taxa valor fixo R$ 5.000,00.
- **Abandonado sem salvar:** lançamento de teste de quantidade (8,5 / 8,51) na fase 5 - Estrutura (nenhum POST saiu).

---

## Bloco B (M4-M7)

### Resumo
Pelo celular dá pra lançar nota, pagamento e foto, e as contas que eu somei à mão bateram em todas as telas. Mesmo assim, hoje ainda não troco a planilha. O que mais pesou: (1) o campo de valor transforma "1.234,5" em 123,45 sem avisar, e é exatamente assim que eu digito cansado; (2) o card "A receber (previsto)" não conta a taxa das fases que eu concluí nem o que passou do orçado, então mostra um número que eu não posso passar pro cliente; (3) o Carlos não vê dinheiro em nenhuma tela nem na API, mas abre pela URL a nota fiscal de uma saída e a foto de outra obra. Pro cliente ainda falta o dossiê final, e o extrato da fase sai com código de serviço diferente do orçamento.

### Missões
| Missão | Resultado | Cliques/telas | Comentário |
|---|---|---|---|
| M4 - Fechamento de fase para o cliente | ⚠️ cumpri com dificuldade | Extrato: Relatórios → Extrato da fase → obra → fase = 4 cliques, 1 tela. Concluir fase com taxa: 4 cliques + digitação. Visão do cliente: 1 clique na obra. | No banco semeado nenhuma obra tinha fase concluída, nem as 3 obras "Concluídas". Concluí eu mesmo a fase 1 da Casa Ribeiro (10% → R$ 4.539,79, conferido). O extrato fecha linha a linha, mas não mostra o orçado da fase e sai com códigos de serviço errados (A19). Não tem dossiê final. O "Exportar" do fluxo baixou `Reforma_da_fachada_e_hall.csv`, mas no teste eu não consegui abrir o arquivo pra ver o conteúdo. Extrato e Estimado×realizado só imprimem, não exportam. |
| M5 - No celular (390×844) | ⚠️ cumpri com dificuldade | (a) nota de material com item e anexo: ~15 toques; (b) pagamento de empreiteiro sem itens: ~9; (c) diário com foto: ~7; (d) pendência: ❌ não existe; pergunta do cliente: ~5 toques e rolar a tabela pro lado | Os lançamentos (a), (b) e (c) gravaram certo. De pé na obra eu faria a foto e o pagamento. A nota com item não: a coluna do item tem 58 px, aparece o popup de preço e tem que rolar. No diário não tem campo de data (A24). Os ícones Editar/Excluir do diário têm 13 px. A pergunta "quanto gastei na Terraplanagem e estou acima ou abaixo do orçado" tem resposta no Fluxo (com rolagem lateral) e na Visão do cliente (R$ 43 mil · 99,3%, abaixo). |
| M6 - Equipe | ⚠️ cumpri com dificuldade | Criar usuário: Usuários → Novo → 3 campos + papel + obra → Salvar (6-7 cliques) | Carlos (campo, só "Muro de arrimo") só vê Diário e Galeria da obra dele, lança diário com foto e não edita registro dos outros. URL de tela de dinheiro manda ele pra /obras; outra obra dá "Obra não encontrada". A API não devolveu nenhum valor em dinheiro pra ele: `/api/obra/12` veio com `saidas`, `entradas`, `itens` e `fornecedores` vazios, e fluxo, orçamentos e clientes deram 403. Mas os anexos abrem sem checar quem pede (A18). Ana (escritório) vê e faz tudo, menos Usuários (a URL /usuarios manda pro Início). Pra escritório faz sentido. |
| M7 - Caminhos tortos | ⚠️ cumpri com dificuldade | - | Duplo clique em Salvar não duplicou nada (cliente, fornecedor, obra, diário, lançamento e usuário: 1 POST cada; em cliente e fornecedor o 2º clique virou PATCH). Validação de data fim antes do início funciona. Problemas: valor "1.234,5" (A16), data futura aceita (A26), inativar fornecedor que não grava (A23), fase com gasto que volta a ficar marcada sem explicação (A27), duas abas em que a última apaga a primeira (A22). Voltar e recarregar descartam o que foi digitado sem perguntar (igual ao já conhecido, não piorou). |

### Números que eu conferi à mão
- Total "Gasto" da lista de obras = total "Lançado" do relatório de Pagamentos = R$ 13.238.171,99 (somei as 11 obras com gasto). "A pagar" das obras somado = R$ 2.091.578,07, igual ao "Em aberto" do relatório.
- Extrato da fase 7 (Hidráulicas, Casa Ribeiro): saídas 19.133,95 + 15.009,26 + 14.977,90 + 9.910,96 + 8.696,76 + 11.678,77 = 79.407,60; entradas 3 × 29.116,12 = 87.348,36; saldo 7.940,76. Conferi o saldo linha a linha nas 9 linhas: certo.
- Extrato da fase 1 (Casa Ribeiro): saídas somam 45.397,94, igual ao "Pago na fase" usado na taxa; 10% = 4.539,79, certo.
- Fluxo da Reforma da fachada: fase 1 com 23.675,64 de saídas e 24.859,42 de entradas, certo; a pagar 4.229,16 + 14.421,77 = 18.650,93, certo.
- Estimativa da Reforma da fachada: as 5 fases somam 185.000,02, certo. Estimado×realizado da Casa Ribeiro: realizado soma 582.800,05, certo.
- Muro de arrimo depois dos meus lançamentos: saldo 6.253,22 − 778,00 − 2.350,00 = 3.125,22; caixa 46.945,79; Terraplanagem 43.374,69 de 43.658,85 = 99,35%; consumo da obra 80.078/95.000 = 84,29%; prazo 82/90 dias = 91,11%. Tudo certo. Lançamento de teste de 1.234,50 entrou e saiu certinho do saldo.

### Achados

#### A16 - "1.234,5" vira R$ 123,45 sem aviso
- **Tipo:** número errado
- **Gravidade:** alta
- **Onde:** Registrar lançamento → Valor (também testei colando com Ctrl+V)
- **Passos:** 1. Abrir Registrar lançamento, desmarcar Itens. 2. Digitar ou colar `1.234,5` no Valor.
- **Esperava:** R$ 1.234,50.
- **Aconteceu:** ficou 123,45, dez vezes menos, sem nenhum aviso. Colar `1234.56` deu 1.234,56 e colar `R$ 1 234,56` deu 1.234,56, os dois certos. O campo trata todos os dígitos como centavos, então quem esquece o último zero perde uma casa.
- **Na planilha eu faria:** 1234,5 é 1.234,50, sempre.
- **Evidência:** `capturas/r2-m7-colar-1234-5-vira-123-45.png`
- **Sugestão:** interpretar a vírgula como separador decimal (o que vem depois dela são os centavos) e só usar a máscara de "caixa registradora" quando não houver vírgula. Ou, no mínimo, avisar quando o valor digitado e o valor gravado forem diferentes.

#### A17 - "A receber (previsto)" ignora a taxa devida e o gasto acima do orçado
- **Tipo:** número errado
- **Gravidade:** alta
- **Onde:** topo da obra, card "A receber (previsto) - orçado + taxa − recebido"
- **Passos:** 1. Casa Ribeiro (concluída): orçado 620.000,05, recebido 575.987,75, gasto 582.800,05. 2. Concluir a fase 1 com taxa de 10% (R$ 4.539,79 devida, aparece no relatório de Taxa). 3. Recarregar a obra. 4. Abrir a Reforma da fachada (gasto 221.164,09, recebido 196.786,39, saldo −24.377,70).
- **Esperava:** que a taxa devida entrasse na conta e que, em obra concluída ou estourada, o número fosse o que o cliente deve de fato.
- **Aconteceu:** na Casa Ribeiro o card continua em 44.012,30, sem a taxa de 4.539,79. Pra obra concluída o que o cliente deve é 6.812,30 de custo + 4.539,79 de taxa = 11.352,09. Na Reforma da fachada o card nem aparece, e o cliente me deve 24.377,70. O "taxa" do rótulo só pega o % de administração da estimativa (0%). E não existe onde eu registre que recebi a taxa.
- **Evidência:** obra/2 com o card em R$ 44.012,30 depois da conclusão da fase; relatório Taxa de administração mostrando "Taxa devida R$ 4.539,79".
- **Sugestão:** a receber = máx(orçado, gasto) + taxa devida − recebido; em obra concluída, usar o gasto real. Ter um lançamento de "taxa recebida" pra fechar a conta da taxa.

#### A18 - Anexos abrem por URL pra qualquer usuário logado (Carlos baixou nota fiscal e foto de outra obra)
- **Tipo:** bug (segurança)
- **Gravidade:** alta
- **Onde:** `/api/anexo/<arquivo>`
- **Passos:** 1. Como admin, anexar `nota-fiscal-deposito.png` a uma saída da obra Muro de arrimo e copiar o link. 2. Entrar como carlos (campo). 3. Abrir `/api/anexo/1792326461092-r935yl__nota-fiscal-deposito.png`. 4. Abrir `/api/anexo/1755800051844-8zuj__foto-2026-02-22-1.png?inline=1`, que é foto da Reforma da fachada, obra que não é dele.
- **Esperava:** 403, como acontece em `/api/obra/2` e `/api/obra/12/fluxo`.
- **Aconteceu:** baixou a nota fiscal, que tem valores, e mostrou a foto da outra obra.
- **Evidência:** `capturas/r2-m6-carlos-abre-foto-outra-obra.png`; download `capturas/nota-fiscal-deposito.png` feito na sessão do Carlos.
- **Sugestão:** checar papel e obra também no download de anexo: campo só abre anexo de diário e galeria das obras dele, nunca anexo de saída ou entrada.

#### A19 - Extrato da fase sai com código de serviço diferente do orçamento
- **Tipo:** bug
- **Gravidade:** média (é o documento que vai pro cliente)
- **Onde:** Relatórios → Extrato da fase, coluna Histórico
- **Passos:** 1. Casa Ribeiro, fase 1: na Estimativa os serviços são 1.1 Tapume, 1.2 Placa de obra, 1.3 Outros. 2. No Fluxo, S-000012 aparece como "1.1 Tapume" e S-000022 como "1.3 Outros". 3. Gerar o Extrato da fase 1.
- **Esperava:** os mesmos códigos.
- **Aconteceu:** no extrato S-000012 e S-000015 aparecem como "1.3 Tapume" e S-000022 como "1.6 Outros". No Muro de arrimo a estimativa tem "1.1 Outros" e o extrato mostra "1.4 Outros".
- **Evidência:** `capturas/r2-m4-extrato-fase1-codigos-servico.png`
- **Sugestão:** usar no extrato a mesma numeração da estimativa da obra.

#### A20 - Taxa ao concluir fase: digitar "10" vira 0,10%
- **Tipo:** atrito / número errado
- **Gravidade:** média
- **Onde:** Fluxo de caixa → Concluir fase → Percentual sobre o pago
- **Passos:** 1. Concluir fase. 2. No percentual, apagar e digitar `10`.
- **Esperava:** 10%.
- **Aconteceu:** ficou 0,10% e a taxa devida foi pra R$ 45,40. Só com "1000" chega em 10,00% (R$ 4.539,79). Na quantidade do item, digitar "20" dá 20,00: o comportamento muda de campo pra campo.
- **Evidência:** `capturas/r2-m4-taxa-10-vira-0-10.png`
- **Sugestão:** percentual e quantidade aceitam número inteiro como inteiro. Mostrar a taxa em destaque antes de confirmar (isso já existe, mas some no meio do resto).

#### A21 - Não tem dossiê final, e o extrato não mostra o orçado da fase
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** Relatórios / Visão do cliente
- **Passos:** procurar um dossiê de fim de obra; gerar o extrato de uma fase.
- **Esperava:** um documento único com capa, resumo orçado × realizado, extrato de cada fase, taxa por fase, fotos e diário. E, no extrato da fase, o orçado, a diferença e o status (concluída em, taxa aplicada).
- **Aconteceu:** só existe a Visão do cliente (imprimir/PDF) e o extrato fase por fase. O extrato mostra "concluída em 18/10/2026", mas não mostra orçado, diferença, taxa nem link das notas. Extrato e Estimado×realizado não têm Exportar.
- **Na planilha eu faria:** junto as abas de resumo e gastos e mando em PDF.
- **Evidência:** `capturas/r2-m4-extrato-fase-hidraulica.png`
- **Sugestão:** botão "Dossiê da obra" (PDF) e Exportar CSV em todo relatório.
- **Proposta pra Visão do cliente durante a obra** (hoje ela tem investido, executado, saldo, % do estimado, gráficos e fotos): (1) avanço físico por fase (já conhecido), ao lado do % gasto; (2) "próximos passos": fase atual, próxima fase e data prevista; (3) contas a vencer que o cliente vai ter que cobrir nos próximos 30 dias; (4) últimas anotações do diário escolhidas por mim; (5) legenda nas fotos em vez do nome do arquivo ("foto-2026-02-17-3.png" não diz nada pro cliente); (6) link pro cliente acessar sozinho, só leitura.

#### A22 - Duas abas na mesma obra: a última a salvar apaga o que a outra mudou
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Obra → Dados → Salvar
- **Passos:** 1. Aba A: Observação "Aba A..." e CEI preenchido. 2. Aba B, aberta antes de salvar a A: só Observação "Aba B...". 3. Salvar A e depois B (dois PATCH 200). 4. Recarregar.
- **Esperava:** um aviso de que a obra mudou desde que abri, ou pelo menos que o CEI da aba A não fosse apagado.
- **Aconteceu:** ficou a observação da B e o CEI voltou a ficar vazio. A alteração da A sumiu sem aviso.
- **Evidência:** obra/12, Dados, CEI vazio depois do teste.
- **Sugestão:** gravar só os campos alterados, ou recusar o salvamento quando o registro mudou ("alguém alterou esta obra, recarregue").

#### A23 - "Inativar fornecedor" confirma mas não grava
- **Tipo:** bug / atrito
- **Gravidade:** média
- **Onde:** Fornecedor → Inativar fornecedor → "Inativar"
- **Passos:** 1. Abrir J. Alves. 2. Inativar fornecedor → Inativar (a mensagem diz "Some da lista e do lançamento"). 3. Sair da tela sem clicar em Salvar.
- **Esperava:** que estivesse inativado.
- **Aconteceu:** nenhuma requisição saiu e o fornecedor continua ativo na lista. O botão só vira "Ativar fornecedor"; pra valer tem que clicar também em Salvar. Fechar não avisa nada. O histórico do fornecedor continua aparecendo nos extratos, e isso está certo.
- **Sugestão:** a confirmação já grava, ou o texto diz "clique em Salvar para concluir".

#### A24 - Diário de obra sem campo de data
- **Tipo:** lacuna
- **Gravidade:** média (atrapalha todo dia)
- **Onde:** Diário de obra → Registrar e Editar
- **Passos:** registrar à noite o que aconteceu ontem.
- **Esperava:** poder escolher a data, como no lançamento.
- **Aconteceu:** fica com a data e a hora de agora (18/10/2026), e nem na edição dá pra mudar. O fim de dia, que é quando eu regularizo, sai todo com data errada.
- **Sugestão:** campo Data (padrão hoje) no diário.

#### A25 - Obra "Concluída" com fases abertas e contas a pagar
- **Tipo:** lacuna / dado inconsistente
- **Gravidade:** média
- **Onde:** Obra → Dados → Situação; Visão do cliente
- **Passos:** abrir a Reforma da fachada (Concluída).
- **Esperava:** que, pra concluir a obra, o sistema pedisse pra fechar as fases (com taxa) e mostrasse as contas em aberto.
- **Aconteceu:** a obra está Concluída com 0 de 5 fases concluídas, R$ 18.650,93 a pagar e taxa devida R$ 0,00. Na Visão do cliente aparece "Concluída · 0 de 5 fases concluídas". O mesmo vale pra Casa Ribeiro e pro Alto da Serra A.
- **Sugestão:** ao mudar pra Concluída, listar as fases abertas e as contas a pagar e pedir confirmação.

#### A26 - Lançamento com data no futuro aceito sem aviso
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** Registrar lançamento → Data
- **Passos:** Data 15/03/2027, Pago marcado com data de pagamento 18/10/2026.
- **Esperava:** um aviso de data no futuro e de pagamento anterior à nota.
- **Aconteceu:** gravou sem aviso (S-000317, já excluída depois do teste), e o saldo e o caixa de hoje já descontaram o valor.
- **Sugestão:** avisar quando a data passar de hoje (ex.: mais de 7 dias) e quando o pagamento for anterior à nota.

#### A27 - Tirar fase com gasto: o sistema desfaz em silêncio
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Obra → Fases → desmarcar "9 - FORRO" (tem R$ 9.310,48) → Salvar
- **Passos:** desmarcar e salvar, duas vezes.
- **Esperava:** uma mensagem do tipo "Forro tem 3 lançamentos, não dá pra tirar".
- **Aconteceu:** a fase volta a ficar marcada ("6 selecionado(s)" vira "8 selecionado(s)") e não aparece nenhuma explicação. Pelo menos não perdeu os lançamentos.
- **Sugestão:** dizer o motivo e oferecer "mover lançamentos para outra fase".

#### A28 - Conta vencida aparece como "Vence 30/08/2026"
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Fluxo de caixa → Situação; Extrato da fase
- **Passos:** Muro de arrimo, S-000302, vencimento 30/08/2026, hoje é 18/10/2026.
- **Esperava:** "Vencida há 49 dias", em vermelho.
- **Aconteceu:** "Vence 30/08/2026" no fluxo e "em aberto, vence 30/08/2026" no extrato, sem destaque.
- **Sugestão:** destacar o que está vencido e pôr no Início "contas vencidas".

#### A29 - Celular: alvos pequenos e barra inferior cortada
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** 390×844, Diário e barra de navegação
- **Passos:** abrir Diário de obra no celular.
- **Aconteceu:** os ícones Editar e Excluir de cada registro têm 13×13 px e ficam colados (é fácil excluir querendo editar). A barra inferior tem 7 botões e "Usuários" fica fora da tela (começa em x=403). Na aba Diário aparece um botão "Salvar" solto no rodapé, que é do formulário de Dados. As abas da obra (Dados até Galeria) precisam ser roladas de lado pra achar Diário e Galeria.
- **Evidência:** `capturas/r2-m5-lancamento-celular-rodape.png`, `capturas/r2-m5-visao-cliente-celular.png`
- **Sugestão:** alvos de 40 px ou mais, menu "Mais" na barra, botão Salvar só onde ele salva alguma coisa.

#### A30 - "Pra qual fase a obra vai agora?" pula a fase aberta seguinte; fluxo fora de ordem
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Fluxo de caixa → Concluir fase → janela "Fase concluída"; lista de lançamentos da fase
- **Passos:** 1. Concluir a fase 1 da Casa Ribeiro. 2. Ver a lista de lançamentos de uma fase.
- **Aconteceu:** a tela já mostrava a 2 - Terraplanagem, mas a lista de "próxima fase" sugere 3 - Estrutura, e a 2 nem aparece. Na lista de lançamentos da fase as linhas não seguem data nem número (ex.: E-000022 de 24/11 antes de S-000058 de 17/12, que vem antes de E-000021 de 30/12).
- **Evidência:** `capturas/r2-m4-fase-concluida-proxima-fase.png`
- **Sugestão:** sugerir a próxima fase aberta pela ordem; ordenar a lista por data, com opção de inverter.

#### A31 - Pequenos erros de texto
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Visão do cliente, Extrato da fase, Obra → Dados, Novo cliente
- **Aconteceu:** "Posição em18/10/2026" e "Emitido em18/10/2026", sem espaço, justo no documento do cliente. Período 28/07 a 26/10 (90 dias) aparece como "2 meses". O formulário de Novo cliente já mostra o botão "Inativar cliente" (o de Novo fornecedor também, "Inativar fornecedor").
- **Sugestão:** corrigir o espaço, mostrar "2 meses e 29 dias" (ou "3 meses"), esconder Inativar em cadastro novo.

#### A32 - Aba do navegador parou de responder a cliques (não confirmado)
- **Tipo:** bug (não confirmado, pode ser do navegador de teste)
- **Gravidade:** baixa
- **Onde:** várias telas (Usuários → Novo, Sair, Diário → Registrar, Clientes → Novo)
- **Passos:** aconteceu 3 vezes na sessão: depois de salvar um usuário e depois de navegar por URLs diretas. Na aba travada nenhum botão reage, nem recarregando; o console não mostra erro e não sai requisição.
- **Aconteceu:** só abrindo uma aba nova o sistema voltou a responder. Uma vez o diálogo "Novo usuário" ficou aberto sem Salvar nem Fechar funcionarem.
- **Evidência:** `capturas/r2-m6-novo-usuario-nao-abre.png`, `capturas/r2-m6-novo-usuario-travado.png`
- **Sugestão:** tentar reproduzir num navegador comum. Se acontecer lá, é grave.

### Já conhecidos que reapareceram (não contei como novos)
- Pendência: não existe; a M5(d) ficou sem fazer.
- No celular os itens da nota ficam cortados (coluna Item com 58 px, lista de sugestão com 56 px).
- O popup de preço combinado apareceu de novo na primeira nota.
- A foto do diário aparece só como link com o nome do arquivo.
- Voltar no navegador e recarregar com alteração não salva descartam sem perguntar, igual a fechar.
- Nada disso piorou. Só a falta de Pendência impediu um passo.

### Dados que eu criei
- **Casa Ribeiro - Jardim Chapadão (obra 2):** fase 1 - Instalações do canteiro concluída com taxa de 10% sobre o pago (R$ 45.397,94 → R$ 4.539,79).
- **Muro de arrimo e drenagem (obra 12), fase 1 - Terraplanagem:**
  - S-000315, 17/10/2026, Depósito Central, Cimento portland cp ii-e-32, 20 × 38,90 = R$ 778,00, paga, NF 4521 com anexo `nota-fiscal-deposito.png`. Escolhi "Passa a ser o preço de Depósito Central", então o preço combinado do cimento com esse fornecedor ficou 38,90.
  - S-000316, 17/10/2026, J. Alves Empreitas, R$ 2.350,00, paga (pix), "Empreita semana 12-17/10".
  - S-000317, 15/03/2027, R$ 1.234,50: teste de data futura, já excluída.
  - Diário do admin (18/10, Terraplanagem) "Baldrame concretado no trecho B..." com `foto-obra-baldrame.jpg`.
  - Diário do carlos (18/10) "Carlos: chegou o caminhão de areia..." com `foto-obra-baldrame.jpg`.
  - Observação da obra: "Aba B: muro vai até a divisa" (teste das duas abas).
- **Usuários:** carlos / carlos123 (Campo, só Muro de arrimo); ana / ana12345 (Escritório).
- **Cliente:** Paulo Henrique Tavares, celular (19) 99123-4567.
- **Fornecedor:** Zé Pedreiro Empreitas (presta serviço).
- **Obra:** Reforma cozinha Tavares (cliente Paulo Henrique Tavares, não iniciada, previsto 01/11/2026 a 31/01/2027).

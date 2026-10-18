# Rodada 3 - relatório do Jean

Bloco A (M1 a M3). O bloco B (M4 a M7) vai em outro arquivo.
Senha do admin trocada para **`Jean@2026`** (Usuários > Editar > Nova senha). Saí e entrei de novo com ela, funcionou.

## Verificação das correções da rodada 2

| # | Item | Resultado | O que eu vi |
|---|------|-----------|-------------|
| 1 | "A receber (previsto)" fase a fase | ✅ corrigido | Legenda "custo previsto + taxa − recebido". Só com a estimativa: R$ 400.950,00 (364.500 + 10% = 36.450). Depois da entrada de 50 mil: R$ 350.950,00. Concluí a Fundação com R$ 5.000 fixos (gasto 10.450,75) e deu **R$ 311.400,75**. Na mão: fases abertas 314.500 × 1,10 = 345.950,00, mais Fundação 10.450,75 + 5.000 = 15.450,75, total 361.400,75, menos 50.000 = 311.400,75. Bate. Também testei concluir com 10%: deu 307.445,83, ou seja 10% sobre os 10.450,75 que a fase gastou (1.045,08). Bate com a regra. |
| 2 | Cartões do topo atualizam sozinhos | ✅ corrigido | Ao salvar a estimativa o cartão "A receber" apareceu na hora (400.950,00). Ao concluir a fase foi para 311.400,75 e ao reabrir voltou para 350.950,00, tudo sem recarregar. "A pagar" também apareceu sozinho quando lancei o boleto. |
| 3 | Vírgula no valor | ⚠️ parcial | Digitar `1.234,5` deu 1.234,50. **Ctrl+V** de `1.234,5` (copiei da Descrição) deu 1.234,50. Sem vírgula continua caixa eletrônico (`45000` = 450,00). Digitar `350000` rápido logo ao entrar no campo deu 3.500,00, e `425075` deu 4.250,75. **Mas o Backspace depois da vírgula engana:** de 1.234,50, o 1º Backspace dá 1.234,00 e o 2º dá **12,34**. Se eu saio do campo, fica 12,34 (ver A1). |
| 4 | Concluir fase com conta em aberto avisa | ✅ corrigido | A janela de concluir mostra "Ainda há R$ 4.250,75 em aberto nesta fase", com o pago na fase (6.200,00) e a taxa devida. |
| 5 | "Pra qual fase a obra vai agora?" | ✅ corrigido | Depois de concluir a 4 - Fundações, veio marcada a **5 - Estrutura**, que é a seguinte na lista. A tela ficou na Fundação, com "Ficar nesta" e "Abrir fase". |
| 6 | Esc com a lista de fornecedor aberta | ✅ corrigido | Digitei "Depósito São José" (ainda não existia), a lista abriu com "Criar…", apertei Esc: a lista fechou, o texto ficou e o formulário continuou aberto. |
| 7 | Editar saída com anexo mostra o nome | ✅ corrigido | Em "Editar saída S-000001" o anexo aparece como link "nota-fiscal-deposito.pdf". `capturas/r3-m2-editar-saida-anexo-nome.png` |
| 8 | Diário sem "Salvar" solto | ✅ corrigido | A aba Diário de obra só tem "Registrar" e os registros. `capturas/r3-m2-diario-sem-salvar.png` |
| 9 | Pagamentos > Analítico por fase sem "Fase" duplicada | ✅ corrigido | Colunas: Fase, Obra, Data, Lançado, Pago, Em aberto, % do total. Uma vez só. `capturas/r3-m3-pagamentos-analitico-fase.png` |
| 10 | Cadastro novo sem "Inativar"; existente inativa direto | ✅ corrigido (com efeito colateral, ver A2) | Cliente novo e fornecedor novo só têm "Salvar". Na Marina, "Inativar cliente" e depois "Inativar" já gravou: ela sumiu do filtro Ativo e apareceu no Inativo. "Ativar cliente" voltou na hora, sem pedir confirmação. Testei também no fornecedor Remove Entulhos e funcionou, mas ele perdeu a marca "incompleto" (A2). |
| 11 | Duas abas na mesma obra | ✅ corrigido | Aba 1: mudei a Observação e salvei. Aba 2: mudei o CEI (51.234.56789/12) e salvei. Recarreguei e os dois campos estavam gravados. |

## Resumo
Desta vez **todos os números bateram** com a minha conta: gasto por fase, caixa, saldo, a pagar, o "A receber" antes e depois de concluir a fase, a taxa devida e os percentuais do relatório. As correções da rodada 2 estão quase todas resolvidas. Para a parte de dinheiro de uma obra eu já trocaria a planilha. O que ainda pesa é o lançamento da noite: a nota de 3 itens deu umas 30 interações, por causa das confirmações "Criar…?" e do popup de preço, que ainda engole o clique seguinte. E o Backspace no valor pode transformar 1.234 em 12,34 sem eu perceber.

## Missões
| Missão | Resultado | Cliques/telas | Comentário |
|---|---|---|---|
| M1 - Primeira obra | ✅ cumpri | Senha: 4 cliques. Cliente: 6 (1 tela). Obra: cerca de 12 em 2 abas (Dados e Endereço); ela fecha ao salvar e tem que reabrir. Fases: 11 checkboxes + Salvar. Estimativa: 11 cliques para abrir as fases + 18 valores (17 serviços e a taxa) + Salvar. Entrada: 6. | Sozinho, vindo da planilha, eu levaria uns 25 a 30 minutos. A estimativa é a parte longa: escolher a fase marca 71 serviços e tem que abrir fase por fase para pôr valor. Só travei uma vez: depois de salvar a obra ela fechou e voltei à lista sem saber onde estavam as fases. A taxa de 10% só pegou digitando "10," (já conhecido). Total: custo R$ 364.500,00 + adm. R$ 36.450,00 = R$ 400.950,00. |
| M2 - Fim do dia | ⚠️ cumpri com dificuldade | NF do Depósito (3 itens + anexo): cerca de 30 interações (3 confirmações "Criar…?", 3 popups de preço, 2 cliques perdidos). Zé Pedreiro: cerca de 14. Gerdau (boleto): cerca de 16, com 1 clique perdido no "Pago". Caçamba: cerca de 10. Correção da fase: 5. Diário com foto: 7. Pendência: 4. | Na planilha seriam 4 linhas, uns 5 minutos. Aqui foram uns 20 a 25 minutos para um usuário real. O "Salvar e continuar" ajuda, porque mantém fase e data, mas mantém também o fornecedor anterior e tenho que limpar. Clique duplo em "Salvar e continuar" gerou **um** lançamento só (1 POST), certo. Erro proposital: lancei a caçamba na Fundação e corrigi para Canteiro editando a saída. Os totais se ajustaram certo. A pendência foi para o diário como texto (não há módulo, já conhecido). |
| M3 - O cliente ligou | ✅ cumpri | 1 a 3 cliques por pergunta (Fluxo de caixa, Relatórios > Pagamentos / Estimado × realizado / Taxa). | Todos os números bateram (tabela abaixo). A pergunta de material × mão de obra eu respondi somando à mão no relatório "Por insumo" (já conhecido). "A pagar nos próximos dias": só o cartão "A pagar R$ 4.250,75" e a linha "Vence 28/10/2026" dentro da fase (sem lista por vencimento, já conhecido). |

### Conferência dos números (minha conta × sistema)
| Pergunta | Minha conta | Sistema | OK |
|---|---|---|---|
| Gasto na Fundação | 3.400,00 + 2.800,00 + 4.250,75 = 10.450,75 | 10.450,75 (Fluxo, Pagamentos, Estimado × realizado) | ✅ |
| Fundação: material / mão de obra | material 1.900 + 1.120 + 380 + 4.250,75 = 7.650,75; mão de obra 2.800,00 | por insumo: Aço 4.250,75, MO 2.800,00, Cimento 1.900,00, Areia 1.120,00, Bloco 380,00 | ✅ (soma à mão) |
| Cimento do Depósito São José | 50 × 38,00 = 1.900,00 | Cimento CP-II 1.900,00 | ✅ |
| Fundação × orçado | 10.450,75 de 50.000 = −79,10% | −39.549,25 (−79,10%) | ✅ |
| Obra × orçado | 10.900,75 de 364.500 = −97,01% | −353.599,25 (−97,01%) | ✅ |
| Cliente pagou | 50.000,00 | Entradas 50.000,00 | ✅ |
| Quanto falta (previsto) | 361.400,75 − 50.000 = 311.400,75 (depois de concluir) | A receber (previsto) R$ 311.400,75 | ✅ |
| Caixa da obra | 50.000 − 3.400 − 2.800 − 450 = 43.350,00 | Caixa R$ 43.350,00 | ✅ |
| Saldo (tudo lançado) | 50.000 − 10.900,75 = 39.099,25 | Saldo R$ 39.099,25 | ✅ |
| Taxa devida | Fundação fixo 5.000,00 | Taxa devida (fases concluídas) R$ 5.000,00 | ✅ |
| A pagar | Gerdau 4.250,75 vence 28/10 | A pagar R$ 4.250,75, "Vence 28/10/2026" | ✅ |
| % do total no relatório | 4.250,75 / 10.900,75 = 39,00%; 10.450,75 / 10.900,75 = 95,87% | 39,00 / 95,87 | ✅ |
| Prazo decorrido | 17 de 272 dias = 6,25% | 6,25% | ✅ |

## Achados

### A1 - Backspace depois da vírgula divide o valor por 100
- **Tipo:** bug
- **Gravidade:** média (pode gravar número errado se eu não olhar o campo)
- **Onde:** qualquer campo de valor (testei na Estimativa e no Registrar lançamento > Valor)
- **Passos:** 1. Digito `1.234,5` (aparece 1.234,50). 2. Aperto Backspace duas vezes para apagar o ",5".
- **Esperava:** 1.234,00 (ou 1.234 com a vírgula esperando os centavos).
- **Aconteceu:** o 1º Backspace dá 1.234,00 e o 2º dá **12,34**. Se eu saio do campo (Tab), fica 12,34. Se eu digito ",7" em seguida, volta para 1.234,70, então o sistema guardou os dígitos mas mostra outra coisa.
- **Na planilha eu faria:** apagar o 5 e ficar com 1.234.
- **Evidência:** `capturas/r3-m2-backspace-virgula-12-34.png`
- **Sugestão:** depois que digitei a vírgula, o Backspace só apaga os centavos e nunca volta para o modo caixa eletrônico no meio da edição.

### A2 - Inativar e ativar o fornecedor tira a marca "incompleto"
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Fornecedores > Editar > Inativar fornecedor / Ativar fornecedor
- **Passos:** 1. Remove Entulhos foi criado no lançamento ("Entra como cadastro incompleto"). 2. Editar > Inativar fornecedor > Inativar. 3. Filtro Inativo > Editar > Ativar fornecedor. 4. Volto ao filtro Ativo.
- **Esperava:** continuar "incompleto", porque o cadastro segue sem CNPJ, sem tipo e sem telefone.
- **Aconteceu:** os outros 3 continuam com a etiqueta "incompleto" e o Remove Entulhos não. O botão do painel diz "3 cadastro(s) incompleto(s)", mas são 4.
- **Evidência:** `capturas/r3-fornecedor-perde-incompleto.png`
- **Sugestão:** inativar e ativar mudam só a situação, sem mexer no "incompleto".

### A3 - O popup de preço ainda engole o clique seguinte
- **Tipo:** atrito (complemento do popup já conhecido)
- **Gravidade:** média (acontece em todo lançamento com itens)
- **Onde:** Registrar lançamento > Itens > Valor unit.
- **Passos:** 1. Ponho o preço do item. 2. Clico direto em "Adicionar linha" (ou no "Pago").
- **Esperava:** a linha nova aparecer, ou o Pago desmarcar.
- **Aconteceu:** aparece o popup "saiu por R$ … / Só nesta nota" e o clique que eu dei se perde. Depois de responder, tenho que clicar de novo. Aconteceu 3 vezes na noite: duas no "Adicionar linha" e uma no "Pago" da Gerdau.
- **Sugestão:** fazer a pergunta sem cancelar o clique, ou perguntar uma vez só, ao salvar a nota.

### A4 - Taxa da fase: dois números diferentes para "10%"
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** janela "Concluir fase" × cartão "A receber (previsto)"
- **Passos:** 1. Concluir a Fundação com "Percentual sobre o pago" 10%. 2. Olhar o cartão.
- **Esperava:** um número só para a taxa da fase.
- **Aconteceu:** a janela mostra "Taxa devida: R$ 620,00" (10% dos 6.200 pagos) e o "A receber" soma 1.045,08 (10% dos 10.450,75 lançados). As duas contas fazem sentido, mas o usuário vê dois valores e não sabe qual é. Outra coisa: depois de concluir com %, reabrir e escolher "Valor fixo", o campo voltou para 0,00. Antes ele tinha lembrado os 5.000.
- **Sugestão:** na janela, mostrar também "previsto quando o aberto for pago: R$ 1.045,08".

### A5 - Relatório analítico de pagamentos não mostra o fornecedor
- **Tipo:** lacuna
- **Gravidade:** baixa
- **Onde:** Relatórios > Pagamentos > Analítico (por fase e por insumo)
- **Passos:** abrir o analítico.
- **Esperava:** uma coluna com quem cobrou.
- **Aconteceu:** a linha mostra só "S-000001 · NF 18.532 - cimento…", sem o fornecedor. No Fluxo de caixa da obra ele aparece ("Depósito São José · …").
- **Sugestão:** colocar a coluna Fornecedor no analítico.

### A6 - Um "0" solto ao lado do campo Celular
- **Tipo:** bug visual
- **Gravidade:** baixa
- **Onde:** Cliente (editar) e Fornecedor (editar), campo Celular
- **Aconteceu:** o texto da tela fica "Celular" + caixa + "0", com o 0 logo depois da caixa, mesmo com o celular preenchido (Marina) ou vazio (Remove Entulhos).
- **Evidência:** `capturas/r3-celular-zero-solto.png`
- **Sugestão:** tirar o 0, ou dizer o que ele significa.

### A7 - Duração da obra arredonda para baixo
- **Tipo:** número errado (pequeno)
- **Gravidade:** baixa
- **Onde:** Obra > Dados > Período previsto
- **Aconteceu:** de 01/10/2026 a 30/06/2027 mostra "8 meses". Para mim são 9 meses (outubro a junho).
- **Sugestão:** arredondar para o mês cheio ou mostrar "8 meses e 29 dias".

### A8 - Cliente inativo não aparece como inativo na tela dele
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Clientes > Editar (cliente inativado)
- **Aconteceu:** a tela de edição é igual à de um cliente ativo, só o botão de baixo vira "Ativar cliente". Não há etiqueta "Inativo" no título.
- **Sugestão:** etiqueta "Inativo" no cabeçalho, como o "Paga / Em aberto" do lançamento.

### A9 - Na confirmação "Criar …?" o campo fica vazio
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Fornecedor e Item
- **Aconteceu:** enquanto a pergunta "Criar 'Depósito São José'? Entra como cadastro incompleto." está aberta, o campo de texto embaixo fica em branco. Parece que perdi o que digitei. Depois de "Criar" o nome volta.
- **Sugestão:** manter o texto visível enquanto pergunta.

### A10 - "Posição em18/10/2026" sem espaço
- **Tipo:** bug visual
- **Gravidade:** baixa
- **Onde:** Obra > Visão do cliente, cabeçalho
- **Sugestão:** "Posição em 18/10/2026".

## Dados que eu criei
- **Usuário:** admin, senha trocada para `Jean@2026`.
- **Cliente:** Marina Costa, CPF 529.982.247-25, (11) 98765-4321, marina.costa@gmail.com. Inativada e ativada de volta.
- **Obra 1:** "Casa Marina Costa - Rua das Palmeiras, 45", Construção Casa, Em andamento, previsto de 01/10/2026 a 30/06/2027, Rua das Palmeiras 45, Jardim Primavera, Campinas/SP, CEI 51.234.56789/12, observação "Casa térrea 120 m², por administração. Cliente prefere contato por WhatsApp."
- **Estimativa 000001 (viva):** 1 Serviços 11.500 (técnicos 8.000, sondagem 3.500); 2 Canteiro 6.000 (barracão 3.500, tapume 2.500); 4 Fundações 50.000 (escavação 12.000, sapatas 38.000); 5 Estrutura 80.000 (pilares 30.000, vigas 25.000, lajes 25.000); 7 Alvenaria 35.000; 8 Cobertura 45.000 (madeira 20.000, telhamento 25.000); 10 Revestimentos 60.000 (reboco 25.000, interno 35.000); 14 Elétrica 25.000 (fiação); 15 Hidráulica 25.000 (água fria 15.000, esgoto 10.000); 17 Pintura 22.000 (interna); 21 Finalização 5.000 (limpeza final). Custo 364.500,00, administração 10%, total 400.950,00.
- **Entrada E-000001:** 18/10/2026, R$ 50.000,00, fase 1 - Serviços, "Entrada - sinal do contrato (Pix)".
- **Saídas (todas em 18/10/2026):**
  - S-000001 Depósito São José, Fundação, R$ 3.400,00 paga (pix): Cimento CP-II 50 × 38,00; Areia média 8 × 140,00; Bloco cerâmico 200 × 1,90. Anexo nota-fiscal-deposito.pdf.
  - S-000002 Zé Pedreiro, Fundação, R$ 2.800,00 paga (pix), item "Mão de obra - pedreiro (semana)".
  - S-000003 Gerdau Distribuidora, Fundação, R$ 4.250,75 em aberto, vence 28/10/2026, item do catálogo "Aço CA-50 10mm".
  - S-000004 Remove Entulhos, R$ 450,00 paga (dinheiro), lançada na Fundação por engano e corrigida para 2 - Canteiro.
- **Fornecedores criados no lançamento:** Depósito São José, Zé Pedreiro, Gerdau Distribuidora, Remove Entulhos. O Remove Entulhos foi inativado e ativado de volta.
- **Itens criados:** Cimento CP-II, Areia média, Bloco cerâmico, Mão de obra - pedreiro (semana).
- **Diário:** "Baldrame concretado, choveu à tarde, equipe parou às 15h" (Fundação, foto-obra-baldrame.jpg); "PENDÊNCIA: Comprar impermeabilizante antes de subir a alvenaria".
- **Fase 4 - Fundações:** concluída 3 vezes (fixo 5.000, depois 10%, depois fixo 5.000) e reaberta 2 vezes. Estado final: **concluída com taxa fixa de R$ 5.000,00**.

---

# Rodada 3 - relatório do Jean

## Bloco B (M4-M7)

### Resumo
Os números estão batendo. Conferi à mão o A receber em três obras, o extrato de fase, o Pagamentos geral contra a lista de obras e contra os fornecedores, a taxa de administração e os cartões depois de lançar no celular: nenhum centavo de diferença. Das oito correções da rodada 2, sete ficaram resolvidas e uma em parte (a 7). O que mais pesou nesta rodada: (1) valor com uma casa decimal que entra de uma vez no campo ("1.234,5", como quando se cola ou se dita) vira 123,45, dez vezes menos; (2) no celular, a pergunta do preço aparece no meio da digitação da quantidade e come um dígito; (3) o mestre de obras abre e pode apagar o contrato e o cronograma físico-financeiro. Para o escritório já dá para trocar a planilha. No campo, pelo celular, ainda não.

### Verificação das correções da rodada 2 (bloco B)

| # | Correção | Resultado | Comentário |
|---|---|---|---|
| 1 | Anexos do usuário de campo | ✅ | Carlos (campo, só Casa Menezes). A NF que anexei na S-000161 da Casa Menezes deu 404; a foto da Galeria da Casa Ribeiro deu 404; a foto `canteiro-2.png` da Galeria da Casa Menezes abriu (200). |
| 2 | "A receber (previsto)" em obra concluída | ✅ | Conferido à mão na Reforma da fachada e na Casa Ribeiro, antes e depois de concluir duas fases (ver Números conferidos). Não achei obra em que o cliente tenha pago mais que o custo + taxa, então não deu para ver o cartão sumir. |
| 3 | Códigos de serviço no extrato da fase | ✅ | Casa Ribeiro, fase 1: o extrato mostra 1.1 Tapume / 1.2 Placa de obra / 1.3 Outros, igual à Estimativa e ao Fluxo. |
| 4 | Inativar fornecedor | ✅ | Inativar + confirmar já grava, sem Salvar (a lista de ativos foi de 17 para 16). Ativar volta na hora. O Marcelo Encanador continua "incompleto" depois de inativar e de ativar. |
| 5 | Concluir fase | ✅ | Com valor em aberto, a janela avisa: "Ainda há R$ 11.863,96 em aberto... com tudo pago, R$ 2.379,36". Depois de concluir, oferece a próxima fase aberta (fase 1 → 2; fase 6 → 7, pulando a 6) e a tela fica parada. |
| 6 | Duas abas, campos diferentes | ✅ | Casa Menezes: na aba B mudei a Observação e salvei; na aba A mudei o CEI e salvei. Numa terceira aba aberta depois, os dois ficaram gravados. |
| 7 | Valores colados e digitados | ⚠️ | Digitados, todos certos: `1.234,5` → 1.234,50; `1234.56` → 1.234,56; `R$ 1 234,56` → 1.234,56; `450` → 4,50; Backspace em 1.234,56 → 123,45. Quando o texto entra de uma vez no campo, `1234.56` e `R$ 1 234,56` dão certo, mas `1.234,5` e `1234,5` viram **123,45** (ver A11). A ferramenta do teste não tem área de transferência, então não fiz um Ctrl+V de verdade. |
| 8 | Popup de preço combinado | ✅ no computador / ⚠️ no celular | No computador: mudei o preço e cliquei direto em "Adicionar linha"; a linha entrou e a pergunta veio depois. Mudei o preço e cliquei direto no "Pago"; ele desmarcou (passou a "Em aberto") e a pergunta veio depois. No celular, a pergunta apareceu enquanto eu digitava a quantidade e engoliu um dígito (ver A12). |

### Missões

| Missão | Resultado | Cliques/telas | Comentário |
|---|---|---|---|
| M4 - Fechamento de fase | ⚠️ | Extrato: Relatórios > Extrato da fase > obra > fase = 4 cliques, 1 tela, mais "Imprimir / salvar PDF". | Nenhuma obra semeada tinha fase concluída; concluí duas na Casa Ribeiro. O extrato é claro, tem saldo linha a linha e confere com a soma à mão, mas não traz a taxa da fase (A15) e tem a data grudada no texto (A14). Dossiê final continua sem existir (já se sabe). A Visão do cliente é boa para acompanhar a obra (investido × executado, por fase com "▲ acima do estimado", fotos por fase); falta o avanço físico (já se sabe). O "Exportar" do Fluxo baixa um CSV, mas não consegui abrir o arquivo no navegador do teste para dizer se dá para usar no Excel; o nome do arquivo perde o acento (A16). |
| M5 - No celular | ⚠️ | Nota com item e anexo: cerca de 14 toques. Pagamento de empreiteiro com "Salvar e continuar": cerca de 8 toques (fornecedor, data e fase ficam). Diário com foto: 5 toques. | Fiz as três coisas e os números bateram. O que me impede de fazer de pé na obra: a pergunta do preço come dígito (A12); a coluna do item tem 58 px e o nome do material não aparece; o "Itens" vem marcado e a tabela de 5 colunas não cabe; o Pago é uma caixinha de 13 px (já se sabe). "Quanto gastei na fase X, acima ou abaixo?": no Fluxo, a tabela de fases tem 513 px numa tela de 390 e não diz se está acima ou abaixo, eu tenho de comparar de cabeça. Na Visão do cliente diz (TERRAPLANAGEM R$ 71 mil estimado × R$ 98 mil executado), mas fica a dois rolamentos de tela e em "mil" arredondado. |
| M6 - Equipe | ⚠️ | Criar usuário: Novo, nome, senha, papel, obra, Salvar = 6 cliques. | Carlos (campo) só vê a obra dele, só Diário e Galeria. Lançou diário com foto (com data e fase). Pelas URLs de dinheiro (/fornecedores, /usuarios, /relatorios, /obra/2) volta para a lista de obras ou mostra "Obra não encontrada". Na API, fornecedores, clientes e usuários dão 403, e /api/obra/5 vem com saídas e entradas vazias, sem nenhum valor. Mas na Galeria ele vê e pode excluir o contrato e o cronograma físico-financeiro, e pode excluir fotos dos outros (A13). Ana (escritório) faz tudo o que eu faço, menos cadastrar usuário: lança, conclui e reabre fase, define a taxa. Para o escritório faz sentido; eu só preferiria que concluir ou reabrir fase e mexer na taxa ficassem comigo (A19, ideia). |
| M7 - Caminhos tortos | ✅ | - | Duplo clique em Salvar no usuário, na saída e no diário: um POST só, sem duplicar. Fornecedor não tem Excluir, só Inativar (bom). Desmarcar fase com gasto (TERRAPLANAGEM) e salvar: ela volta marcada sem explicar (já se sabe). Duas abas: ok (item 6). Valores estranhos: ver A11. Backspace: ok. Data no futuro, voltar e recarregar: comportamento já conhecido, não piorou. |

### Números conferidos
- **Reforma da fachada** (concluída, nenhuma fase concluída): saídas 221.164,09 − entradas 196.786,39 = 24.377,70, igual ao cartão A receber. ✅
- **Casa Ribeiro** (concluída): antes, 582.800,05 − 575.987,75 = 6.812,30 ✅. Concluí a fase 1 a 10% sobre 45.397,94 pagos = 4.539,79, e o A receber foi para 11.352,09 ✅. Concluí a fase 6 a 8%: sobre 17.877,98 pagos dá 1.430,24; com tudo pago (29.741,94) dá 2.379,36; o A receber foi para 13.731,45 ✅.
- **Relatório Taxa de administração** (Casa Ribeiro): 4.539,79 + 1.430,24 = 5.970,03 ✅.
- **Casa Menezes** (em andamento): soma das fases pelo maior entre estimado e gasto = 950.631,26, menos 557.773,66 recebido = 392.857,60, igual ao cartão ✅.
- **Depois dos lançamentos no celular** na Casa Menezes (nota de 389,00 em aberto e mão de obra de 2.850,00 paga, ambas na TERRAPLANAGEM):
  - Saídas da fase: 94.816,92 → 98.055,92 ✅
  - Saldo da obra: 68.273,64 → 65.034,64 ✅
  - Caixa: 88.584,66 → 85.734,66 ✅
  - A pagar: 20.311,02 → 20.700,02 ✅
  - A receber: 392.857,60 → 396.096,60 ✅ (a fase já estava acima do estimado, então somou os 3.239,00 inteiros)
- **Extrato da fase 1 da Casa Ribeiro**: entradas 2 × 30.643,61 = 61.287,22; as sete saídas somam 45.397,94; saldo 15.889,28 ✅ (igual ao Fluxo).
- **Relatório Pagamentos, todas as obras**: lançado 13.238.171,99, igual à soma da coluna Gasto das 13 obras ✅. Também igual à soma dos 17 fornecedores ativos (12.797.348,84) mais o inativo Vidraçaria Cristal (440.823,15) ✅.

### Achados

#### A11 - Valor com uma casa decimal que entra de uma vez no campo fica dez vezes menor
- **Tipo:** número errado
- **Gravidade:** alta
- **Onde:** Registrar lançamento > Valor (testado no campo Valor da saída)
- **Passos:** 1. Obra > Fluxo de caixa > Registrar lançamento, com Itens desmarcado. 2. Pôr `1.234,5` no Valor de uma vez (como quando se cola da planilha ou do WhatsApp, ou se dita pelo teclado do celular).
- **Esperava:** 1.234,50.
- **Aconteceu:** 123,45. O mesmo com `1234,5`. Já `1.234,50`, `1234.56` e `R$ 1 234,56` entram certos. Digitando tecla por tecla, `1.234,5` também fica certo (1.234,50).
- **Na planilha eu faria:** colo 1.234,5 e a célula mostra 1.234,50.
- **Evidência:** campo Valor mostrando 123,45 depois de receber "1.234,5" e "1234,5" de uma vez.
- **Sugestão:** quando o texto chega inteiro e já tem vírgula ou ponto decimal, ler como número e não como dígitos de caixa eletrônico.

#### A12 - No celular, a pergunta do preço aparece no meio da digitação da quantidade e come um dígito
- **Tipo:** bug
- **Gravidade:** média (o total fica errado na tela; se eu não olho, salvo errado)
- **Onde:** celular 390×844, Registrar lançamento > Itens > Valor unit. → Qtd
- **Passos:** 1. Item "Cimento portland cp ii-e-32", fornecedor Depósito Central. 2. Mudar o Valor unit. para 38,90. 3. Tocar na Qtd, selecionar tudo e digitar `10`.
- **Esperava:** Qtd 10, total 389,00, e a pergunta "saiu por R$ 38,90" depois.
- **Aconteceu:** a pergunta apareceu enquanto eu digitava e a Qtd ficou "0" (depois 0,00), com total 0,00. Tive de digitar de novo.
- **Evidência:** `capturas/r3-b-celular-popup-preco-come-digito.png`
- **Sugestão:** não abrir a pergunta enquanto o foco estiver num campo da mesma linha; perguntar ao salvar, ou ao sair da linha.

#### A13 - Mestre de obras vê, baixa e pode apagar contrato e cronograma físico-financeiro
- **Tipo:** lacuna
- **Gravidade:** média
- **Onde:** Obra > Galeria > Documentos (usuário de campo)
- **Passos:** 1. Entrar como carlos (campo). 2. Casa Menezes > Galeria > Documentos.
- **Esperava:** o mestre não vê dinheiro. Contrato e cronograma físico-financeiro têm valor; ele não deveria abrir esses arquivos, e menos ainda apagar.
- **Aconteceu:** ele vê "Contrato assinado.pdf" e "Cronograma fisico-financeiro.pdf", baixa os dois e tem o botão Excluir (com a confirmação "Não dá pra desfazer"). Também pode excluir as fotos da Galeria que outras pessoas lançaram.
- **Evidência:** download de `Cronograma_fisico-financeiro.pdf` logado como carlos; confirmação "Excluir Contrato assinado.pdf?".
- **Sugestão:** para o campo, mostrar só Fotos, Projetos e Diário; e o Excluir só no que ele mesmo lançou.

#### A14 - "Emitido em18/10/2026" e "Posição em18/10/2026" sem espaço
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Relatórios > Extrato da fase (cabeçalho); Obra > Visão do cliente (cabeçalho)
- **Aconteceu:** a data vem grudada no texto, e é assim que vai no papel que eu entrego ao cliente.
- **Evidência:** `capturas/r3-b-extrato-fase-casa-ribeiro.png`
- **Sugestão:** pôr o espaço.

#### A15 - Extrato de fase concluída não traz a taxa da fase
- **Tipo:** lacuna
- **Gravidade:** baixa (é o caso da "taxa para o cliente", que aguarda a decisão do Jean)
- **Onde:** Relatórios > Extrato da fase
- **Aconteceu:** a fase 1 da Casa Ribeiro foi concluída com taxa de 10% (R$ 4.539,79), mas o extrato só mostra entradas, saídas e saldo. Para fechar a fase com o cliente, ainda tenho de escrever a taxa à mão.
- **Sugestão:** no extrato de fase concluída, uma linha "Taxa de administração da fase".

#### A16 - Arquivo exportado perde o acento do nome
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Obra > Fluxo de caixa > Exportar
- **Aconteceu:** o arquivo saiu como `Casa_Ribeiro_-_Jardim_Chapad_o.csv` (o "ã" virou "_"). Não consegui abrir o CSV no navegador do teste para conferir o conteúdo.

#### A17 - A pergunta do preço já vem com o foco em "Passa a ser o preço de..."
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Itens > pergunta "saiu por R$ ..."
- **Aconteceu:** o botão ativo é "Passa a ser o preço de Depósito Central...". Se eu aperto Enter achando que é "ok", mudo o preço combinado com o fornecedor.
- **Sugestão:** foco em "Só nesta nota", que é o caso comum.

#### A18 - Três preços diferentes para o mesmo item no mesmo lugar
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Itens > Valor unit.
- **Aconteceu:** o campo vem com 38,90 (o último que paguei), a dica do campo diz "Acima do preço base (0,78)" e a pergunta diz "O preço com Depósito Central é R$ 0,74". Não fica claro qual vale.
- **Sugestão:** mostrar um só ("último pago" ou "preço combinado") e dizer qual é.

#### A19 - Escritório pode concluir e reabrir fase e definir a taxa
- **Tipo:** ideia
- **Gravidade:** baixa
- **Onde:** Usuário "Escritório" > Fluxo de caixa > Concluir fase / Reabrir fase
- **Aconteceu:** a Ana faz tudo o que eu faço, menos usuários. Concluir fase e definir taxa é dinheiro meu com o cliente.
- **Sugestão:** deixar como opção do papel; por padrão, só o administrador conclui ou reabre fase.

### Observação sobre o teste (não é achado)
Algumas vezes, depois de abrir uma tela digitando o endereço na mesma aba (principalmente depois de baixar um arquivo ou de abrir uma página de erro 404 da API), a página parou de responder aos cliques: os botões e o menu não faziam nada e nenhuma requisição saía. Abrindo uma aba nova, tudo voltou a funcionar. Não consegui provar que é do sistema e não da ferramenta de teste, por isso não numerei. Se alguém vir isso com um navegador comum, vale investigar.

### Dados que eu criei
- **Usuários:** `carlos` / `carlos123` (Campo, só Casa Menezes - Condomínio Terras); `ana` / `ana12345` (Escritório).
- **Casa Ribeiro (obra 2):**
  - fase 1 INSTALAÇÕES DO CANTEIRO concluída a 10% (R$ 4.539,79);
  - fase 6 PAVIMENTAÇÃO concluída a 8% (R$ 1.430,24 sobre o pago; R$ 2.379,36 com tudo pago).
- **Casa Menezes (obra 5):**
  - `nota-fiscal-deposito.png` anexada na saída S-000161;
  - diário do carlos, 18/10/2026, TERRAPLANAGEM: "Carlos: baldrame da lateral esquerda concretado...", com `foto-obra-baldrame.jpg`;
  - pelo celular, saída do Depósito Central de 17/10/2026, TERRAPLANAGEM, 10 × Cimento portland cp ii-e-32 a R$ 38,90 = R$ 389,00, em aberto, vence 17/11/2026, "NF 4521 - cimento do baldrame", com `nota-fiscal-deposito.png` (preço "Só nesta nota");
  - pelo celular, saída da J. Alves Empreitas de 17/10/2026, TERRAPLANAGEM, R$ 2.850,00, paga em 17/10/2026, pix, "Medição semanal - pedreiro e servente baldrame";
  - pelo celular, diário do admin de 18/10/2026: "Vistoria do baldrame com o cliente...", com `foto-obra-baldrame.jpg`;
  - Observação "Portão do condomínio fecha às 17h." e CEI alterado de 95.773.40444/44 para 95.773.40444/45.
- **Fornecedor Marcelo Encanador:** inativado e ativado de novo.

# Rodada 4 - relatório do Jean

Bloco A. Banco vazio, usuário `admin`. Troquei a senha do admin para **`Jean@Obras2026`** (Usuários > Editar > Nova senha; PATCH 200).

## Verificação do que é novo

| # | Item | Resultado | O que eu vi |
|---|------|-----------|-------------|
| 1 | Numeração dos lançamentos por obra | ✅ funciona | Entrada da Marina = Nº 1, saídas Nº 2, 3, 4, 5 na ordem lançada. Título "Editar saída Nº 2", "Nº 5" ok. Criei Nº 6 de teste e excluí; o seguinte saiu **Nº 7** (não reaproveitou). A tentativa recusada pelo servidor (400, ano 1926) não gastou número. O Nº também aparece no Analítico, em Contas a pagar e no Extrato da fase. |
| 2 | Pendências | ✅ funciona | Aba "Pendências (1)" com o número de abertas. Texto, fase (com número: "7 - ALVENARIA"), responsável e prazo. Prazo passado mostra "prazo vencido em 15/10/2026" (a cor eu registrei em `capturas/r4-pendencias-vencida.png`; pelo leitor de tela só vejo o texto). Marcar a caixinha tira da lista e aparece "Mostrar as 1 feita(s)". |
| 3 | Material × mão de obra | ✅ funciona | Relatórios > Pagamentos > "Material × mão de obra" com filtro de fase: Fundação = Material 7.650,75 + Mão de obra 2.800,00 = 10.450,75, bate com a minha conta. O campo **Tipo** aparece quando desmarco "Itens". Depois que marquei o Zé Pedreiro como "Presta serviço", o Tipo veio sugerido "Mão de obra". O item "Diária de ajudante", criado na hora numa nota do Zé, nasceu como Mão de obra (em Itens e no relatório). |
| 4 | Contas a pagar | ✅ funciona | Relatório ordenado do vencimento mais antigo pro mais novo. Teste com a caçamba vencida em 15/10: "Vencida há 4 dias" e "1 vencida(s): R$ 450,00". Cartão no Início: "R$ 4.700,75 em 2 conta(s), 1 vencida(s)". O cartão "A pagar" do topo da obra leva para `relatorios?r=apagar&obra=1`. Mostra a linha digitável do boleto na descrição. |
| 5 | Diário com data | ⚠️ em parte | Data vem com hoje, a foto aparece como miniatura, a fase aparece com número ("4 - FUNDAÇÕES..."). **Mas aceitou a data 25/10/2026, no futuro** (ver A2). |
| 6 | Datas | ⚠️ em parte | No lançamento: ano 1926 recusado ("Não foi possível salvar: data inválida."), nota em 15/11/2026 dá aviso "está no futuro", pagamento antes da nota dá aviso. **Na obra (Dados), a Data fim 62207 foi aceita e salva**, com "722173 meses" (ver A1). A mensagem do ano não diz qual é a faixa aceita (A8). |
| 7 | Boleto | ✅ funciona | Com Pago desmarcado, o campo vira "Boleto (linha digitável...)". Marquei e desmarquei Pago e o texto ficou. |
| 8 | Obra nova abre em Fases; Área e R$/m² | ✅ funciona | Depois de salvar caiu em `?aba=fases`. Área 120 m² mostra "R$ 3.004,17/m² estimado · R$ 0,00/m² gasto" (360.500 / 120 = 3.004,17, conta sobre o custo, sem taxa). |
| 9 | Taxa | ✅ funciona | Concluí a Fundação com valor fixo R$ 5.000,00: o topo mostra "Taxa devida R$ 5.000,00", a Visão do cliente mostra "Taxa de administração devida R$ 5.000,00 / 4 - FUNDAÇÕES: R$ 5.000,00" e o Extrato da fase mostra "Taxa de administração (Valor fixo) R$ 5.000,00". |
| 10 | Concluir a obra | ✅ funciona | Recusado (409) com "falta concluir 11 fases: ... e pagar R$ 4.700,75 em aberto". Só que a tela continua mostrando "Concluída" no combo (A9). |
| 11 | Busca por palavras soltas | ⚠️ em parte | "cp ii" acha "Cimento portland cp ii-e-32"; "Cimento CP-II", "aco ca 50", "areia media" e "ze ped" também acham. **"cpii" não acha nada** na tela Itens (A6). |
| 12 | Tirar fase com gasto | ✅ funciona | Desmarquei "2 - INSTALAÇÕES DO CANTEIRO": "Salvo. 3 item(ns) mantidos por já terem valor, lançamento ou registro no diário: Barracão de obra, Tapume, INSTALAÇÕES DO CANTEIRO DE OBRA. Para tirar, mova ou exclua o que está neles." |

## Resumo
Para uma obra só, já dá para trocar a planilha. Todos os números que conferi bateram com a minha conta: gasto da fase, material × mão de obra, cimento do fornecedor, orçado × gasto, caixa, A receber e taxa. Contas a pagar, pendências e a numeração do comprovante resolvem coisas que eu fazia de cabeça. O que mais pesou: o sistema ainda deixa entrar data absurda (fim da obra no ano 62207, diário com data de semana que vem). A unidade do item não aparece na nota, então meus 50 sacos de cimento ficaram como "50 quilos". E a entrada do cliente é obrigada a cair numa fase, o que bagunça o caixa por fase. A noite de lançamentos (4 notas, 1 correção, diário e pendência) levaria uns 15 a 20 minutos. Na planilha seriam uns 10, mas a planilha não me daria contas a pagar nem extrato pronto.

## Missões
| Missão | Resultado | Cliques/telas | Comentário |
|---|---|---|---|
| M1.1 Entrar e trocar senha | ✅ cumpri | Login 3; senha: Usuários > Editar > campo > Salvar = 4 | Na primeira aba o "Entrar" não respondeu (sem POST): é o navegador de teste. Abri outra aba e entrou. Não aparece mensagem de "senha alterada". |
| M1.2 Cliente | ✅ cumpri | 7 (Clientes, Novo, 4 campos, Salvar) | CPF formatado sozinho, celular também. |
| M1.3 Obra com área | ✅ cumpri | ~9 | Abriu direto em Fases. Aceitou Data fim 62207 (A1). |
| M1.4 Orçamento | ✅ cumpri | 11 caixas de fase + Salvar; na Estimativa 11 cliques para abrir as fases + 13 valores + Salvar | Marcar a fase inteira marca todos os serviços (71). Total custo R$ 360.500,00 + 10% = **R$ 396.550,00**. |
| M1.5 Taxa | ✅ cumpri | 1 campo | 10% geral na estimativa. Aceitou 1.000% sem aviso (A12). |
| M1.6 Entrada R$ 50.000 | ⚠️ cumpri com dificuldade | 6 | Obriga a escolher fase para a entrada do cliente; pus na fase 1 (A3). |
| M2.1 Nota Depósito São José (3 itens + PDF) | ✅ cumpri | ~17 cliques, 1 modal (3 popups de preço, 2 confirmações de "Criar") | Soma 3.400,00 certa; clique duplo em Salvar gerou um POST só. |
| M2.2 Zé Pedreiro só valor + Tipo | ✅ cumpri | ~8 | Tipo veio sem sugestão (fornecedor criado na hora não tem tipo). |
| M2.3 Gerdau boleto em aberto | ✅ cumpri | ~11 | Vence 29/10, linha digitável guardada. |
| M2.4 Caçamba canteiro | ✅ cumpri | ~10 | |
| M2.5 Diário de ontem com foto | ⚠️ cumpri com dificuldade | ~8 | Aceitou data futura antes de eu corrigir para 18/10 (A2). |
| M2.6 Pendência | ✅ cumpri | 8 | |
| M2.7 Erro proposital e correção | ✅ cumpri | Lancei R$ 4.500,00 na Fundação; corrigi em 5 cliques (abrir Nº 5, valor 450, limpar fase, escolher Canteiro, salvar) | Totais recalcularam certo. |
| M3.1 a M3.7 | ✅ cumpri | 1 a 3 cliques por pergunta (Relatórios + filtro) | Todos os números bateram (tabela abaixo). Para "cimento do Depósito" precisei do Analítico; não há filtro por fornecedor nem coluna de quantidade (A4). |

### Números conferidos (minha conta × sistema)
| Pergunta | Minha conta | Sistema | |
|---|---|---|---|
| Gasto Fundação | 3.400,00 + 2.800,00 + 4.250,75 = 10.450,75 | 10.450,75 | ✅ |
| Fundação material / mão de obra | 1.900 + 1.120 + 380 + 4.250,75 = 7.650,75 / 2.800,00 | 7.650,75 / 2.800,00 | ✅ |
| Cimento do Depósito São José | 50 × 38,00 = 1.900,00 | 1.900,00 (Nº 2) | ✅ |
| Fundação × orçado | 10.450,75 de 45.000,00 → abaixo 34.549,25 | -34.549,25 (-76,78%) | ✅ |
| Obra × orçado | 10.900,75 de 360.500,00 → abaixo 349.599,25 | -349.599,25 (-96,98%) | ✅ |
| Recebido | 50.000,00 | Investido 50.000,00 | ✅ |
| A receber (antes de concluir a Fundação) | 360.500 + 36.050 − 50.000 = 346.550,00 | 346.550,00 | ✅ |
| A receber (depois, taxa fixa 5.000) | 10.450,75 + 5.000 + 315.500 + 31.550 − 50.000 = 312.500,75 | 312.500,75 | ✅ |
| Caixa da obra | 50.000 − 3.400 − 2.800 − 450 = 43.350,00 | 43.350,00 | ✅ |
| Saldo (tudo lançado) | 50.000 − 10.900,75 = 39.099,25 | 39.099,25 | ✅ |
| Taxa devida | 5.000,00 (Fundação fixa) | 5.000,00 | ✅ |
| A pagar | Gerdau 4.250,75 vence 29/10 | 4.250,75, Nº 4, vence 29/10/2026 | ✅ |
| Consumo no Início | 10.900,75 / 360.500 = 3,02% | 3,02% | ✅ |

## Achados

### A1 - Data fim da obra aceita o ano 62207
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Obra > Dados > Período previsto > Data fim (na criação e na edição)
- **Passos:** 1. Nova obra. 2. Na Data fim, digitar 30/06/2207 (o campo deste navegador é mm/dd/aaaa e montou 62207-03-01). 3. Salvar.
- **Esperava:** recusa com mensagem, como no lançamento (ano fora de 2000-2100).
- **Aconteceu:** salvou e mostrou "722173 meses". Continuou salvo na aba Dados até eu corrigir.
- **Na planilha eu faria:** a planilha também deixa, mas é justamente o que o sistema prometeu barrar.
- **Evidência:** `capturas/r4-obra-nova-ano-62207.png`, `capturas/r4-obra-dados-ano-62207-salvo.png`; POST /api/obras 200.
- **Sugestão:** aplicar a mesma regra de ano (2000-2100) nas datas da obra, nos dois períodos.

### A2 - Diário aceita data no futuro
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Obra > Diário de obra > Registrar > Data
- **Passos:** 1. Registrar. 2. Data 25/10/2026 (hoje é 19/10). 3. Registrar.
- **Esperava:** recusa ("não passa de hoje").
- **Aconteceu:** gravou o registro com "25/10/2026", sem aviso. Corrigi editando para 18/10.
- **Evidência:** `capturas/r4-diario-data-futura-aceita.png`
- **Sugestão:** validar também no salvar (o campo deixa digitar qualquer data), com mensagem.

### A3 - Entrada do cliente é obrigada a cair numa fase e distorce o caixa por fase
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** Fluxo de caixa > Registrar lançamento > Entrada > Fase *
- **Passos:** 1. Lançar a entrada de R$ 50.000 da Marina. 2. O campo Fase é obrigatório; pus em "1 - SERVIÇOS".
- **Esperava:** poder lançar a entrada na obra, sem fase (ou numa linha "Recebimentos").
- **Aconteceu:** a tabela por fase mostra SERVIÇOS com caixa +50.000,00 e FUNDAÇÕES com caixa -6.200,00. Os totais da obra estão certos, mas o caixa de cada fase não quer dizer nada.
- **Na planilha eu faria:** aba de recebimentos separada da aba de gastos por fase.
- **Sugestão:** entrada sem fase (da obra), ou uma opção "Recebimento do cliente" fora das fases.

### A4 - Unidade do item não aparece na nota; cimento em sacos ficou "Quilos"
- **Tipo:** número errado (quantidade) / lacuna
- **Gravidade:** média
- **Onde:** Registrar lançamento > Itens; Itens; Relatórios > Por insumo
- **Passos:** 1. Na nota, escolher "Cimento portland cp ii-e-32", Qtd 50, unit. 38,00. 2. Ver Itens: Unidade = "Quilos".
- **Esperava:** a unidade ao lado da quantidade na nota, para eu ver que está em kg e trocar para saco.
- **Aconteceu:** a linha da nota mostra só Item / Qtd / Valor unit. / Total. Meus 50 sacos ficaram registrados como 50 kg a R$ 38,00/kg. O relatório Por insumo não tem coluna de quantidade, então "quanto de cimento comprei" só sai em reais.
- **Evidência:** tela Itens: "Cimento portland cp ii-e-32 · Quilos".
- **Sugestão:** mostrar e deixar trocar a unidade na linha da nota; coluna Qtd + unidade no Por insumo; filtro por fornecedor no Pagamentos.

### A5 - Popup do preço apaga o que eu já tinha digitado no item seguinte
- **Tipo:** atrito
- **Gravidade:** baixa (o popup já é conhecido; o novo é o texto sumir)
- **Onde:** Registrar lançamento > Itens > "... saiu por R$ 38,00 / Só nesta nota"
- **Passos:** 1. Preencher o cimento. 2. Clicar em Adicionar linha e digitar "areia media". 3. O popup do cimento aparece; clicar "Só nesta nota".
- **Aconteceu:** o campo da areia voltou vazio; tive de digitar de novo.
- **Sugestão:** não limpar o campo seguinte ao responder o popup.

### A6 - Busca "cpii" (junto) não acha "cp ii"
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Itens > painel de pesquisa > Nome
- **Passos:** digitar "cpii".
- **Esperava:** achar "Cimento portland cp ii-e-32" (prometido na rodada).
- **Aconteceu:** "Nenhum item encontrado." Com "cp ii" acha.
- **Sugestão:** comparar também sem espaços/hífens.

### A7 - Lista do Fluxo de caixa omite na descrição os itens criados na hora
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Fluxo de caixa > lista da fase
- **Passos:** nota Nº 2 com cimento, areia e "Bloco cerâmico 9x19x29" (criado na hora).
- **Aconteceu:** a linha mostra "Cimento portland cp ii-e-32, Areia lavada tipo media"; o bloco some. No Extrato da fase aparecem os três. O teste com "Diária de ajudante" teve o mesmo efeito.
- **Sugestão:** listar todos os itens da nota (ou "e mais 1").

### A8 - Ano fora da faixa: só "data inválida" no salvar
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Data
- **Passos:** data 18/10/1926 > Salvar e fechar.
- **Aconteceu:** "Não foi possível salvar: data inválida." (HTTP 400). Para data futura há aviso na hora; para ano absurdo, não.
- **Evidência:** `capturas/r4-ano-1926-recusado.png`
- **Sugestão:** aviso na hora: "O ano 1926 está fora de 2000-2100".

### A9 - Recusa de concluir a obra deixa "Concluída" no combo
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Obra > Dados > Situação
- **Passos:** escolher Concluída > Salvar (recusado com a lista do que falta).
- **Aconteceu:** a mensagem é boa, mas o combo continua "Concluída" até recarregar. Parece que mudou.
- **Sugestão:** voltar o combo para a situação gravada.

### A10 - Foto na Visão do cliente com a data de envio, não a do diário
- **Tipo:** bug
- **Gravidade:** baixa
- **Onde:** Visão do cliente > Fotos da obra
- **Passos:** registro do diário de 18/10 com a foto do baldrame.
- **Aconteceu:** a foto aparece "19/10/2026 · FUNDAÇÕES". O cliente vai ver o baldrame no dia errado.
- **Sugestão:** usar a data do registro do diário.

### A11 - Colar "5" no Valor vira R$ 0,05, colar "50" vira R$ 50,00
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Valor (sem itens)
- **Passos:** colar "5" → 0,05; colar "50" → 50,00; colar "2800" → 2.800,00; digitar tecla a tecla "450" → 4,50 (caixa eletrônico, já conhecido).
- **Aconteceu:** ao colar, um dígito só vira centavos e dois ou mais viram reais. Meu lançamento de teste Nº 7 saiu R$ 0,05 em vez de R$ 5,00.
- **Evidência:** `capturas/r4-valor-5-virou-005.png`
- **Sugestão:** regra única para o colar (inteiro = reais).

### A12 - Administração de 1.000% aceita sem aviso
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Estimativa > Administração %
- **Aconteceu:** colando "1000" virou 1.000,00% e total R$ 3.965.500,00, sem nenhum alerta.
- **Sugestão:** avisar acima de, por exemplo, 30%.

### A13 - Fornecedor criado na hora não pergunta se é material ou serviço
- **Tipo:** ideia
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Fornecedor > Criar
- **Aconteceu:** Zé Pedreiro, Gerdau e Remove Entulhos nasceram sem tipo. O Tipo não veio sugerido no primeiro uso do Zé, e a "Caçamba de entulho" (serviço) nasceu como "Materiais". Só depois de editar o fornecedor ("Presta serviço") a sugestão funcionou.
- **Sugestão:** no "Criar 'Zé Pedreiro'?", oferecer "Fornece material / Presta serviço".

### A14 - Detalhes de tela
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** vários
- **Aconteceu:** (a) a URL fica `?aba=fases` ao trocar de aba; se eu der F5 em Fluxo de caixa, volto para Fases. (b) Nos filtros do Pagamentos as fases aparecem sem número ("FUNDAÇÕES - INFRA ESTRUTURA"); no resto, com número. (c) "-94,37%" para -7.550/8.000 (= -94,375, esperava -94,38). (d) A caixinha de marcar pendência como feita não tem rótulo para o leitor de tela. (e) Não aparece confirmação ao trocar a senha.

## Dados que eu criei
- Usuário admin: senha trocada para `Jean@Obras2026`.
- Cliente: **Marina Costa**, CPF 529.982.247-25, cel. (11) 98765-4321, marina.costa@gmail.com, Particular.
- Obra 1: **Casa Marina - Rua das Palmeiras, 45**, Construção Casa, Em andamento, 120 m², previsto 01/10/2026 a 30/06/2027, início real 05/10/2026.
- Estimativa (custo R$ 360.500,00 + 10% = R$ 396.550,00): 1.1 Serviços técnicos 12.000; 2.1 Barracão 5.000 + 2.3 Tapume 3.000; 4.2 Escavação 15.000 + 4.4 Sapatas 30.000; 5.1 Pilares 35.000 + 5.3 Lajes 50.000; 7.1 Alvenaria de vedação 47.500; 8.3 Telhamento 35.000; 10.2 Emboço 25.000 + 10.6 Revest. interno 30.000; 14.2 Fiação 22.000; 15.1 Água fria 20.000; 17.3 Pintura acrílica interna 25.000; 21.1 Limpeza final 6.000. Os demais serviços dessas fases a zero; a fase 2 ficou só com Barracão e Tapume (as outras foram tiradas).
- Lançamentos:
  - Nº 1 Entrada 15/10/2026, fase 1, R$ 50.000,00 "Entrada Marina - TED".
  - Nº 2 Saída 19/10, Fundação, Depósito São José: cimento 50 × 38,00, areia 8 × 140,00, bloco cerâmico 200 × 1,90 = R$ 3.400,00, paga, PDF anexo.
  - Nº 3 Saída 19/10, Fundação, Zé Pedreiro, R$ 2.800,00 sem itens, Tipo Mão de obra, Pix, paga.
  - Nº 4 Saída 19/10, Fundação, Gerdau, Aço CA-50 10mm 1 × 4.250,75, em aberto, vence 29/10/2026, boleto `23793.38128 60000.123456 78000.012345 1 98760000425075`.
  - Nº 5 Saída 18/10, Canteiro, Remove Entulhos, caçamba 1 × 450,00, paga 18/10. Primeiro lancei 4.500 na Fundação e corrigi. Ficou em aberto, vencido em 15/10, durante o teste de contas a pagar e voltou para paga.
  - Nº 6 (R$ 10,00, Diária de ajudante) e Nº 7 (R$ 0,05) eram testes e foram **excluídos**.
- Fase 4 Fundação **concluída** em 19/10/2026 com taxa fixa R$ 5.000,00.
- Diário: 18/10/2026, Fundação, "Baldrame concretado, choveu à tarde, equipe parou às 15h", foto `foto-obra-baldrame.jpg`.
- Pendências: "Comprar impermeabilizante antes de subir a alvenaria" (7 - Alvenaria, Carlos, até 22/10/2026), aberta. "Pedir ART da fundação ao engenheiro" (Jean, prazo 15/10/2026), marcada como feita.
- Fornecedores criados na hora: Depósito São José, Zé Pedreiro (depois marcado "Presta serviço"), Gerdau Distribuidora, Remove Entulhos.
- Itens criados na hora: Bloco cerâmico 9x19x29, Caçamba de entulho 5m3, Diária de ajudante.

---

# Rodada 4 - relatório do Jean

## Bloco B (M4-M7)

### Resumo
Perfis e permissões ficaram bons: montei "Mestre com documentos" e "Comprador", dei permissão só para um usuário, e o Carlos (campo) não vê dinheiro nem documento, nem na tela nem pela URL nem nas respostas do servidor. Os números que conferi à mão (extrato da fase, fluxo, contas a pagar, taxa) batem. O que mais pesou: (1) o Comprador vê "Nenhum lançamento" e R$ 0,00 em Pagamentos e no Extrato do credor, quando a verdade é que o servidor recusou (403) e ele tem lançamentos; (2) no campo de valor não dá para corrigir um dígito no meio, o cursor sempre volta para os centavos; (3) o card "A receber (previsto)" usa uma taxa diferente da "Taxa devida" mostrada ao lado e não fecha na conta à mão. Para trocar a planilha ainda faltam o dossiê final e uma exportação que eu consiga abrir no Excel.

### Verificação do que é novo (bloco B)
| # | Item | Resultado | Observação |
|---|------|-----------|------------|
| 1 | Perfis editáveis (Administrador, Escritório, Campo) + criar "Mestre com documentos" e "Comprador"; Lançar puxa Ver valores | ✅ | Marcar Lançar marca Ver valores sozinho, e desmarcar Ver valores tira Lançar. Duplo clique em Salvar fez um POST só. |
| 2 | Usuário com "Permissões só deste usuário" e escolha de obras | ✅ | A Marta (perfil Campo + Documentos, só Galpão) aparece como "Campo personalizado". Marcar "Todas as obras" esconde a lista de obras. Salvar sem obra avisa "nenhuma - não vê obra alguma". |
| 3 | Campo (Carlos) | ✅ | Só Diário, Pendências e Galeria. Não aparece a pasta Documentos. `/api/anexo/...ART_registrada.pdf` dá 404, e o anexo da nota de saída também dá 404. Só a foto que ele enviou tem Excluir. `/api/obra/12` vem sem saídas, entradas nem documentos; `/api/obra/2` dá 404; `/relatorios` redireciona para Obras. |
| 4 | Comprador (Pedro, só Salão paroquial) | ⚠️ | Lança na obra dele. Não abre outra obra pela tela, pela API nem pelo relatório (404 ou combobox sem a obra). Contas a pagar e o card do Início mostram só a obra dele (R$ 40.438,50). Mas Pagamentos e Extrato do credor com "Todas as obras" mostram R$ 0,00, o que é falso (ver A15). |
| 5 | Não dá para ficar sem quem cadastre usuários | ✅ | Tirar "Usuários e perfis" do perfil Administrador, trocar o admin para Escritório ou inativar o admin: os três são recusados com "é preciso manter ao menos um usuário ativo que cadastre usuários." |
| 6 | Semente | ✅ | As 3 Concluídas (Fachada e hall, Casa Ribeiro, Alto da Serra A) têm A pagar 0,00 e, na Casa Ribeiro, as 9 fases concluídas. O Muro e o Salão têm a 1ª fase concluída com taxa (Muro: 10% do pago = R$ 1.898,17; Salão: R$ 9.311,96). As Paralisadas (Sobrado, Piscina) ainda têm contas a pagar, o que está coerente. |
| 7 | Numeração por obra no extrato e no CSV | ⚠️ | No extrato e no fluxo aparece só o número, por obra (Muro 1..20, meu lançamento novo virou nº 20). O CSV baixou ("Muro de arrimo e drenagem.csv"), mas não consegui abrir o conteúdo neste ambiente de teste: não verificado. |
| 8 | Contas a pagar com vencidas e o cartão do Início | ⚠️ | O cartão do Início mostra total e quantidade de vencidas (32 / R$ 1.428.555,71) e leva ao relatório. A lista mostra "Vencida há N dias". A cor vermelha não consegui confirmar pelo leitor de tela. O cartão soma também as obras Paralisadas, que não estão na tabela do Início (diferença de R$ 24.732,90), e não diz isso. |

### Missões
| Missão | Resultado | Cliques/telas | Comentário |
|--------|-----------|---------------|------------|
| M4 - Fechamento de fase | ⚠️ | Relatórios > Extrato da fase > obra > fase: 4 cliques | O extrato da Terraplanagem do Muro bate à mão e mostra a taxa (10% do pago). A Visão do cliente é boa (investido, executado, saldo, taxa, gráficos, fotos). Faltam o dossiê final (já sabido), "quanto falta o cliente aportar" e o avanço físico. Exportar: o botão gera um CSV, mas não consegui abrir para conferir. |
| M5 - Celular | ⚠️ | Nota com item e anexo: ~18 ações. Mão de obra: ~12. Diário com foto: ~8. Pendência: ~6 | Tudo salvou certo e os totais bateram. No Estimado × realizado a coluna "Diferença (%)" fica cortada e a barra de abas sai da tela (A19). |
| M6 - Equipe | ⚠️ | — | Carlos, João, Ana e Marta estão corretos. No Pedro, os relatórios sem obra escondem um 403 (A15). Nenhuma resposta trouxe dinheiro para quem não devia. |
| M7 - Caminhos tortos | ⚠️ | — | Duplo clique em Salvar (perfil, saída, diário, fornecedor): sem duplicar. "R$ 3.250,00" colado: aceito como 3.250,00. "1234,567": vira 1.234,56. Fornecedor com lançamento: só dá para inativar. Fase com gasto: mantida, com aviso claro. Duas abas, campos diferentes: os dois ficaram salvos. Data 2027: avisa mas deixa salvar. Data 1999: recusada. Problemas: correção no meio do valor (A16) e CNPJ duplicado aceito (A18). |

### Achados

#### A15 - Comprador vê R$ 0,00 em Pagamentos e Extrato do credor (o 403 fica escondido)
- **Tipo:** número errado
- **Gravidade:** alta
- **Onde:** Relatórios > Pagamentos e Relatórios > Extrato do credor, logado como Comprador (sem "Todas as obras")
- **Passos:** 1. Entrar como pedro (só Salão paroquial). 2. Relatórios > Pagamentos, com "Todas as obras" já selecionado. 3. Extrato do credor > Depósito Central.
- **Esperava:** os números da obra dele (o Depósito tem R$ 23.735,54 no Salão), ou o aviso "escolha a obra".
- **Aconteceu:** "Nenhum lançamento no filtro", Lançado R$ 0,00 / "Nenhum lançamento para este credor", R$ 0,00. No Extrato do credor o combobox de obra só tem "Todas as obras", sem a opção do Salão. O console mostra `403` em `/api/relatorios/pagamentos?por=fase` e em `/api/fornecedores/1/extrato`.
- **Na planilha eu faria:** filtraria a aba da obra e veria o valor.
- **Evidência:** `capturas/r4-b-m6-comprador-credor-zerado.png`, console 403 (4 vezes em pagamentos, 2 em extrato)
- **Sugestão:** para quem não tem todas as obras, já abrir na obra dele (ou somar só as obras dele). Nunca mostrar zero quando o servidor recusou.

#### A16 - Campo de valor: não dá para corrigir um dígito no meio
- **Tipo:** bug
- **Gravidade:** média
- **Onde:** Registrar lançamento > Valor (o mesmo vale para o valor unitário dos itens)
- **Passos:** 1. Digitar 1234,56. 2. Seta para a esquerda 3 vezes (cursor antes da vírgula) e Backspace. 3. Home e Delete. 4. Home e digitar 9. 5. Em 12,50, cursor antes da vírgula e digitar 0.
- **Esperava:** 123,56, depois 23,56, depois 923,56; e 120,50 no item 5.
- **Aconteceu:** 1.234,50 (apagou o último centavo), depois 1.234,00, depois 1.234,90; e 12,50 não mudou. O cursor é ignorado: tudo cai nos centavos.
- **Na planilha eu faria:** F2 e corrigiria o dígito.
- **Sugestão:** respeitar a posição do cursor, ou ao menos selecionar tudo ao entrar no campo.

#### A17 - "A receber (previsto)" não fecha com a "Taxa devida" ao lado
- **Tipo:** número errado (de apresentação)
- **Gravidade:** média
- **Onde:** topo da obra (Muro de arrimo)
- **Passos:** 1. Abrir a obra Muro. 2. Somar à mão: estimado 95.000,00 + taxa devida 1.898,17 − recebido 83.203,22 = 13.694,95.
- **Esperava:** que a conta batesse, ou que o card dissesse qual taxa usa.
- **Aconteceu:** o card mostra R$ 12.409,29. Pela minha conta, ele usa o realizado da fase concluída (40.246,69) e a taxa sobre tudo o que foi lançado (10% = 4.024,67), não os 1.898,17 do card ao lado. Só no diálogo "Concluir fase" aparece a explicação ("com tudo pago... é o que o A receber previsto já conta").
- **Sugestão:** no próprio card, abrir a conta: custo previsto X + taxa prevista Y − recebido Z. Ou mostrar "taxa prevista" ao lado de "taxa devida".

#### A18 - Fornecedor com CNPJ repetido é aceito sem aviso
- **Tipo:** atrito
- **Gravidade:** média
- **Onde:** Fornecedores > Novo
- **Passos:** 1. Novo fornecedor "Areia & Pedra Souza" com CNPJ 12.345.678/0001-90 (o mesmo do Depósito Central). 2. Salvar.
- **Esperava:** o aviso "já existe Depósito Central com este CNPJ".
- **Aconteceu:** salvou. Agora há dois fornecedores com o mesmo CNPJ, o que parte o extrato do credor.
- **Sugestão:** avisar e oferecer abrir o cadastro existente.

#### A19 - Celular: Estimado × realizado corta a coluna de % e as abas saem da tela
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Relatórios > Estimado × realizado em 390×844
- **Aconteceu:** a tabela tem 452 px num espaço de 366 px, e a "Diferença (%)" fica cortada. As abas do relatório começam em x=-21 e vão até 809. Há um vão grande entre a tabela e o rodapé de totais. Mesmo assim consegui responder pelo celular: "Cobertura: gasto 27.802,83 de 28.566,66, abaixo 763,83 (−2,67%)".
- **Evidência:** `capturas/r4-b-m5-celular-estimado-realizado.png`
- **Sugestão:** no celular, um cartão por fase (estimado / gasto / diferença), sem tabela larga.

#### A20 - Data de nota no futuro só avisa e deixa salvar
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Registrar lançamento > Data
- **Passos:** saída com data 31/12/2027, paga em 19/10/2026.
- **Aconteceu:** salvou na hora. O aviso "data no futuro" e "pagamento antes da nota" só vi depois, ao reabrir. 01/01/1999 foi recusado só no Salvar ("ano de 2000 a 2100"). Uma data anterior ao início da obra não gera aviso.
- **Sugestão:** pedir confirmação antes de salvar nota com data mais de 30 dias no futuro ou antes do início da obra.

#### A21 - Depois de sair e entrar com outro usuário, cai na tela do anterior
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Login
- **Passos:** sair como joao (em /obra/12) e entrar como pedro.
- **Aconteceu:** o Pedro caiu em /obra/12 com "Obra não encontrada".
- **Sugestão:** depois do login, ir para o Início do usuário.

#### A22 - Lista de fases do Extrato da fase não diz quais estão concluídas
- **Tipo:** ideia
- **Gravidade:** baixa
- **Onde:** Relatórios > Extrato da fase > combobox de fase
- **Aconteceu:** aparece "1 - TERRAPLANAGEM, 2 - COBERTURA...", sem "(concluída)". Para o cliente eu quero achar rápido a fase fechada.
- **Sugestão:** marcar "concluída em dd/mm" na opção.

#### A23 - Comprador com "Cadastros" vê todos os clientes e pode criar obra
- **Tipo:** ideia
- **Gravidade:** baixa
- **Onde:** Início/Clientes como pedro
- **Aconteceu:** o card mostra "10 clientes cadastrados" e há o botão "Nova obra". "Cadastros" junta clientes, fornecedores, itens e dados da obra, então não dá para dar fornecedor e item ao comprador sem dar a lista de clientes.
- **Sugestão:** separar "Clientes" de "Fornecedores e itens".

#### A24 - Voltar do navegador precisa de dois toques no cadastro de fornecedor
- **Tipo:** atrito
- **Gravidade:** baixa
- **Onde:** Fornecedores > Editar > botão Voltar do navegador
- **Aconteceu:** o primeiro Voltar não fez nada (a URL continuou /fornecedores/1, sem aviso). O segundo saiu e perdeu o texto digitado (perder o texto já é sabido).

Observação (não é achado): de vez em quando a aba do navegador de teste parava de responder a cliques depois de salvar ou de trocar de usuário. Abrindo uma aba nova, tudo voltava. Como orientado, considerei problema do navegador de teste.

### Números conferidos
- Extrato da fase Muro / 1 - Terraplanagem: saídas 10.321,63 + 10.183,45 + 11.081,51 + 8.660,10 = 40.246,69; entradas 54.333,03; saldo 14.086,34; em aberto 21.264,96; pago 18.981,73 × 10% = 1.898,17. Bate.
- Fluxo do Muro: entradas 54.333,03 + 23.283,90 + 5.586,29 = 83.203,22; saídas 76.950,00; a pagar 43.820,57; caixa 50.073,79. Bate.
- Depois da minha nota (500 kg × 0,82 = 410,00): Cobertura 27.802,83, caixa 49.663,79. Depois da mão de obra 3.250,00: Forro 12.560,48, saídas 80.610,00, caixa 46.413,79. Bate.
- Diálogo Concluir fase (Cobertura): pago 4.265,06 + 4.613,52 + 410,00 = 9.288,58; em aberto 18.514,25. Bate.
- Contas a pagar do Pedro: 16.702,96 + 23.735,54 = 40.438,50. Bate.
- Casa Ribeiro: A receber 65.092,30 = 6.812,30 + 58.280,00. Bate.
- Início: o total de A pagar das em andamento soma 1.403.822,81; o cartão mostra 1.428.555,71 porque inclui as Paralisadas (14.806,48 + 9.926,42 = 24.732,90).

### Dados que eu criei
- Perfis: "Mestre com documentos" (Diário e fotos + Documentos da obra) e "Comprador" (Ver valores + Lançar + Cadastros).
- Usuários: carlos/carlos123 (Campo, Muro de arrimo); ana/ana12345 (Escritório); joao/joao1234 (Mestre com documentos, Muro); pedro/pedro123 (Comprador, Salão paroquial); marta/marta123 (Campo personalizado: Diário e fotos + Documentos, Galpão da padaria).
- Obra Muro de arrimo (id 12):
  - saída nº 20, 18/10/2026, Depósito Central, Cimento portland 500 kg × 0,82 = R$ 410,00, Cobertura, paga, anexo nota-fiscal-deposito.png;
  - saída 18/10/2026, J. Alves, mão de obra, R$ 3.250,00, Forro, paga (pix);
  - diário 18/10/2026, Cobertura, com foto-obra-baldrame.jpg;
  - pendência "Comprar manta asfáltica..." (Cobertura, Carlos, até 22/10/2026), marcada como feita pelo Carlos;
  - foto foto-obra-baldrame.jpg na Galeria > Fotos (enviada pelo Carlos);
  - Área 180,50 m², Observação "Cliente pediu relatório quinzenal", CEI 51.204.33871/02.
- Salão paroquial: saída de teste nº 25 (R$ 1.234,56, data 2027) criada e excluída.
- Fornecedor "Areia & Pedra Souza" (CNPJ 12.345.678/0001-90, repetido de propósito).
- Um CSV foi enviado para Documentos do Muro e depois excluído.

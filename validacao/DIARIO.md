# Diário de validação

## Backlog
| Origem | O que seria | Tamanho |
|---|---|---|
| R1-A9 | Pagamentos: filtros de insumo e fornecedor e colunas Qtd/Unid (o filtro de fase e o fornecedor no analítico já entraram) | pequeno/médio |
| R1-A10 | Avanço físico por fase e projeção "vai fechar em R$ X" (depende da Dúvida 21 do UPDATE.md) | grande |
| R1-A12 / R2-A29 | Celular: botão fixo "+ Lançar", itens da nota em lista vertical, menu "Mais" na barra de baixo | médio |
| R1-A15 | Preço combinado: padrão "só nesta nota" sem popup; "Criar" com um clique, sem o campo em branco durante a pergunta (R3-A9) | pequeno |
| R1-A16 | Aviso "parecido com..." antes de criar item ou fornecedor (a busca por palavras soltas já entrou) | pequeno |
| R2-A7 | Quantidade: selecionar ao clicar de novo; avisar mais de 2 casas | pequeno |
| R2-A13 | "Descartar alterações?" ao fechar formulário alterado | pequeno/médio |
| R2-A15 | Um nome só para a estimativa ("000001" × "viva") | pequeno |
| R2-A21 | Dossiê da obra em PDF; Exportar CSV nos relatórios; orçado e diferença no extrato da fase; Visão do cliente durante a obra (propostas no relatório da rodada 2) | grande |
| R2-A22 | Aviso "alguém alterou esta obra" (versão do registro) quando duas abas mudam o mesmo campo | médio |
| R2-A27 | Tirar fase com gasto: oferecer mover os lançamentos (o motivo já aparece) | pequeno/médio |
| R2-A30 | Lista da fase ordenada por data, com opção de inverter | pequeno |
| R4-A12 | Aviso de taxa de administração acima de 30% | pequeno |
| R4-A7 | Lista do Fluxo com os itens criados na hora na descrição | pequeno |
| R4-A20 | Aviso de nota com data antes do início da obra | pequeno |
| R4-A24 | Voltar do navegador no cadastro de fornecedor com um toque só | pequeno |

### Feito do backlog em 19/10/2026
| Origem | O que entrou | Commit |
|---|---|---|
| Jean 19/10 | Numeração dos lançamentos por obra, entrada e saída na mesma sequência (o Nº 2 é o 2º comprovante da pasta física) | cf31b60 |
| R3-A13/A19 | Permissões configuráveis: perfis editáveis (Administrador, Escritório, Campo e os que o admin criar) e permissões por usuário; Documentos da Galeria com permissão própria; excluir arquivo só quem enviou | f6507f4 |
| R2-A24, R1-A18, R2-A26, R2-A9, R1-A17, R2-A15, R2-A29 | Data no diário; ano de 2000 a 2100 nas datas; aviso de data no futuro e de pagamento antes da nota; boleto em conta a vencer; miniatura das fotos e número da fase no diário; ícones maiores | 8f2c6db |
| R2-A5/A28 | Contas a pagar de todas as obras por vencimento, vencidas em vermelho (relatório, cartão no Início, "A pagar" do topo leva a ele); obra conferida em toda rota pra quem não vê todas | 7e4378f |
| R1-A5, R1-A9, R3-A5 | Material × mão de obra no relatório de Pagamentos, com filtro de fase; tipo na nota sem itens e no item criado na hora; fornecedor no analítico | 974df41 |
| R1-A11 | Pendências da obra, com fase, responsável e prazo | 50a2a37 |
| R1-A16, R3-A18, R3-A8 | Busca por palavras soltas; unidade junto do preço; "inativo" no título do cadastro | 8e78c5e |
| R1-A14, R1-A19, R2-A27 | Obra nova abre na aba Fases; área e R$/m²; aviso da fase mantida aparece | 9aab05a |
| R2-A25 | Semente com obra concluída coerente e primeira fase fechada nas em andamento | aa06c3d |

## Perguntas ao Jean
1. **R2-A3 Pagamento da taxa.** Quando o cliente paga a taxa de administração, como você registra: como uma entrada comum (vai para o caixa da obra), ou como um recebimento separado, que não entra no caixa?

### Respostas do Jean (18/10/2026)
- **R2-A3 Taxa para o cliente:** "acho que pode ser" para mostrar a taxa. Feito em 47eaed7: cartão "Taxa devida" no topo da obra, faixa na Visão do cliente com o valor por fase e linha no extrato da fase concluída. Como registrar o pagamento da taxa ficou sem resposta (pergunta 1 acima).
- **R2-A20 Percentual:** fica como caixa eletrônico, igual ao dinheiro: 10 = 0,10%, 1000 = 10%. Nada a mudar. Digitar "10," continua dando 10%.
- **R2-A25 Concluir a obra:** (c) impedir até tudo estar fechado. Feito em acd6a35. A obra só passa a Concluída com toda fase ativa concluída e nenhuma conta a pagar, e a mensagem diz o que falta. Obra que já estava Concluída não é barrada. O banco semeado tem três assim, e o `semear.js` ainda gera esse caso (backlog).
- **R3-A13/A19 Permissões:** criadas em tempo de uso. O administrador cria perfis ou define as permissões de cada usuário, em vez dos três papéis fixos. Foi para o backlog (abaixo).

### Respostas do Jean (17/10/2026)
- **R1-A2 Taxa:** cada fase escolhe valor fixo OU percentual. A taxa é devida ao **fechar a fase**. O percentual incide **só sobre o que foi pago**.
- **R1-A2 detalhe:** o tipo (fixo ou %) se escolhe **só ao concluir a fase**. Feito em f94c4c9.
- **R1-A6 Recebimentos:** o pagamento do cliente é lançado numa fase, mas o dinheiro é do **caixa da obra**. A tela do Fluxo de caixa **fica como está**. Sobre "quanto falta", pediu minha opinião: entrou o cartão **A receber (previsto)** = orçado + taxa da estimativa − recebido.
- **R1-A3 Digitação:** dinheiro continua como caixa eletrônico (450 = R$ 4,50). Nada a mudar.
- **R1-A8 Rajada:** deixou para mim. Decidido: cada nota recomeça paga hoje, sem vencimento (commit 80a7bac).

---

## Rodada 1 - 17/10/2026
**Missões:** M1 (vazio), M2, M3 (continua). Relatório: [rodada-1/relatorio.md](rodada-1/relatorio.md). Plano: [rodada-1/plano.md](rodada-1/plano.md).
Senha do admin trocada pelo agente para `Jean@Obras2026`.

**Achados:** 19. Alta 6 (A1-A6), média 6 (A7-A12), baixa 7 (A13-A19). Todos os números que o Jean conferiu à mão bateram com o sistema; os erros de número vieram da digitação (A3) e do clique duplo (A1).

**Corrigidos (verificados por mim no navegador, sem rodada 2):**
| Achado | Commit |
|---|---|
| A1 - clique duplo em Salvar duplicava o lançamento | 066588b |
| A7 - observação do pagamento sumia ao editar (e salvar a apagava) | df734c5 |
| A4 - editar saída sem itens abria com 0,00 | 52942be |
| A8 - "Salvar e continuar" levava a observação para a nota seguinte (parcial) | d279539 |
| A13 - Esc na lista fechava o lançamento inteiro | f34b042 |
| A3 - valor dependia do cursor; quantidade "50" virava 0,50 | 149f224 |

**Backlog:** A5, A9, A10, A11, A12, A14-A19 e o ajuste do upload no ambiente.
**Perguntas abertas:** A2 (taxa por fase), A6 (entrada sem fase / a receber), A3 (dinheiro como planilha), A8 (vencimento e Pago na rajada).
**Não procede:** A18, a parte dos "8 meses" (01/10 a 30/06 são 8 meses e 29 dias, regra documentada).
**Ambiente:** a nota fiscal e a foto do baldrame não foram anexadas porque o Playwright não alcança `validacao/arquivos/`; o upload foi testado com outra imagem e funcionou.

**Depois da rodada (17/10/2026):** A8 completado com a decisão acima (80a7bac). Ambiente: `.mcp.json` passa a montar `validacao/arquivos/` no mesmo caminho do host, e as missões e o agente usam `/home/melo/apps/obras_jean/validacao/arquivos/`. Vale depois de reiniciar o Claude Code.
Depois das respostas: **A2** taxa por fase escolhida ao concluir, fixo ou % sobre o pago (f94c4c9); **A6** cartão "A receber (previsto)" no topo da obra. Os dois foram conferidos no navegador com a obra da Marina: Fundação fixo R$ 5.000,00 / 10% de R$ 6.200,00 pagos = R$ 620,00; a receber R$ 346.000,00. A Fundação ficou reaberta, como estava.

---

## Rodada 2 - 18/10/2026
**Missões:** bloco A M1-M3 (vazio, depois continua); bloco B M4-M7 (semeado). Relatório: [rodada-2/relatorio.md](rodada-2/relatorio.md). Plano: [rodada-2/plano.md](rodada-2/plano.md).
Senha trocada pelo agente no bloco A: `Jean@2026` (o banco foi recriado para o bloco B). Usuários criados no B: `carlos`/`carlos123` (campo, Muro de arrimo), `ana`/`ana12345` (escritório).

**Verificação da rodada 1:** A1, A3, A4, A7, A8 ✅. A13 (Esc) ⚠️, porque apagava o texto do fornecedor: virou o A8 desta rodada, corrigido. A2 (taxa ao concluir) ✅. A6 (a receber) ⚠️, porque a conta errava: A1/A17, corrigido.

**Achados:** 32. Alta 4 (A1, A16, A17, A18), média 14, baixa 14. Fora o "A receber", todos os números que o Jean conferiu bateram, incluindo o total das 13 obras (R$ 13.238.171,99) e o extrato da fase 7 da Casa Ribeiro. O Carlos não recebeu dinheiro pela API, mas abria a nota fiscal pelo link (A18).

**Corrigidos (verificados por mim):**
| Achado | Commit |
|---|---|
| A18 - campo abria nota fiscal e foto de outra obra | 74efc91 |
| A1/A17 - a receber previsto fase a fase | 0d078e5 |
| A10 - números do topo atualizam ao salvar estimativa e concluir fase | 190bcf2 |
| A16/A6 - vírgula e valor colado; digitar rápido não perde dígito | a098a3e |
| A19 - extrato com o código de serviço da estimativa | 46f13eb |
| A23 - inativar grava ao confirmar; cadastro novo sem Inativar | 8596e5e |
| A30 - concluir fase não pula para a seguinte | f378505 |
| A11 - concluir fase avisa conta em aberto | a926007 |
| A8 - Esc mantém o texto digitado | 0602167 |
| A12 - anexo pelo nome na edição | fe0f2c6 |
| A22/A15 - obra grava só o que mudou; sem Salvar solto no Diário | 20b9e8c |
| A15 - coluna Fase repetida no analítico | 4a6b15a |

**Backlog:** A5/A28, A7, A9, A13, A14 (já era R1-A15), A15 (resto), A21, A22 (aviso), A24, A26, A27, A29, A30 (ordem).
**Perguntas abertas:** A3 (taxa para o cliente), A20 (percentual como se fala), A25 (concluir obra com fases abertas).
**Não procede:** A2 e A4 (decisões do Jean de 17/10), A31 (`<br />` entre "em" e a data; "2 meses" é a regra documentada), A32 (não reproduzido), "8 meses" do A15.

---

## Rodada 3 - 18/10/2026
**Missões:** bloco A M1-M3 (vazio, depois continua); bloco B M4-M7 (semeado; interrompido por limite de uso e retomado). Relatório: [rodada-3/relatorio.md](rodada-3/relatorio.md). Plano: [rodada-3/plano.md](rodada-3/plano.md).
Senha trocada no bloco A: `Jean@2026`. Bloco B: `carlos`/`carlos123` (campo, Casa Menezes), `ana`/`ana12345` (escritório).

**Verificação da rodada 2:**
- Bloco A: 10 de 11 ✅. A vírgula ficou ⚠️ por causa do Backspace: virou A1, corrigido.
- Bloco B: 7 de 8 ✅. Valores ficaram ⚠️ quando o texto entra de uma vez (A11) e o popup ficou ⚠️ no celular (A12); os dois foram corrigidos.
- A18 da rodada 2 (anexos do campo) ✅.
- A1/A17 da rodada 2 (a receber) ✅, conferido à mão em três obras.

**Achados:** 19. Alta 1 (A11), média 5 (A1, A2, A3, A12, A13), baixa 13. Todos os números conferidos à mão bateram.

**Corrigidos (verificados por mim):**
| Achado | Commit |
|---|---|
| A1 - Backspace depois da vírgula dividia por 100 | 253f722 |
| A2 - inativar/ativar tirava a marca de incompleto | f8644ee |
| A6 - "0" solto ao lado do Celular | 9174437 |
| A3 - pergunta do preço engolia o clique | f11ffd0 |
| A4 - janela de concluir mostra também a taxa com tudo pago | 3725db9 |
| A11 - valor que entra de uma vez ficava 10× menor | fa2dfaf |
| A12 - quantidade perdia dígito; pergunta espera sair dos campos | a58367a |
| A17 - pergunta do preço com foco em "Só nesta nota" | f2c3f46 |
| A16 - CSV com acento no nome | 1793e9e |
| A10/A14 - "em18/10/2026" | 12b8397 |

**Backlog:** A5 (em R1-A9), A8, A9 (em R1-A15), A15 (em R2-A21), A18 (unidade nos preços).
**Perguntas abertas:** A13/A19 (pastas e exclusão do campo; o que o escritório pode), mais as três da rodada 2.
**Não procede:** A7 ("8 meses"), A18 como número (cimento por kg), aba que para de responder (não reproduzido).
**Fim do ciclo pedido (2 rodadas: 2 e 3).** A rodada 3 ainda trouxe 1 alta e 4 médias corrigíveis, e todas foram corrigidas aqui. As correções da rodada 3 ainda não passaram por uma rodada de verificação do agente.

---

## Rodada 4 - 19/10/2026
**Missões:** bloco A M1-M3 (vazio, depois continua); bloco B M4-M7 (semeado; parou no limite de uso e foi retomado). Relatório: [rodada-4/relatorio.md](rodada-4/relatorio.md). Plano: [rodada-4/plano.md](rodada-4/plano.md).
Verificou o feito em 19/10: numeração por obra, permissões configuráveis e o backlog. Senha do admin no bloco A: `Jean@Obras2026`. Usuários do bloco B: carlos (Campo), ana (Escritório), joao (Mestre com documentos), pedro (Comprador, só Salão paroquial), marta (Campo personalizado).

**Verificação:** numeração por obra, pendências, material × mão de obra, contas a pagar, boleto, obra nova em Fases, área, taxa no topo/Visão/extrato, concluir obra, fase mantida, perfis, permissões próprias, Campo, último administrador e a semente ✅. Parciais, corrigidos: diário aceitava data futura (A2), data da obra sem faixa de ano (A1), busca "cpii" nas listas (A6), relatórios do Comprador (A15).

**Achados:** 24. Alta 1 (A15), média 7, baixa 16. Todos os números conferidos à mão bateram nos dois blocos, inclusive o "A receber" antes e depois de concluir a Fundação (312.500,75), o material × mão de obra da Fundação (7.650,75 / 2.800,00) e o extrato da Terraplanagem do Muro.

**Corrigidos (verificados por mim):**
| Achados | Commit |
|---|---|
| A1, A2, A4, A5, A6, A8, A9, A10, A14 (endereço) | 0dda160 |
| A15 (+ lista de fornecedores recortada), A17 (explicação), A18, A21, A22, cartão do Início | 203222c |

**Backlog:** A7, A12, A13 (em R1-A15), A19 (em R1-A12), A20 (antes do início), A24.
**Não procede:** A3 e A16 (decisões do Jean), A11 (um caractere colado é igual a uma tecla), A17 (número; a regra está certa), A20 (futuro só avisa, por decisão), A23 (o perfil decide).

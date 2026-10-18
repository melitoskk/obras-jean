# Diário de validação

## Backlog
| Origem | O que seria | Tamanho |
|---|---|---|
| R1-A5 | Escolher o tipo (material / mão de obra / equipamento) ao criar o item no lançamento; relatório e filtro "Por tipo" com fase | médio |
| R1-A9 | Relatório de pagamentos com filtros combinados (fase + insumo + fornecedor) e colunas Qtd/Unid | médio |
| R1-A10 | Avanço físico por fase e projeção "vai fechar em R$ X" (depende da Dúvida 21 do UPDATE.md) | grande |
| R1-A11 | Pendências: status aberta/feita, fase, responsável | médio |
| R1-A12 | Celular: botão fixo "+ Lançar"; itens da nota em lista vertical | médio |
| R1-A14 | Ao salvar obra nova, abrir direto na aba Fases | pequeno |
| R1-A15 | Preço combinado: padrão "só nesta nota" sem popup; "Criar" com um clique | pequeno |
| R1-A16 | Busca do catálogo por palavras soltas; aviso "parecido com..." antes de criar | pequeno |
| R1-A17 | Miniatura da foto no diário e foto do diário contando na Galeria | pequeno |
| R1-A18 | Validar faixa de ano nas datas (ex.: 2000-2100) | pequeno |
| R1-A19 | Área da obra (m²) e R$/m² | pequeno |
| R2-A5/A28 | Contas a pagar de todas as obras por vencimento (Início + clique no cartão A pagar), vencidas em vermelho | médio |
| R2-A7 | Quantidade: selecionar ao clicar de novo; avisar mais de 2 casas | pequeno |
| R2-A9 | Campo "boleto / linha digitável" para conta a vencer | pequeno |
| R2-A13 | "Descartar alterações?" ao fechar formulário alterado | pequeno/médio |
| R2-A15 | Fases com número no Diário; um nome só para a estimativa ("000001" × "viva") | pequeno |
| R2-A21 | Dossiê da obra em PDF; Exportar CSV nos relatórios; orçado e diferença no extrato da fase; Visão do cliente durante a obra (propostas no relatório) | grande |
| R2-A22 | Aviso "alguém alterou esta obra" (versão do registro) quando duas abas mudam o mesmo campo | médio |
| R2-A24 | Data no Diário de obra (padrão hoje) | pequeno |
| R2-A26 | Aviso de data no futuro e de pagamento antes da nota | pequeno |
| R2-A27 | Tirar fase com gasto: dizer o motivo e oferecer mover os lançamentos | pequeno/médio |
| R2-A29 | Celular: alvos de 40 px, menu "Mais" na barra (junto com R1-A12) | médio |
| R2-A30 | Lista da fase ordenada por data, com opção de inverter | pequeno |

## Perguntas ao Jean
1. **R2-A3 Taxa para o cliente.** Hoje a taxa devida só aparece no relatório de taxa. Você quer que ela apareça (a) no topo da obra, (b) na Visão do cliente e no extrato da fase? E quando o cliente paga a taxa, como você registra: como uma entrada comum, ou como um recebimento separado, que não vai para o caixa da obra?
2. **R2-A20 Percentual.** O dinheiro continua como caixa eletrônico (450 = R$ 4,50). E o percentual: quando você digita "10" na taxa, deve dar 10% (como se fala) ou 0,10% (como o dinheiro)? Hoje dá 0,10%. Digitar "10," já dá 10%.
3. **R2-A25 Concluir a obra.** Hoje dá para marcar a obra como Concluída com fases abertas e contas a pagar. Ao concluir a obra, o sistema deve (a) só avisar o que está aberto, (b) pedir para concluir cada fase com a taxa, ou (c) impedir até tudo estar fechado?

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

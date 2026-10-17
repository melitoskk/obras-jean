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

## Perguntas ao Jean
Nenhuma em aberto.

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

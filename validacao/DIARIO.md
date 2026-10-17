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
| R1-amb | `.mcp.json`: montar o projeto no mesmo caminho do host para o upload alcançar `validacao/arquivos/` (exige reiniciar o Claude Code) | pequeno |

## Perguntas ao Jean
1. **Taxa de administração (R1-A2).** Hoje é um % único para a obra toda, sobre o custo de cada fase (decidido em 03/10). No seu contrato com a Marina é R$ 5.000 fixos na fundação e 10% nas outras fases. Você precisa escolher, por fase, entre valor fixo e percentual? O fixo é devido de uma vez quando a fase começa, quando termina ou proporcional ao gasto? E a taxa deve ser calculada sobre o que foi lançado ou só sobre o que já foi pago?
2. **Recebimentos do cliente (R1-A6).** Hoje toda entrada do cliente precisa cair numa fase. Você prefere poder lançar a entrada "para a obra toda"? E quer cadastrar o valor do contrato (custo + taxa) para o sistema mostrar "quanto o cliente ainda deve"?
3. **Digitação de valor (R1-A3).** Os campos de dinheiro funcionam como caixa de banco: digitar 450 dá R$ 4,50, e para R$ 450,00 se digita 45000. A quantidade já mudou ("50" = 50 sacos). Quer que o dinheiro também funcione como planilha (450 = R$ 450,00, centavos com vírgula)?
4. **"Salvar e continuar" (R1-A8).** Na rajada de notas o sistema mantém fornecedor, vencimento e o "Pago" da nota anterior. Uma nota em aberto seguida de uma paga pode sair errada se ninguém reparar. Prefere que vencimento e "Pago" voltem ao padrão (paga hoje, sem vencimento) a cada nota?

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

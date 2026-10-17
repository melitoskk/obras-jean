# Rodada 1 - plano de ação

Relatório: [relatorio.md](relatorio.md). Missões M1, M2, M3 (banco vazio, depois continua).
Os números conferidos pelo Jean (saídas, saldo, caixa, a pagar, fase) batem com o sistema.

| Achado | Causa (arquivo:linha) | Decisão | Por quê |
|---|---|---|---|
| A1 - clique duplo duplica lançamento | `web/src/components/MovimentacaoPanel.jsx` `gravar()` sem trava; botões sem `disabled` | **corrigir agora** (066588b) | Bug que gera número errado. Trava por ref + botão desabilitado enquanto salva. Verificado: dblclick = 1 POST. |
| A2 - taxa de adm só em % único | `UPDATE.md` §4, decidido em 03/10/2026: "% único por estimativa" | **perguntar ao Jean** | É regra de negócio decidida; mudar para fixo/% por fase é decisão dele. |
| A3 - campos de valor/qtd mudam o que se digita | `web/src/ui/Numeros.jsx`: corrida lia o TEXTO, então o dígito entrava onde estava o cursor; quantidade também era corrida ("50" = 0,50) | **corrigir agora** (149f224) | Gerou nota de R$ 1,9 mi sem aviso. Valor/percentual continuam corridos (regra do projeto), mas pela tecla: dígito sempre no fim, focar seleciona tudo. Quantidade passa a ler o número digitado (`lerQtd`, testado em `format.test.mjs`). Se o valor também deve ser "450 = 450", é pergunta ao Jean. |
| A4 - editar saída sem itens abre com 0,00 | `MovimentacaoPanel.jsx:51` `mostrarItens = tipo === 'saida' \|\| ...` forçava a grade na edição | **corrigir agora** (52942be) | Na edição abre como foi lançada. Salvar não zerava (o `gravar` recusava valor 0), mas a tela mentia. Verificado. |
| A5 - item criado na hora vira "Materiais"; nenhum relatório separa material × MO | `api/server.js:285` cria insumo sem tipo; relatórios não agrupam por tipo | **backlog** | Escolher o tipo no "Criar" do item + relatório/filtro "Por tipo" com fase. Médio (1-2 dias). |
| A6 - entrada obrigada a ter fase; não há "quanto falta" | `MovimentacaoPanel.jsx:18-20` "A fase é obrigatória nos dois" (regra) | **perguntar ao Jean** | Fase da entrada é regra do modelo de caixa por fase; "valor do contrato" não existe no sistema. |
| A7 - observação do pagamento some ao editar | `api/rotas/orcamento.js:387` o GET do fluxo não trazia `s.pago_obs` | **corrigir agora** (df734c5) | Pior que o relatado: ao editar e salvar, o campo vazio APAGAVA a observação gravada. Teste em `fluxo.test.mjs`. |
| A8 - "Salvar e continuar" herda pago/vencimento/obs | `MovimentacaoPanel.jsx` `limpar()`: manter fornecedor, vencimento e Pago é decisão escrita no código | **corrigir agora** (d279539) a observação; **perguntar ao Jean** vencimento e Pago | A observação é da nota, não da rajada. Vencimento/Pago foram mantidos de propósito. |
| A9 - relatório sem filtro fase+insumo+fornecedor e sem quantidade | `api/rotas/relatorio.js` (Pagamentos por insumo) | **backlog** | Filtros combinados + colunas Qtd/Unid. Médio. |
| A10 - acima/abaixo do orçado sem avanço físico | `UPDATE.md` Dúvida 21: medição física não tem tela | **backlog** | % de avanço por fase + projeção. Grande (depende da Dúvida 21). |
| A11 - não existe pendência | `PROJETO-v2.md:31` cita Pendências como preservadas, mas não há tela nem tabela | **backlog** | Módulo novo: pendência com status, fase e responsável. Médio. |
| A12 - celular: botão de lançar longe, itens cortados | layout do Fluxo de caixa | **backlog** | Botão fixo "+ Lançar" e itens em lista vertical no celular. Rever com a M5. |
| A13 - Esc fecha o modal inteiro | `web/src/ui/Registro.jsx:33` ouvia Esc na janela sem ver se o Combobox já tinha usado | **corrigir agora** (f34b042) | Perdia o lançamento digitado. Esc com a lista aberta fecha só a lista. Verificado. |
| A14 - depois de criar a obra o modal fecha | `ObraPanel.jsx` | **backlog** | Abrir a obra na aba Fases ao salvar. Pequeno. |
| A15 - popup de preço combinado a cada item | `ItensEditor.jsx` `conferirPreco` | **backlog** | Padrão "só nesta nota" sem perguntar; criar com 1 clique. Pequeno. |
| A16 - busca do catálogo não acha "CP-II" em "cp ii" | `web/src/ui/Combobox.jsx` filtro por substring | **backlog** | Busca por palavras soltas e "parecido com..." antes de criar. Pequeno. |
| A17 - foto do diário sem miniatura e fora da Galeria | `DiarioObra.jsx`, `GaleriaObra.jsx` (pasta `dia_a_dia` não conta como Fotos) | **backlog** | Miniatura no diário e foto do diário na Galeria. Pequeno. |
| A18 - ano 62027 aceito; "8 meses" | `duracaoEntre` em `web/src/lib/format.js` | **backlog** (ano) / **não procede** (meses) | 01/10 a 30/06 são 8 meses e 29 dias; a regra "mês só conta quando o dia já passou" é documentada e testada. Validar faixa de ano é pequeno. |
| A19 - obra sem área (m²) | cadastro da obra | **backlog** | Campo de área + R$/m². Pequeno. |
| Ambiente - upload não alcança `/validacao/arquivos/` | `.mcp.json`: o Playwright só aceita arquivos em `/validacao/capturas` e na raiz do projeto (caminho do host, que não existe no container) | **corrigir no ambiente** | Montar o projeto no mesmo caminho do host (`-v /home/melo/apps/obras_jean:/home/melo/apps/obras_jean:ro`) e passar os arquivos por esse caminho. Exige reiniciar o Claude Code. |

## Verificação feita por mim (Playwright, depois das correções)
- Clique duplo em "Salvar e fechar": 1 POST /api/saidas.
- S-000005 (sem itens) abre com "Itens" desmarcado e 450,00.
- Observação "pix" aparece na edição.
- Esc com a lista de fase/fornecedor aberta: o modal continua.
- Valor: focar e digitar 12345 → 123,45; cursor no meio + dígito → entra no fim.
- Quantidade: "50" → 50,00; "8,5" → 8,50.
- A saída de teste (R$ 123,45) foi apagada do banco.

Testes da API: 11/11. `format.test.mjs`: ok. Build do front: ok.

# Rodada 2 - plano de ação

Relatório: [relatorio.md](relatorio.md). Bloco A: M1, M2, M3 (banco vazio, depois continua). Bloco B: M4, M5, M6, M7 (banco semeado).
Verificação da rodada 1: A1, A3, A4, A7 e A8 corrigidos. A13 (Esc) ficou parcial e virou o A8 desta rodada. A2 (taxa ao concluir) e A6 (a receber) funcionam, mas o cartão errava a conta (A1/A17).
Números que o Jean conferiu à mão: todos bateram, menos o "A receber (previsto)".

| Achado | Causa (arquivo:linha) | Decisão | Por quê |
|---|---|---|---|
| A1 / A17 - "A receber (previsto)" ignora a taxa da fase concluída e o que passou do orçado | `api/rotas/relatorio.js` `aReceberPrevisto`: orçado total × % da estimativa, sem olhar fase | **corrigir agora** (0d078e5) | Número errado. A conta passa a ser feita fase a fase. Fase aberta: o maior entre orçado e gasto, mais o % da estimativa. Fase concluída, ou obra concluída: o gasto mais a taxa escolhida ao concluir (no percentual, sobre o gasto todo). Teste em `relatorio.test.mjs`. Conferido: Casa Ribeiro 11.352,09 e Reforma da fachada 24.377,70, iguais à conta do Jean. A Marina passa a dar 322.950,75, porque o orçado da Fundação concluída (45.000) não vem mais. |
| A18 - campo abre nota fiscal e foto de outra obra pelo link | `api/server.js` `GET /api/anexo/:ref` só checava o papel, não o dono do arquivo | **corrigir agora** (74efc91) | Vazamento de dado. `podeAnexo` (auth.js): o campo abre só arquivo de obra dele ou a capa da obra. Teste em `usuario.test.mjs`. Conferido com o Carlos: a nota da S-000315 dá 404, a foto da obra dele 200 e a da obra 3 dá 404. |
| A16 - "1.234,5" vira 123,45 | `web/src/ui/Numeros.jsx`: a corrida ignorava a vírgula e o colado | **corrigir agora** (a098a3e) | Número errado. O valor colado é lido como número escrito (`lerColado`). Na digitação, a vírgula separa reais de centavos (`teclaCorrida`). Sem vírgula continua o caixa eletrônico (450 = 4,50), como o Jean decidiu. Testes em `format.test.mjs`. Conferido no navegador. |
| A6 - primeiro dígito some ao digitar rápido | `Numeros.jsx`: a seleção do foco chega um quadro depois (rAF), e o 2º dígito achava tudo selecionado e recomeçava | **corrigir agora** (a098a3e) | A primeira tecla depois do foco conta como "tudo selecionado" e a seleção atrasada não acontece mais. Conferido: 3500000 sem pausa = 35.000,00. |
| A19 - extrato da fase com código de serviço do catálogo | `relatorio.js` `extratoFase` usava `servico_catalogo.codigo` | **corrigir agora** (46f13eb) | Documento do cliente. Agora usa o código e o nome da estimativa viva, como o Fluxo. Teste. Conferido: S-000012 "1.1 Tapume". |
| A23 - Inativar fornecedor confirma mas não grava | `FornecedorPanel.jsx` / `ClientePanel.jsx`: inativar só mudava o rascunho | **corrigir agora** (8596e5e) | A confirmação "some da lista" mentia. Agora confirmar já salva. Junto: cadastro novo não mostra Inativar (parte do A31). |
| A10 - cartões do topo não atualizam | `ObraPanel.jsx`: Estimativa e Fases não chamavam o recarregar da página | **corrigir agora** (190bcf2) | Também ao concluir e reabrir fase. |
| A30 - concluir fase pula para a seguinte, que some das opções | `FluxoObra.jsx`: sem `#f` no endereço, a ativa era "a primeira não concluída" | **corrigir agora** (f378505) a sugestão / **não procede** a ordem da lista | A fase concluída fica fixa até a pessoa escolher. Conferido: a fase 2 aparece. A lista vai pela ordem de lançamento, de propósito (comentário em `ExtratoFase.jsx`). No semeado, o lançamento não acompanha a data da nota. Ordenar por data com opção de inverter fica no backlog. |
| A11 - concluir com conta em aberto não avisa | diálogo de `FluxoObra.jsx` | **corrigir agora** (a926007) | Aviso "Ainda há R$ X em aberto nesta fase, que entram na taxa quando forem pagos". Não trava, porque concluir é marca (§11.2). |
| A8 - Esc na lista de fornecedor apaga o texto | `web/src/ui/Combobox.jsx`: o Esc tirava o foco, e o campo voltava a mostrar a seleção | **corrigir agora** (0602167) | Com a lista aberta, o Esc só fecha a lista. Com ela fechada, sai do campo como antes. |
| A12 - anexo aparece como "anexo" | `MovimentacaoPanel.jsx:38` | **corrigir agora** (fe0f2c6) | O nome sai do ref (`<tempo>__<nome>`). |
| A22 - duas abas: a última apaga a outra | `ObraPanel.jsx` `salvar` mandava o formulário inteiro | **corrigir agora** (20b9e8c), parcial / **backlog** o aviso | Agora grava só o que mudou: o CEI da aba A não volta mais vazio. Se as duas abas mudarem o mesmo campo, a última ainda ganha. O aviso "alguém alterou esta obra" (versão do registro) fica no backlog. |
| A15 - detalhes | vários | **corrigir agora** o Salvar solto no Diário/Galeria (20b9e8c) e a coluna Fase repetida (4a6b15a) / **backlog** fases sem número no Diário, nome "Estimativa 000001" × "viva" / **não procede** "8 meses" | 01/10 a 30/06 são 8 meses e 29 dias, regra documentada (rodada 1, A18). |
| A2 - taxa por fase não se configura no orçamento | decisão do Jean em 17/10/2026: "o tipo se escolhe só ao concluir" | **não procede** | Regra decidida. A previsão já usa a taxa escolhida (A1). |
| A3 - taxa devida não aparece na obra nem para o cliente; não se registra o recebimento | sem tela | **perguntar ao Jean** | Pergunta 1 abaixo. |
| A4 - entrada obrigada a ter fase | decisão do Jean (rodada 1, A6): o Fluxo fica como está | **não procede** | Já decidido. |
| A5 / A28 - não há lista de contas a pagar por vencimento; vencida não se destaca | sem tela | **backlog** | Lista de títulos em aberto de todas as obras por vencimento (Início + clique no cartão A pagar), com "vencida há N dias" em vermelho. Médio. |
| A7 - clicar de novo na quantidade não seleciona; casas a mais cortadas | `QtdInput` é campo de texto comum | **backlog** | Pequeno. Selecionar em todo clique tira o jeito de pôr o cursor no meio, então precisa pensar. Avisar quando o número tem mais de 2 casas. |
| A9 - observação só com Pago marcado | `MovimentacaoPanel.jsx`: `pago_obs` é do pagamento | **backlog** | Campo "boleto / linha digitável" para conta a vencer. Pequeno. |
| A13 - fechar edição alterada não pergunta | `Registro.jsx` | **backlog** | "Descartar alterações?" quando o formulário mudou. Pequeno/médio (todos os cadastros). |
| A14 - confirmação dupla para criar fornecedor/item | `Combobox.jsx` `pendente` | **backlog** | Já está no backlog (rodada 1, A15). |
| A20 - percentual: "10" vira 0,10% | `PctInput` é corrida, como o dinheiro | **perguntar ao Jean** | Pergunta 2 abaixo. Com o A16, digitar "10," já dá 10,00%. |
| A21 - sem dossiê final, sem exportar relatório, extrato sem orçado | sem tela | **backlog** | Dossiê da obra em PDF (capa, orçado × realizado, extrato e taxa de cada fase, fotos, diário), Exportar CSV nos relatórios, orçado e diferença no extrato. Grande. Propostas para a Visão do cliente estão no relatório (A21). |
| A24 - diário sem campo de data | `DiarioObra.jsx` grava a hora de agora | **backlog** | Campo Data (padrão hoje). Pequeno. |
| A25 - obra Concluída com fases abertas e contas a pagar | `ObraPanel.jsx`: situação é campo livre | **perguntar ao Jean** | Pergunta 3 abaixo. |
| A26 - data no futuro aceita sem aviso | `MovimentacaoPanel.jsx` | **backlog** | Aviso (não trava) quando a data passa de hoje + 7 dias e quando o pagamento é antes da nota. Pequeno. |
| A27 - tirar fase com gasto volta em silêncio | `FasesCatalogoPanel.jsx` | **backlog** | Dizer "Forro tem 3 lançamentos" e oferecer mover. Pequeno (mensagem) / médio (mover). |
| A29 - celular: alvos de 13 px, barra cortada, abas roladas | layout | **backlog** | Junta com a rodada 1, A12: alvos de 40 px, menu "Mais" na barra. Médio. |
| A31 - "em18/10/2026"; "2 meses" para 90 dias | `VisaoCliente.jsx:72` / `Relatorios.jsx:457` têm `<br />` entre os dois | **não procede** | Na tela e na impressão a data fica na linha de baixo; o leitor juntou o texto. "2 meses" para 28/07 a 26/10 é a mesma regra documentada do "8 meses". O Inativar em cadastro novo foi corrigido no A23. |
| A32 - aba parou de responder a cliques | não reproduzido | **não procede** (não reproduzido) | Comigo aconteceu uma vez, e era um modal ainda aberto por cima: o "Pra qual fase" continua aberto quando só o hash do endereço muda. Pode ter sido o mesmo. Fica de olho na rodada 3. |

## Perguntas ao Jean
1. **Taxa de administração para o cliente (A3).** Hoje a taxa devida só aparece no relatório de taxa. Você quer que ela apareça (a) no topo da obra, (b) na Visão do cliente e no extrato da fase? E quando o cliente paga a taxa, como você registra: como uma entrada comum, ou como um recebimento separado, que não vai para o caixa da obra?
2. **Percentual (A20).** O dinheiro continua como caixa eletrônico (450 = R$ 4,50). E o percentual: quando você digita "10" na taxa, deve dar 10% (como se fala) ou 0,10% (como o dinheiro)? Hoje dá 0,10%. Digitar "10," já dá 10%.
3. **Concluir a obra (A25).** Hoje dá para marcar a obra como Concluída com fases abertas e contas a pagar. Ao concluir a obra, o sistema deve (a) só avisar o que está aberto, (b) pedir para concluir cada fase com a taxa, ou (c) impedir até tudo estar fechado?

## Verificação feita por mim (API e Playwright)
- Carlos (campo): nota fiscal da saída 404, foto da obra dele 200, foto de outra obra 404.
- `/api/obras`: Casa Ribeiro a receber 11.352,09 e Reforma da fachada 24.377,70, iguais às contas do Jean.
- Valor: "3500000" sem pausa = 35.000,00; "1.234,5" digitado = 1.234,50; "450" = 4,50; "12,34" + 3 backspaces = 0,12; colar "1.234,5" = 1.234,50 e "1234" = 1.234,00.
- Extrato fase 1 da Casa Ribeiro: S-000012 "1.1 Tapume".
- Inativar fornecedor: o PATCH sai na confirmação (o fornecedor foi reativado depois).
- Concluir a fase 1 do Muro sem `#f` no endereço: as opções trazem a fase 2. A fase foi reaberta depois.
- Aviso de conta em aberto aparece no diálogo de concluir.
- Esc com a lista do fornecedor aberta mantém o texto e o lançamento.
- Salvar a obra manda só `observacao` quando só ela mudou. O Diário não tem mais o Salvar do cadastro.

Testes da API: 11/11. `format.test.mjs`: ok. Build do front: ok.

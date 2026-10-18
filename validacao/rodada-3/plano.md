# Rodada 3 - plano de ação

Relatório: [relatorio.md](relatorio.md). Bloco A: M1, M2, M3 (banco vazio, depois continua). Bloco B: M4, M5, M6, M7 (banco semeado). O bloco B foi interrompido por limite de uso e retomado.
Verificação da rodada 2:
- Bloco A: 10 de 11 ✅. A vírgula ficou ⚠️ por causa do Backspace (A1).
- Bloco B: 7 de 8 ✅. Valores ficaram ⚠️ quando o texto entra de uma vez (A11), e o popup ficou ⚠️ no celular (A12).

Números conferidos à mão: todos bateram, nos dois blocos. Entre eles:
- o "A receber (previsto)" da Marina antes e depois de concluir a Fundação (311.400,75);
- a Reforma da fachada (24.377,70);
- a Casa Ribeiro com duas fases concluídas (13.731,45);
- a Casa Menezes depois de lançar pelo celular;
- o total das 13 obras (13.238.171,99).

| Achado | Causa (arquivo:linha) | Decisão | Por quê |
|---|---|---|---|
| A11 - valor que entra de uma vez fica 10× menor ("1.234,5" → 123,45) | `web/src/ui/Numeros.jsx`: o texto que não vem por tecla caía no `onChange`, que só junta dígitos | **corrigir agora** (fa2dfaf) | Número errado. Atinge preenchimento automático, ditado e o teclado do Android, que não manda a tecla. Agora o `beforeinput` trata: 1 caractere segue a corrida; texto inteiro se lê como número escrito, como o colar. Conferido: `1.234,5` e `1234,5` = 1.234,50; tecla sem `key` com 450 = 4,50 e ",7" = 450,70. Consequência: "450" que entra inteiro vale 450,00, como já valia no colar. |
| A1 - Backspace depois da vírgula divide por 100 | `web/src/lib/format.js` `teclaCorrida`: apagar com 0 casas "desfazia a vírgula" | **corrigir agora** (253f722) | Depois da vírgula, o Backspace só apaga dígito. Testes em `format.test.mjs`: "1.234,5" + 2 Backspaces = 123,00. |
| A12 - celular: a pergunta do preço abre na quantidade e come dígito | duas causas: (1) `QtdInput` tinha a mesma corrida da seleção do A6 da rodada 2, e "10" virava "0" mesmo sem popup (reproduzido); (2) a pergunta abria ao sair do valor | **corrigir agora** (a58367a) | O primeiro caractere depois do foco seleciona antes de entrar. A pergunta espera o foco sair para algo que não é campo de digitação. Conferido: valor → quantidade "10" = 10, sem pergunta; clicar no Pago muda o Pago e a pergunta vem depois. Ao clicar direto em Salvar a nota salva e a pergunta não aparece (vale "só nesta nota"). |
| A3 - a pergunta do preço engole o clique seguinte | `ItensEditor.jsx`: abria no `blur`, que vem no mousedown | **corrigir agora** (f11ffd0) | Espera o clique acabar. Conferido: "Adicionar linha" acrescenta a linha e a pergunta vem depois. |
| A17 - a pergunta vem com o foco em "Passa a ser o preço de…" | `web/src/ui/Confirm.jsx`: `autoFocus` sempre no confirmar | **corrigir agora** (f2c3f46) | Um Enter mudava o preço combinado. `focoNoCancelar` só nessa pergunta. Conferido. |
| A2 - inativar/ativar tira a marca "incompleto" | `api/server.js` PATCH de fornecedor e cliente punha `incompleto=0` sempre | **corrigir agora** (f8644ee) | Inativar/ativar manda só `ativo`, e o servidor só tira a marca quando chega outro campo. Conferido pela API: (0,1) → (1,1) → com CNPJ (1,0). |
| A4 - "10%" com dois números (620 na janela, 1.045,08 no A receber) | diálogo de `FluxoObra.jsx` | **corrigir agora** (3725db9) | A janela mostra também "com tudo pago, R$ 1.045,08 (é o que o A receber previsto já conta)". Lembrar o valor fixo depois de reabrir com % fica de fora: o banco guarda uma regra só. |
| A6 - "0" solto ao lado do Celular | `CampoTelefone.jsx`: `{marcado && …}` com `marcado = 0` | **corrigir agora** (9174437) | Visto na captura. |
| A16 - CSV perde o acento no nome | `api/csv.js` trocava tudo que não é ASCII por "_" | **corrigir agora** (1793e9e) | `filename*` em UTF-8 + reserva sem acento. Conferido: `Galpão da padaria - ampliação.csv`. |
| A10 / A14 - "em18/10/2026" | `<br />` sem espaço: na tela quebra a linha, mas no texto copiado as palavras grudam | **corrigir agora** (12b8397) | Terceira vez que aparece. Um espaço antes do `<br />` não muda a tela. |
| A13 - o campo vê, baixa e exclui contrato e cronograma; exclui fotos dos outros | Galeria: o campo tem todas as pastas (`ROTAS_CAMPO`), e `arquivo` não tem autor | **perguntar ao Jean** | Pergunta 4 abaixo. |
| A19 - escritório conclui/reabre fase e define taxa | `auth.js`: escritório pode tudo, menos usuários | **perguntar ao Jean** | Junto com a pergunta 4. |
| A5 - analítico sem fornecedor | `Relatorios.jsx` | **backlog** | Junta com R1-A9 (filtros combinados + colunas). |
| A8 - cliente inativo sem etiqueta | `ClientePanel.jsx` | **backlog** | Etiqueta "Inativo" no título. Pequeno. |
| A9 - campo em branco durante "Criar…?" | `Combobox.jsx` `pendente` | **backlog** | Junta com R1-A15 (criar com um clique). |
| A15 - extrato de fase concluída sem a taxa | `relatorio.js` `extratoFase` | **backlog** | Junta com R2-A21 (orçado e taxa no extrato). |
| A18 - três preços para o mesmo item | o cimento do semeado é por **quilo** (base 0,78/kg, combinado 0,74/kg); o 38,90 é o preço do saco que o próprio agente lançou | **não procede** (número) / **backlog** | As contas estão certas. Mostrar a unidade junto dos preços ("R$ 0,78/kg") evitaria a confusão. Pequeno. |
| A7 - "8 meses" | regra de mês cheio, documentada | **não procede** | Mesma resposta da rodada 1. |
| Aba que para de responder | não reproduzido | **não procede** | Mesmo padrão da rodada 2 (abrir pelo endereço, download, 404). Nada aponta para o sistema. |

## Pergunta nova ao Jean
4. **O que o mestre de obras e o escritório podem (A13, A19).**
   - O mestre (campo) hoje vê todas as pastas da Galeria, inclusive Contrato e Cronograma físico-financeiro, que têm valores. Quais pastas ele deve ver: só Fotos, Projetos e Diário?
   - Ele também pode excluir arquivo e foto que outra pessoa lançou. Deve excluir só o que ele mesmo lançou, como no diário?
   - O escritório pode concluir e reabrir fase e escolher a taxa. Fica assim, ou isso é só seu?

## Verificação feita por mim (Playwright e API)
- Valor: `1.234,5`, `1234,5`, `1234.56` e `R$ 1 234,56` entrando de uma vez dão 1.234,50 / 1.234,50 / 1.234,56 / 1.234,56. Digitado, `1.234,5` = 1.234,50, e 2 Backspaces = 123,00. Teclado sem tecla: 450 = 4,50.
- Quantidade "10" logo depois do valor = 10, sem pergunta. Pago muda e a pergunta vem depois. A pergunta abre com o foco em "Só nesta nota".
- Concluir no %: a janela mostra 620,00 pago e "com tudo pago, R$ 1.045,08".
- Fornecedor incompleto: inativar → (0,1), ativar → (1,1).
- CSV: `filename*=UTF-8''Galp%C3%A3o%20da%20padaria…`.

Testes da API: 11/11. `format.test.mjs`: ok. Build do front: ok.

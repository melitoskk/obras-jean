# Rodada 4 - plano de ação

Relatório: [relatorio.md](relatorio.md). Bloco A: M1, M2, M3 (banco vazio, depois continua). Bloco B: M4, M5, M6, M7 (banco semeado; parou no limite de uso e foi retomado).
O que a rodada verificou: o que foi feito em 19/10/2026 - numeração por obra, permissões configuráveis e os itens do backlog. Nos dois blocos todos os números que o Jean conferiu à mão bateram. Nenhuma resposta da API trouxe dinheiro para quem não devia.

| Achado | Causa (arquivo:linha) | Decisão | Por quê |
|---|---|---|---|
| A15 - Comprador vê R$ 0,00 em Pagamentos e no Extrato do credor | `api/auth.js` `exigirObra` recusava com 403 o relatório de "todas as obras" de quem não vê todas; a tela mostrava a lista vazia | **corrigir agora** (203222c) | Número errado na tela. Agora esses dois relatórios passam e recortam pelas obras da pessoa. Teste em `relatorio.test.mjs`. Conferido como Pedro: Pagamentos R$ 253.357,77, só do Salão paroquial. Na revisão achei o mesmo furo na lista de fornecedores (total comprado de todas as obras); ela agora conta só as obras visíveis e esconde o total de quem não vê valores. |
| A1 - data fim da obra aceita o ano 62207 | `server.js` POST/PATCH `/api/obras` não validavam data | **corrigir agora** (0dda160) | A mesma `dataValida` dos lançamentos. Conferido pela API. |
| A2 - diário aceita data no futuro | só o `max` no campo | **corrigir agora** (0dda160) | O servidor recusa data do diário depois de hoje. |
| A4 - unidade do item não aparece na nota | `ItensEditor.jsx` | **corrigir agora** (0dda160) | A unidade do cadastro fica ao lado da quantidade ("Quilos"). Filtros por insumo e fornecedor no Pagamentos continuam no backlog (R1-A9). |
| A5 - responder a pergunta do preço apaga o texto do item seguinte | `ui/Combobox.jsx`: ao perder o foco, o texto não escolhido sumia | **corrigir agora** (0dda160) | O texto digitado e não escolhido fica, em cinza, até escolher ou apagar. Conferido. |
| A6 - "cpii" não acha na tela Itens | as listas (Itens, Clientes, Fornecedores, Obras) usavam o filtro antigo | **corrigir agora** (0dda160) | `casaBusca` nas listas também. |
| A8 - ano fora da faixa só diz "data inválida" | mensagem do servidor | **corrigir agora** (0dda160) | "data inválida (dia que exista, ano de 2000 a 2100)". |
| A9 - depois da recusa de concluir, o combo fica em "Concluída" | `ObraPanel.jsx` | **corrigir agora** (0dda160) | A situação volta à gravada. Conferido. |
| A10 - foto do diário na Visão do cliente com a data do envio | `rotas/visao.js` | **corrigir agora** (0dda160) | Usa o dia do registro do diário. |
| A14 - detalhes | vários | **corrigir agora** o `?aba=fases` que ficava no endereço (0dda160) / **não procede** as fases sem número no filtro do Pagamentos (o filtro é pelo nome, junta a fase de todas as obras) / **backlog** os outros | |
| A16 - não dá para corrigir um dígito no meio do valor | regra do campo de dinheiro: o dígito entra sempre no fim (rodada 1, A3) e o Jean confirmou o caixa eletrônico | **não procede** | Decisão já tomada. |
| A17 - "A receber" não fecha com a "Taxa devida" ao lado | regra de `aReceberPrevisto`: na fase concluída no %, a previsão conta a taxa sobre tudo o que foi lançado (o em aberto vai ser pago) | **não procede** (número) / **corrigir agora** a explicação (203222c) | A conta está certa pela regra. A legenda do cartão ganhou a conta por extenso ao passar o mouse. |
| A18 - CNPJ repetido aceito | `server.js` PATCH `/api/fornecedores` | **corrigir agora** (203222c) | Recusa com o nome de quem já tem o CNPJ. Conferido pela API. |
| A21 - depois de trocar de usuário, cai na tela do anterior | sair não limpava o endereço | **corrigir agora** (203222c) | Sair volta para o começo. |
| A22 - lista de fases do Extrato da fase não marca as concluídas | `Relatorios.jsx` | **corrigir agora** (203222c) | "(concluída)" no rótulo. |
| Cartão de Contas a pagar no Início soma as paralisadas sem avisar | rótulo | **corrigir agora** (203222c) | O cartão diz "de todas as obras (também as paralisadas)". |
| A3 - entrada do cliente obrigada a ter fase | decisão do Jean (rodada 1, A6) | **não procede** | Já decidido. |
| A11 - colar "5" dá 0,05 | o que entra como um caractere só segue a corrida (é como o teclado do Android manda cada tecla); texto inteiro com mais de um caractere é número escrito | **não procede** | Não dá para distinguir uma tecla de uma colagem de um caractere. Digitado continua caixa eletrônico. |
| A12 - administração de 1.000% sem aviso | `OrcamentoObra.jsx` | **backlog** | Aviso acima de 30%. Pequeno. |
| A13 - fornecedor criado na hora não pergunta se é material ou serviço | quick-create | **backlog** | Junta com R1-A15 (criar com um clique). |
| A7 - lista do Fluxo omite na descrição os itens criados na hora | `ExtratoFase.jsx` monta a descrição com o catálogo carregado | **backlog** | Baixa; o Extrato da fase mostra. |
| A19 - celular: Estimado × realizado corta o %, abas saem da tela | layout | **backlog** | Junta com R1-A12 / R2-A29. |
| A20 - data no futuro só avisa; data antes do início da obra não avisa | aviso, por decisão (rodada 2, A26) | **não procede** (futuro) / **backlog** (antes do início) | Pequeno. |
| A23 - Comprador com "Cadastros" vê todos os clientes e cria obra | é o que "Cadastros" dá | **não procede** | O administrador escolhe; o perfil pode ficar sem Cadastros. |
| A24 - Voltar precisa de dois toques no fornecedor | rota do cadastro empilha duas vezes | **backlog** | Baixa. |

## Verificação feita por mim
- Pedro (Comprador, só Salão paroquial): Pagamentos com todas as obras = R$ 253.357,77, só do Salão; Extrato do credor 1 = 3 lançamentos, só do Salão; total da lista de fornecedores = o gasto do Salão.
- Data fim 62207 e diário em 2099 recusados com mensagem.
- Concluir obra com pendência: a situação volta para "Em andamento".
- "cpii" acha o cimento; a unidade "Quilos" aparece ao lado da quantidade; o texto "areia media" fica depois de responder a pergunta do preço.
- CNPJ repetido: recusado com o nome do outro fornecedor.

Testes da API: 11/11. `format.test.mjs`: ok. Build do front: ok.

---
name: validar-fluxo
description: Ciclo autônomo de validação de uso. O agente gerente-de-obras usa o sistema pelo navegador, cumpre as missões de validacao/missoes.md e escreve um relatório. Depois disso, o plano de ação é montado, as correções são aplicadas e a rodada seguinte verifica. Use quando o usuário pedir para validar, testar fluxos ou rodar uma rodada de validação.
argument-hint: "[rodadas=2] [missões=todas, ex.: M2,M3]"
---

# /validar-fluxo

Você orquestra; o agente `gerente-de-obras` usa o sistema. Ele nunca vê código, e você nunca
avalia a UX no lugar dele. O que ele relata é o dado.

Argumentos: `$ARGUMENTS`. São o número de rodadas (padrão **2**) e as missões a cumprir
(padrão: todas de [validacao/missoes.md](../../../validacao/missoes.md)).

## Antes da primeira rodada

1. Confirme que o projeto é um repositório git com a árvore limpa. Se não for, **pare e peça
   ao usuário** para criar um. Sem isso, não há como desfazer o que as correções mudarem.
2. Confirme que as ferramentas `mcp__playwright__*` existem. Se não, pare e diga ao usuário
   para reiniciar o Claude Code na raiz do projeto e aprovar o servidor `playwright` do `.mcp.json`.
3. Leia [validacao/DIARIO.md](../../../validacao/DIARIO.md), se existir. Lá estão as decisões e o
   backlog de rodadas anteriores. Continue a numeração das rodadas a partir dele.

## Cada rodada N

### 1. Preparar
- `docker compose up -d` e espere `http://localhost:6100` responder 200.
- Estado do banco conforme a primeira missão da rodada:
  - **vazio**: `docker compose stop api && docker compose run --rm api rm -f /data/obras.db && docker compose start api`
    (o `db.js` recria o banco com `admin`/`admin`).
  - **semeado**: `docker compose run --rm api node --experimental-sqlite semear.js --limpar`.
- Se as missões da rodada misturam estados, rode-as em blocos e prepare o banco entre um
  bloco e outro: uma chamada ao agente por bloco, todas escrevendo no mesmo relatório (a
  segunda acrescenta ao arquivo).

### 2. Usar o sistema
Chame o agente `gerente-de-obras` com:
- o texto completo das missões (copie de `missoes.md`, pois ele não lê arquivos);
- as credenciais e o estado do banco;
- o caminho do relatório: `validacao/rodada-N/relatorio.md`;
- a partir da rodada 2: a lista de achados corrigidos na rodada anterior, para ele
  **verificar primeiro**, cada um com os passos para reproduzir.

### 3. Plano de ação
Leia o relatório e as capturas citadas. Escreva `validacao/rodada-N/plano.md` com uma tabela
de cada achado (A1, A2…), com estas colunas:

| Achado | Causa (arquivo:linha) | Decisão | Por quê |

Decisões possíveis:
- **corrigir agora**: bug, número errado, atrito com solução clara e local, regressão.
- **backlog**: lacuna ou ideia que é funcionalidade nova (ex.: módulo novo, app mobile).
  Escreva o que seria e o tamanho.
- **perguntar ao Jean**: decisão de produto ou de regra de negócio que não dá para tirar do
  código nem do [UPDATE.md](../../../UPDATE.md) (ex.: como a taxa de administração
  incide). Escreva a pergunta pronta para enviar.
- **não procede**: o agente se enganou. Explique.

Antes de decidir, reproduza cada bug (pela API com `curl`, pelo teste ou lendo o código).
Achado que não se reproduz não é corrigido às cegas.

### 4. Corrigir
- Siga o estilo do código ao redor e as regras dos documentos do projeto (dinheiro em
  centavos inteiros, `ui/` não importa de `pages/`, etc.).
- Número errado ou regra de cálculo: escreva o teste em `api/*.test.mjs` **antes** de corrigir.
- Rode os testes: `docker compose run --rm api node --experimental-sqlite --test`.
- Rode o build do front: `docker compose run --rm web npm run build`.
- Não apague funcionalidade nem mude regra de negócio por conta própria. Isso vai para
  "perguntar ao Jean".
- Um commit por achado corrigido (`fix(validacao): A3 - <título>`), para dar para reverter
  um sem perder os outros.

### 5. Registrar
Acrescente ao `validacao/DIARIO.md` a seção da rodada: data, missões, contagem de achados
por gravidade, o que foi corrigido (com o commit), o que foi para o backlog e as perguntas
abertas. Mantenha no topo do arquivo duas listas vivas: **Backlog** e **Perguntas ao Jean**.

### Parar quando
- as rodadas pedidas acabarem; ou
- uma rodada não trouxer nenhum achado de gravidade alta ou média que dê para corrigir agora; ou
- a mesma correção falhar na verificação duas vezes (registre e pare).

## Ao final
Responda ao usuário com: rodadas feitas, quantidade de achados corrigidos e verificados, o
que ficou no backlog, as perguntas ao Jean (prontas para enviar) e o link para o `DIARIO.md`.

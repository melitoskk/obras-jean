# Missões do gerente de obras

Roteiro que o agente `gerente-de-obras` cumpre a cada rodada de `/validar-fluxo`.
Edite à vontade: cada missão é independente e diz em que **estado do banco** começa.

- **vazio**: banco recriado do zero, só o usuário `admin` / senha `admin`. Primeiro uso real.
- **semeado**: banco com um ano de dados de demonstração (`semear.js --limpar`), login `admin` / `admin`.
- **continua**: segue do que a missão anterior deixou, sem mexer no banco.

---

## M1 - Primeira obra (vazio)

Você acabou de assinar com um cliente novo, a **Marina Costa**, para uma casa térrea de
120 m² na Rua das Palmeiras, 45. Você é organizado, mas nunca usou o sistema.

1. Entre no sistema. Se der para trocar a senha padrão, troque (e anote a nova no relatório).
2. Cadastre a cliente com o que você teria em mãos (nome, CPF, celular, e-mail).
3. Cadastre a obra dela.
4. Monte o orçamento: escolha as fases que uma casa térrea usa (serviços preliminares,
   canteiro, fundação, estrutura, alvenaria, cobertura, instalações, revestimentos,
   pintura, limpeza final) e dê valor aos serviços. Total entre R$ 350 mil e R$ 450 mil.
5. Configure a **taxa de administração**: R$ 5.000,00 fixos na fundação e 10% nas demais
   fases. Se o sistema não tiver onde, registre como lacuna e diga onde você esperava achar.
6. Registre que a Marina pagou R$ 50.000,00 de entrada.

Avalie: quanto tempo levaria para alguém que vem da planilha fazer isso sozinho? Em algum
momento você ficou sem saber o próximo passo?

## M2 - Fim do dia (continua)

São 19h, você chegou da obra da Marina. No bolso:

1. Nota do **Depósito São José**: 50 sacos de cimento CP-II (R$ 1.900,00), 8 m³ de areia
   média (R$ 1.120,00), 200 blocos cerâmicos (R$ 380,00). Total R$ 3.400,00, fase
   Fundação. Anexe `/validacao/arquivos/nota-fiscal-deposito.pdf`.
2. Pagamento ao empreiteiro **Zé Pedreiro**: R$ 2.800,00, mão de obra da semana na fundação, pago no Pix.
3. **Aço CA-50** comprado da **Gerdau Distribuidora**: R$ 4.250,75, fase Fundação, boleto
   que vence daqui a 10 dias (ainda não pago).
4. Caçamba de entulho da **Remove Entulhos**: R$ 450,00, canteiro.
5. Uma foto do baldrame concretado (`/validacao/arquivos/foto-obra-baldrame.jpg`) com uma
   anotação no diário: "Baldrame concretado, choveu à tarde, equipe parou às 15h".
6. Uma pendência: "Comprar impermeabilizante antes de subir a alvenaria".
7. Erre de propósito em um lançamento (valor errado ou fase errada) e corrija.

Anote cliques e telas por lançamento. Quanto tempo levou a noite toda?

## M3 - O cliente ligou (continua)

A Marina liga e pergunta. Responda **só pelo sistema** e confira cada número somando à mão
o que você lançou nas missões anteriores:

1. Quanto já foi gasto na Fundação?
2. Na Fundação, quanto foi de material e quanto de mão de obra?
3. Quanto de cimento foi comprado do Depósito São José?
4. A Fundação está acima ou abaixo do orçado? E a obra inteira?
5. Quanto ela já pagou, quanto falta, e qual o saldo em caixa da obra?
6. Quanto de taxa de administração já é devida até agora?
7. O que está a pagar nos próximos dias?

Se algum número divergir da sua conta, é **achado de gravidade alta**.

## M4 - Fechamento de fase para o cliente (semeado)

Escolha uma obra com fases já encerradas.

1. Gere o extrato de uma fase como você entregaria ao cliente. Ele entenderia sozinho?
2. Gere o que seria o dossiê final da obra.
3. Abra a visão do cliente. O que falta para o cliente acompanhar a obra durante a execução
   (fotos, avanço, gasto x orçado, próximos passos)? Proponha.
4. Exporte algo para planilha (CSV/Excel), se houver, e diga se dá para usar.

## M5 - No celular (semeado)

Redimensione para 390×844. Repita quatro lançamentos típicos da M2 (uma nota com anexo, um
pagamento de mão de obra, uma foto com anotação e uma pendência) e responda uma pergunta da M3.
Diga se você faria isso de pé, dentro da obra. O que impede?

## M6 - Equipe (semeado)

1. Crie um usuário de **campo** para o mestre de obras, **Carlos**, ligado a uma única obra.
2. Crie um usuário de **escritório** para a **Ana**.
3. Entre como Carlos: ele consegue lançar diário e foto? Vê algum valor em dinheiro? Vê
   outras obras? Tente abrir pela URL uma tela que ele não deveria ver.
4. Entre como Ana: o que ela consegue e o que não consegue fazer? Faz sentido para
   alguém do escritório?

## M7 - Caminhos tortos (semeado)

Tente quebrar o sistema como um usuário cansado faria: duplo clique em Salvar, valor
`1.234,5`, `1234.56` e `R$ 1 234,56`, data no futuro, excluir um fornecedor que tem
lançamento, excluir uma fase com gasto, voltar no navegador no meio de um cadastro, recarregar
com alteração não salva, duas abas editando a mesma obra. Registre o que acontecer.

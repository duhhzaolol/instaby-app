# Instaby App

Painel interno da Instaby Agência — v26 (Central de Comando).

## Sobre o spec que você mandou

Muito bem pensado — implementei o núcleo dele nesta versão. O menu
lateral e a estrutura de navegação continuam exatamente iguais, como
você pediu. A mudança é toda dentro da Visão Geral.

## O que entrou

### Central de Comando (substitui o formulário antigo)
Card grande "⚡ O que precisa fazer?" → clica em "+ Começar" → escolhe a
categoria (Gravação, Criar arte, Criar Reel, Fotos, Campanha, Reunião,
Contato, Orçamento, Nova ideia, Outra tarefa) → escolhe o cliente (ou
"Sem cliente") → tarefa criada na hora, sem pedir data/prazo nesse
momento. Confirmação rápida e fecha sozinho.

Mantive também o caminho de digitar direto — tem um link "ou prefiro
digitar" embaixo do card, que abre o campo de texto livre (o antigo).
Não implementei o atalho de teclado "/" ainda (fica fácil de adicionar
depois se sentir falta).

### Cor por cliente
Cliente ganhou uma cor (escolhida entre 10 opções, na edição/cadastro).
Ela aparece como:
- Barra lateral colorida nos cards de cliente (lista de Clientes)
- Barra lateral nas tarefas dele
- Bolinha colorida nos cards de "Clientes ativos" e nos itens de "Hoje"

A interface continua toda escura — a cor é só um destaque de
identificação, não domina a tela.

### Detalhe da tarefa (organizar depois)
Clicar numa tarefa expande um painel com Descrição, Data, Horário e
Prioridade — é onde você organiza com calma o que criou rápido pela
Central de Comando. Isso já integra com a Agenda (se você põe data, ela
aparece lá).

### Seção "Hoje"
Mostra as tarefas com prazo pra hoje, em ordem de horário, com o ícone da
categoria e a cor do cliente.

### Clientes ativos no Dashboard
Cards pequenos com cada cliente ativo, quantas tarefas ele tem e quantas
estão pendentes — clica e vai direto pro cliente.

## O que ficou de fora desta rodada (e por quê)

- **Pipeline de Leads** (Novos/Em conversa/Proposta enviada/Negociação):
  isso precisa de um conceito novo de "estágio do lead", mais profundo
  que o status atual (Lead/Ativo/Inativo). Prefiro fazer isso como uma
  entrega própria depois, pra não misturar com essa.
- **Checklist e anexos na tarefa**: anexo exigiria upload de arquivo, que
  você decidiu não ter no início do projeto (prefere linkar Drive). Dá
  pra reconsiderar depois.
- **Widget "Próximos pagamentos"** no Dashboard (tipo Hostinger, Adobe,
  Mlabs): o Financeiro já mostra despesas e cobranças pendentes
  detalhadamente — replicar resumido no Dashboard é rápido de fazer numa
  próxima entrega se sentir falta.
- **Atalho de teclado "/"**: puramente de conveniência, fácil de
  adicionar depois.

## Sobre "Responsável"
O spec menciona um campo de responsável na tarefa — como o app é de
uso único (só você), não adicionei; não teria pra quem atribuir.

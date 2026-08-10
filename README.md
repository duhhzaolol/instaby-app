# Instaby App

Painel interno da Instaby Agência — v28.

## 1. Loading calmo, sem quebrar o logo

Troquei o obturador por um fade suave: a marca aparece pequena, com um
leve brilho vermelho ao redor pulsando devagar (respira, não pisca) —
sem partir o logo ao meio. Bem mais discreto, do jeito que você pediu.

## 2. Cards do Dashboard clicáveis

Cada um agora leva pra página de onde a informação vem:
- **Clientes ativos** → lista de clientes já filtrada em "Ativo"
- **Leads em aberto** → lista de clientes já filtrada em "Lead"
- **Faturamento do mês** → Financeiro
- **Cobranças pendentes** → Financeiro

Também dei uma cor própria pra cada ícone (azul, roxo, verde, âmbar) em
vez de todos vermelhos — ajuda a diferenciar rápido e já é parte da
resposta pro ponto 3.

## 3. Sobre estar muito escuro

Fiz uma melhoria rápida agora, e quero ser transparente sobre o que ela
resolve e o que não resolve:

**O que mudei nesta versão**: o preto quase puro (#09090B) virou um
grafite mais suave (#131519), os cards ganharam um tom mais claro e com
mais contraste entre as camadas (#1C2028), e o hover ficou mais visível.
Isso já tira aquela sensação de "parede preta chapada" — fica mais
parecido com Linear/Vercel no modo escuro (que também é escuro, mas
"respira" mais) do que com uma tela apagada. Combinado com as cores por
categoria que já estavam entrando aos poucos (ícones de serviço, tarefa,
cliente), o app fica visivelmente mais colorido sem perder a
identidade preto/vermelho.

**O que isso NÃO é**: um modo claro de verdade. Se o que você quer é
poder alternar entre escuro e claro (ou até deixar claro como padrão),
isso é um projeto à parte — hoje as cores estão "fixas" em vários lugares
(inclusive a página pública do orçamento e do contrato, que usam cor
direta em vez de depender de um tema), então mudar pra um sistema de
tema de verdade exige refazer isso com cuidado pra não quebrar nada.
Não é impossível, só não é uma correção rápida — prefiro fazer isso como
uma entrega própria, com atenção, do que apressar e arriscar bagunçar o
que já está funcionando bem.

Testa essa versão mais suave primeiro — pode ser que já resolva boa parte
do cansaço visual. Se ainda achar pouco, me fala que a gente parte pro
modo claro de verdade como próximo projeto.

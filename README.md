# Instaby App

Painel interno da Instaby Agência — v29 (leva grande).

## ⚠️ Passo obrigatório antes de usar o upload de logo

Pra fazer upload de imagem funcionar, você precisa criar um "Blob Store"
gratuito no Vercel (é armazenamento de arquivo, separado do banco):

1. No painel do Vercel, vai em **Storage** → **Create Database** → **Blob**
2. Dá um nome, cria
3. Ele gera um token — copia
4. Vai em Settings → Environment Variables do seu projeto e adiciona:
   `BLOB_READ_WRITE_TOKEN` = (o token que copiou)
5. Redeploy

Sem isso, o upload de logo não funciona (mas o resto do app continua
normal).

## 1. Upload de logo direto no app

Trocou o campo de link por um seletor de arquivo de verdade. Quando você
escolhe uma imagem:
- Se detectar um fundo sólido (branco ou preto uniforme nos 4 cantos),
  tenta remover automaticamente e te mostra as duas versões lado a lado
  (original vs. sem fundo) pra você escolher
- Tem um checkbox "Ver como fica em cinza" — mostra a prévia exata de
  como vai aparecer na vitrine dos orçamentos, antes de confirmar
- **Limite honesto**: essa remoção de fundo é simples (detecta cor sólida
  nos cantos e torna transparente) — funciona bem pra logo com fundo
  branco/preto liso, mas não é uma IA de recorte tipo remove.bg. Se o
  fundo for foto ou gradiente, ele avisa que não conseguiu e usa a
  imagem original.

## 2. Agenda mostrando as horas trabalhadas

Além de cobrança vencendo e prazo de tarefa, a Agenda agora também
mostra os registros de Horas no dia em que aconteceram — na cor do
cliente (a mesma que você escolhe na edição dele).

## 3. Horas separadas por cliente e por atividade

A tela de Horas não soma mais tudo junto. Agora cada cliente vira um
card próprio, com uma barra para cada tipo de atividade (Edição,
Captação, Reunião...) — a barra é proporcional dentro daquele cliente
(a atividade que você mais fez fica com a barra maior). Um total geral
do mês continua no topo.

## 4. Financeiro reformulado

- **Abre no mês atual por padrão** — não mais nos últimos 6 meses
- **Seletor de período**: Este mês / Mês anterior / Últimos 3 meses /
  Últimos 6 meses
- **Gráfico de linha estilo DRE**: 3 linhas — Entradas (verde), Custos
  fixos (laranja), Custos flexíveis (vermelho)
- **Custos operacionais** (fixo) separado de **Custos flexíveis** —
  despesa ganhou um campo de tipo. Cadastre aluguel, água, luz, internet,
  ferramentas de IA etc. como fixo; compras avulsas (papel, equipamento,
  comida) como flexível
- **Cobranças pendentes com contagem regressiva**: "faltam X dias",
  "vence hoje" ou "atrasado há X dias" — com um banner de alerta no topo
  quando tem algo vencendo/vencido
- **Botão de lembrete no WhatsApp** em cada cobrança pendente (usa o
  WhatsApp do cliente), com uma mensagem padrão tipo "Oi {cliente}!
  Passando pra lembrar que seu boleto vencerá em 3 dias." — o texto muda
  sozinho conforme os dias. Deixei como mensagem fixa por enquanto; você
  mencionou querer configurar isso depois, e dá pra fazer uma tela de
  template editável numa próxima entrega

### Ideias que eu acrescentaria (você pediu sugestões)
- Meta de faturamento do mês, com barra de progresso
- Comparação "esse mês vs. mês passado" (ex: "+18% de lucro")
- Exportar o resumo financeiro em PDF pra guardar/mandar pro contador

## 5. Orçamento — visualização registrada + topo redesenhado

- Quando o cliente abre o link da proposta pela primeira vez, o sistema
  grava a data/hora — aparece como "visto em DD/MM" (em verde) na lista
  de orçamentos, tanto na global quanto dentro do cliente
- Tirei a fileira "01-05" do topo (ficava repetindo o que já tem lá
  embaixo em "Como vamos trabalhar") e centralizei o cabeçalho — texto
  no meio, com o gráfico de performance agora como um fundo bem sutil
  atrás do texto, em vez de do lado

## O que ficou de fora / mais simples do que o ideal

- **Contrato**: você disse que ainda não foi mexer nele, não toquei
- **Catálogo de serviços**: você disse que está em adaptação, não mexi
- **Mensagem do WhatsApp configurável**: hoje é um texto fixo (mas já
  inteligente, muda com os dias) — deixar 100% editável é uma tela nova
- **Remoção de fundo "de verdade"** (tipo remove.bg): o que fiz é uma
  versão simples e honesta (detecta cor sólida), não é IA de recorte

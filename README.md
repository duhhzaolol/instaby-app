# Instaby App

Painel interno da Instaby Agência — v23.

## Sobre a sua pergunta: vale a pena levar esse estilo pro resto do sistema?

Sim, acho que faz muito sentido — o ícone colorido por categoria ajuda a
escanear visualmente mais rápido, tanto pra você internamente quanto pro
cliente. Criei um arquivo só (`lib/categoriaVisual.ts`) com o mapeamento
categoria → ícone/cor, e já uso ele em três lugares agora (orçamento
público, contrato público, catálogo interno). Da próxima vez que
quisermos levar pra mais uma tela (Financeiro, Dashboard, etc.), é só
importar esse arquivo — não precisa redesenhar do zero.

## O que entrou nesta versão

### Página pública do contrato (`/contrato/[id]`)
No mesmo estilo visual da proposta: cabeçalho com código (#CT-2026-XXX) e
status, hero com gradiente, cada serviço contratado como um card com
ícone colorido por categoria + o texto da cláusula daquele serviço,
sidebar com o valor mensal, vigência e renovação (quando preenchidos).

Ela puxa os dados de duas formas, na ordem:
1. Se o contrato foi gerado a partir de um orçamento, usa os itens
   daquele orçamento
2. Senão, usa os Serviços Contratados atuais do cliente
3. Se não tiver nenhum dos dois (contrato escrito na mão), mostra o texto
   corrido normal, sem os cards

Link pra essa página aparece em cada contrato, na aba Contratos do
cliente ("Ver página").

### Catálogo interno com ícone colorido
A lista de Serviços (`/dashboard/servicos`) agora mostra o mesmo ícone
colorido por categoria que já aparece na proposta pública — mais fácil de
escanear visualmente qual é qual.

## Próximos passos possíveis (não pedidos ainda, só sugestão)
- Levar o mesmo ícone/cor pra aba Serviços Contratados do cliente e pro
  construtor de orçamento (pílulas com ícone em vez de só texto)
- Aplicar em Financeiro e no Dashboard também

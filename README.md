# Instaby App

Painel interno da Instaby Agência — v50 (correção).

## O bug

A lista de "Custos flexíveis" no Financeiro só mostrava as 10 despesas
mais recentes — um limite que ficou no código desde bem no início do
projeto, sem nenhum "ver mais" pra acessar o resto. Por isso as despesas
da sua viagem em São Paulo sumiam depois da oitava/nona linha.

## A correção

Removido o limite — agora mostra todas as despesas flexíveis do período
selecionado, igual os Custos operacionais (fixos) já faziam.

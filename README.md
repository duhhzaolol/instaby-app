# Instaby App

Painel interno da Instaby Agência — v49 (Financeiro, Fase 1).

## Resumo do que foi feito

Primeira fase da evolução do Financeiro (documento que você mandou) —
**Tipo + Categoria/Subcategoria**, a base de tudo que vem depois.

## O que mudou

### 1. Classificação financeira completa
Toda despesa agora pode ter uma **Classificação** (Custo direto,
Despesa fixa, Despesa variável, Despesa financeira, Imposto, Investimento/
Ativo, Retirada/Transferência) e uma **Categoria** (texto livre, com
sugestões — Aluguel, Material de escritório, Comida, etc., que mudam
conforme a classificação escolhida). O campo velho de fixa/flexível
continua existindo por baixo (o gráfico de sempre não quebrou), só que
agora tem uma camada mais rica em cima.

Receitas (cobranças) também ganharam **Categoria** (Serviços, Produtos,
Mensalidades, Recorrências, Outras receitas).

### 2. Retirada/Transferência não conta mais como despesa
Regra importante do documento: se você lançar uma "Retirada pessoal" ou
"Distribuição de lucros" com a classificação **Transferência**, ela fica
registrada (você continua vendo ela na lista), mas **não entra mais na
conta de lucro nem nos gráficos** — porque tirar dinheiro seu do caixa
não é uma despesa da agência.

### 3. Lançamentos antigos não foram mexidos
Nenhuma despesa que já existia foi reclassificada — tudo o que você já
tinha (celular, cartório, comida, HDD, quadros...) continua exatamente
como estava, só que agora mostra **"Sem categoria"** até você mesmo
classificar. Pra isso, é só clicar no lápis de qualquer despesa — o
formulário de edição agora também tem os campos de classificação.

## O que NÃO mudou

- O gráfico "Entradas x Custos fixos x Custos flexíveis" continua igual
  (só passou a ignorar retiradas/transferências no cálculo)
- Nenhuma despesa ou cobrança foi apagada ou alterada automaticamente
- O visual, os cards, as cores — tudo igual

## Próximas fases (não fiz ainda, aguardando você)
Competência vs. pagamento → DRE de verdade → Contas a Pagar/Receber →
o resto, conforme combinamos.

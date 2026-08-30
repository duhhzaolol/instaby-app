# Instaby App

Painel interno da Instaby Agência — v52 (Financeiro, Fase 3).

## O que entrou: DRE de verdade

Nova página `/dashboard/financeiro/dre`, acessível pelo link "Ver DRE →"
no topo do Financeiro.

### A estrutura completa
```
Receita Bruta
(−) Impostos sobre vendas
(−) Descontos/cancelamentos  [ainda não rastreado — mostra R$ 0]
= Receita Líquida

(−) Custos diretos
= Lucro Bruto                    → Margem bruta

(−) Despesas Operacionais        (com o detalhe de cada categoria embaixo)
= Lucro Operacional              → Margem operacional

(−) Despesas Financeiras
= Lucro Líquido                  → Margem líquida
```

### Por competência, não por caixa
Diferente da Visão Geral (que soma só cobranças já marcadas como
"Pago"), a DRE soma **tudo que pertence àquele período**, mesmo que
ainda esteja pendente — é assim que uma DRE de verdade funciona,
olhando pra quando a receita/despesa "aconteceu", não pra quando o
dinheiro efetivamente mudou de mão.

### Período estendido
O seletor de período (tanto na Visão Geral quanto na DRE) ganhou duas
opções novas: **Este ano**, **Ano anterior**, e **Personalizado** (você
escolhe as duas datas).

### Avisos importantes
- Se tiver despesa **sem classificação** (ou marcada como Retirada/
  Transferência) no período, aparece um aviso amarelo dizendo quanto
  ficou de fora da conta — assim você sabe que a DRE não está 100%
  completa até classificar tudo
- **Investimentos/Ativos** do período aparecem separados, informando que
  reduziram o caixa mas não entram na DRE (compra de equipamento não é
  despesa operacional)

## Próxima fase
Fase 4 — Contas a Pagar e Contas a Receber como telas próprias.

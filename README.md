# Instaby App — v87

## Lançar despesa ficou muito mais rápido

### O problema
Pra registrar uma despesa, você precisava entrar no Financeiro e rolar a tela até
passar dos indicadores, do "Progresso do mês", do gráfico de Entradas x Custos — só
aí chegava nos cards de "Custos operacionais"/"Custos flexíveis" com o botão "+ Novo".
Muito passo pra um dado que você usa toda hora.

### A correção
1. **Botão "Lançar despesa" logo no topo do Financeiro** — antes de qualquer gráfico,
   um botão grande e destacado. Clica e o formulário abre ali mesmo, sem rolar nada.
2. **Atalho do Dashboard agora funciona de verdade** — "Nova despesa" (nos atalhos
   abaixo da Central de Comando) já leva pro Financeiro com o formulário **já
   aberto**, pronto pra preencher. Antes só te jogava na tela, sem abrir nada.

Os cards antigos ("Custos operacionais"/"Custos flexíveis" com seus próprios "+Novo")
continuam existindo do jeito que sempre foram — pra quando você quiser classificar
específico ali. O botão novo é só um caminho mais rápido pro caso comum.

## Arquivos alterados
- `components/dashboard/FinanceiroClient.tsx`
- `components/dashboard/DashboardClient.tsx`

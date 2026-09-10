# Instaby App

Painel interno da Instaby Agência — v55 (Financeiro, Fase 4).

## O que entrou: Contas a Pagar e Contas a Receber

Duas telas novas, já no menu lateral dentro de "Financeiro".

### Contas a Pagar (`/dashboard/financeiro/contas-a-pagar`)
Todas as despesas pendentes/atrasadas, com 4 cards de destaque no topo:
- **Total a pagar** (soma de tudo que está pendente/atrasado)
- **Vencendo hoje**
- **Próximos 7 dias**
- **Em atraso** (calculado pela data de vencimento, não precisa você marcar
  manualmente — se o vencimento já passou e ainda está pendente, conta
  aqui sozinho)

Abas pra filtrar: Pendentes + Atrasadas (padrão), só Pendentes, só
Atrasadas, Próximos 7 dias, Pagas, Todas. Cada item usa o mesmo cartão de
despesa que você já conhece (clica no lápis pra editar, marcar como pago,
mudar vencimento etc.)

### Contas a Receber (`/dashboard/financeiro/contas-a-receber`)
Mesma ideia, só que com as cobranças dos clientes — mostra o nome do
cliente em cada linha, os mesmos 4 destaques, e o botão de "marcar como
recebido" que já existia no cartão de cobrança.

## Onde ficou tudo isso
Menu lateral → seção "Financeiro": Visão geral, DRE, Contas a Pagar,
Contas a Receber — a estrutura de navegação que o documento original
pedia, praticamente completa agora.

## O que resta do documento original
Fluxo de Caixa (com projeção), Contas bancárias/múltiplas, Cartão de
crédito, Centro de Custo — ficaram de fora por decisão sua (você usa só
uma conta, e as outras partes ficaram como "pergunto antes de construir"
na nossa conversa). Se quiser retomar algum desses, é só falar.

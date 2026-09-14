# Instaby App — v84

## As 4 coisas que você pediu

### 1. Data de início do contrato
Aba Serviços → "Ajustar valor, início e prazo do contrato" → campo **"Início do
contrato"** com o calendário de sempre. Fica marcado e é usado pra calcular a
renovação, mesmo que você nunca tenha gerado um Contrato formal (documento) — antes a
renovação só funcionava se existisse um contrato assinado gerado no sistema.

### 2. Tempo até renovar, em meses (e dias quando estiver perto)
Aparece em dois lugares agora:
- No **topo da página do cliente**, junto do chip de Mensalidade
- Na aba **Visão Geral**, no card "Contrato"

Mostra em meses ("renova em 5 meses") e troca pra dias automaticamente quando faltar
menos de 1 mês ("renova em 12 dias").

### 3. Desconto/Acréscimo virou um campo só
Em vez de escolher entre dois campos separados, agora é um campo único:
**"Valor final da mensalidade"**. Você digita quanto vai cobrar, e o sistema mostra
embaixo se isso é um desconto ou um acréscimo em cima do total dos serviços — sem
você ter que calcular ou decidir qual campo preencher.

### 4. Ocultar valores, fora do Financeiro
O botão de olho (👁) que já existia no Dashboard agora vale também em:
- Mensalidade e tempo de renovação (topo do cliente)
- Aba Serviços (total, desconto/acréscimo, mensalidade final, valor de cada serviço)
- Aba Visão Geral (mensalidade, próxima cobrança, receita, despesas, custo de horas,
  rentabilidade)
- Lista de Clientes (mensalidade e recebido até agora, em cada card)

O Financeiro (Visão geral, DRE, Contas a Pagar/Receber) continua sempre mostrando os
valores direto, sem ocultar — foi o que você pediu.

## Banco
- `Cliente.dataInicioContrato` (aditivo)

## Arquivos principais
- `prisma/schema.prisma`, `app/api/clientes/[id]/route.ts`
- `lib/formatarTempoRenovacao.ts` (novo)
- `components/ui/ValorOcultavelTexto.tsx` (novo — wrapper reutilizável)
- `app/dashboard/clientes/[id]/ServicosContratadosTab.tsx`,
  `components/dashboard/ServicoContratadoRow.tsx`
- `app/dashboard/clientes/[id]/MensalidadeChip.tsx` (novo)
- `app/dashboard/clientes/[id]/page.tsx`, `VisaoGeralClienteTab.tsx`
- `app/dashboard/clientes/page.tsx`

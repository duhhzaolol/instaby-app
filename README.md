# Instaby App — v85

## Botão de ocultar valores, dentro do cliente e na lista

### O problema
O botão de olho só existia no Dashboard. Se você tivesse ativado "ocultar" lá, dentro
do cliente os valores ficavam escondidos sem nenhum jeito de reverter ali mesmo —
tinha que voltar pro Dashboard só pra desligar.

### A correção
- **Dentro do cliente**: o botão aparece no topo, ao lado da Mensalidade (mesmo se o
  cliente não tiver mensalidade ainda, o botão continua lá)
- **Lista de Clientes**: o botão aparece no topo, ao lado de "Novo cliente"

É o mesmo estado de sempre (fica salvo no navegador) — ativar em qualquer uma dessas
telas já reflete em todas as outras, Dashboard incluso.

## Arquivos novos
- `components/ui/ToggleOcultarValores.tsx`

## Arquivos alterados
- `app/dashboard/clientes/[id]/MensalidadeChip.tsx`
- `app/dashboard/clientes/page.tsx`

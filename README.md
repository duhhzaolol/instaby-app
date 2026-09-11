# Instaby App — v73

## TAREFA 13 — Snapshot do orçamento aceito + alerta de renovação

### 1. Orçamento congelado
Antes, o nome/descrição do serviço numa proposta vinha sempre "ao vivo" do catálogo —
se você editasse um serviço no catálogo meses depois, orçamentos antigos mudavam junto
(sem querer). Agora, na hora de criar o orçamento, o nome e a descrição de cada item são
**congelados** ali dentro. Editar o catálogo depois não muda mais nada em propostas já
enviadas ou aceitas.

Orçamentos antigos (de antes dessa atualização) continuam funcionando normalmente —
usam o catálogo ao vivo como já usavam, sem quebrar nada.

Também passei a registrar a **data exata do aceite** (`dataAceite`).

### 2. Alerta de renovação de contrato
Sem criar campo novo — reaproveitei o **prazo do contrato** que você já configura na
aba Serviços do cliente. A partir da data que o contrato foi gerado + esse prazo, o
sistema calcula sozinho quando ele renova:

- Na aba **Visão Geral** do cliente: mostra "Renova em X dias" (ou "vencido há X dias"),
  ficando laranja quando faltam 30 dias ou menos
- Na lista **Contratos** (geral): um resumo no topo juntando todos os clientes com
  renovação chegando, com link direto pro cliente

### Banco
- `ItemOrcamento.nomeServico`, `descricaoServico` (aditivos)
- `Orcamento.dataAceite` (aditivo)
- Nada novo em `Contrato` — a renovação é 100% calculada

### Arquivos principais
- `prisma/schema.prisma`
- `app/api/clientes/[id]/orcamentos/route.ts`, `app/api/orcamento/[slug]/aceitar/route.ts`
- `app/orcamento/[slug]/page.tsx`, `app/contrato/[id]/page.tsx`
- `app/api/clientes/[id]/contratos/route.ts`
- `app/dashboard/clientes/[id]/page.tsx`, `VisaoGeralClienteTab.tsx`
- `app/dashboard/contratos/page.tsx`

## Continuando
Próxima: TAREFA 14 (Aprovação pública de conteúdo + Solicitações do cliente +
Templates básicos). Seguindo.

# Instaby App — v92

## Fase 1 da atualização grande (Landing/Agenda/Financeiro conservador)

Esse documento grande pedia bastante coisa, mas de forma explicitamente
conservadora em várias áreas ("não mexer", "não recriar do zero"). Essa versão
entrega a parte de menor risco e maior impacto no dia a dia — a parte que mexe em
rotas públicas (Landing Page, `/link`, reestruturação pra `/app`) ficou de fora,
aguardando sua confirmação antes de tocar em algo que afeta o domínio público.

Detalhe completo de tudo que mudou está no `IMPLEMENTATION_PLAN.md`, na seção
"FASE — Atualização grande". Resumo rápido:

### Corrigido
- **"Próxima cobrança" vazia no cliente**: causa raiz era a mesma classe de bug já
  corrigida nas despesas recorrentes — a mensalidade configurada nunca virava uma
  Cobrança de verdade todo mês. Agora vira, automaticamente.
- Link quebrado "Novo conteúdo" no Dashboard (apontava pra rota que não existe mais).

### Novo
- Logo sempre volta pra Visão Geral.
- Clientes agrupados por status (Ativos/Avulsos/Leads/Inativos), seções recolhíveis.
- Anexar PDF do contrato assinado (upload via Vercel Blob), marca como assinado
  automaticamente.
- Ícone de ajuda contextual (?) em Clientes, Tarefas, Serviços, Horas, Financeiro,
  Agenda, Relatórios e Solicitações.
- Calendário financeiro na Visão Geral do Financeiro (dia a dia, clicável).
- Agenda: tarefas e horas trabalhadas classificadas em tipos (Captação, Edição,
  Reunião, Trabalho interno, Compromisso), com filtros e clique-no-dia pra ver tudo.
- Horas: calendário mostra até 3 atividades por dia (nome do cliente em destaque),
  "+N atividades" quando tem mais.

### Removido
- Seção duplicada "Clientes ativos" no Dashboard (já tem card de métrica pra isso).
- Gráficos de linha da Visão Geral do Financeiro (não agregavam informação — dados
  continuam disponíveis pelo novo calendário financeiro e pelos cards de resumo).
- Informação financeira (cobranças vencendo) da Agenda — fica só no Financeiro.

### Não mudou (por instrução explícita do documento)
DRE, Contas a Pagar, Contas a Receber, Comercial (Oportunidades). Nenhum cálculo
financeiro existente foi alterado — só reorganização visual.

## Arquivos novos
- `lib/garantirRecorrentes.ts` — unifica a geração de despesas recorrentes (já
  existia, movida do Financeiro) com a nova geração de cobranças mensais.
- `lib/tipoAtividadeAgenda.ts` — classifica tarefas/horas em tipos de atividade.
- `components/ui/AjudaContextual.tsx` — ícone de ajuda reutilizável.
- `components/dashboard/ClienteCard.tsx` / `ClientesAgrupados.tsx`
- `components/dashboard/CalendarioFinanceiro.tsx`
- `app/api/upload-contrato/route.ts`

## Banco de dados
Dois campos novos, aditivos (não quebram dados existentes):
- `Cliente.dataInicioContrato` (já existia desde a v81/82)
- `Contrato.arquivoUrl` (novo nessa versão)

Depois de subir pro Vercel, o build já roda `prisma db push` sozinho (conforme seu
fluxo atual) — nenhum comando extra necessário.

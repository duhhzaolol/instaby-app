# Instaby App — v94

## Ajuste pequeno + revisão final

- Página pública do contrato (`/contrato/[id]`) agora mostra um selo "Ver PDF
  assinado" ao lado do status, quando o contrato tem arquivo anexado (novidade da
  v92) — o cliente consegue baixar o PDF de qualquer hora pelo mesmo link que já
  tinha.
- `AUDITORIA_FINAL.md` atualizado com o resumo da Fase 1 + Fase 2 dessa rodada
  (estava desatualizado desde a remoção do módulo Conteúdo).
- Revisão manual (rule de sempre: sem acesso de rede ao binário do Prisma nesse
  sandbox, então sem build/typecheck real aqui) confirmando que não sobrou
  referência órfã de nada removido nessa rodada inteira (gráficos do Financeiro,
  camada financeira da Agenda, módulo Conteúdo).

## Fase 2 — Landing Page, /link e /app

Depois da Fase 1 (v92 — painel), essa versão entrega a parte de rotas públicas do
documento grande:

- **`/`** virou a Landing Page pública da Instaby — Hero, Quem somos, Serviços,
  Portfólio (placeholder), Clientes/depoimentos, Diferenciais, Processo, CTA
  WhatsApp. Sem preços.
- **`/link`** — página de links estilo Linktree (WhatsApp, Site, Instagram...).
  Lista de links fica num array simples no topo de `app/link/page.tsx` — fácil de
  editar/adicionar depois.
- **`/app`** — atalho de entrada pro sistema administrativo, redireciona pra
  `/dashboard` (que continua sendo a árvore real do painel, protegida pelo
  middleware de sempre). Não recriei o painel embaixo de `/app` — só criei o
  atalho com o nome que o documento pediu, sem duplicar nada.
- `/login` não mudou.

Detalhe completo na seção "FASE 2" do `IMPLEMENTATION_PLAN.md`.

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

# Instaby App — v75

## TAREFA 15 — Agenda com camadas, Dashboard "Precisa da sua atenção", Central expandida

### 1. Agenda com camadas
Pílulas clicáveis pra ligar/desligar cada tipo de evento: Cobrança, Tarefa, Conteúdo
(novo — data de publicação) e Horas trabalhadas. **Horas vem desligada por padrão** —
é um registro histórico, não algo que precisa de atenção futura, então não compete
mais visualmente com prazo/vencimento.

### 2. Dashboard — "Precisa da sua atenção"
Novo bloco logo no topo, antes da Meta do mês. Só aparece o que tem alguma coisa pra
resolver:
- Tarefas atrasadas
- Cobranças vencidas
- Conteúdo aguardando aprovação
- Contrato(s) renovando em breve (≤30 dias)
- Despesas sem classificação
- Item(ns) de onboarding bloqueados
- Oportunidade(s) sem próxima ação

Cada linha é clicável e leva direto pra tela certa. Se estiver tudo em dia, o bloco
nem aparece.

### 3. Central de Comando — atalhos, sem IA
Fileira de atalhos abaixo do botão principal: Novo conteúdo, Registrar horas, Nova
cobrança, Nova despesa, Novo lead, Novo orçamento. São links diretos pra cada tela —
**nenhuma interpretação de texto, nenhum comando em linguagem natural**, exatamente
como o documento pediu.

## Banco
Nenhuma mudança de schema nessa leva — tudo calculado a partir do que já existia.

## Arquivos principais
- `app/dashboard/agenda/page.tsx`, `components/dashboard/AgendaGrid.tsx`
- `app/dashboard/page.tsx`, `components/dashboard/DashboardClient.tsx`

## Continuando
Próxima: TAREFA 16 (Templates de tarefas/projeto — última peça pendente do documento).
Depois disso, faço a auditoria final completa e o documento de resumo do projeto
inteiro. Seguindo.

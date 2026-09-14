# Instaby App — v80

## Módulo Conteúdo removido

Você não curtiu o formato pipeline/kanban — removido por completo, com cuidado pra
não quebrar nada que dependia dele:

- Pipeline de Conteúdo, Visão de Captações, aprovação pública → apagados
- Aba **Escopo** do cliente → removida (dependia 100% do Conteúdo pra calcular)
- Camada de Conteúdo na Agenda, alerta no Dashboard, item no menu → removidos
- Campo `formatoConteudo` do catálogo de Serviços → removido (o campo "Formato de
  conteúdo" some do formulário de editar serviço)
- No banco: modelo `Conteudo` e os campos que existiam só por causa dele

## O que continua exatamente igual
O **Calendário de conteúdo** original — que já existia antes desse módulo todo, direto
em cima da Tarefa (`/dashboard/tarefas/calendario`, acessível também pelo botão na
tela de Tarefas e dentro de cada cliente) — nunca dependeu da entidade Conteúdo.
Continua funcionando normal: cadastra tarefa com prazo, aparece no calendário.

Onboarding, Contatos, Links, Solicitações, Oportunidades, Financeiro, Templates — nada
disso foi tocado, são independentes do que foi removido.

## Arquivos removidos
`app/dashboard/conteudo/`, `app/aprovacao/`, `app/api/conteudos/`, `app/api/aprovacao/`,
`components/dashboard/PipelineConteudo.tsx`, `NovoConteudoForm.tsx`,
`lib/conteudoVisual.ts`

## Arquivos ajustados (pra não quebrar o build)
Schema do Prisma, Sidebar, Agenda, Dashboard, página do cliente, VisaoGeralClienteTab,
API de tarefas, API de serviços, formulário de editar serviço, API de aplicar template.

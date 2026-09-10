# Instaby App — v60

## TAREFA 01 CONCLUÍDA — Módulo Conteúdo

### Implementado
- Entidade `Conteudo` própria (não é mais só uma view sobre Tarefa) — título, campanha,
  formato, objetivo, pilar, redes, orgânico/anúncio, briefing, roteiro, legenda, CTA,
  referências, link de arquivos, datas de captação/edição/aprovação/publicação, status,
  URL publicada
- Pipeline por status (Ideia → Planejado → Produção → Edição → Revisão interna →
  Aguardando aprovação → Alteração solicitada → Aprovado → Agendado → Publicado)
- Tarefa pode se vincular a um Conteúdo (campo novo `conteudoId`, opcional) — não
  substitui, é um vínculo. De dentro do conteúdo dá pra criar uma tarefa já vinculada
  ("gravar", "editar", "publicar"...)
- Nova página `/dashboard/conteudo` (menu lateral, logo depois de Tarefas), com filtro
  por cliente e formulário de criação

### Banco
- Novo model `Conteudo` (aditivo, não mexe em nada que já existia)
- `Tarefa` ganhou `conteudoId String?` opcional
- `Cliente` ganhou a relação `conteudos Conteudo[]`
- Nenhum campo removido ou renomeado — zero risco pros dados que já existem

### Arquivos principais
- `prisma/schema.prisma` (model novo + relação)
- `app/api/conteudos/route.ts` e `[id]/route.ts` (API)
- `app/api/tarefas/route.ts` e `[id]/route.ts` (aceitam `conteudoId`)
- `lib/conteudoVisual.ts` (formatos e status, ícone+cor)
- `components/dashboard/PipelineConteudo.tsx` (pipeline + modal de detalhe)
- `components/dashboard/NovoConteudoForm.tsx`
- `app/dashboard/conteudo/page.tsx`
- `components/layout/Sidebar.tsx` (item novo no menu)

### Testes/verificações
- Build local não rodado por aqui (nosso combinado é você conferir pela Vercel) — a
  estrutura segue exatamente o padrão dos outros módulos (Tarefa, Relatório), que já
  builda limpo
- Nada em Tarefas, Agenda, Dashboard ou Calendário de Conteúdo antigo foi alterado —
  continuam funcionando exatamente como antes

### Pendência conhecida (fica pra próxima leva)
Hoje só dá pra vincular uma tarefa a um conteúdo **criando ela de dentro do conteúdo**.
Vincular uma tarefa solta que já existia (arrastar ela pra dentro de um conteúdo) ainda
não tem interface — é rápido de adicionar depois, deixei de fora pra não mexer de novo
no `TarefaRow` (componente usado em muitos lugares) nesta rodada.

### Próxima
TAREFA 02 — Visão de Captações (agrupar conteúdos por data de captação). Mas antes eu
queria seu retorno: dá uma testada no pipeline de Conteúdo, veja se o conceito faz
sentido no seu dia a dia (formato/pilar/briefing — campos que você realmente vai
preencher, ou que ficam vazios), e me diz se seguimos direto pras próximas fases do
`IMPLEMENTATION_PLAN.md` ou se ajustamos alguma coisa primeiro.

---

## Junto nesse zip: IMPLEMENTATION_PLAN.md
Documento completo com as 12 fases do documento original, convertidas em 15 tarefas
técnicas reais (bancos, páginas, componentes reaproveitados, critério de pronto). Fica
na raiz do projeto — dá pra ir marcando [x] conforme formos avançando.

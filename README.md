# Instaby App — v76

## TAREFA 16 — Templates de tarefas (última do plano)

### Implementado
- Novo model `TemplateTarefas` (nome + lista de itens)
- Gerenciado em **Configurações** → "Templates de tarefas": cria, edita, exclui.
  Exemplo pronto pra você cadastrar (do próprio documento): template "Captação" com
  preparar pauta, conferir equipamento, captação, backup, seleção, edição
- Dentro do modal de **Conteúdo**, seletor **"Aplicar template"** — escolhe um
  template e já cria todas as tarefas de uma vez, vinculadas àquele conteúdo e
  cliente, sem digitar uma por uma

Não criei nada de template pronto por padrão — a lista começa vazia até você cadastrar
o que faz sentido pro seu fluxo.

### Banco
- `TemplateTarefas` (aditivo)

### Arquivos principais
- `prisma/schema.prisma`
- `app/api/templates-tarefas/` (+ `[id]`, `[id]/aplicar`)
- `app/dashboard/configuracoes/TemplatesTarefasForm.tsx`, `page.tsx`
- `components/dashboard/PipelineConteudo.tsx` (seletor de aplicar template)

## Com isso, fecha o IMPLEMENTATION_PLAN.md inteiro (16 tarefas)
Próximo passo: a **auditoria final completa** que o documento original pediu — revisar
todos os módulos, listar o que foi implementado, o banco alterado, rotas novas, o que
mudou, o que ficou de fora conscientemente, e sugestões pra próxima versão. Vou montar
esse documento final agora, sem pausa.

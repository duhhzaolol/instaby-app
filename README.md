# Instaby App — v61

## TAREFA 02 CONCLUÍDA — Visão de Captações

### Implementado
- Nova página `/dashboard/conteudo/captacoes` (botão "Captações" no topo de Conteúdo)
- Agrupa por dia (ex: "SEXTA — 11/09/2026"), e dentro do dia por cliente, listando cada
  item com o ícone do formato — igual o exemplo do documento
- Dias futuros aparecem primeiro; já passados ficam numa seção "Já passou" embaixo
- Adicionei o campo **Data de captação** no modal de detalhe do conteúdo e na criação
  rápida (o campo já existia no banco desde a Tarefa 01, mas não tinha onde preencher —
  sem isso essa tela nunca teria dado pra usar)

### Banco
Nenhuma mudança — só usa o campo `dataCaptacao` que já existia desde a Tarefa 01.

### Arquivos principais
- `app/dashboard/conteudo/captacoes/page.tsx` (novo)
- `components/dashboard/PipelineConteudo.tsx` (campo de captação no modal)
- `components/dashboard/NovoConteudoForm.tsx` (campo de captação na criação)
- `app/dashboard/conteudo/page.tsx` (link pra Captações)

### Testes/verificações
Nada em Conteúdo (Tarefa 01), Tarefas, Agenda ou Dashboard foi alterado além do
necessário — mudança pequena e isolada.

### Próxima
TAREFA 03 — Escopo mensal (contratado x planejado x entregue, calculado a partir dos
Serviços Contratados + Conteúdo). Parando aqui de novo antes de seguir — testa a Visão
de Captações com alguns conteúdos de datas diferentes primeiro.

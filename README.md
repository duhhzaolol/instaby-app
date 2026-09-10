# Instaby App — v62

## TAREFA 03 CONCLUÍDA — Escopo mensal

### Implementado
- `Servico` ganhou um campo opcional **"Formato de conteúdo"** — liga um serviço tipo
  "8 Reels por mês" ao formato "Reel" (configurável em Serviços → editar qualquer
  serviço; se não for um formato de conteúdo, deixa em branco, como reunião ou
  orçamento)
- Nova aba **"Escopo"** dentro do cliente: mostra, pra cada serviço contratado ligado a
  um formato, quanto foi **contratado**, **entregue** (Conteúdo com status Publicado),
  **planejado** (qualquer status entre Planejado e Aprovado) e **faltando**, com barra
  de progresso — tudo calculado a partir do que já existe, nada digitado na mão
- Sem serviço vinculado a um formato, a aba simplesmente avisa e explica como ligar —
  não força nada

### Banco
- `Servico.formatoConteudo` (String, opcional) — aditivo, não mexe em serviço nenhum
  que já existe

### Arquivos principais
- `prisma/schema.prisma`
- `app/api/servicos/route.ts` e `[id]/route.ts`
- `app/dashboard/servicos/[id]/editar/EditarServicoForm.tsx` e `page.tsx`
- `app/dashboard/clientes/[id]/page.tsx` (aba Escopo + cálculo)

### Testes/verificações
Nada em Serviços, Clientes, Conteúdo ou Orçamento foi alterado além da adição do campo
— serviço sem o campo preenchido continua funcionando exatamente como antes em
orçamento/contrato/proposta pública.

### Pendência conhecida
O cálculo hoje é sempre do **mês atual**, sem navegação entre meses (o exemplo do
documento era "Setembro/SkyFit" — cobre isso, mas não dá pra olhar agosto depois que
setembro passar). Se isso for importante no seu uso, é rápido de adicionar.

### Próxima
TAREFA 04 — Projetos (agrupar tarefa/conteúdo/hora/despesa/cobrança sob um trabalho
específico, opcional). Parando aqui de novo — essa é justamente uma das partes que eu
questionei se você vai usar de verdade (Conteúdo já cobre bastante do que "Projeto"
serviria pra você sozinho). Vale confirmar antes de eu construir.

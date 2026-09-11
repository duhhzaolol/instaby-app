# Instaby App — v74

## TAREFA 14 — Aprovação pública, Solicitações, Templates

### 1. Aprovação pública de conteúdo
Dentro do modal de qualquer conteúdo (`/dashboard/conteudo`), botão **"Enviar pra
aprovação do cliente"** — gera um link público (`/aprovacao/[token]`), muda o status
pra "Aguardando aprovação". O cliente abre o link, vê o material (link de arquivo),
legenda, data prevista, e tem dois botões:
- **Aprovar** (com nome opcional, registrado)
- **Pedir alteração** (com comentário obrigatório — ex: "trocar a cena dos 00:12") →
  volta pro status "Alteração solicitada", com o comentário salvo

Marca sozinho quando foi visto pela primeira vez.

### 2. Solicitações do cliente
Nova aba **"Solicitações"** no cliente — registra pedidos que chegam fora do fluxo
normal ("cria um Reel extra pra domingo"). Tem prioridade e um marcador **"Fora do
escopo"**, que sinaliza quando algo pode precisar de orçamento adicional.

### 3. Templates (versão focada no que mais importa)
Em vez de um construtor de templates genérico e grande, fiz o mais valioso primeiro:
o checklist de **Onboarding** virou configurável — Configurações → "Checklist padrão
de onboarding". Adiciona, remove, reordena os itens que aparecem toda vez que você
clica em "Iniciar onboarding" num cliente novo. Se não mexer em nada, usa o checklist
original de 17 itens.

### Banco
- `Conteudo`: `tokenAprovacao`, `enviadoAprovacaoEm`, `visualizadoAprovacaoEm`,
  `aprovadoEm`, `aprovadoPor`, `comentarioAprovacao` (aditivos)
- `Solicitacao` (nova, aditiva)
- `Configuracao.templateOnboarding` (aditivo)

### Arquivos principais
- `prisma/schema.prisma`
- `app/api/conteudos/[id]/enviar-aprovacao/`, `app/api/aprovacao/[token]/`
- `app/aprovacao/[token]/page.tsx` (pública) + `AcoesAprovacao.tsx`
- `components/dashboard/PipelineConteudo.tsx` (botão de enviar)
- `app/api/clientes/[id]/solicitacoes/`, `app/api/solicitacoes/[id]/`
- `app/dashboard/clientes/[id]/SolicitacoesTab.tsx`
- `app/api/clientes/[id]/onboarding/route.ts` (usa o template configurado)
- `app/dashboard/configuracoes/TemplateOnboardingForm.tsx`

## Continuando
Próxima: TAREFA 15 (Agenda com camadas + Dashboard "Precisa da sua atenção" + Central
de Comando expandida — sem IA, como o documento pediu). Seguindo.

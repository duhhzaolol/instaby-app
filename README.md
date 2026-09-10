# Instaby App — v64

## TAREFA 06 CONCLUÍDA — Múltiplos contatos

### Implementado
Nova aba **"Contatos"** dentro do cliente (logo depois de Visão Geral). Cada contato
tem nome, cargo, WhatsApp, e-mail, e flags de responsabilidade (Principal, Financeiro,
Aprovação de conteúdo, Assina contratos) — pra você saber quem procurar quando precisar
de algo específico.

### Sobre o contato antigo
O campo único que já existia (`Cliente.contatoNome`) **não foi tocado nem migrado
automaticamente** — segui a regra do documento de não inventar dado sem confirmação.
Ele aparece na própria aba Contatos como "Contato do cadastro", só como referência (e
continua editável onde sempre foi, na tela de editar cliente). Se um cliente não tiver
nenhum Contato novo cadastrado ainda, é só isso que aparece — nada quebra.

### Banco
- Novo model `Contato` (aditivo) — cliente, nome, cargo, telefone, whatsapp, email,
  observações, e as 4 flags booleanas

### Arquivos principais
- `prisma/schema.prisma`
- `app/api/clientes/[id]/contatos/route.ts` e `app/api/contatos/[id]/route.ts`
- `app/dashboard/clientes/[id]/ContatosTab.tsx` (novo)
- `app/dashboard/clientes/[id]/page.tsx`

### Testes/verificações
Nada em Cliente (cadastro, edição, orçamento, contrato) foi alterado.

### Próxima
TAREFA 07 — Links e referências do cliente (Drive, Canva, redes sociais, etc — hoje só
tem 1 link do Drive). Seguindo.

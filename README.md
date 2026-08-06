# Instaby App

Painel interno da Instaby Agência — v3.

## O que já está pronto nesta versão

- Estrutura do projeto (Next.js + Prisma + Tailwind, mesmo padrão do JM Team)
- Schema completo do banco (`prisma/schema.prisma`): Cliente, Tarefa, Serviço,
  Orçamento, ItemOrcamento, Contrato, Cobrança, Despesa, Depoimento
- Login funcional (e-mail + senha) protegendo a rota `/dashboard`
- Módulo de Cliente completo: lista com filtro por status, cadastro,
  detalhe com abas (Tarefas funcional)
- Catálogo de serviços (`/dashboard/servicos`) — cadastre os serviços da
  agência uma vez, com nome, descrição, categoria e valor
- Construtor de orçamento por cliente: seleciona os serviços em pílula,
  ajusta quantidade, calcula o total e gera a página pública
- Página pública `/orcamento/[slug]` — sem login, mostra os serviços com
  descrição e valor, e um botão "Aceitar proposta" que já: marca o orçamento
  como aceito, cria a cobrança automaticamente e muda o status do cliente
  pra Ativo

## O que falta (próximas entregas)

- Seções "Nosso processo" e depoimentos na página pública (refinamento visual)
- Financeiro (cobranças + despesas, visão de lucro)
- Contrato (rascunho gerado do orçamento aceito)

## Antes de usar

Cadastre pelo menos um serviço em `/dashboard/servicos` antes de tentar
gerar um orçamento pra um cliente — sem isso não tem o que selecionar.

## Como publicar (mesmo fluxo do Juninho App)

1. Suba esses arquivos pro GitHub (Add file → Upload files)
2. Crie um banco no Neon e copie a `DATABASE_URL`
3. Crie um projeto no Vercel apontando pro repositório, com as variáveis de
   ambiente de `.env.example` preenchidas
4. Rode `npx prisma migrate dev --name init` localmente antes do primeiro
   deploy, pra criar as tabelas
5. Crie seu usuário de acesso direto no banco (ou me avise quando estiver no
   ar que eu preparo uma rota de seed pra isso)

# Instaby App

Painel interno da Instaby Agência — v1 (esqueleto inicial).

## O que já está pronto nesta versão

- Estrutura do projeto (Next.js + Prisma + Tailwind, mesmo padrão do JM Team)
- Schema completo do banco (`prisma/schema.prisma`): Cliente, Tarefa, Serviço,
  Orçamento, ItemOrcamento, Contrato, Cobrança, Despesa, Depoimento
- Login funcional (e-mail + senha) protegendo a rota `/dashboard`
- Dashboard inicial mostrando os 3 módulos

## O que falta (próximas entregas)

- Telas de Cliente (lista + detalhe com abas)
- Construtor de orçamento (seleção de serviços em pílula)
- Página pública do orçamento (`/orcamento/[slug]`)
- Financeiro (cobranças + despesas)
- Contrato (rascunho gerado do orçamento)

## Como publicar (mesmo fluxo do Juninho App)

1. Suba esses arquivos pro GitHub (Add file → Upload files)
2. Crie um banco no Neon e copie a `DATABASE_URL`
3. Crie um projeto no Vercel apontando pro repositório, com as variáveis de
   ambiente de `.env.example` preenchidas
4. Rode `npx prisma migrate dev --name init` localmente antes do primeiro
   deploy, pra criar as tabelas
5. Crie seu usuário de acesso direto no banco (ou me avise quando estiver no
   ar que eu preparo uma rota de seed pra isso)

# Instaby App

Painel interno da Instaby Agência — v3.1.

## O que já está pronto nesta versão

- Estrutura do projeto (Next.js + Prisma + Tailwind, mesmo padrão do JM Team)
- Schema completo do banco (`prisma/schema.prisma`): Cliente, Tarefa, Serviço,
  Orçamento, ItemOrcamento, Contrato, Cobrança, Despesa, Depoimento
- Login funcional (e-mail + senha) protegendo a rota `/dashboard`
- Módulo de Cliente completo: lista com filtro por status, cadastro,
  detalhe com abas (Tarefas funcional)
- Catálogo de serviços (`/dashboard/servicos`)
- Construtor de orçamento por cliente com pílulas de serviço
- Página pública `/orcamento/[slug]` com botão de aceitar (gera cobrança e
  ativa o cliente automaticamente)
- O build agora sincroniza o banco sozinho (não precisa rodar nenhum comando
  no terminal) e existe uma rota pra criar seu login direto pelo navegador

## O que falta (próximas entregas)

- Seções "Nosso processo" e depoimentos na página pública
- Financeiro (cobranças + despesas, visão de lucro)
- Contrato (rascunho gerado do orçamento aceito)

## Como colocar no ar e criar seu login (sem terminal)

1. Suba os arquivos no GitHub (via GitHub Desktop)
2. No Neon, crie o banco e copie a `DATABASE_URL`
3. No Vercel, conecte o repositório e preencha as variáveis de ambiente de
   `.env.example` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`,
   `SETUP_SECRET` — pode inventar qualquer texto aleatório pros dois
   secrets, só não pode ficar em branco)
4. Espere o deploy terminar — o build já cria as tabelas no banco sozinho
5. Abra no navegador (troque pelos seus dados e pelo mesmo `SETUP_SECRET`
   que você colocou no passo 3):

   ```
   https://SEU-DOMINIO/api/setup?secret=SEU_SETUP_SECRET&email=voce@email.com&senha=suasenha
   ```

6. Vai aparecer uma mensagem confirmando — pronto, já pode entrar em
   `/login` com esse e-mail e senha. Essa rota só funciona uma vez (trava
   sozinha depois que o primeiro usuário existe), então pode deixar o link
   de lado depois de usar

## Como publicar (mesmo fluxo do Juninho App)

1. Suba esses arquivos pro GitHub (Add file → Upload files)
2. Crie um banco no Neon e copie a `DATABASE_URL`
3. Crie um projeto no Vercel apontando pro repositório, com as variáveis de
   ambiente de `.env.example` preenchidas
4. Rode `npx prisma migrate dev --name init` localmente antes do primeiro
   deploy, pra criar as tabelas
5. Crie seu usuário de acesso direto no banco (ou me avise quando estiver no
   ar que eu preparo uma rota de seed pra isso)

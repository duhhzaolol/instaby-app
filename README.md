# Instaby App — v101

## Hero e "Quem somos": banner de fundo intacto, texto sempre por cima

Reportado com print: o jeito que a imagem de abertura e a foto de "Quem somos"
apareciam (empilhada embaixo do texto, ou lado a lado) não tinha nada a ver
com a referência pedida — o certo é a foto ficar inteira, intacta, como fundo
de um card, com o texto (que você edita) sempre por cima, igual a seção de
Portfólio em destaque já fazia.

Corrigido: as duas seções (Hero e Quem somos) agora seguem esse mesmo padrão
— banner ocupando o card inteiro, com um gradiente escuro sutil só pra dar
contraste, e o texto (editável no painel, sem precisar mexer na imagem)
posicionado por cima. Tamanho recomendado do banner mudou pra 1920×1080px
(formato bem largo) nos dois — e a orientação agora deixa claro: mande a
imagem **sem nenhum texto escrito nela**, porque o texto já é renderizado
por cima automaticamente.

## v100 — Correção: site e /link não atualizavam sozinhos

Reportado: depois de adicionar banners/fotos em Configurações → Site & Link na
bio, o site (`/`) não mudava nada.

Causa: `/` e `/link` não tinham nenhuma instrução dizendo "busque os dados de
novo a cada visita" — por padrão, a Vercel trata essas páginas como estáticas
(gera uma "foto" delas no momento do deploy e serve sempre essa mesma foto).
Então salvar algo no painel funcionava certinho no banco, só não aparecia no
site até o próximo deploy.

Corrigido: as duas páginas ganharam `export const dynamic = "force-dynamic"`,
que faz elas buscarem o conteúdo direto do banco a cada visita — qualquer
edição salva no painel (textos, imagens, links) aparece no site na hora, sem
precisar de novo deploy.

(Separado disso: também foi resolvido o erro de "No token found" no upload de
fotos — faltava conectar um Blob Store ao projeto na Vercel, feito direto no
painel da Vercel.)

## v99 — Página /link redesenhada, seguindo a nova referência

Você mandou um novo print, mais elaborado, específico pra página `/link` (foto de
topo, nome "INSTABY" grande, tagline estilo assinatura, frase de impacto com
sublinhado vermelho, linha de tags, links com ícone+subtítulo, um card grande de
destaque com foto, e ícones de redes sociais no fim). Essa versão redesenha a
página pra seguir essa referência e expande o painel de edição pra você controlar
tudo isso sozinho, sem mexer em código.

### O que dá pra editar agora em Configurações → Site & Link na bio → Página de links
- **Foto de topo** (fundo do topo da página, recomendado 1080×1350px).
- **Tagline pequena** (a frase estilo assinatura no canto da foto, ex: "Mais que
  uma agência.").
- **Frase de abertura** (o título grande com o sublinhado vermelho).
- **Linha de tags** (texto pequeno em caixa alta, ex: "MARCA · CONTEÚDO ·
  TRÁFEGO · RESULTADO").
- **Redes sociais** (Instagram/YouTube/TikTok/LinkedIn) — só aparece o ícone se
  você preencher o link.
- **Rodapé** (texto livre).
- Cada link agora também tem um **subtítulo opcional** (ex: "Atendimento
  rápido") e pode ser marcado como **destaque**, o que faz ele aparecer como um
  card grande com foto no fim da lista (tamanho recomendado 600×400px, contra
  200×200px dos links normais).

### Banco de dados
Aditivo: `Configuracao` ganhou 7 campos novos (todos opcionais — foto/tagline/
tags/redes sociais da página /link); `LinkBio` ganhou `descricao` (subtítulo) e
`destaque` (Boolean). Nenhum campo existente mudou.

## v98 — Painel de edição do Site & Link na bio

Você vai refazer o visual do site com outra IA — isso não muda aqui. O que essa
versão entrega é a "sala de controle": um lugar dentro do painel (Configurações →
Site & Link na bio) pra você editar o conteúdo sozinho, sem precisar mexer em código
nem me chamar toda vez.

### O que dá pra editar agora
- **Textos e imagens do site** (`/`): frase de impacto do topo, subtítulo, imagem de
  abertura, texto e foto de "Quem somos", e o rodapé — cada campo de imagem já
  mostra o tamanho recomendado em pixel antes de você enviar.
- **Portfólio**: adicione quantos trabalhos quiser, com foto de capa, categoria/tags,
  link "Ver case" opcional, marque como "destaque" (aparece grande) e reordene com
  as setas. Enquanto estiver vazio, o site mostra os placeholders "Em breve" de
  sempre.
- **Página de links** (`/link`, estilo Linktree): adicione links com foto de capa
  (200×200px), texto e endereço, reordene com as setas, e edite a frase de abertura
  e o rodapé da página (textos livres, sem ser link).

Tudo isso é aditivo — se você não configurar nada, o site continua exatamente como
está hoje (os textos padrão continuam no código como fallback).

### Banco de dados
Aditivo: `Configuracao` ganhou 8 campos novos (todos opcionais — hero/sobre/rodapé do
site e intro/rodapé do link na bio); dois models novos, `CaseTrabalho` (portfólio) e
`LinkBio` (links da página /link).

### Upload de imagem
Nova rota genérica `/api/upload-imagem` (Vercel Blob, igual ao upload de logo, mas
sem a remoção de fundo — não faz sentido pra fotografia).

## v97 — Ajuste: "Sem classificação" não devia incluir retiradas

Reportado com print: o filtro "⚠️ Sem classificação" em Contas a Pagar estava
trazendo junto lançamentos como "Pró Labore" e "perfume" marcados como "Retirada
pessoal" — mas esses JÁ estão classificados (como transferência/retirada), só não
entram na DRE por não serem despesa operacional. Misturar os dois na mesma bandeira
de alerta estava errado — retirada não é um dado faltando, é uma escolha válida.

Corrigido: "Sem classificação" agora é só o que realmente não tem categoria nenhuma
(nem em Contas a Pagar, nem no aviso da DRE, nem no card do Dashboard). A DRE ganhou
uma segunda linha, neutra (sem cor de alerta), avisando o total de retiradas/
transferências do período separado do aviso de sem classificação.

## v96 — Correção de build da v95

O deploy da v95 quebrou no Vercel: erro de tipo TypeScript em
`app/dashboard/financeiro/page.tsx` — uma consulta que eu tinha removido do
`Promise.all` continuou sendo esperada na lista de variáveis, desalinhando a posição
de `patrimonioAtivo`. Corrigido (lista de variáveis e lista de consultas agora com a
mesma quantidade, 7 cada). Não há outra mudança nessa versão além dessa correção.

## v95 — Financeiro: DRE, Fluxo de Caixa e Patrimônio separados (mas conectados)

Baseado no seu documento sobre não misturar o conceito da DRE com o saldo do banco.
Resumo: a DRE mostra lucro/prejuízo da operação; o que precisa bater com a conta é o
Fluxo de Caixa; e os bens da empresa (câmera, computador, móveis...) viraram
Patrimônio, num lugar só.

**Boa notícia**: a DRE (`/dashboard/financeiro/dre`) já estava certa nesse ponto —
já excluía investimentos do lucro operacional e já avisava sobre isso. Não mexi na
conta dela, só melhorei a apresentação.

### Novo
- **Patrimônio** (`/dashboard/financeiro/patrimonio`) — lista de bens da empresa,
  com valor de aquisição e valor atual estimado (editável, pra acompanhar
  depreciação/revenda), status (Em uso / Vendido / Baixado). Cadastro manual ou
  automático: ao lançar uma despesa como "Investimento/Ativo", o sistema pergunta
  "Adicionar este item ao patrimônio da empresa?" — se sim, o bem já nasce vinculado.
- **Fluxo de Caixa** (`/dashboard/financeiro/fluxo-de-caixa`) — saldo inicial +
  entradas − saídas efetivamente pagas/recebidas = saldo final, com a linha do
  tempo de movimentações do período. É esse número que deve bater com o banco
  (a DRE nunca teve esse objetivo).
- **DRE**: aviso de "despesas sem classificação" agora é clicável, leva direto pra
  Contas a Pagar já filtrado. O resumo de investimentos ganhou a conta explícita —
  Lucro operacional − Investimentos = Geração de caixa após investimentos — com
  link pro Fluxo de Caixa completo.
- **Financeiro (Visão geral)**: 4 cards novos acima dos que já existiam (Entradas/
  Custos/Lucro continuam do jeito que estavam) — Saldo atual, Resultado do mês,
  Variação de caixa e Patrimônio.
- **Contas a Pagar**: filtros novos de categoria (incluindo "Sem classificação") e
  período (mês atual/anterior), além das abas de status que já existiam. O card de
  "Despesas sem classificação" no Dashboard agora abre direto nesse filtro.

### Banco de dados
Aditivo: novo model `Patrimonio` (nome, categoria, valor de aquisição, valor atual,
status, despesa de origem opcional). Nenhum campo existente mudou.

Detalhe completo na seção "FASE — Financeiro" do `IMPLEMENTATION_PLAN.md`.

## v94 — Ajuste pequeno + revisão final

- Página pública do contrato (`/contrato/[id]`) agora mostra um selo "Ver PDF
  assinado" ao lado do status, quando o contrato tem arquivo anexado (novidade da
  v92) — o cliente consegue baixar o PDF de qualquer hora pelo mesmo link que já
  tinha.
- `AUDITORIA_FINAL.md` atualizado com o resumo da Fase 1 + Fase 2 dessa rodada
  (estava desatualizado desde a remoção do módulo Conteúdo).
- Revisão manual (rule de sempre: sem acesso de rede ao binário do Prisma nesse
  sandbox, então sem build/typecheck real aqui) confirmando que não sobrou
  referência órfã de nada removido nessa rodada inteira (gráficos do Financeiro,
  camada financeira da Agenda, módulo Conteúdo).

## Fase 2 — Landing Page, /link e /app

Depois da Fase 1 (v92 — painel), essa versão entrega a parte de rotas públicas do
documento grande:

- **`/`** virou a Landing Page pública da Instaby — Hero, Quem somos, Serviços,
  Portfólio (placeholder), Clientes/depoimentos, Diferenciais, Processo, CTA
  WhatsApp. Sem preços.
- **`/link`** — página de links estilo Linktree (WhatsApp, Site, Instagram...).
  Lista de links fica num array simples no topo de `app/link/page.tsx` — fácil de
  editar/adicionar depois.
- **`/app`** — atalho de entrada pro sistema administrativo, redireciona pra
  `/dashboard` (que continua sendo a árvore real do painel, protegida pelo
  middleware de sempre). Não recriei o painel embaixo de `/app` — só criei o
  atalho com o nome que o documento pediu, sem duplicar nada.
- `/login` não mudou.

Detalhe completo na seção "FASE 2" do `IMPLEMENTATION_PLAN.md`.

## Fase 1 da atualização grande (Landing/Agenda/Financeiro conservador)

Esse documento grande pedia bastante coisa, mas de forma explicitamente
conservadora em várias áreas ("não mexer", "não recriar do zero"). Essa versão
entrega a parte de menor risco e maior impacto no dia a dia — a parte que mexe em
rotas públicas (Landing Page, `/link`, reestruturação pra `/app`) ficou de fora,
aguardando sua confirmação antes de tocar em algo que afeta o domínio público.

Detalhe completo de tudo que mudou está no `IMPLEMENTATION_PLAN.md`, na seção
"FASE — Atualização grande". Resumo rápido:

### Corrigido
- **"Próxima cobrança" vazia no cliente**: causa raiz era a mesma classe de bug já
  corrigida nas despesas recorrentes — a mensalidade configurada nunca virava uma
  Cobrança de verdade todo mês. Agora vira, automaticamente.
- Link quebrado "Novo conteúdo" no Dashboard (apontava pra rota que não existe mais).

### Novo
- Logo sempre volta pra Visão Geral.
- Clientes agrupados por status (Ativos/Avulsos/Leads/Inativos), seções recolhíveis.
- Anexar PDF do contrato assinado (upload via Vercel Blob), marca como assinado
  automaticamente.
- Ícone de ajuda contextual (?) em Clientes, Tarefas, Serviços, Horas, Financeiro,
  Agenda, Relatórios e Solicitações.
- Calendário financeiro na Visão Geral do Financeiro (dia a dia, clicável).
- Agenda: tarefas e horas trabalhadas classificadas em tipos (Captação, Edição,
  Reunião, Trabalho interno, Compromisso), com filtros e clique-no-dia pra ver tudo.
- Horas: calendário mostra até 3 atividades por dia (nome do cliente em destaque),
  "+N atividades" quando tem mais.

### Removido
- Seção duplicada "Clientes ativos" no Dashboard (já tem card de métrica pra isso).
- Gráficos de linha da Visão Geral do Financeiro (não agregavam informação — dados
  continuam disponíveis pelo novo calendário financeiro e pelos cards de resumo).
- Informação financeira (cobranças vencendo) da Agenda — fica só no Financeiro.

### Não mudou (por instrução explícita do documento)
DRE, Contas a Pagar, Contas a Receber, Comercial (Oportunidades). Nenhum cálculo
financeiro existente foi alterado — só reorganização visual.

## Arquivos novos
- `lib/garantirRecorrentes.ts` — unifica a geração de despesas recorrentes (já
  existia, movida do Financeiro) com a nova geração de cobranças mensais.
- `lib/tipoAtividadeAgenda.ts` — classifica tarefas/horas em tipos de atividade.
- `components/ui/AjudaContextual.tsx` — ícone de ajuda reutilizável.
- `components/dashboard/ClienteCard.tsx` / `ClientesAgrupados.tsx`
- `components/dashboard/CalendarioFinanceiro.tsx`
- `app/api/upload-contrato/route.ts`

## Banco de dados
Dois campos novos, aditivos (não quebram dados existentes):
- `Cliente.dataInicioContrato` (já existia desde a v81/82)
- `Contrato.arquivoUrl` (novo nessa versão)

Depois de subir pro Vercel, o build já roda `prisma db push` sozinho (conforme seu
fluxo atual) — nenhum comando extra necessário.

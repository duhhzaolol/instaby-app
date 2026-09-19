# Instaby App — v105

## Cor dos textos sobre os banners, escolhível pelo painel

Pedido: poder escolher a cor de todos os textos que ficam em cima das fotos de
fundo (abertura, "Quem somos" e chamada final), de um jeito prático.

- Em Configurações → Site & Link na bio, novo bloco **"Cor dos textos sobre
  os banners"**, com dois seletores de cor (clique no quadrado ou cole um
  código hex): um pra **títulos** e outro pra **textos/legendas**. Um controla
  de uma vez só a cor em todas as três seções com foto de fundo — não precisa
  configurar seção por seção. Tem uma prévia ao vivo logo abaixo dos
  seletores.
- Também tornei essas cores mais robustas no código: antes elas vinham de
  classes do Tailwind (`text-white`, `text-white/75`); agora são aplicadas
  diretamente no elemento, então sempre saem exatamente na cor que você
  escolher, sem depender de nenhuma classe.
- Sobre o print que você mandou (só o parágrafo do "Quem somos" aparecendo
  escuro, título e botão normais): o padrão é bem típico de **texto
  selecionado no navegador** (um clique-arrasto ou triple-click sem querer)
  — o navegador troca a cor de seleção e pode parecer preto. Se depois de
  configurar a cor aqui ainda aparecer escuro sem estar selecionado, me avisa
  com um print novo que eu vou fundo nisso.

### Banco de dados
Aditivo: `Configuracao` ganhou `siteCorTitulo` e `siteCorTexto` (ambos hex,
opcionais — vazio usa branco, o padrão de antes).

## v104

## Correção: datas erradas depois das 21h (fuso de Brasília vs. UTC)

Reportado com print: no calendário de Horas, ainda não era dia 19 e o app já
marcava o dia 19 como "hoje". Causa raiz: várias telas calculavam "hoje" (ou
a data de um registro) convertendo direto pra UTC (`toISOString()`), sem
considerar o fuso de Brasília (UTC-3). Como o servidor da Vercel roda em UTC,
depois das 21h daqui (horário de Brasília) o relógio dele já virou o dia
seguinte — então qualquer cálculo de "hoje" feito assim ficava um dia
adiantado, todo santo dia, das 21h à meia-noite.

Essa mesma classe de bug já tinha sido corrigida antes na Agenda (por isso lá
não acontecia) — mas ainda estava presente em outras 6 telas:

- **Horas** (calendário geral e por cliente): "hoje" errado destacado no
  calendário, e um registro de horas lançado depois das 21h podia cair
  agrupado no dia seguinte.
- **Concluir tarefa com "registrar horas"**: se você concluísse uma tarefa
  depois das 21h e marcasse pra registrar o tempo gasto, o registro nascia
  com a data do dia seguinte.
- **Formulário "Registrar horas" (novo registro avulso)**, **Patrimônio
  (novo bem)**, **Nova despesa (Financeiro)** e **Nova conta a pagar**: o
  campo de data já abria pré-preenchido com o dia seguinte, depois das 21h.

Corrigido usando o fuso de Brasília explicitamente em todos esses pontos —
nas telas que rodam no servidor, com `timeZone: "America/Sao_Paulo"`; nos
formulários que rodam no navegador, com a data local do próprio navegador
(que já é a de Brasília) em vez de convertida pra UTC.

### O que eu validei
Revisão manual de cada arquivo alterado — não tem como rodar o build aqui.
Nenhuma mudança de schema nessa versão, só lógica de data.

## v103

## Redesign completo do site, seguindo o material de referência completo (14 itens)

Implementação da especificação completa que você mandou de novo em `.txt`
(a versão sem corte). Cobre estrutura, visual, separação imagem/texto,
cabeçalho, Hero, Serviços, "Quem somos" + Diferenciais, Portfólio, Processo,
chamada final e Rodapé — tudo editável pelo painel, nada hard-coded como
imagem com texto embutido.

**Pronto e funcionando (código revisado manualmente — ver observação sobre
testes no fim):**

- **Cabeçalho**: logo, menu com 5 itens (Início/Serviços/Portfólio/Sobre/
  Contato), botão "Falar no WhatsApp" com contorno vermelho, e menu mobile
  (hambúrguer) com os mesmos links.
- **Hero**: banner de fundo de ponta a ponta (com foco de imagem e versão
  mobile opcional), badge pequeno, título com uma palavra/trecho em dourado
  (você escolhe qual, no painel), subtítulo, botões "Falar no WhatsApp" e
  "Ver serviços", e uma linha de até 3 indicadores — **fica oculta
  automaticamente enquanto você não preencher valor+legenda dos dois campos
  de pelo menos um indicador**, então não aparece nenhum número inventado.
- **Serviços**: os 8 serviços (nome, descrição e destino de cada um editáveis
  no painel), grade 4×2, cabeçalho com título à esquerda e "Ver todos os
  serviços" à direita.
- **"Quem somos"**: banner de fundo + texto por cima (mesmo padrão do Hero),
  agora com um botão de chamada (texto e destino editáveis).
- **Diferenciais**: faixa compacta com os 4 itens (Proximidade, Agilidade,
  Transparência, Foco em resultado) logo abaixo do "Quem somos", cada um
  editável.
- **Portfólio**: o(s) trabalho(s) marcado(s) como "destaque" aparece(m)
  grande, com nome, categoria, descrição, botão e (se você preencher)
  resultados num painel sobre a imagem; com mais de um destaque, aparecem
  contador e setas pra alternar. Os demais trabalhos aparecem no grid normal.
  Cada trabalho tem uma página própria em `/portfolio/[id]` (nova) — usada
  quando o campo "link" do trabalho está vazio; se você preencher um link
  externo, o botão vai pra esse link em vez da página interna. **Com poucos
  cases cadastrados, o site mostra só o que existe — não duplica nada pra
  preencher espaço.**
- **Processo**: faixa vermelha escura, com os 4 passos fixos (Diagnóstico →
  Estratégia → Execução → Acompanhamento) e um texto+botão editáveis do lado
  do título.
- **Chamada final**: banner de fundo (imagem própria, diferente do Hero/
  Sobre) com título, texto e botão editáveis por cima.
- **Rodapé**: logo, os mesmos links de navegação + `/link` + painel, ícones
  de redes sociais (reaproveitando os links já cadastrados na aparência da
  página `/link` — Instagram/YouTube/TikTok/LinkedIn), região de atendimento
  e direitos autorais editáveis separadamente, e a frase institucional.
- **Painel** (Configurações → Site & Link na bio): reorganizado em blocos por
  seção, com 3 formulários novos (Serviços, Diferenciais, Processo/chamada
  final) somados aos já existentes. Cada campo de imagem mostra prévia,
  onde ela aparece, tamanho recomendado (largura×altura), proporção,
  formatos aceitos, limite de tamanho do arquivo e uma dica curta de
  composição — além do ajustador de ponto de enquadramento e da imagem
  alternativa pro celular, quando fazem sentido pra aquele campo.

**O que eu validei:** conferi manualmente (não tem como rodar `npm run
build`/`prisma generate` neste ambiente, mas isso já era assim antes) que:
o esquema do banco só ganhou campos novos e opcionais — nada foi removido
ou renomeado; toda leitura/gravação de API bate com os nomes desses campos;
e a contagem de itens dos `Promise.all` em `app/page.tsx` e nas páginas do
painel está correta (esse é o tipo exato de erro que já quebrou um build de
produção antes neste projeto). O que eu **não** validei é a aparência
renderizada de fato — não tenho como abrir o site e comparar visualmente com
a imagem de referência daqui; isso só se confirma depois do deploy.

**O que ainda falta pra bater 100% com a referência, e não está pronto:**
- **Indicador de item ativo no menu ao rolar a página** ("scroll-spy") — o
  menu tem os 5 links, mas não destaca automaticamente qual seção você está
  vendo.
- **"Ver todos os serviços" e "Ver todos os cases"** hoje continuam
  apontando pra dentro da própria página (âncora `#servicos`/`#portfolio`) —
  a referência sugere que podem ser páginas dedicadas, mas isso não foi
  pedido explicitamente nem existe conteúdo pra elas ainda. Me avise se quer
  que eu crie páginas de listagem completas pra Serviços e/ou Portfólio.
- **Validação automática de resolução de imagem enviada** (avisar se a foto
  está com qualidade baixa pro tamanho recomendado) não foi implementada —
  o painel só mostra o tamanho recomendado como texto, não mede a imagem.

**Conteúdo/imagens reais que só você pode fornecer** (nenhum dado fictício
foi publicado como se fosse real):
- Foto **sem texto/botão embutido** pra fundo do Hero, do "Quem somos" e da
  chamada final — hoje, sem elas, cada seção usa um fundo neutro/gradiente.
- Números reais dos indicadores do Hero (projetos entregues, clientes
  atendidos, etc.) — ficam ocultos até você preencher.
- Conteúdo real dos trabalhos do portfólio: os 3 cadastrados agora são só
  exemplos de teste (como você avisou) — nome, categoria, descrição,
  imagem, resultados e (se quiser) descrição completa de cada case real.
- Se algum dia quiser simular uma conversa de WhatsApp na imagem da chamada
  final, ela precisa ser fictícia — nunca uma print de conversa real.

### Banco de dados
Aditivo, sem remover nem renomear nada: `Configuracao` ganhou
`siteHeroTituloDestaque`, `siteHeroIndicadores` (Json), `siteServicos`
(Json), `siteDiferenciais` (Json), `siteSobreBotaoTexto`, `siteSobreBotaoUrl`,
`siteProcessoTexto`, `siteProcessoBotaoTexto`, `siteProcessoBotaoUrl`,
`siteCtaTitulo`, `siteCtaTexto`, `siteCtaBotaoTexto`, `siteCtaImagemUrl`,
`siteCtaImagemUrlMobile`, `siteCtaFoco`, `siteRodapeRegiao`,
`siteRodapeDireitos`. `CaseTrabalho` ganhou `imagemFoco`, `descricao`,
`descricaoCompleta`, `botaoTexto`, `resultados` (Json). Nova rota pública
`/portfolio/[id]`.

## v102

## Site: banners de ponta a ponta, sem cartão/linhas, e Serviços compactos

Mandou instruções detalhadas com uma referência visual pra deixar o site mais
fiel ao layout combinado. Aplicado (itens 1 a 4 do que você mandou — a
mensagem cortou no meio do item de Serviços, então Portfólio/Diferenciais/
Processo/CTA/Rodapé ficaram de fora dessa rodada, aguardando o resto do
pedido):

- **Hero e "Quem somos"**: o banner agora ocupa a seção inteira, de ponta a
  ponta (sem cartão, sem cantos arredondados, sem borda, sem margem lateral
  cortando a imagem). O texto continua sempre por cima, editável no painel.
- **Removidas as linhas divisórias e as grandes faixas vazias** entre todas
  as seções do site (não só Hero/Sobre) — o espaçamento interno continua,
  só não tem mais a linha cinza nem o respiro exagerado.
- **Painel de imagens do site** (Configurações → Site & Link na bio) ficou
  bem mais completo pra cada banner (Hero e "Quem somos"): nome da seção +
  onde aparece, prévia, tamanho recomendado em largura×altura, proporção,
  formatos aceitos e limite do arquivo, e uma orientação curta de composição
  (ex: "sem texto, assunto principal à direita"). Também dá pra ajustar o
  **ponto de enquadramento** da imagem (grade de 9 posições + prévia do
  corte) e enviar uma **imagem alternativa pro celular**, com suas próprias
  orientações — se não enviar, o site usa a imagem principal recortada pelo
  ponto de enquadramento escolhido.
- **Serviços**: cabeçalho com título alinhado à esquerda e descrição + "Ver
  todos os serviços" à direita (só desktop); grade 4 colunas × 2 linhas em
  telas largas, 2 colunas no tablet, 1 no celular; cartões menores, com
  menos espaço interno, fundo quase preto e bordas discretas.

### Banco de dados
Aditivo: `Configuracao` ganhou 4 campos novos opcionais (`siteHeroImagemUrlMobile`,
`siteHeroFoco`, `siteSobreImagemUrlMobile`, `siteSobreFoco`).

## v101

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

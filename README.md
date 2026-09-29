# Instaby App — v152

**Etapa 1** do plano de evolução em 11 etapas ("Unificar tarefas e
implementar notificações"), a partir da especificação anexada pelo usuário.
Reaproveita a estrutura existente de tarefas (`Tarefa`, `ChecklistItemTarefa`,
os três quadros Kanban, `TarefaRow`) e de permissões (`lib/permissoes.ts`) —
nenhum módulo novo duplicado, tudo aditivo ao banco. Entregue em modo
automático (autorização já dada em turnos anteriores); decisões reversíveis
tomadas sozinho, sinalizadas abaixo em "Decisões tomadas sem perguntar".

## O que é isso, resumindo

Toda tarefa ganhou um painel lateral único (comentários internos, histórico
de alterações, estado "Bloqueada" com motivo/responsável, edição completa),
acessível de qualquer lugar que já mostra tarefas. Um sino de notificações de
verdade substituiu o botão decorativo do cabeçalho. Comentário de cliente em
relatório público agora chega pra dentro do painel, com notificação e
resposta da agência. Cronômetro nunca mais duplica hora quando a tarefa é
concluída/bloqueada por qualquer um dos 4 pontos de entrada. De passagem,
corrigidas 2 rotas que não pediam login nenhum (relatório e criação de tarefa
por cliente).

## Schema novo (`prisma/schema.prisma`) — tudo aditivo

- `Tarefa`: `motivoBloqueio`, `bloqueioResponsavelId` + relação
  (`bloqueioResponsavel`), `bloqueadaEm`; relação `responsavel` renomeada
  pra `@relation("TarefaResponsavel", ...)` (só efeito no schema, zero
  efeito no banco — precisou de nome porque agora há uma 2ª relação com
  `Usuario`, a de bloqueio).
- `ComentarioTarefa` (novo): comentário interno, nunca editado/apagado —
  mesmo espírito de `MovimentacaoVerba`. `onDelete: Cascade` em `tarefaId`
  (obrigatório — comentário não sobrevive sem a tarefa).
- `HistoricoTarefa` (novo): uma linha por campo alterado num PATCH
  (`campo`/`valorAntigo`/`valorNovo`/quem/quando), calculado no servidor
  antes de aplicar o update. `onDelete: Cascade` em `tarefaId`.
- `Notificacao` (novo): `usuarioId` (destinatário, obrigatório,
  `onDelete: Cascade` — é caixa de entrada efêmera, não precisa sobreviver à
  remoção de alguém da equipe, diferente do histórico/comentários, que ficam
  como registro), `tarefaId`/`clienteId`/`relatorioId` opcionais (sem
  cascade — default `SetNull`, preserva a notificação como registro solto se
  o que ela referenciava for apagado), `agrupadorChave` +`contador` (ver
  "Sino" abaixo), `lidaEm`/`adiadaAte`.
- `RegistroTempo`: `tarefaId` opcional (sem cascade) — vincula um cronômetro
  a uma tarefa específica, sem o que o fechamento automático (item 9) não
  teria o que fechar.
- `RelatorioPeriodo`: `comentarioClienteEm` — marca quando
  `comentarioCliente` foi de fato alterado (não só criado), pra saber quando
  disparar notificação sem comparar strings toda hora.
- Armadilha evitada: toda outra FK pra `Usuario` no schema inteiro é
  opcional; `Notificacao.usuarioId` teve que ser obrigatória (notificação
  sem destinatário não faz sentido) — se usasse o comportamento padrão do
  Prisma pra FK obrigatória (`Restrict`), a primeira pessoa da equipe
  removida que já tivesse recebido uma notificação quebraria
  `DELETE /api/equipe/[id]`. Resolvido com `onDelete: Cascade` só nessa
  relação, verificado contra as 3 rotas de DELETE existentes
  (cliente/equipe/relatório) antes de aplicar.

## Painel lateral de detalhes da tarefa

`components/dashboard/PainelDetalheTarefa.tsx` — busca os próprios dados
(`GET /api/tarefas/[id]`, que agora devolve checklist + comentários +
histórico + cronômetro aberto de uma vez) em vez de depender de cada página
mudar a própria consulta. Editável ali: título, descrição, responsável,
prioridade, prazo, link, além de checklist (reaproveita `ChecklistTarefa`
existente, não duplicado) e o fluxo de bloqueio/conclusão.

Abre com `?tarefa=ID` na URL, montado **uma vez** em
`app/dashboard/layout.tsx` (`PainelDetalheTarefaHost`, dentro de
`<Suspense>` — é o único lugar do app que usa `useSearchParams()` pra isso).
Os 4 pontos de acesso pedidos só precisaram de um `onClick`/`href` cada,
sem tocar a consulta das páginas grandes (`dashboard/page.tsx`,
`clientes/[id]/page.tsx`, ambas com centenas de linhas):

- **Início / Kanban** (`QuadroTarefas.tsx`, `QuadroTarefasPessoal.tsx`,
  `TarefaRow.tsx`): clique no card/linha abre o painel; um botão dedicado
  (`PanelRight`) foi acrescentado em `TarefaRow` sem remover o quick-edit
  inline que já existia (clique no título).
- **Agenda** (`app/dashboard/agenda/page.tsx`): o link de um evento de
  tarefa agora fica na própria Agenda com `?tarefa=ID` em vez de navegar pra
  fora; `AgendaGrid.tsx` não precisou mudar (seu próprio modal só edita
  prazo, e o link que ele usa já vinha corrigido de fora).
- **Ficha do cliente**: mesma técnica, herdada de graça pelas tarefas
  listadas lá (mesmos componentes de quadro/linha).

Técnica usada nos 3 componentes de quadro/linha pra abrir o painel: leem
`window.location.search` na hora do clique em vez de `useSearchParams()` —
esse hook exige `<Suspense>` em toda página que renderiza o componente, e
esses três são usados em várias.

## Comentários internos, histórico e estado "Bloqueada"

- Comentários (`POST /api/tarefas/[id]/comentarios`): cria e notifica o
  responsável da tarefa (se não foi ele quem comentou). Nunca editado nem
  apagado.
- Histórico: calculado no `PATCH /api/tarefas/[id]` comparando o corpo da
  requisição contra o estado atual, campo por campo, **antes** de aplicar o
  update — só grava o que realmente mudou.
- Bloqueada: motivo obrigatório (validado no servidor, não só na tela),
  responsável pelo desbloqueio opcional. Sai de bloqueada → os 3 campos
  (`motivoBloqueio`/`bloqueioResponsavelId`/`bloqueadaEm`) somem sozinhos.
  Nova coluna própria (vermelha) nos 3 quadros Kanban, entre "Em andamento"
  e "Feito". A trava que impede sair de "A fazer" numa tarefa de Reel sem
  vídeo bruto (pré-existente) foi ajustada pra **não** valer pra "Bloqueada"
  — bloquear é exatamente o que se faz quando falta o vídeo bruto; a trava
  antiga impediria registrar esse motivo.
- Item 5 (separar disponíveis de atribuídas): só faz sentido na coluna "A
  fazer" dos quadros **pessoais** (`QuadroTarefasPessoal.tsx`, usado no
  Início do editor/tráfego) — os outros quadros não têm esse conceito de
  "fila pessoal", então não foram alterados nesse ponto.

## Sino de notificações (`components/layout/SinoNotificacoes.tsx`)

Substitui o botão decorativo do cabeçalho (`Header.tsx`). Tipos:
`tarefa_atribuida`, `tarefa_bloqueada`, `comentario_tarefa`,
`comentario_relatorio` (o 5º tipo já reservado no schema,
`tarefa_sem_responsavel`, ficou sem gatilho nesta etapa — ver "Decisões"
abaixo). Ações por notificação: abrir (clique na linha, sempre), responder
(comentário de tarefa ou relatório), revisar (atalho pra `tarefa_bloqueada`),
atribuir (qualquer notificação com `tarefaId`), adiar (1h/amanhã/semana que
vem) e marcar lida/não lida — as 4 ações pedidas (abrir/responder/
revisar/atribuir) mais adiar e lida, que já estavam no item 8.

Agrupamento (item 8): `criarNotificacao()` em `lib/notificacoes.ts` calcula
uma `agrupadorChave` (por padrão `tipo:tarefaId|clienteId|relatorioId`) e,
se já existir uma notificação **não lida** com a mesma chave pro mesmo
destinatário, só incrementa `contador` e atualiza título/corpo/link em vez
de criar uma linha nova — é isso que colapsa repetições em "3x" no sino.

## Cronômetro sem duplicar hora (item 9)

Fechamento automático centralizado no servidor
(`PATCH /api/tarefas/[id]`, `statusFechaCronometro()` em `lib/tarefas.ts`):
sempre que o status entra em "feito" ou "bloqueada", qualquer
`RegistroTempo` aberto (`fim: null`) ligado à tarefa via o novo
`RegistroTempo.tarefaId` é fechado sozinho, e a resposta inclui
`registroTempoFechado`. Funciona **não importa qual dos 4 pontos de entrada**
mudou o status, porque mora no PATCH, não em cada tela.

Do lado do cliente, os 4 lugares que podem concluir uma tarefa
(`PainelDetalheTarefa`, `QuadroTarefas`, `QuadroTarefasPessoal`, `TarefaRow`)
checam `registroTempoFechado` na resposta e **não** lançam um segundo
registro manual quando ele vem preenchido — só avisam ("já tinha cronômetro
rodando, fechei sozinho, os horários digitados não foram usados") em vez de
duplicar silenciosamente. Pra isso funcionar de ponta a ponta, o botão
"Iniciar" de `QuadroTarefasPessoal.tsx` (que é quem liga o cronômetro ao sair
de "A fazer") passou a mandar `tarefaId` pro
`POST /api/registros-tempo` — sem isso o registro nascia sem vínculo com a
tarefa e o fechamento automático não tinha o que fechar. `/api/registros-tempo`
ganhou a validação correspondente (tarefa existe + `podeVerCliente`).

## Comentários de relatórios públicos → painel interno (item 7)

`PATCH /api/relatorios/[id]` — reescrita. O comentário do cliente (campo
`comentarioCliente`, enviado sem login pela página pública do relatório,
como sempre foi) agora, quando muda de verdade, marca
`comentarioClienteEm` e dispara uma notificação `comentario_relatorio` pra
quem tem acesso operacional completo àquele cliente
(`usuariosComAcessoAoCliente()`, filtrado por `acessoClienteCompleto` —
ver "Permissões"). Chave de agrupamento explícita por **relatório**, não só
por cliente, pra comentários em 2 relatórios diferentes do mesmo cliente não
se misturarem numa notificação só.

A resposta da agência (`comentarioAgencia`) — que antes só dava pra definir
na hora de criar o relatório (`NovoRelatorioForm`) — agora também é editável
depois, de dois jeitos: direto no card do relatório dentro da ficha do
cliente (`RelatorioCard.tsx`, seção nova que mostra o comentário do cliente
e um campo de resposta) ou pela ação "Responder" no próprio sino.

## Falhas de segurança corrigidas de passagem

Encontradas revisando o entorno do que a Etapa 1 pedia pra mexer — corrigidas
junto, não deixadas pra depois, seguindo a regra geral de aplicar permissão
no servidor:

- `PATCH`/`DELETE /api/relatorios/[id]` não tinham **nenhuma** autenticação:
  qualquer pessoa que soubesse o ID de um relatório conseguia apagá-lo ou
  escrever um "comentário oficial da Instaby" nele (campo que aparece pro
  cliente na página pública), sem estar logada. Agora exige login +
  `acessoClienteCompleto` + acesso àquele cliente especificamente pra
  `comentarioAgencia`/DELETE. `comentarioCliente` continua aberto sem login
  de propósito — é o único uso legítimo (o cliente não tem conta).
- `POST /api/clientes/[id]/tarefas` também não tinha autenticação nenhuma —
  criava tarefa em qualquer cliente sabendo só o ID dele. Agora exige login +
  `podeVerCliente`, mesma trava de `/api/tarefas`.

## Permissões

Nada novo inventado — só aplicado o que já existia
(`getUsuarioAtual`/`podeVerCliente`/`clienteIdsPermitidos`/`exigirPermissaoApi`
de `lib/permissoes.ts`) nas rotas novas, mais um helper novo,
`usuariosComAcessoAoCliente(clienteId)` (master OU `todosClientes` OU
`ClienteUsuario` explícito), usado pra decidir quem recebe notificação de
comentário de relatório — filtrado ainda por `acessoClienteCompleto` (a
mesma trava que já protege a aba Relatórios), pra ninguém receber uma
notificação que a própria tela não deixaria ela abrir ou responder (ex.: um
Gestor de Tráfego com acesso só à verba de mídia, sem acesso operacional
completo àquele cliente). Nenhum campo de valor/financeiro passou a
aparecer em tarefa, comentário, histórico ou notificação — o painel de
tarefa e o sino são seguros pra Editor.

## Decisões tomadas sem perguntar (reversíveis)

- **"Atribuir" no sino** vira uma ação em cima de qualquer notificação que já
  tenha `tarefaId` (bloqueio, comentário), em vez de existir um tipo de
  notificação dedicado "tarefa sem responsável" — o schema já reserva esse
  tipo (`tarefa_sem_responsavel`) pra uma etapa futura decidir o gatilho
  certo (ex.: um job periódico, ou no momento em que a tarefa é criada sem
  responsável), porque disparar isso a cada tarefa sem dono, toda vez,
  seria ruidoso demais sem mais contexto de quando faz sentido avisar.
- **Resposta da agência a um comentário de relatório substitui o texto
  anterior** (é um campo único no banco, não uma lista de mensagens, ao
  contrário do comentário de tarefa) — o sino avisa disso antes de mandar
  ("substitui o anterior, se já tinha"). Virar uma conversa de verdade
  (histórico de idas e vindas) é uma mudança de modelo de dados maior, fora
  do que a Etapa 1 pedia.

## Validação

- Sem acesso a banco nesta sandbox (mesma limitação já documentada na v151)
  — não dá pra rodar os fluxos de ponta a ponta de verdade. Verificação foi
  por leitura cuidadosa de todas as rotas/telas tocadas, cruzando nome de
  campo por nome de campo contra o schema novo (relação, `onDelete`,
  obrigatório/opcional) e reconferindo os 3 fluxos de permissão pedidos
  (Administrador/Editor/Gestor de Tráfego) rota por rota: nenhum dado de
  valor/contrato/financeiro aparece em tarefa/comentário/histórico/
  notificação; acesso a cliente sempre passa por `podeVerCliente` ou
  equivalente; a notificação de comentário de relatório só vai pra quem a
  própria aba deixaria agir.
- Casos de borda conferidos por leitura: reimportar o mesmo comentário de
  cliente sem mudança não duplica notificação (compara com o texto
  anterior); duas notificações do mesmo tipo pro mesmo destinatário viram
  uma só com contador; cronômetro aberto por qualquer um dos 4 pontos de
  entrada fecha sozinho não importa qual dos 4 conclui a tarefa; remover
  alguém da equipe não quebra mais (cascade só na caixa de notificação, não
  no histórico/comentários).

## Verificação

- `tsc --noEmit`: 332 erros — **mesmo total exato da v151**. Zero erros nos
  arquivos tocados nesta etapa (painel, quadros, sino, rotas de tarefas/
  notificações/relatórios, `lib/tarefas.ts`, `lib/notificacoes.ts`). Os 332
  são o mesmo ruído já documentado (Prisma Client não gerado nesta sandbox —
  toda chamada `prisma.*` tipa como `any`, o que também significa que typo
  de nome de campo/relação do Prisma **não** seria pego pelo `tsc` aqui; por
  isso a conferência principal foi manual, campo por campo, contra o
  schema).
- `prisma generate`/`prisma validate`: continuam bloqueados nesta sandbox
  (sem rede pra `binaries.prisma.sh`, testado de novo incluindo a variável
  de ambiente `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING` sugerida pelo próprio
  Prisma pra ambiente offline — nem assim, porque falta o binário em si, não
  só o checksum). A sincronização de schema de verdade só acontece no
  próximo deploy (`prisma db push --accept-data-loss`, já é assim desde
  sempre neste projeto).

---

# Instaby App — v151

Módulo de **Tráfego Pago** reconstruído do zero como um sistema completo de
gestão de mídia paga, a partir de uma especificação detalhada dele (~7
seções). Reaproveita a estrutura, o layout e as permissões já existentes do
painel — não é uma tela nova solta, é uma extensão do que já existia
(`Campanha`, a antiga tela de Tráfego, o botão "Importar do Meta Ads").
Entregue inteiro em modo automático (autorização já dada em turnos
anteriores).

## O que é isso, resumindo

Antes, Tráfego Pago era só uma lista de campanhas com gasto manual. Agora:
importa o relatório (CSV/Excel) que o Meta exporta, concilia sozinho quanto
cada campanha gastou a mais desde a última importação, controla a verba e o
saldo de mídia de cada cliente, separa "status que o Meta reporta" de
"organização interna da equipe", registra avaliação de campanha, e gera
relatórios em PDF com histórico de versões.

## Schema novo (`prisma/schema.prisma`)

Tudo aditivo — nenhum campo/tabela removido, `Campanha` ganhou colunas novas
em vez de ser substituída:

- `Campanha`: `statusInterno` (`em_acompanhamento | pausada | finalizada |
  arquivada` — ver "Status" abaixo), `avaliacao` +
  `avaliacaoObjetivo`/`avaliacaoMeta`/`avaliacaoObservacoes` +
  `avaliadoPorId`/`avaliadoEm`, `idExternoMeta`, `chaveCorrespondencia`,
  `nomesOriginaisMeta` (`String[]`), `ultimoStatusMeta`/`ultimoStatusMetaEm`,
  `orcamentoConjunto`, `tipoOrcamento`.
- `LoteImportacao` (novo): um registro por arquivo confirmado — período,
  `arquivoUrl` (upload original preservado no Vercel Blob), totais do
  arquivo, `arquivoAntigo`, quem importou.
- `ItemImportacao` (novo): o ledger de verdade — uma linha por campanha por
  importação confirmada, nunca editada nem apagada depois.
  `gastoAcumuladoArquivo` (o valor bruto do arquivo), `gastoAnterior` (o que
  o sistema já sabia antes), `gastoIncremental` (a diferença, pode ser
  negativo numa correção pra baixo).
- `VerbaTrafego` + `MovimentacaoVerba` (novos): saldo inicial por cliente +
  extrato de aportes/devoluções/ajustes/saldo transportado, cada um com
  valor sempre positivo (o *tipo* decide se soma ou subtrai).
- `RelatorioTrafego` (novo): uma versão congelada por relatório gerado —
  nunca recalculada, `dadosSnapshot` (`Json`) guarda o resultado exato que
  foi mostrado/impresso naquele momento.

## Motor de importação (`lib/parseCampanhasMeta.ts` + `lib/importacaoMeta.ts`)

- Reconhece colunas do export do Meta (PT/EN variam um pouco) por nome,
  tolerando variação de idioma/acentuação. Usa a lista de cabeçalhos
  **declarada** pelo arquivo (`Papa.parse` `meta.fields` / primeira linha
  real do XLSX) em vez de inferir pelas chaves da primeira linha de dados —
  corrigido depois de testar com um arquivo real em que o Meta manda só uma
  linha de texto "No data available." quando não há campanha no período
  (isso quebrava o reconhecimento pra 1 de 16 colunas). Esse caso agora vira
  um aviso específico ("o Meta não retornou nenhuma campanha nesse
  período") em vez do erro genérico de "arquivo não reconhecido".
- Identidade da campanha: por `ID da campanha` quando o export inclui essa
  coluna (mais confiável); senão por nome + configuração de atribuição.
  Nome duplicado com a mesma atribuição (ou ID que não bate com nada) nunca
  é decidido sozinho — cai pra conferência manual, com os candidatos
  prováveis listados.
- Conciliação por período acumulado: o Meta manda o gasto acumulado *desde
  o dia 1 do mês*, então o "gasto anterior" de cada campanha é sempre a
  última leitura conhecida daquele mês (nunca uma soma) — reimportar o
  mesmo arquivo dá incremento zero, uma correção pra baixo dá incremento
  negativo, e um arquivo mais antigo que a última importação confirmada
  (`arquivoAntigo`) exige confirmação explícita antes de aplicar. Validação
  nova: um arquivo "cumulativo" (uma linha por campanha cobrindo o período
  inteiro) que não começa no dia 1 do mês ou atravessa a virada do mês é
  recusado com uma mensagem explicando como reexportar certo — não se aplica
  a um export dia-a-dia, que já concilia corretamente por linha.
- Campanha ausente numa importação nunca é zerada nem apagada — o sistema só
  grava o que veio no arquivo; o que não veio mantém o último valor
  conhecido.
- Prévia (`/api/campanhas/importar-meta/preview`) mostra cliente, período,
  campanhas encontradas, conflitos e o **impacto no saldo** (saldo atual →
  saldo projetado depois de confirmar) antes de qualquer gravação — esse
  último ponto existia na rota mas não estava sendo mostrado na tela; agora
  está.

## Verba e saldo por cliente (`lib/trafego.ts`)

`saldoRestante = saldoInicial + aportes + saldo transportado − devoluções −
ajustes − gasto acumulado`. Gasto acumulado nunca é filtrado por status —
arquivar/finalizar uma campanha não tira o gasto dela da conta. Corrigido
nesta versão: o cálculo do "valor mais atual" (tanto do saldo quanto de
qualquer tela que lê o histórico) agora desempata por *criado mais
recentemente* quando duas importações cobrem exatamente o mesmo período —
sem isso, uma correção de gasto reimportada pro mesmo período podia perder
pra ordem (não garantida) em que o banco devolvia as linhas.

## Status separado (Meta vs. interno) + reparo automático

`statusInterno` (em_acompanhamento/pausada/finalizada/arquivada) é o
controle de verdade a partir de agora; o campo antigo `status`
(ativa/pausada/encerrada) é mantido em espelho só pra não quebrar quem
ainda lê ele (Início do gestor, alerta de criativos pendentes). **Armadilha
encontrada e corrigida:** como não há acesso a banco nesta sessão pra rodar
uma migração de verdade, adicionar a coluna nova via `db push` preenche
*todas* as campanhas já existentes com o valor padrão
("em_acompanhamento"), inclusive as que já estavam pausadas/encerradas —
`statusInternoEfetivo()`/`repararStatusInternoLegado()` corrigem isso na
leitura (comparando com o `status` legado) e gravam o valor certo de volta
na primeira vez que a campanha é lida, sem precisar de migração.

## Telas novas, dentro de Tráfego Pago

Sete abas: Visão Geral, Campanhas, Finalizadas, Verba e movimentações,
Histórico de importações, Relatórios, Rotina (a última já existia). As
quatro primeiras operam sobre **um cliente por vez** (`?clienteId=`);
Campanhas/Finalizadas cruzam todos os clientes autorizados. Campanhas e
Finalizadas reusam o mesmo componente (`TrafegoClient`, estendido — não
duplicado) também usado na aba "Tráfego Pago" dentro da ficha do cliente.
Relatórios: escolhe campanhas e período, vê prévia, gera PDF (imprimível),
mantém todas as versões já geradas.

## Permissões

Tudo já existia (`gerenciarTrafego` + `clienteIdsPermitidos`/`podeVerCliente`
de `lib/permissoes.ts`) — essa versão só aplicou em cada rota/tela nova, sem
inventar um modelo novo. Conferido rota por rota: toda rota de API sob
`/api/campanhas/importar-meta/*`, `/api/relatorios-trafego*` e
`/api/clientes/[id]/verba*` exige `gerenciarTrafego` **e** checa
`podeVerCliente` pro cliente específico do corpo/URL. A página de impressão
do relatório (`/relatorio-trafego/[id]`) faz a mesma checagem no servidor
antes de renderizar — abrir o link direto sem permissão redireciona, não
mostra nada. Endurecido nesta versão: a aba "Tráfego Pago" dentro da ficha
do cliente agora também confere a permissão no ponto de renderização (antes
só no fetch dos dados — mesmo padrão pré-existente da aba Arquivos), não só
no menu de abas.

## Validação

- Testado com os 4 arquivos reais de exemplo (incluindo o CSV de
  referência do pedido original: 20 campanhas, 3 com gasto, R$ 105,43 e
  6.621 impressões em 01–28/09 — bateu exatamente). Os outros três
  expuseram os dois problemas de reconhecimento de arquivo descritos acima
  (já corrigidos e reconfirmados rodando de novo contra os 4 arquivos).
- Cenários pedidos conferidos por leitura cuidadosa do código (banco de
  dados não está disponível nesta sessão sandbox, então não dá pra rodar
  um teste de ponta a ponta de verdade): importação repetida, períodos
  sobrepostos, nomes duplicados, correção de gasto, arquivo antigo,
  importação parcial e arquivamento sem alterar o saldo — todos conferem
  com o esperado pela spec.

## Verificação

- `tsc --noEmit`: 332 erros. A grande maioria é ruído já conhecido (o
  Prisma Client não tem como ser gerado nesta sandbox — sem acesso ao
  banco/à internet certa — então toda chamada `prisma.*` tipa como `any`,
  e isso produz avisos de "implicitamente `any`" em callbacks por todo o
  projeto, não só nas partes tocadas aqui). Os ~17 erros a mais desta
  versão são um artefato confirmado desse mesmo problema: uma função
  genérica que espalha (`{...c, ...}`) o parâmetro dentro do próprio corpo
  só consegue tipar esse spread pelo *constraint* declarado — com um
  `PrismaClient` de verdade (gerado no build real, via `prisma generate`,
  que roda antes do `next build`), o argumento chega com o tipo completo e
  o erro desaparece; confirmado com um teste isolado reproduzindo os dois
  casos lado a lado. Os 7 erros restantes são de telas não tocadas nesta
  versão (`orçamentos`, `equipe`, `serviços`), pré-existentes.

---

# Instaby App — v150

Novo estilo de ícone (preto e vermelho, com brilho, "3D glossy") no menu do
painel e na cena de abertura do site — a partir de 4 imagens de referência
que ele mandou (claquete, duas pessoas, alvo, cronômetro).

## Ícone novo: `IconeEstilizado` (`components/ui/IconeEstilizado.tsx`)

- Não existe gerador de imagem disponível nesta sessão pra replicar o render
  3D de verdade das imagens de referência — o que foi feito é a aproximação
  possível com CSS/SVG puro: um "palco" escuro (gradiente quase preto,
  FIXO — não muda com o tema do painel, de propósito, pra garantir contraste
  e brilho sempre) + o ícone com um glow vermelho ao redor (drop-shadow,
  acompanha o contorno exato do desenho) + um reflexo "de vidro" no terço de
  cima, pra dar sensação de profundidade. Aceita ícone do lucide-react ou de
  outra lib (usado pro logo do Google, que o lucide não tem — ver abaixo).
- Componente único, reusado nos dois lugares abaixo — mesmo visual, só muda
  o tamanho.
- Testado visualmente antes de entregar: renderizei o componente de verdade
  (fora do navegador, via script) e tirei print em tamanho pequeno (28px,
  como no menu) e grande (96px, como na abertura), pra conferir contraste e
  legibilidade antes de mandar pra produção.

## Menu do painel (`components/layout/Sidebar.tsx`)

- Todos os ícones da lista "Geral" (Início, Tarefas, Agenda, Clientes,
  Tráfego pago, Horas) e dos grupos "Financeiro"/"Comercial" agora usam o
  novo ícone estilizado, no lugar do ícone simples de antes.
- O ícone de **Tarefas** virou uma claquete de cinema (`Clapperboard`, do
  lucide-react) — ele gostou desse ícone específico nas imagens de
  referência e pediu pra usar em alguma coisa como tarefas.
- Não mexi nos ícones pequenos de Configurações/Sair no rodapé do menu (já
  têm um tratamento próprio, de botão quadrado) nem nos ícones dentro dos
  `StatTile` (cartõezinhos de número, ex: painel do Tráfego Pago) — são
  pequenos demais (12px) pra esse visual valer a pena, e mexer neles também
  mudaria a cor semântica que já indica alerta/atenção em cada um.

## Abertura do site — "ícones que voam e formam o logo" (`CinematicIntro.tsx`)

- Os 6 ícones que convergem pro centro e formam o logo (Instagram, YouTube,
  Play, TrendingUp, Heart, Film) agora usam o mesmo ícone estilizado, no
  lugar do "vidro fosco" de antes.
- Adicionado **Facebook** (lucide-react) e **Google** ao conjunto, a pedido
  dele. O lucide-react não tem logo do Google — instalada a lib
  `react-icons` só pra esse ícone (`react-icons/si`), mesmo espírito de já
  usar Instagram/YouTube/Linkedin do lucide-react pra essa finalidade,
  prática já existente neste projeto desde antes dessa versão. Os dois
  ícones novos aparecem só no desktop (`soDesktop`), mesma regra que já
  existia pra Play/TrendingUp — mantém o celular com a mesma quantidade de
  ícones de antes, sem lotar a tela.
- Sobre "ícones originais deles, recortado o fundo" (pedido dele): o que foi
  usado são os desenhos de contorno reconhecíveis de cada marca (mesma
  natureza do que o site já fazia com Instagram/YouTube/Linkedin), não uma
  imagem/logo oficial baixada — não tenho como gerar ou baixar imagem nesta
  sessão (ver limitação abaixo). Sendo vetor, também não tem "fundo" pra
  recortar — já nascem transparentes.

## Limitação: sem gerador de imagem nesta sessão

- As 4 imagens de referência que ele mandou têm cara de render 3D de
  verdade (profundidade, material, luz) — isso não dá pra replicar com
  código, só aproximar (o que foi feito acima). Se ele quiser o resultado
  mais parecido possível com as imagens de referência em algum lugar
  específico (e não só a aproximação em CSS), o caminho é ele gerar essas
  imagens (do jeito que gerou as 4 de referência) e mandar aqui — a
  integração no app a partir de imagens prontas é rápida.

## Verificação (v150)

- `tsc --noEmit`: 323 erros, mesmo baseline já conhecido (stub do Prisma),
  zero erro novo — e zero erro nos 3 arquivos tocados/criados
  (`IconeEstilizado.tsx`, `Sidebar.tsx`, `CinematicIntro.tsx`).

---

# Instaby App — v149

Correção de um bug real que a v148 subiu sem querer no mapa "Onde a gente
atende" — reportado por ele, por print. Nada mais mudou desde a v148; todo o
resto do conteúdo dessa versão (mapa de verdade, card vermelho, carrossel do
Processo, Ken Burns, rodapé etc.) continua descrito na seção da v148, logo
abaixo.

## Correção (v149): tiles do mapa quebrados — "API KEY REQUIRED" por cima de tudo

- A v148 trocou o mapa ilustrativo por um mapa de verdade usando tiles
  escuros gratuitos da CARTO (`basemaps.cartocdn.com`), descrito naquela
  seção como "sem chave de API nenhuma". Isso deixou de ser verdade: a CARTO
  passou a exigir chave pra esse mesmo serviço — mudança posterior ao meu
  conhecimento (cutoff de jan/2026), que eu não tinha como prever e não
  conferi de novo antes de entregar. Resultado reportado por ele, por print:
  o mapa inteiro (menos os pinos, que são HTML nosso, não tile) virou um
  cinza com a marca d'água repetida "API KEY REQUIRED" por cima.
- Antes de trocar às cegas de novo, pesquisei: confirmado que isso pegou
  vários projetos ao mesmo tempo (não foi só aqui) — e que a correção mais
  usada em conserto recente de outros projetos com o mesmo problema foi
  trocar pra tiles da Esri (`server.arcgisonline.com`), que continuam
  gratuitos, sem chave e sem conta.
- `components/landing/MapaAtuacao.tsx`: trocada a única camada CARTO por
  duas camadas Esri empilhadas — `World_Dark_Gray_Base` (fundo) +
  `World_Dark_Gray_Reference` (nomes de rodovia/lugar por cima, sem ela o
  mapa ficava um cinza liso demais). Adicionado `maxNativeZoom: 16` — esse
  serviço da Esri não tem tile além do zoom 16; sem esse limite, um zoom
  maior mostraria tile em branco. Como esse mapa nunca passa de visão de
  região/cidade na prática, isso não tira nitidez nenhuma. Atribuição do
  rodapé do mapa atualizada de CARTO pra Esri. Reparar também a ordem da URL
  — `{z}/{y}/{x}`, invertida em relação ao padrão `{z}/{x}/{y}` da CARTO e
  da maioria dos outros provedores — é assim que o serviço da Esri espera.
- **Não dá pra garantir que isso nunca quebra de novo** — é serviço gratuito
  de terceiro, sem contrato: se a Esri também decidir exigir chave no
  futuro, o sintoma vai ser o mesmo (tile virando placeholder) e a correção
  vai ser a mesma ideia (achar o substituto gratuito atual e trocar).
  Deixado registrado em comentário no próprio arquivo, pra não reconstruir
  essa investigação do zero se acontecer de novo.
- Verificação: `tsc --noEmit` em 323 (mesmo baseline), zero erro novo;
  `MapaAtuacao.tsx` conferido sem erro nenhum.

# Instaby App — v148

Lote grande de feedback sobre **o site principal** (`/` e `/link`), mandado de
uma vez só, em áudio transcrito e sem estrutura (~10 pedidos diferentes
misturados num texto só). Executado inteiro em modo automático (autorização
já dada em turnos anteriores), com as decisões de interpretação registradas
aqui e também explicadas pra ele na resposta final.

## Novo: card vermelho de prova social, depois do "Quem somos"

- Pedido de volta: um card vermelho vibrante ("estouro") que existia num site
  anterior (antes desse rebuild em Next.js, feito por outra IA) e sumiu nesse
  processo. **Procurei o texto original em tudo que tinha disponível no
  projeto (README, plano de implementação, auditoria, design system) e não
  encontrei rastro nenhum** — o texto atual é novo, escrito no mesmo espírito
  ("prova social"/"o povo já viu"), não uma restauração do original.
- Schema: `Configuracao.siteProvaSocialTitulo` e `siteProvaSocialTexto`
  (ambos `String?`, opcionais/aditivos). Editável em Configurações → Site,
  entre "Quem somos" e "Cor dos textos". Título e texto vazios escondem a
  seção inteira.
- Faixa full-width em `components/landing/LandingPage.tsx`, gradiente
  vermelho vibrante (`#ff3b4a → #e63946 → #b81926`) — de propósito mais
  saturada que o vermelho escuro já usado no "Processo" logo mais abaixo, pra
  não parecerem a mesma faixa repetida.

## Processo virou carrossel grande, "estilo Netflix", com foto por etapa

- Ele descreveu duas ideias (mini-fotos nos cards, ou um carrossel grande
  estilo Netflix) com mais entusiasmo na segunda — implementei as duas
  juntas: cartões grandes e arrastáveis, cada um com espaço opcional pra
  foto, sombra e overlay.
- Schema: `Configuracao.siteProcessoEtapas` (`Json?`, aditivo) — array de até
  4 `{titulo, texto, imagemUrl, foco}`, indexado (índice ausente/vazio usa o
  texto padrão já embutido no código, sem foto). O número do passo (01-04)
  continua fixo no código, não editável.
- Editor novo em `ProcessoCtaForm.tsx` (Configurações → Site → "Processo e
  chamada final"), um card por etapa com upload de imagem + ponto de
  enquadramento, mesmo padrão já usado em outras imagens do site.
- Renderização em `LandingPage.tsx`: `overflow-x-auto` com `snap-x`, arrasta
  com o mouse (ver hook novo abaixo).

## "Onde a gente atende" virou um mapa de verdade

- Antes era um SVG ilustrativo com posições fixas, sem geografia real. Agora
  usa **Leaflet** com tiles escuros gratuitos da **CARTO**
  (`basemaps.cartocdn.com/dark_all`, sem chave de API, sem custo) — pino
  maior e pulsando pra Araras (base), pinos menores pras demais cidades,
  linha tracejada vermelha ligando cada uma à base, `fitBounds` pra
  enquadrar tudo automaticamente. Ícones custom via `L.divIcon()` (evita o
  bug clássico do ícone padrão do Leaflet quebrando com Next/webpack).
- `lib/cidadesRegiao.ts` (novo): tabela com coordenadas reais de ~22 cidades
  da região de Campinas/Araras. **Não mudou o formato salvo no banco** —
  `Configuracao.siteMapaLocais` continua `Json?` com só `[{nome: string}]`;
  as coordenadas são resolvidas pelo nome na hora de desenhar o mapa, sem
  precisar editar schema nem pedir latitude/longitude a ele.
- `MapaForm.tsx` reescrito: Araras fixo como base (sempre marcada, não dá
  pra desmarcar) + grade de botões pra marcar/desmarcar as outras cidades da
  tabela — clique liga/desliga, sem precisar digitar nome de cidade.

## Arrastar com o mouse nos carrosséis (antes só tocava)

- Bug relatado: testando o site no computador com a janela estreita (ou
  dando zoom), o carrossel de Serviços não respondia ao arrastar com o
  mouse — só touch/trackpad rolavam.
- `lib/useArrastarScroll.ts` (novo, reutilizável): hook com pointer events
  que só age quando `pointerType === "mouse"` (nunca interfere no swipe de
  toque nativo) e cancela o clique seguinte se houve arraste de verdade,
  pra não "ativar" um link por baixo do mouse sem querer. Aplicado no
  carrossel de Serviços (celular) e no novo carrossel do Processo. Dica
  "Arraste pra ver mais" com seta animada, mais visível que antes.

## Mais efeito nos banners (Ken Burns) e botão do menu maior

- Hero, "Quem somos", Processo e chamada final: fotos de fundo ganharam um
  zoom lento e contínuo (`framer-motion`, `scale` de 1 → ~1.08-1.09,
  20-26s, `repeatType: "mirror"`) em vez de ficarem estáticas.
- Botão do menu (hambúrguer) no celular: de 36px pra 44px (padrão de área de
  toque confortável), com feedback ao tocar.

## Fundo do site: cinza → preto de verdade

- `styles/tokens-colors.css`: `--base` de `19 21 25` (#131519) pra
  `10 10 12` (#0A0A0C). Esse token só afeta site público/portfólio — o
  painel interno usa a paleta isolada em `.tema-painel` e não foi tocado
  (confirmado via grep em todo uso de `bg-base` antes de mexer).

## Álbuns: efeito de profundidade nos cartões

- Card "sozinho" (só um álbum publicado) ficava parecendo vazio. Adicionado
  um cartão-fantasma rotacionado atrás (efeito pilha de fotos) + uma
  fitinha washi decorativa no canto, em todo cartão do carrossel — não só
  quando tem um só.

## /link: mais ícones e elementos flutuantes coloridos

- `iconePara()` ganhou mais palavras-chave (câmera, Photoshop/design,
  Premiere/edição/vídeo) — link cadastrado com esses termos no título já
  sai com o ícone certo.
- Ícones flutuantes decorativos (Instagram, câmera, YouTube) no topo da
  página, cada um com uma cor diferente — não precisa ficar só no
  vermelho/preto do resto do site, como pedido.
- Balõezinhos de chat decorativos (verde do WhatsApp, única exceção
  combinada ao tema vermelho/preto) no botão de WhatsApp.

## Rodapé: sem links de navegação nem painel administrativo

- Removida a fileira de links (Início/Contato/etc. + "Painel
  administrativo") do rodapé do site público. No lugar, mostra as cidades
  marcadas no mapa (mesma fonte de dados do mapa de atendimento).
- **Não mexido de propósito:** o menu do celular (☰) ainda tem um link
  pequeno "Entrar no painel" — ele reclamou especificamente do rodapé
  ("o final" da página), não desse atalho discreto no menu, que parece ser
  o jeito dele de entrar no próprio painel pelo celular. Fica fácil de tirar
  também se ele preferir.

## Verificação

- `tsc --noEmit`: 323 erros, igual ao baseline conhecido (nenhum erro novo
  introduzido pelas mudanças desta versão — conferido arquivo por arquivo
  entre os que foram tocados).

---

# Instaby App — v147

Parte 3 do redesign do painel — entregue de uma vez, em cima de um lote
grande de feedback em áudio transcrito, sem estrutura, com autorização
explícita dele pra tocar tudo sem parar pra perguntar nem esperar aprovação
da Parte 2 antes de começar (ele que liberou desta vez). Cobre boa parte do
que tava planejado como Parte 3 (Tarefas) e pedaços da Parte 4
(Configurações, Horas, Financeiro, Comercial) — o que ficou de fora está
listado no fim desta seção.

## Configurações pessoais (novo) — pra qualquer pessoa da equipe

- Tela nova em `/dashboard/perfil` (`app/dashboard/perfil/`), fora do
  bloqueio de `gerenciarConfiguracoes`/`gerenciarEquipe` que trava
  `/dashboard/configuracoes/*` — de propósito, porque isso aqui é
  auto-serviço de cada um sobre os PRÓPRIOS dados, não gestão de equipe.
  Acessa clicando no próprio nome no rodapé do menu lateral.
- Dá pra trocar: foto (upload via `UploadImagem`, pasta "avatares"), nome,
  e-mail, senha (pede a senha atual) e uma lista de links de contato
  (Discord, WhatsApp, Instagram, e-mail, outro).
- **Detalhe técnico:** troca de e-mail quebraria a sessão sem um ajuste — a
  sessão do NextAuth é um JWT que não sabia se atualizar sozinho, e
  `getUsuarioAtual()` busca o usuário pelo e-mail da sessão. Adicionado um
  `callbacks.jwt` em `lib/auth.ts` (que não tinha nenhum callback antes) pra
  aceitar `session.update()`; o formulário chama isso depois de salvar, e no
  caso específico de troca de e-mail força um logout (mais seguro que
  confiar só na atualização do token). Schema ganhou `Usuario.fotoUrl` e o
  modelo novo `LinkUsuario` (espelha `LinkCliente`).

## Editor e Tráfego pago: Início virou quadro Kanban pessoal

- Substituído o "Fazendo agora / Minha fila / Disponíveis" (3 seções
  separadas) por um quadro só (A fazer / Fazendo / Pronto) —
  `components/dashboard/QuadroTarefasPessoal.tsx`, reaproveitando as cores e
  o limite de 8 cards em "Pronto" (`COLUNAS`/`LIMITE_FEITO`) exportados do
  quadro de Tarefas já existente (`QuadroTarefas.tsx`), porque a regra dele
  foi clara: **todo Kanban do app usa o mesmo estilo, sempre.**
- Cada card tem acesso rápido à pasta do Drive da tarefa (quando ela tem uma
  vinculada) e um botão de ação sensível ao contexto: "Pegar pra mim" (tarefa
  livre), "Iniciar" (assume + muda status + começa um registro de horas sem
  hora de fim) ou "Marcar feito" + sub-passos expansíveis. Arrastar um card
  de A fazer pra Fazendo dispara o mesmo "Iniciar"; arrastar de qualquer
  outro lugar pra Fazendo só muda o status (não reabre um cronômetro à toa).
- Tráfego pago ganhou a mesma seção "Suas tarefas" no Início, e a Agenda dele
  também passou a mostrar só os itens dele (ver seção de Horas/Agenda
  abaixo — mesma regra pro editor e pro tráfego).
- Checklist com presets ao criar uma tarefa (`lib/presetsChecklist.ts`):
  "Básico" e "Virais / edições criativas", ou digitar os próprios passos.
  Usa a tabela `ChecklistItemTarefa` que já existia (sub-passos de UMA
  tarefa) — diferente do `TemplateTarefas` (que cria VÁRIAS tarefas de uma
  vez), então não mexeu nisso.
- Editor ganhou acesso à aba "Links" dentro da página do cliente (antes só
  quem tinha acesso completo ao cliente via).
- Página de Tarefas (`/dashboard/tarefas`) virou o mesmo quadro Kanban, no
  lugar das abas Abertas/Concluídas/Todas — "Nova tarefa" continua separado.

## Horas e Agenda: avatar de quem fez, filtro por funcionário, e privacidade

- `components/ui/AvatarPessoa.tsx` (novo): foto se a pessoa tiver colocado
  uma em Configurações pessoais, senão iniciais numa cor derivada do nome —
  cor própria e estável por PESSOA, diferente do círculo de iniciais por
  PAPEL que já existia na Sidebar/"Equipe agora" (esse não mudou). Usado em
  Horas (lista do dia, calendário, calendário por cliente) e Agenda (grade
  mensal + detalhe do dia).
- Horas ganhou um seletor "ver por funcionário" (só o dono vê essa opção).
- **Mudança de regra, pra Horas E Agenda:** `usuario.master` virou o único
  critério de "vê tudo" — todo mundo que não é dono (editor, tráfego, e
  qualquer papel futuro) só vê os PRÓPRIOS itens, no lugar da regra antiga
  (que variava por tela). Aplicado também em `/dashboard/horas/[clienteId]`
  — o calendário de horas por cliente, rota separada acessada direto por URL
  a partir da página do cliente, que **não tinha nenhuma trava de permissão
  antes** (nem de cliente, nem de "só vê o próprio"): virava um jeito de
  furar a regra nova só de saber o endereço. Corrigido com as mesmas travas
  que a página do cliente já usa (`getUsuarioAtual` + `podeVerCliente`) mais
  o filtro pessoal.

## Auditoria: zero R$ visível sem a permissão `verFinanceiro`

- Conferido o app inteiro atrás de valor em R$ aparecendo sem essa
  permissão — em duas passadas (uma própria, e uma segunda revisão
  independente por cima do que já tinha sido corrigido, que pegou mais 2
  pontos que a primeira passada tinha deixado passar). Achados e corrigidos
  4 pontos que vazavam mesmo sem `verFinanceiro`:
  - Lista de Clientes: StatTile "Mensalidade recorrente" + mensalidade/total
    recebido em cada card — agora zerados na consulta, não só escondidos na
    tela.
  - Chip de mensalidade no topo da página de um cliente — aparecia pra
    qualquer um que pudesse abrir a página, não só quem tinha acesso
    financeiro.
  - **Aba "Visão Geral" do cliente** (`VisaoGeralClienteTab.tsx`):
    mensalidade, próxima cobrança, receita/despesas/custo-de-horas/
    rentabilidade do mês e o gráfico de faturamento de 6 meses apareciam
    inteiros pra qualquer um com `acessoClienteCompleto`, sem checar
    `verFinanceiro` — o botão de "ocultar valores" só borra visualmente, não
    é uma permissão, então não contava. O texto da linha do tempo também
    embutia o valor de cada pagamento recebido direto na frase. Corrigido
    escondendo só os pedaços com R$ (o resto da aba — horas do mês,
    relatório, próxima atividade — continua liberado); o valor só entra na
    linha do tempo pra quem tem a permissão.
  - **Aba "Serviços" do cliente** (`ServicosContratadosTab.tsx`): mostrava
    (e deixava editar) o valor de cada serviço contratado, desconto,
    acréscimo, mensalidade final e valor de renovação, atrás só de
    `acessoClienteCompleto`. Essa aba é 100% preço/contrato, então em vez de
    redigir número por número dentro de um editor com bastante estado,
    ela virou mais uma aba com trava própria (`verFinanceiro`), no mesmo
    grupo de Financeiro/Orçamentos/Contratos — não a trava genérica
    `acessoClienteCompleto` de antes.

## Corrigido: sessão de quem é desativado continuava valendo (achado na revisão)

- A segunda revisão (independente, sobre o que já tinha sido feito) achou um
  problema mais sério: o `middleware.ts` só confere se existe um cookie de
  sessão válido — não se `usuario.ativo` ainda é `true` no banco (isso exige
  ir no banco, e o middleware roda antes disso, por design). A sessão dura
  até 30 dias (`lib/auth.ts`). Então desativar alguém em Configurações →
  Equipe não derrubava a sessão dele: pelo tempo que sobrasse dela, todo
  `getUsuarioAtual()` continuava rodando normal até achar `ativo: false` e
  devolver `null` — e o `app/dashboard/layout.tsx` (a casca que envolve toda
  página do painel) tratava esse `null` caindo pra um objeto de permissão de
  **dono, com tudo liberado**, só pra Sidebar não quebrar sem usuário. A
  `/dashboard/agenda` ia além: com `usuarioAtual=null`, o filtro "só vejo o
  que é meu" virava um filtro vazio (SEM filtro nenhum) em vez de "nada" —
  mostraria a agenda inteira da agência, incluindo horas e tarefas de todo
  mundo.
- Corrigido nos 3 pontos: `app/dashboard/layout.tsx` agora manda pro login
  se `usuarioAtual` vier nulo (em vez de fingir ser dono) — como essa layout
  envolve toda página do painel, isso sozinho já fecha a brecha pra
  qualquer página que ainda não tivesse essa trava própria; `app/dashboard/
  agenda/page.tsx` e `app/dashboard/clientes/page.tsx` ganharam a mesma
  trava, pelo mesmo motivo que `ClienteDetalhePage`/`HorasClientePage` já
  tinham (defesa em camadas, não só confiar na layout de cima).
- **Não mexido, de propósito, por ser uma mudança maior de arquitetura, não
  um ajuste pontual:** o `middleware.ts` continua sem checar `ativo` (só o
  cookie), e o NextAuth (sessão em JWT) não tem como revogar um token já
  emitido antes dos 30 dias — então desativar alguém ainda não desconecta
  ele na hora, só garante que, na próxima vez que uma página realmente
  checar o banco (o que agora é toda página do painel, graças à trava na
  layout), ele cai fora. Se quiser desconexão imediata de verdade, dá pra
  conversar sobre isso numa próxima parte (normalmente envolve trocar pra
  sessão de banco em vez de JWT, ou guardar um "carimbo de desativação" pra
  invalidar tokens antigos).

## Início do dono e navegação: ajustes visuais

- "Equipe agora" e "Precisa da sua atenção" — antes dois blocos de largura
  cheia, um embaixo do outro, bem maiores que os 4 cards de KPI ali em cima —
  viraram um do lado do outro, do tamanho de 2 cards cada, formando uma
  segunda fileira. Se só um dos dois tiver conteúdo, ele ocupa a fileira
  inteira sozinho.
- Financeiro e Comercial: a barra de abas que ficava em cima da página
  (`components/layout/AbasSecao.tsx`, removido — sem mais uso) virou um
  submenu que abre dentro do próprio item "Financeiro"/"Comercial" no menu
  lateral — clica no item pra abrir/fechar, clica numa sub-opção pra
  navegar. Abre sozinho ao entrar numa tela da seção; depois disso, quem
  manda é o clique da pessoa.

## Ficou de fora desta entrega (de propósito)

- **Indefinido, ele mesmo sinalizou que ia voltar a decidir depois:** um
  jeito de acompanhar "saldo" de verba de anúncio no Tráfego pago, o desenho
  exato da métrica de tendência mês a mês do Tráfego Pago, e um redesign da
  lista de Clientes.
- **Painel lateral de detalhe da tarefa** (da Parte 3 original) não entrou —
  o que entrou foi o quadro pessoal + checklist dentro do card, que cobre
  boa parte da mesma necessidade sem o painel em si.
- **Gap de permissão identificado, não mexido:**
  `app/api/clientes/[id]/tarefas/route.ts` (rota de criar tarefa dentro de
  um cliente, mexida nesta entrega pra aceitar o checklist) não tem nenhuma
  checagem de autenticação/permissão — pré-existente, fora do escopo do que
  foi pedido, registrando pra decidir depois.
- **De propósito, não mexido:** o feed `.ics` da Agenda (`/api/agenda.ics`)
  continua sem filtro nenhum (mostra tudo pra quem tiver o link, inclusive
  valor) — instrução explícita de não mexer nisso por enquanto.
- **Detalhe técnico pra registro:** `tsc --noEmit` sem nenhum erro novo —
  só o barulho de sempre do client do Prisma deste sandbox (nunca terminou
  de gerar de verdade porque o download do motor dele é bloqueado aqui, e
  isso faz todo retorno de consulta virar `any`). Schema ganhou
  `Usuario.fotoUrl` e `LinkUsuario` (roda `prisma db push
  --accept-data-loss` no build, igual sempre).

# Instaby App — v146

Correção de um erro de build que a v145 subiu sem querer (o deploy dela
falhava no ar — ver "Correção de build" logo abaixo). O conteúdo da Parte 2
do redesign (as 3 telas de Início) é o mesmo descrito na seção da v145,
alguns parágrafos abaixo — só o código quebrado foi corrigido, nada mudou
no que a tela mostra. Faltam ainda as Partes 3 a 5 (Tarefas — quadro e
painel lateral —, Clientes/Financeiro em si/Comercial em si/Horas/
Configurações, Login+páginas do celular). **Aguardando aprovação da Parte 2
antes de começar a Parte 3.**

## Correção de build (v146): erro de tipo travava o deploy da v145

- A v145 falhava no build da Vercel (ficava na versão antiga no ar, o commit
  novo nunca ia pro ar) com este erro: `Type 'Decimal' is not assignable to
  type 'number'` em `app/dashboard/page.tsx`, na função que soma os
  resultados de tráfego pago do mês pro Início do gestor de tráfego.
- Causa: campo de dinheiro do banco (`verbaInvestida`/`valorRetorno` de
  Resultado de Campanha) chega do Prisma como um tipo especial de número
  decimal (`Decimal`), não um `number` puro do JavaScript — mesma natureza
  do ajuste feito lá na v110 (`lib/prisma.ts`), só que daquela vez pra
  serialização de resposta de API, e aqui é o `page.tsx` lendo direto do
  banco (sem passar por API no meio) e entregando pra uma função que
  esperava `number` de verdade. Sem `prisma generate` funcionando neste
  sandbox de trabalho (bloqueio de rede de sempre), essa peça específica só
  aparece quando o Prisma de verdade é gerado — e isso só acontece no build
  da Vercel, não aqui. Por isso passou despercebido na entrega da v145: a
  verificação por aqui não tem como pegar esse tipo de erro específico
  (registrado na memória do projeto, pra não repetir a mesma surpresa numa
  parte futura).
- Corrigido convertendo esse valor pra `number` assim que ele sai da
  consulta ao banco — mesmo padrão (`Number(...)`) já usado em todo o resto
  do arquivo pra outros valores de dinheiro. Conferido a mão, campo por
  campo do schema, que não sobrou nenhum outro ponto do código da Parte 2
  com esse mesmo problema.
- **Depois de subir esta correção pro GitHub, espera a Vercel terminar o
  deploy novo antes de testar** — o site só reflete a Parte 2 de verdade a
  partir daí.

## Parte 2 do redesign: as 3 telas de Início (dono, editor, tráfego)

- **Início do dono** — tudo que já existia (faturamento do mês com meta e
  gráfico de 6 meses, alertas, performance por cliente, atividade recente)
  continua igual, com o seguinte por cima: **"Equipe agora"**, mostrando o
  que cada pessoa ativa está fazendo neste exato momento (a partir do
  cronômetro) e quantas horas já lançou essa semana; um bloco de **tarefas
  por status** (a fazer / em andamento / feitas essa semana); **caixa dos
  próximos 7 dias** (a receber e a pagar, dia a dia); e 2 alertas novos na
  lista de "Precisa de você" — tarefa sem responsável e proposta enviada sem
  resposta.
- **Início do editor** — tela nova, sem nenhum valor em R$: **"Fazendo
  agora"** (a tarefa em andamento, com checklist de sub-passos e um botão
  "Marcar como feito"), **"Minha fila"** (tarefas atribuídas a essa pessoa,
  ordenada por prazo, com botão de iniciar o cronômetro direto ali),
  tarefas **disponíveis pra pegar** (sem dono ainda — botão "Pegar pra
  mim"), próximas captações agendadas e horas lançadas essa semana.
- **Início do gestor de tráfego** — tela nova: investido no mês, resultados,
  custo por resultado e retorno; uma **barra de ritmo de verba** por
  campanha ativa (mostra o quanto já foi investido contra o que "deveria"
  estar investido pra essa altura do mês); alertas (campanha sem resultado
  lançado há mais de 7 dias, campanha bem abaixo do ritmo); relatórios do
  mês; e criativos pedidos ao editor (tarefas de arte/reel/fotos/gravação
  em aberto pra clientes com campanha ativa).
- **Checklist dentro da tarefa** — sub-passos simples (ex: roteiro,
  captação, edição, aprovação), pensados pra reaproveitar no painel lateral
  de tarefa que vem na Parte 3.
- **Tarefa ganhou um responsável** (campo novo e opcional — tarefa antiga
  sem dono continua funcionando normal). Por enquanto só dá pra assumir uma
  tarefa sem dono pelo botão "Pegar pra mim" no Início do editor; escolher/
  trocar o responsável na hora de criar ou editar a tarefa fica pra Parte 3
  (painel lateral de tarefa).
- **Ficou de fora desta parte, de propósito:** o item "Voltou com ajuste"
  (tarefa que o cliente pediu pra revisar) — depende de um fluxo de
  aprovação do cliente que ainda não existe no app; entra quando a Parte 3
  construir isso.
- **Detalhe técnico pra registro:** mudança de schema (campo `responsavelId`
  e `concluidaEm` em Tarefa, tabela nova de checklist) avisada e aprovada
  antes de codar. `tsc --noEmit` sem nenhum erro novo de verdade — só o
  barulho de sempre do client do Prisma desse sandbox (que nunca terminou
  de gerar de verdade, porque o download do motor dele é bloqueado aqui);
  como esse client fica travado igual a um "aceita qualquer coisa", ele não
  vai acusar erro de campo digitado errado, então cada nome de campo novo
  foi conferido um a um direto no schema à mão. Tailwind recompilado e
  conferido que as cores novas (`bg-pessoa-trafego/20` etc.) geram CSS de
  verdade. Sem `next dev` funcional nesse sandbox (mesmo motivo do Prisma),
  então não deu pra clicar no app rodando — verificação 100% por leitura de
  código, igual sempre.

## Parte 1 do redesign: base visual, menu, topo, casca de Financeiro/Comercial

- **Cor e fonte novas, só dentro do painel e do login.** Uma classe
  (`.tema-painel`) sobrescreve a paleta só ali — a landing e o `/link`
  continuam exatamente como estavam, sem nenhuma mudança. Fontes novas:
  Manrope no texto geral, JetBrains Mono em valores/horas/contagens.
- **Cartão sólido, sem transparência nem blur** (era `bg-card/70` com
  desfoque) — como o componente de cartão só é usado dentro do painel/login,
  a mudança não vaza pra lugar nenhum de fora.
- **Menu lateral**: 248px (era 280px), fundo próprio mais escuro que o resto
  do painel. Reorganizado — Início, Tarefas (contador vermelho de
  atrasadas), Agenda, Clientes (contador de ativos), Tráfego pago (só pra
  quem gerencia tráfego), Horas; grupo "Gestão" (só quem tem acesso) com
  Financeiro (contador vermelho de cobranças vencidas) e Comercial.
  Configurações saiu da lista e virou a engrenagem no rodapé, ao lado do
  avatar, nome, cargo, botão de tema e do botão de sair.
- **Barra do topo**: cronômetro novo (usa o registro de horas que já
  existia, nenhum dado novo no banco) — clica, escolhe cliente/atividade,
  roda ao vivo na barra até parar. Atalho ⌘K foca a busca de qualquer tela.
  Botão vermelho "Nova tarefa" abre um formulário rápido de qualquer lugar
  do painel (antes só existia dentro da própria página de Tarefas).
- **Financeiro e Comercial**: cada um virou 1 item só no menu, com abas por
  dentro da página. As 5 telas do Comercial (Oportunidades, Orçamentos,
  Contratos, Serviços, Pacotes) continuam nos mesmos endereços de sempre —
  só ganharam a barra de abas em cima ligando uma na outra. **O conteúdo
  novo de cada aba (o "Resumo" do Financeiro, o funil do Comercial etc.) é
  da Parte 4** — por enquanto é o mesmo conteúdo de sempre, só com o visual
  novo por cima.
- Sem imagem de referência disponível pra essa parte (não chegou anexada) —
  segui as medidas e cores exatas que vieram por escrito. Se algo não bater
  com o desenho aprovado, é só apontar.
- **Detalhe técnico pra registro:** `tsc --noEmit` no total de sempre (305),
  zero erro novo; recompilei o Tailwind isolado e conferi uma a uma as
  classes novas com opacidade (`bg-sidebar`, `bg-inset`, `bg-accent/15` etc.)
  pra não repetir o bug da v141; conferido visualmente com um mockup usando
  o CSS real do projeto, nos dois temas (escuro/cinza).

## v143

Um pedido direto: faltava um jeito de sair da conta pelo próprio app.

## Adicionado: botão de sair da conta

- Novo botão ao lado do de trocar o tema (ícone de trocar, ⏻), na caixa com
  seu nome e e-mail no rodapé do menu lateral — funciona igual no desktop e
  no menu mobile, porque os dois usam o mesmo bloco por baixo dos panos.
- Pede uma confirmação antes de sair de verdade (mesmo padrão de aviso que
  já existe nos botões de excluir espalhados pelo app), pra evitar deslogar
  sem querer com um clique errado logo ali do lado do botão de tema. Ao
  confirmar, encerra a sessão e volta pra tela de login.
- **Detalhe técnico pra registro:** `tsc --noEmit` no mesmo total de sempre
  (305, barulho conhecido do client do Prisma desatualizado), zero erro
  novo. Como o espaço ali no rodapé do menu é apertado (avatar + nome +
  e-mail + dois botões), conferi visualmente com um mockup usando o CSS
  real do projeto, inclusive simulando um nome bem comprido, pra garantir
  que não quebra ou fica espremido.

## v142

Correção de um bug visual sério que a v141 introduziu sem querer (várias
caixas do app perdendo o fundo escuro), mais dois ajustes pedidos depois de
ver a v141 no ar: Novidades mudou de lugar e o sininho parou de mentir.

## Corrigido: caixas com fundo sumindo e borda clara (bug da v141)

A v141 trocou as cores do Tailwind (`base`, `card`, `hover`, `accent`,
`text`, `muted`) de valor fixo pra variável CSS, pra dar suporte ao tema
cinza novo. Isso quebrou, em silêncio (sem erro nenhum no build), toda
classe que usa essas cores **com opacidade** — `bg-card/60`, `bg-card/70`,
`border-accent/20`, `bg-accent/10`, `text-muted/70` e por aí vai: o Tailwind
não consegue calcular a transparência de uma variável sem ela guardar o
valor num formato específico, então a classe simplesmente não virava CSS
nenhum. Na prática, isso tirava o fundo escuro (ficava transparente) de uma
quantidade grande de caixas e cartões pelo app inteiro — incluindo o
componente `Card` usado em quase toda tela — e deixava a borda aparecendo
com a cor do texto (branca) por baixo.

**Corrigido na raiz**: as variáveis de cor agora guardam o valor em
"R G B" (ex.: `19 21 25`) e o Tailwind usa o formato
`rgb(var(--cor) / <valor-alfa>)`, que é o jeito correto de deixar uma cor
customizada funcionar com opacidade dinâmica. Conferido depois do conserto,
com uma comparação lado a lado (print) de antes/depois nos dois temas —
fundo e borda das caixas voltaram a aparecer do jeito certo, incluindo com o
tema cinza ligado.

## Novidades mudou de lugar, sininho parou de mentir

- O item "Novidades" saiu do menu lateral (achado escondido demais) e virou
  um ícone de estrelinha no topo da tela, do lado do sininho de
  notificações — mais fácil de ver e clicar.
- Tirado o pontinho vermelho do sininho, que ficava sempre aceso mesmo sem
  nenhuma notificação de verdade por trás. O sininho em si continua sem
  abrir nada — isso já era assim desde antes da v141, não é regressão desta
  leva — fica registrado como possível próximo passo, se fizer sentido
  construir um sistema de notificação de verdade.

**Detalhe técnico pra registro:** `tsc --noEmit` no mesmo total de sempre
(305, barulho conhecido do client do Prisma desatualizado), zero erro novo.
Essa leva, por ser puramente visual/CSS, foi conferida também com um
mockup estático usando o CSS real compilado do projeto + print via
Playwright, não só leitura de código.

## v141

Rodada de ajustes pedidos numa revisão ao vivo do app: uma página de
novidades pra acompanhar o que muda a cada versão, reorganização e mais cor
no Dashboard, tema alternativo de fundo, e dois bugs corrigidos em Clientes.

## Novidades — histórico de versões dentro do próprio app

Novo item "Novidades" no menu lateral (ícone de estrelinha, logo abaixo de
Horas), levando pra uma página que lista o que mudou em cada versão, em
linguagem simples — sem termo técnico, sem nome de arquivo. Uma bolinha
aparece ao lado do item no menu quando tem versão nova que a pessoa ainda
não visitou; some sozinha ao abrir a página.

**Processo permanente a partir de agora:** toda versão nova entregue ganha
uma entrada nova nessa página — então você e o time sempre vão ter onde
conferir o que mudou, sem precisar perguntar.

## Dashboard — ordem nova e mais cor

- O bloco "Precisa da sua atenção" subiu de posição: agora aparece logo
  abaixo dos 4 cartões do topo (Clientes ativos, Leads em aberto,
  Faturamento, Cobranças pendentes), antes do gráfico de faturamento — como
  pedido.
- Os cartões "Clientes ativos" (azul) e "Leads em aberto" (roxo) ganharam a
  borda colorida com degradê, no mesmo estilo que já existia no cartão
  "Insight Instaby" — só nesses dois por enquanto, de propósito, pra não
  ficar repetitivo. Apontando outros lugares onde vale o mesmo efeito, dá
  pra ir espalhando aos poucos.

## Tema de fundo alternativo (cinza)

Botão novo ao lado do nome do usuário, no rodapé do menu lateral — alterna
o fundo do sistema entre o escuro padrão de sempre e um cinza mais neutro
(ainda escuro, não é modo claro). Fica salvo no navegador, então cada
pessoa escolhe o que preferir sem afetar as outras.

**Sobre a cor exata:** a imagem enviada como referência não correspondeu à
descrição — em vez de um print do calendário em cinza, chegou o ícone
pequeno do app de Calendário (branco/vermelho/preto, sem nenhum cinza
nele), então não deu pra tirar a cor de lá. Ficou um cinza neutro como
ponto de partida provisório. Com o print certo (ou só um código de cor tipo
#RRGGBB), a troca é rápida — é um ajuste pequeno agora que a estrutura já
existe (3-4 valores de cor num arquivo só).

## Clientes — dois bugs corrigidos

- A "janelinha de buscar" no topo, que antes era só um desenho sem
  funcionar (daí a sensação de travada), agora é uma busca de verdade:
  digita 2+ letras e já aparecem clientes e orçamentos correspondentes,
  clica e vai direto pra lá. Aparece em qualquer tela do painel, não só em
  Clientes.
- O botão "Novo cliente" duplicado sumiu. De brinde: o mesmo tipo de
  duplicação existia (ainda não reportada) em Serviços, Pacotes, Orçamentos
  e na aba de Orçamentos dentro de um cliente — corrigido nos 4 lugares de
  uma vez, porque vinha da mesma origem.

**Detalhe técnico pra registro:** `tsc --noEmit` deu o mesmo total de erros
de sempre (305, todos conhecidos e sem relação com essa leva) e zero erro em
qualquer um dos arquivos tocados ou criados agora.

## v140

Varredura de um tech debt que já tinha sido identificado (mas não fechado de
propósito) lá na v137: telas que salvam/excluem algo sem checar se a API
aceitou o pedido. Sem essa checagem, se a gravação falhasse por qualquer
motivo (queda de conexão, sessão expirada, regra de negócio recusando), a
tela seguia como se tivesse dado certo — formulário fechava, botão parava de
girar — sem avisar que nada foi salvo de verdade.

## Corrigido: 13 telas que falhavam em silêncio

Mesmo padrão da correção que a Tarefa já tinha (v137): checa se a resposta
da API deu certo e, se não deu, avisa com uma mensagem e não fecha o
formulário nem assume que salvou. Onde foi corrigido:

- **Dentro do cliente**: Contratos (gerar, editar texto, mudar status,
  anexar assinado, excluir), Links, Contatos, Onboarding (iniciar, mudar
  status/responsável, lançar tempo, adicionar/excluir item), Solicitações.
- **Comercial**: Pipeline de Oportunidades (editar campo, marcar
  ganha/perdida, excluir).
- **Tráfego Pago**: criar/editar/excluir campanha.
- **Tarefas**: quadro (kanban) — mudar status, marcar feito, excluir.
- **Horas** e **Agenda**: editar/excluir registro de horas ou compromisso.
- **Financeiro**: excluir/editar despesa, lançar baixa de pagamento.
- **Relatórios**: excluir relatório.
- **Configurações**: templates de checklist de tarefa.

Achado de bônus nessa varredura: o quadro de Tarefas (arrastar card pra
"Feito") tinha um caso real disso acontecendo hoje — uma tarefa de Reel sem
vídeo bruto na pasta (trava que você pediu na v137) já era recusada pelo
servidor certinho, mas o quadro não mostrava por quê — o card só "voltava"
sozinho pro lugar de antes, sem explicação. Agora aparece a mensagem
("...ainda não tem o vídeo bruto na pasta...") de verdade.

**Fora dessa leva, por decisão de escopo**: rodando uma busca no projeto
inteiro, achei bem mais lugares com esse mesmo padrão faltando do que os 13
já mapeados desde a v137 — a maioria formulários de Configurações → Site
(textos/imagens do site público). Como são de menor risco (conteúdo do
site, não dado de cliente/financeiro) e o pente-fino ficaria bem maior que
essa leva, deixei de fora de propósito — fechei só essa lista de 13 que já
era conhecida. Se quiser, numa próxima leva fecho o resto também.

**Detalhe técnico pra registro:** mudança só de tratamento de erro (nenhuma
regra de negócio nova) — `tsc --noEmit` deu o mesmo total de erros de antes
(305, todos os de sempre) e zero erro em qualquer um dos 13 arquivos
tocados.

## v139

Segunda leva do pedido grande da v138 — agora sim o redesign visual das áreas
que ainda estavam no estilo antigo. Painel inteiro agora segue a mesma
linguagem visual (cards com entrada animada, StatTiles no topo de cada tela,
cantos/bordas/cores padronizados) que já existia em Dashboard, Clientes e
Tráfego Pago desde antes.

## Redesign visual — Financeiro

- Patrimônio: cards de bens (visualização e edição) passaram a usar o mesmo
  componente `Card` com entrada animada em cascata do resto do app.
- Ajustes pequenos de tamanho de texto pra bater com o padrão das outras
  telas.
- **Mantido de propósito**: Financeiro não ganhou gráfico nenhum — continua só
  números e calendário, como você já tinha pedido antes. Tinha um cálculo de
  gráfico não usado sobrando no código; não vira gráfico em lugar nenhum, só
  ficou ali sem uso mesmo.

## Redesign visual — Comercial

- Oportunidades: 3 cartões de resumo no topo (Em aberto / Valor estimado /
  Ganhas) e o quadro (kanban) de estágios ganhou o mesmo visual de painel
  arredondado que o quadro de Tarefas já usava — colunas mostram contagem e
  valor total, cards com destaque ao passar o mouse.
  Modal de detalhe e o jeito de mudar estágio não mudaram.
- Orçamentos, Contratos, Pacotes e Serviços: cada um ganhou uma linha de
  cartões de resumo no topo, usando dado que a tela já buscava (sem consulta
  nova ao banco).

## Redesign visual — Tarefas

Conferi a tela de Tarefas, o calendário de tarefas e o quadro (kanban) — já
estavam todos no visual novo de um trabalho anterior. Nada pra mudar aqui.

## Redesign visual — Agenda

Cartões de resumo no topo (Compromissos no período / Horas lançadas / Hoje),
com o mesmo dado que a tela já calculava pro calendário — sem consulta nova.

## Redesign visual — Horas

A caixa única de "Total do mês" virou 3 cartões de resumo: total do
período, cliente com mais horas no período, e registros de hoje. Calendário
de horas (geral e por cliente) já estava no visual novo — conferido, sem
mudança necessária.

## Redesign visual — Tráfego Pago

Linha de cartões de resumo no topo (Campanhas ativas / Verba ativa sob
gestão / Pausadas), no mesmo padrão do resto do app. Formulário de campanha,
importação do Meta e o card de cada campanha já estavam no visual novo.

Com isso fecha o pedido de redesign visual completo — todas as áreas do
painel agora seguem a mesma linguagem visual.

**Detalhe técnico pra registro:** mesma validação de sempre (`tsc --noEmit`
lido à mão, comparando com o que já dava erro antes) — ainda sem acesso ao
`prisma generate` neste ambiente. Nenhum erro novo real, só o barulho de
sempre, em arquivo que eu não toquei ou que já vinha em cascata do client do
Prisma desatualizado.

## v138

Primeira leva de um pedido grande (o resto — redesign visual das áreas que
ainda estavam no estilo antigo — vem nas próximas versões). Essa parte aqui é
toda de dados/permissão, sem mudar a aparência de nada.

## Alcance e métricas novas do Meta em Resultados de Campanha

Você pediu o campo de alcance manual — adicionei, e aproveitei pra pesquisar
o que mais poderia valer a pena de métrica de tráfego pago.

- **Alcance**: agora dá pra lançar na mão (Novo resultado / Editar resultado),
  igual verba, impressões e cliques. Antes só existia se viesse de importação
  do Meta — lançamento manual não tinha o campo.
- **Frequência** (impressões ÷ alcance): mostra quantas vezes, em média, a
  mesma pessoa viu o anúncio. É o sinal clássico de "criativo cansado" —
  passou de ~2-3 em prospecção ou ~5-7 em remarketing, geralmente é hora de
  trocar o criativo ou pausar. Calculada sozinha, não precisa lançar nada a
  mais pra ela aparecer.
- **CPM** (custo a cada mil impressões): mostra se o leilão do Meta pra
  aquele público/período está caro ou barato, independente de quantos
  resultados saíram — complementa o "custo por resultado" que já existia.
- O painel de estatísticas do topo (Investido / Resultados / etc.) ganhou
  esses 3 novos cartões — Alcance, Frequência e CPM — ao lado dos que já
  existiam.

Deixei de fora as métricas específicas de vídeo (hook rate, hold rate) porque
o app não guarda visualização de vídeo hoje — não dava pra calcular de
verdade, só ia virar decoração.

## Revisão de acessos — Editor restrito só aos arquivos

Você pediu pra revisar os acessos porque vai entrar um Editor (só precisa
baixar arquivo) e um Gestor de Tráfego (acesso diferente) em breve.

- **Nova capacidade em Configurações > Equipe**: "Acesso completo dentro do
  cliente". Desligada, a pessoa só vê a aba **Arquivos** (se também tiver
  essa permissão) e **Horas** ao abrir qualquer cliente — Visão Geral,
  Contatos, Onboarding, Solicitações, Tarefas, Serviços, Links e Relatórios
  ficam ocultos pra ela. Ligada (o padrão de sempre) não muda nada de como
  já funcionava.
- **Preset "Editor"** (botão rápido no formulário de Equipe) já vem com essa
  capacidade desligada e "Ver arquivos" ligada — clica no preset e já sai
  pronto pro que você descreveu, sem precisar configurar campo por campo.
  Os outros presets (Social Media, Gestor de Tráfego, Comercial, Financeiro)
  continuam com acesso completo, porque fazem sentido ver as abas gerais do
  cliente.
- **Horas continua universal**: não existe (e não precisa existir) permissão
  pra isso — todo login ativo já podia registrar e ver as próprias horas, com
  ou sem essa restrição nova. Só confirmei que o Editor restrito não perde
  esse acesso.
- **Corrigido de brinde**: se alguém pedisse por URL uma aba que não pode
  ver, a tela caía sempre pra "Visão Geral" — o que ia ficar errado assim que
  essa aba passasse a poder estar bloqueada pra alguém. Agora cai pra
  primeira aba que a pessoa realmente enxerga.

## Quem lançou cada hora — Horas e Agenda mostram o autor

Cada registro de horas agora guarda quem lançou (a partir da sessão de quem
está logado — não dá pra digitar em nome de outra pessoa). Onde aparece:

- Lista de horas de hoje e "sem cliente" na tela Horas.
- Card de detalhe de um dia no calendário de Horas (geral e por cliente).
- Card de detalhe de um dia na Agenda, pros itens que são hora trabalhada.

Registros lançados antes dessa versão não têm autor salvo (não dava pra
adivinhar quem foi) — só aparecem sem esse detalhe, sem quebrar nada.

**Detalhe técnico pra registro:** ainda sem acesso ao `prisma generate` neste
ambiente (bloqueio de rede já reportado antes) — validei essa leva inteira
lendo o `tsc --noEmit` a mão e comparando com o que já dava erro antes, por
causa do client do Prisma local estar desatualizado. Nenhum erro novo real,
só o barulho de sempre em arquivo que eu não toquei.

## v137

## Pastas automáticas no Drive por cliente (parte 2 da automação)

Segunda parte da automação de pastas — agora sim cria e organiza as pastas de
verdade, além da conexão que já existia desde a v135.

**O que tem agora:** uma aba nova, "Arquivos", dentro da página de cada
cliente. Assim que alguém abre essa aba (ou quando a primeira tarefa de
gravação/reel/fotos com prazo é criada), o app cria sozinho, dentro do Drive
da agência, uma pasta com o nome do cliente contendo 3 subpastas:

- **Logotipos** — compartilhada com "qualquer um que tiver o link", pra quem
  for criar arte ou editar não precisar de conta própria no Drive da agência.
- **Conteúdo** — também compartilhada por link, organizada por semana (uma
  subpasta por semana, tipo "Semana 22–28 set"). É onde entra o material
  bruto (gravação/fotos) e sai o editado.
- **Contratos** — nunca é compartilhada por link, de propósito. Só quem loga
  direto na conta do Drive da agência (ou tem a permissão de Contratos aqui
  dentro do app) consegue ver.

A pasta da semana de cada tarefa de mídia (Gravação, Criar Reel, Fotos)
também aparece direto dentro da tarefa, com um botão "Abrir pasta".

**Trava de segurança pro Reel:** uma tarefa "Criar Reel" só sai de "A fazer"
se já tiver um vídeo de verdade dentro da pasta da semana dela no Drive. Tem
um botão "Verificar vídeo bruto" dentro da tarefa pra conferir isso a
qualquer momento — evita começar (ou marcar como pronta) a edição sem o
material ainda ter chegado.

**Quem pode ver:** nova permissão em Configurações > Equipe, "Ver arquivos
(Drive)" — só quem tiver ela marcada (ou acesso total) vê a aba Arquivos de
qualquer cliente. O preset "Editor" já vem com ela marcada.

**Detalhe técnico pra registro:** nada é criado em massa — as pastas de um
cliente só nascem na primeira vez que alguém realmente precisa delas. Se o
Drive falhar por qualquer motivo nesse momento (token, instabilidade, cota),
a aba mostra "pastas ainda não disponíveis" em vez de travar a página
inteira do cliente — isolei esse risco de propósito, depois de ter corrigido
na v136 um caso parecido (uma parte travando a página toda).

## Botões que falhavam sem avisar — corrigidos

Aproveitei pra revisar tarefas, cobranças, clientes e horas atrás de mais
erros do tipo "o botão não fez nada e ninguém soube por quê":

- **Excluir cliente** (em Editar cliente) e **excluir tarefa**: se o servidor
  recusasse (rede, permissão etc.), nada acontecia na tela — parecia que
  tinha excluído, mas não tinha. Agora avisam quando não conseguem.
- **Lançar pagamento numa cobrança** e **salvar detalhes de uma tarefa**
  (descrição, data, prioridade): mesmo problema, mesmo jeito de corrigir.
- **Ranking de horas por cliente**: se dois clientes tivessem o mesmo nome de
  exibição, as horas dos dois podiam se misturar por engano no total do mês.
  Corrigido — agora agrupa pelo cliente de verdade, não pelo nome dele.
- Um detalhe cosmético na tela Financeiro do cliente (dois cartões competindo
  pela mesma animação de entrada).

**Sobre "testar os botões":** não tenho como abrir o app de verdade e clicar
aqui dentro (este ambiente não tem acesso ao banco de dados nem às chaves do
Google) — a verificação foi lendo o código com cuidado, incluindo uma
varredura dedicada no projeto inteiro atrás desses padrões de erro. Onde
achei algo quebrado, corrigi; fora o que está listado aqui e na v136, nada
mais chamou atenção.

## v136

## Corrigido o erro no Clientes (bug em produção)

Achei a causa do "Application error" que você via ao abrir Clientes
(Digest 3240314787), a partir do log de erro que você mandou. Já está
corrigido, sem mudar nada na aparência da tela.

**O que era:** os 3 quadradinhos de resumo no topo do Clientes (Ativos /
Mensalidade recorrente / Leads em aberto) estavam montados de um jeito que
o Next.js não aceita em produção.

**Detalhe técnico pra registro:** o Next.js roda uma parte do código no
servidor e entrega o resultado pronto pro navegador, e outra parte roda
direto no navegador. Um ícone (do pacote lucide-react que a gente usa) é,
por baixo dos panos, uma função — e função não pode atravessar essa
fronteira servidor→navegador como se fosse um dado comum, só o desenho
já pronto dela pode. A tela de Clientes (que roda no servidor, porque
busca os clientes no banco) estava mandando o ícone "cru" pro
componente do quadradinho (que roda no navegador) — isso derrubava a
página inteira assim que tentava montar. Troquei pra montar o ícone
antes de mandar. Conferi o projeto inteiro atrás do mesmo padrão: só
existia nesses 3 quadradinhos, já corrigidos — os outros (Dashboard,
Tráfego Pago, dentro do próprio cliente) usavam um jeito diferente por
baixo dos panos e nunca tiveram esse problema.

## v135

## Conexão com o Google Drive (primeira parte da automação de pastas)

Primeiro pedaço da ideia de organizar pasta de cliente automaticamente no
Drive: por enquanto só a CONEXÃO em si — ainda não cria pasta nenhuma
sozinha, isso vem numa próxima parte.

**O que tem agora:** em Configurações, um cartão "Google Drive" com um botão
"Conectar". Clicando, você é levado pra tela do Google pra autorizar (login +
"Permitir"), e volta pro Configurações já mostrando "Conectado desde
[data]". Dá pra desconectar a qualquer momento pelo mesmo lugar.

**O que precisa estar configurado pra isso funcionar:** as variáveis
`GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Vercel (Settings →
Environment Variables) — configuradas juntas com você durante a conversa.
Se estiver faltando alguma, o cartão avisa isso claramente em vez de dar
erro sem explicação.

**Detalhe técnico pra registro:** o acesso pedido é só o escopo
`drive.file` do Google (arquivos/pastas que o próprio app criar) — nunca o
Drive inteiro. A conexão é única pra agência (guardada em Configurações),
não uma por pessoa da equipe.

## v134

## Permissão "Comercial" detalhada + sugestão de permissões por cargo

Ajuste na tela Configurações > Equipe (modal de novo membro / edição), a
partir do que você notou testando: precisava dar acesso a uma pessoa "mas
não tudo" dentro de Comercial.

**1) "Comercial" deixou de ser um interruptor único.** Antes, um único
"Comercial" liberava Oportunidades, Orçamentos, Contratos e Catálogo/Pacotes
juntos. Agora são 4 interruptores separados, então dá pra liberar só
Oportunidades pra alguém, por exemplo, sem abrir Contratos ou Orçamentos
pra essa pessoa. Vale tanto pro menu lateral quanto pelas abas dentro da
página de cada cliente.

*Quem já tinha o "Comercial" antigo ligado continua exatamente com o mesmo
acesso de antes — nada muda pra ninguém que já existe, a não ser que você
abra o cadastro da pessoa pra editar (aí os 4 novos já aparecem ligados,
refletindo o que ela já tinha, e você pode desligar o que não fizer
sentido).*

**2) Sugestão de permissões por cargo.** No campo Cargo, agora aparecem
alguns chips de sugestão (Editor, Social Media, Gestor de Tráfego,
Comercial, Financeiro) — clicar num deles preenche o cargo e já marca um
conjunto padrão de permissões pra começar. É só um ponto de partida: dá
pra ligar/desligar qualquer coisa depois, antes de salvar.

**3) Conferido: acesso restrito por aba dentro do cliente já funciona.**
Perguntou se dava pra alguém acessar um cliente sem ver o Financeiro — isso
já existia (cada aba da página do cliente já checa a permissão certa:
Financeiro, Orçamentos, Contratos e Tráfego Pago cada uma só aparece pra
quem tem a permissão daquela área). Não precisou de mudança, só confirmação.

## v133

## Abertura: elementos maiores + tempo certo (2s + 1s + revelação)

Ajuste fino em cima da v132, que o Duhzao aprovou ("Ficou perfeito") mas
pediu pra calibrar tamanho e tempo.

**1) Elementos ainda maiores.** Os ícones que convergem cresceram de novo
(64-80px → 80-96px, conforme a tela), com as posições iniciais reajustadas
pra continuarem bem espalhados no tamanho novo. O logo formado também
dobrou de tamanho (40-56px de altura → 80-112px) — fica grande na tela
durante a pausa, do jeito que foi pedido ("tem que ser um tamanho legal").

**2) Tempo dividido em 3 partes, ~3,5s no total** (antes, a sequência
inteira durava só ~1,4s):
- **2 segundos de "apresentação"**: ícones convergindo, brilho, logo se
  formando, quadro de mira, REC e texto — mesma coreografia de antes, só
  esticada pra caber certinho em 2s.
- **1 segundo de logo parado**, grande, sozinho na tela — sem nada
  acontecendo, só pra dar tempo da marca ser vista.
- **Revelação do site**: mesmo mecanismo já aprovado na v132 (a cena sobe e
  esmaece enquanto a tela se abre em duas metades, uma pra cima e outra pra
  baixo, revelando o site a partir do meio) — só que agora começa depois da
  pausa de 1s, não logo em seguida.

**3) Sem mudança na revelação em si** — o "sobe e abre cortina" continua
exatamente como ficou aprovado na v132, incluindo o cuidado de começar a
cortina um pouco antes da cena de fundo terminar de esmaecer (evita um
quadro preto "morto" entre uma coisa e outra).

*(Mesma observação da v132: o vídeo de demonstração foi gravado em câmera
lenta e depois acelerado de volta pra velocidade real, só pra dar pra ver
os detalhes — no site de verdade a abertura roda nessa velocidade real,
~3,5s do início ao fim.)*

## v132

## Abertura automática (sem scroll) + cabeçalho mais sólido

Referência: o Duhzao mandou print/frame do site "Creator Hub", cuja abertura
toca sozinha assim que a página carrega (sem precisar rolar) e cujo
cabeçalho lê como preto sólido, sem linha de corte visível.

**1) Abertura deixou de depender de scroll.** Até a v131, a cena de abertura
(ícones convergindo, virando o logo) era presa ao scroll — a pessoa
precisava rolar a página pra ela acontecer. Agora ela é automática: toca
sozinha assim que o site carrega, do jeito que foi pedido ("a pessoa entrou,
vai aparecer lá, tudo sozinho"). Sem scroll envolvido, o espaçador de 70vh
que só existia pra dar distância de rolagem também saiu — não faz falta
mais.

**2) Ícones flutuantes maiores.** Aumentei o tamanho dos ícones que
convergem (de 48-56px pra 64-80px, conforme a tela) e espalhei um pouco mais
as posições iniciais deles, pra não ficarem apertados uns nos outros no
tamanho novo.

**3) Nova saída: "sobe e abre cortina".** Depois que o logo se forma e o
texto de abertura aparece, a cena inteira sobe e esmaece — e, ao mesmo
tempo, a tela se abre em duas metades (uma sai por cima, a outra por baixo),
revelando o site por trás, crescendo a partir do meio da tela. Tudo isso
rápido — a sequência inteira (ícones convergindo → logo → saída) dura
pouco mais de 1 segundo.

**4) Cabeçalho mais opaco no topo.** O degradê atrás do cabeçalho (que dá
contraste pro logo/menu sobre a foto do Hero) ficou bem mais forte perto do
topo — lê como um preto quase sólido ali, igual à referência mandada, e
continua sumindo suave conforme desce, sem criar linha de corte nenhuma.

*(Testado com gravação de tela da prévia local — a versão em câmera lenta
que mandei junto é só pra dar pra ver os detalhes; no site de verdade a
abertura é rápida, do jeito que foi pedido.)*

## v131

## Repaginação visual do site público — cabeçalho, seções, ícones e tira de filme

Depois do retorno frustrado sobre a tela do Hero, essa versão não mexe em
nenhum dado nem campo novo — é só CSS/layout dos componentes do site
público, ponto por ponto do que foi pedido:

**1) Cabeçalho "grudado" no Hero, sem barra separada.** O cabeçalho era
`sticky`, ou seja, sempre ocupava espaço próprio no topo, com fundo sólido e
uma linha embaixo — isso criava exatamente a "barra em cima do banner" que
incomodava. Agora ele é flutuante (`fixed`) e nasce transparente, sobre a
própria foto do Hero — cabeçalho e banner viram uma cena só. Só depois que a
pessoa rola um pouco pra dentro da página (bem depois da abertura
cinematográfica) é que ele ganha fundo escuro e a linha inferior, pra
continuar legível sobre o conteúdo. Também adicionei um reforço de sombra
atrás do cabeçalho (independente da foto escolhida) pra garantir contraste
do logo/menu em qualquer imagem.

**2) Fim das "camadas que trocam de cor".** As seções escuras usavam 3 tons
de preto ligeiramente diferentes (`#131519`, `#0b0b0d`, `#08080a`) — a
diferença é mínima, mas o corte seco entre uma seção e outra é exatamente o
"risco preto" que incomodava. Unifiquei tudo num único tom. A faixa
vermelha do Processo (o "risco vermelho") continua existindo como um
momento visual à parte, só que agora com uma transição suave nas duas
bordas em vez de um corte seco.

**3) Ícones da seção Serviços (sem foto) redesenhados.** Antes: um ícone
gigante e quase invisível (10% de opacidade) sozinho no meio do cartão —
lido como "ícone quebrado". Agora: um selo compacto (fundo e borda na cor
da marca, brilho sutil atrás) no estilo dos demais elementos do site, com
nome/descrição embaixo — um cartão com identidade mesmo sem foto ainda
cadastrada.

**4) Tira de filme dos Álbuns, refeita.** A perfuração era um degradê
radial suave (30% de opacidade) sobre um fundo quase da mesma cor — por
isso "não dava pra ver nada", e de perto ficava esquisita. Trocada por
furos de verdade (retângulos nítidos, bordas arredondadas) sobre uma faixa
preta bem mais escura que o fundo da seção — bem mais alta também, pra não
passar despercebida.

**5) Cantos arredondados e cards.** Os cartões de Serviços foram de
`rounded-xl` pra `rounded-2xl`; a faixa do Processo ganhou cartões de
verdade (borda, fundo leve, cantos arredondados) em vez de texto solto
sobre o gradiente.

**6) Botão do WhatsApp com brilho mais bonito.** O "risquinho" que passa
pelo botão ganhou um degradê com núcleo brilhante e sombra suave nas
bordas (em vez de uma faixa lisa única), ficou um pouco mais rápido, e
mais largo — fica mais parecido com um reflexo de vidro.

**7) Ajustes de navegação.** Como o cabeçalho virou flutuante, um clique
num link do menu (Serviços, Sobre...) agora reserva o espaço dele antes de
rolar até lá, pra não cobrir o título da seção; a rolagem entre âncoras
ficou suave (respeitando a preferência do sistema de "reduzir movimento").

Não mudei a foto de fundo do Hero em si — ela é a que está cadastrada em
Configurações → Site, então trocar é só subir uma nova por lá quando
quiser; não tenho como gerar ou sugerir uma foto de verdade pra colocar no
lugar.

Sobre a verificação desta vez: como nada aqui mexeu em schema, API ou
tipos vindos do banco, a checagem de tipos (mesmo com a limitação já
conhecida de não gerar o cliente do Prisma neste ambiente) rodou limpa nos
arquivos alterados nas duas vezes que rodei. Além disso, montei um mockup
estático das partes mais visuais (cabeçalho sobre o Hero, tira de filme,
cartão de Serviços sem foto) usando o mesmo `tailwind.config.ts` do
projeto e tirei print pra conferir de verdade como cada coisa fica —
não só "no papel".

## v130

## Correção de build — 3º erro, dessa vez no formulário de Serviços

Mais um log da Vercel, mais um erro de tipagem — de novo só na etapa de
checagem de tipos, depois do "Compiled successfully" (o código em si
rodava certinho, só a checagem de tipos travou):

```
./app/dashboard/configuracoes/site/page.tsx:91:11
Type error: Type '{ ...; foco?: string | null | undefined; }[] | null' is
not assignable to type '(Partial<ServicoOverride> & {...})[] | null'.
  Types of property 'foco' are incompatible.
    Type 'string | null | undefined' is not assignable to type
    'string | undefined'.
```

O que causava: no formulário de Serviços (`ServicosForm.tsx`), eu descrevi
os dados que "entram de fora" (do banco) usando `Partial<ServicoOverride>`
— a ideia era dizer "esses dois campos podem não vir preenchidos". Só que
`Partial<...>` só permite um campo ficar *ausente* (`undefined`); ele não
passa a aceitar `null` num campo cuja definição original é só `string`. Como
o `foco` de um serviço pode perfeitamente vir `null` do banco (serviço que
nunca teve foto), e a definição base tinha `foco: string` (sem `null`),
ficou uma combinação que o TypeScript rejeitou — na tela, o painel
funcionaria normalmente, mas o build trava antes de chegar lá.

Corrigido separando dois tipos: um pro que o formulário guarda por dentro
(sempre preenchido, com valor padrão) e outro pro que pode chegar de fora
(com `foco`/`imagemUrl` explicitamente aceitando `null`). Conferido à mão,
campo por campo, contra os outros pontos que usam esse mesmo padrão nessa
leva (galeria do Hero, mapa) — só esse tinha o problema.

Nota sobre a verificação: da vez passada eu tinha rodado uma checagem de
tipo do projeto inteiro antes de empacotar e não achei nada — mas esse
ambiente de trabalho não consegue gerar o cliente do Prisma (a etapa que
roda na Vercel é bloqueada por rede aqui), então essa checagem local fica
incompleta, de um jeito que não dá pra confiar 100%; foi exatamente esse
tipo de erro que ela deixou passar dessa vez. Pra esta correção, além de
rodar a checagem de novo, revisei à mão cada campo novo introduzido na
v129 — método mais lento, mas o único totalmente confiável aqui.

## v129

## Mixagem inspirada no site que você mandou (câmera, filme, mapa e fotos)

Você pediu pra estudar o appcreatorhub.com e "misturar" as ideias que gostou
de lá com a identidade da Instaby (que já usa a mesma linguagem visual —
preto com degradê vermelho). Entrei no site, naveguei pelas seções que você
comentou (o cabeçalho preto, o efeito nos botões, o portfólio "tipo filme" e
o mapa no fim) e apliquei uma versão de cada ideia no site da Instaby,
mantendo a identidade que você já tinha.

### Abertura: a câmera "grava" o logo se formando

A animação dos ícones convergindo continua exatamente igual (você já tinha
aprovado); só que agora, assim que o logo termina de se formar, um quadro de
mira — tipo visor de câmera, com os 4 cantinhos, o detalhe que você gostou —
fecha ao redor dele, junto com um selo "REC" piscando. A sensação é a de "a
câmera acabou de gravar o logo nascendo", misturando a ideia da referência
com a animação que você já tinha aprovado, sem trocar nada do que já
funcionava.

### Álbuns: tira de filme de verdade

O carrossel de Álbuns ganhou uma "perfuração" (aquelas bolinhas na borda de
um rolo de filme) em cima e embaixo da faixa de cards — um detalhe sutil,
que não atrapalha a leitura dos trabalhos, só reforça a ideia de "filme"
que os álbuns já sugeriam.

Uma decisão que tomei aqui: você pediu pra colocar esse tratamento "logo ali
em cima", mas os Álbuns já estão numa posição que a gente definiu com
cuidado numa rodada anterior (depois dos Pilares, pra não competir com o
Tráfego Pago em destaque). Interpretei o pedido como "aplica esse estilo de
filme na seção de Álbuns" (que eu fiz), não como "move a seção pra cima" —
se eu entendi errado e você quiser os Álbuns mais perto do topo, me avisa
que eu reorganizo.

### Serviços: uma foto pra cada serviço (opcional)

Os 8 cartões de "Serviços" agora aceitam uma foto cada um, em Configurações
→ Site → Serviços. Sem foto, o cartão continua mostrando o ícone de sempre
(nada quebra pros serviços que você ainda não tiver foto). Com foto, ela
ocupa o cartão inteiro com o nome por cima — no mesmo espírito dos cartões
de "portfólio por cliente" que você viu na referência, só que aqui
reaproveitado pros serviços da agência, que foi exatamente a troca de termo
que você pediu.

### Hero: galeria de fotos revezando no fundo

Em Configurações → Site → Abertura, tem agora uma seção nova, "Galeria de
fotos do fundo", onde dá pra enviar 2 ou mais fotos que revezam sozinhas no
fundo da tela inicial, com um fade suave entre uma e outra — parecido com o
efeito que você viu na referência. Sem configurar nada aqui, o site continua
com o banner único de sempre (nada muda pra quem não mexer); configurando,
a galeria assume automaticamente.

### Botões principais: aquele "risquinho passando"

O efeito que você descreveu no botão da referência (uma luz passando de
tempo em tempo, meio "câmera gravando") recriei nos dois botões principais
de "Falar no WhatsApp" — o da tela inicial e o da chamada final, perto do
rodapé. É uma luz diagonal que atravessa o botão a cada poucos segundos e
some. Se achar muito ou pouco, é rápido de ajustar (ou tirar de um dos
dois).

### Nova seção: "Onde a gente atende"

Entre o Processo e a chamada final, entrou um mapa (ilustrativo, não é um
mapa real com endereço) mostrando onde a Instaby atua: Araras no centro, em
destaque, ligada por uma linha a cada outro cliente/cidade. Já cadastrei os
3 exemplos que você pediu — Araras, Limeira e "Estados Unidos" — mas como
você não passou a cidade exata do cliente americano, deixei "Estados
Unidos" por enquanto; me manda o nome da cidade (ou deixa assim mesmo, se
preferir) que eu ajusto na hora. Dá pra adicionar quantos locais quiser em
Configurações → Site → Onde a gente atende, sem limite — o mapa se
reorganiza sozinho.

## v128

## Abertura → Hero: resolvida a "subida" que ainda incomodava

Você confirmou que os ícones convergindo pro logo ficaram muito bonitos — mas
quando essa parte termina e some, a tela inicial ainda "subia" de baixo pra
cima, em vez de simplesmente aparecer. Foi direto na raiz do problema.

O que causava: a técnica que eu tinha usado (um bloco "grudado" no topo da
tela enquanto você rola — "sticky", na programação) precisa, por natureza, de
uma tela cheia inteira de rolagem extra pra "soltar". E era exatamente durante
essa rolagem extra que o cabeçalho e a tela inicial apareciam subindo de
baixo — mesmo eu já tendo corrigido a animação interna deles na v126. Ou
seja: não era mais um bug de animação, era a própria mecânica de rolagem
escolhida que obrigava essa subida a acontecer, e por isso continuava
aparecendo mesmo depois daquele ajuste.

Troquei a mecânica: agora a cena da abertura é uma camada fixa que cobre a
tela inteira o tempo todo — o cabeçalho e a tela inicial já ficam prontos,
exatamente no lugar deles, o tempo todo, só escondidos atrás dessa camada.
Quando a animação termina, ela só esmaece — e como não sobra nada "atrás"
precisando subir, o que aparece é puro fade, rápido, sem nenhum deslocamento.
A animação dos ícones/logo em si continua exatamente igual, só mudou o que
acontece depois que ela termina.

## v127

## Correção de build — outro erro de tipagem, agora nos ícones novos

Você mandou o log do build de novo, com outro erro. Na real é um bom sinal:
esse aqui aconteceu bem mais à frente que o da v125 (a etapa de "Compiled
successfully" já tinha passado), e é um problema completamente diferente —
não tem nada a ver com Map/Set de novo.

Erro do Vercel, resumido:

```
./components/landing/CinematicIntro.tsx:31:5
Type error: Type 'ForwardRefExoticComponent<...>' is not assignable to type
'ComponentType<{ size?: number | undefined; }>'.
  ...propTypes...size... Type 'string' is not assignable to type 'number'.
```

O que aconteceu: na abertura nova (os ícones flutuando) e nos iconezinhos
flutuantes que apareceram em outras seções, eu descrevi pro TypeScript "isso
aqui é um componente de ícone que recebe um tamanho em número" — só que a
biblioteca de ícones que uso (lucide-react) define o tamanho dela de um jeito
um pouco mais flexível (aceita número ou texto). O TypeScript comparou as
duas descrições, viu que não batiam 100% e travou o build — mesmo o ícone
funcionando perfeitamente na tela. É só um desencontro na "ficha técnica" que
eu escrevi, não um bug de comportamento nem nada visual.

Corrigi nos 2 lugares exatos onde esse padrão apareceu (abertura nova e
ícones flutuantes mini) e conferi o projeto inteiro pra garantir que não
sobrou nenhum outro lugar com a mesma pegadinha — não sobrou. Nada muda
visualmente, é só a "ficha técnica" que ficou correta.

## v126

## Retorno sobre a LP — ajustes ponto a ponto no que você comentou

Você mandou um retorno bem detalhado depois de ver a v124/v125 no ar. Fui item
por item do que você falou, na ordem que comentou:

**Abertura — trocada por completo.** Tirei a câmera aproximando (você não
gostou, "vamos esquecer essa ideia") e troquei pelo conceito novo que você
descreveu: ícones soltos (Instagram, YouTube, vídeo, tráfego, curtida,
filme) flutuando espalhados pela tela, que convergem pro centro e "viram" o
logo da Instaby conforme você rola um pouco — bem mais curto que antes (era
quase 3 telas de rolagem, agora é menos de 2), porque você pediu "mexe um
pouquinho", não uma cena longa. Texto de abertura continua editável no mesmo
lugar de sempre (Configurações → Site), só troquei o texto padrão (não fazia
mais sentido falar de "lente" sem a câmera).

**A transição pra o resto do site também mudou.** O problema que você
descreveu — parecia a página antiga "colada" subindo por cima — era a
abertura antiga revelando o Hero só por causa do scroll natural, sem
nenhum fade de verdade por trás. Troquei: agora a cena inteira da abertura
esmaece em opacidade (não só um flash por cima), e o Hero nasce transparente
e vai a 100% assim que aparece na tela — a sensação agora é de fundido
(fade), não de troca de página.

**Os "círculos boiando" que você não entendeu** eram as formas abstratas de
lente/tripé/anéis/abertura espalhadas pelo site (Serviços, Sobre, Pilares,
Processo, Contato). Troquei todas por coisas reconhecíveis: um selo "REC"
(ponto vermelho piscando + texto) na seção Serviços, e ícones de verdade
(Instagram, vídeo, tráfego) nas outras — mesma ideia visual da abertura
nova, então tudo conversa entre si agora.

**Cards de Serviços no celular.** Confirmei: a mesma grade 4×2 que fica ótima
no computador virava uma lista vertical gigante no celular (a grade só
"quebra" pra 2 colunas a partir de telas maiores). No celular agora é um
carrossel horizontal com swipe — desliza pros lados, sem precisar rolar uma
tela inteira pra cada cartão.

**Seção Clientes, mais viva.** Os logos dos clientes agora deslizam num
carrossel contínuo (mesma técnica que você já curtiu nos Álbuns — passa
sozinho, para quando o mouse passa por cima), cada logo com uma "plaquinha"
com brilho vermelho sutil ao passar o mouse, e um glow ambiente atrás da
seção inteira. Pilares, Sobre, Álbuns e a chamada final ("sua marca pode
estar aqui também") ficaram exatamente como estavam — você gostou dessas
partes, não mexi em nada nelas.

**Processo — foto de fundo opcional.** Você comentou que talvez ficasse bom
uma foto atrás, mantendo o vermelho. Adicionei isso como opcional em
Configurações → Site → Processo: sem foto, continua exatamente como está
hoje (só o gradiente vermelho escuro); com foto, ela aparece atrás desse
mesmo gradiente (mais transparente), então o "vermelhinho" que você gostou
não desaparece.

Tudo aditivo no banco (3 campos novos, opcionais) e testado item por item
antes de empacotar, depois do susto do build quebrado na v125 — sem nenhum
`for...of` novo em cima de Map/Set em lugar nenhum do que mexi.

# v125

## Correção de build — o deploy não subia

O deploy que travou depois da v124: o Vercel parou lá pelas 16:13, na etapa de
checagem de tipos, com esse erro em `ResultadosCampanha.tsx` (tela de
Resultados do Tráfego Pago):

```
Type error: Type 'MapIterator<Resultado[]>' can only be iterated through
when using the '--downlevelIteration' flag or with a '--target' of 'es2015'
or higher.
```

Não tem nada a ver com a landing page nova — é um trecho de código da v122
(a tela de Resultados do Tráfego Pago), numa função que agrupa resultados por
mês. Ela percorria os dados de um jeito (`for...of` direto num
`Map.values()`) que essa configuração específica do projeto (TypeScript
mirando numa versão mais antiga do JavaScript, "es5") não aceita — mesmo o
código estando correto, só essa forma de escrever o loop que não é permitida
aqui. Troquei pra uma forma equivalente (`Array.from(...)` antes do loop) que
funciona do mesmo jeito e passa na checagem. Não mudei nada do resultado, só
a maneira como o código percorre os dados.

Conferi o projeto inteiro atrás desse mesmo padrão (qualquer outro
`for...of` em cima de `Map`/`Set`) — essa era a única ocorrência, inclusive
nos arquivos novos da v124 (landing page). Então é bem provável que isso
resolva o build, mas como o Vercel para no primeiro erro que encontra, se
aparecer outro erro diferente mais adiante, é só me mandar o log de novo
(igual mandou dessa vez) que eu já sigo direto pra ele.

## v124

## Landing page cinematográfica — a reforma completa do site público

A reforma da sua LP, do jeito que você descreveu: abertura com câmera, os 3
carros-chefe em destaque, álbuns num carrossel dinâmico, e o site inteiro com
uma pegada mais neon/vermelha. Antes de montar, te chamei pra fechar 4 pontos
(álbuns reaproveitando o Portfólio de hoje, câmera ilustrada em vez de esperar
foto, reforma do site inteiro, e Tráfego Pago com destaque maior) — segue
exatamente essas escolhas.

**Abertura com a câmera.** Antes de tudo, uma tela cheia que fica "grudada" na
tela enquanto você rola — a câmera (ilustração vetorial, inspirada na sua
ZV-E10 II com a Tamron 17-70, estilo minimalista/neon, com o anel vermelho da
marca) cresce e se aproxima, até a tela clarear e revelar o Hero por trás — a
sensação de "entrar na lente" que você pediu. Título e subtítulo dessa tela são
editáveis (Configurações → Site). Como você não mandou foto de referência,
usei uma ilustração própria; se quiser me mandar fotos reais da sua câmera
depois, eu troco a ilustração por elas sem mexer no resto da animação. É tudo
feito com o framer-motion que o projeto já usa (scroll-linked) — nada de
biblioteca 3D nova, que eu não conseguiria instalar aqui.

**Os 3 carros-chefe, logo depois do Hero.** Tráfego Pago em bloco grande,
com espaço pra números/resultados (edite em Configurações → Site — até 3
indicadores tipo "+120 / campanhas ativas"), e Criação de Conteúdo + Captação
ao lado, menores. Fotos em estúdio e o resto dos serviços continuam na grade
completa de Serviços, logo em seguida — só não vêm primeiro, como você pediu.

**Álbuns.** Reaproveita 100% o que você já cadastra em Configurações → Site →
Portfólio (mesmos cases, capa, categoria, resultados) — só mudei a forma como
aparece: um banner que desliza sozinho, contínuo, estilo Netflix (passa
devagar, para quando o mouse passa por cima, cada card continua clicável).
Cadastrou um trabalho novo lá, ele já entra no carrossel automaticamente —
nada fixo no código.

**O resto do site.** Deixei tudo com a mesma pegada nova: câmeras/lentes/tripés
flutuando discretamente em algumas seções (Serviços, Sobre, Processo, Contato),
uma textura sutil de grade neon nos fundos escuros, e alguns brilhos vermelhos
a mais nos cartões e botões — sem mexer na lógica de banners/imagens
configuráveis que já funcionava (Hero, Sobre, Contato final continuam exatamente
como você já configura hoje).

**Tudo conectado nas Configurações**, como você pediu — nova seção
"Abertura cinematográfica, pilares e álbuns" dentro de Configurações → Site,
com: título/subtítulo da abertura, nome/texto dos 3 pilares (+ indicadores do
Tráfego Pago), e título/texto da seção de álbuns. Se algum texto ficar ruim ou
a cor não bater, você mexe por lá — sem precisar mexer em código. 5 campos
novos no banco, todos opcionais (nada quebra se ficarem vazios — o site usa
texto padrão até você preencher).

Não toquei no painel administrativo nessa rodada, só no site público (`/`) e
na tela de Configurações → Site. Quando quiser seguir com o resto do redesign
do painel (Financeiro, Comercial, Tráfego Pago, Tarefas, Agenda, Horas), é só
falar.

## v123

## Repaginação visual — Clientes (lista + Visão Geral)

Segunda tela repaginada, na sequência da Visão Geral (Dashboard, v121). Dessa vez:
tela de Clientes (lista) e a aba "Visão Geral" de dentro de cada cliente.

**Lista de Clientes.** Cartão de cada cliente ganhou ícones nos números
(mensalidade/recebido), o "Recebido até agora" destacado em verde, e um contorno
sutil no avatar/logo. Os grupos por status (Ativos/Avulsos/Leads/Inativos) agora
abrem e fecham com uma animação suave em vez de aparecer/sumir seco, e cada grupo
mostra a contagem num selo colorido (verde pra Ativos, azul Avulsos, amarelo
Leads, cinza Inativos — mesma cor do status). As abas de filtro no topo ganharam
a contagem ao lado do nome (ex: "Ativo (12)"). Novo: um resumo de 3 números
grandes no topo da tela — Ativos, Mensalidade recorrente (soma dos clientes
ativos) e Leads em aberto — pro "bate o olho e já sabe como tá" que você pediu.

**Visão Geral do cliente.** Os 4 números do topo (Mensalidade/Próxima
cobrança/Contrato/Horas) agora usam o mesmo cartão com ícone colorido e entrada
animada que já existe no Tráfego Pago. Novo gráfico "Faturamento — últimos 6
meses" desse cliente específico (mesmo estilo do gráfico do Dashboard geral,
agora por cliente). "Resultado do mês" e as outras seções ganharam uma entrada
suave ao abrir a aba, e a linha do tempo ganhou ícones com fundo colorido por
tipo de evento (pagamento/contrato/proposta) em vez de só um ícone cinza.

Não mexi no fluxo de arrastar-pra-mudar-status pra Clientes dessa vez —
diferente de Tarefas (onde arrastar só muda um "onde isso está no meu dia"),
mudar o status de um cliente mexe em faturamento/relatórios, então preferi
manter isso só pelo formulário de editar por enquanto. Se você quiser esse
comportamento de arrastar entre colunas (tipo Leads → Ativo) também aqui, com
uma confirmação antes de mudanças mais sensíveis (ex: virar Inativo), eu
implemento como próximo passo — é só falar. Também não toquei nos outros 12
formulários/abas de dentro do cliente (Contatos, Links, Onboarding,
Solicitações, Serviços, Relatórios, Financeiro, Orçamentos, Contratos, Horas,
Tráfego Pago) — ficam pra uma rodada futura.

Dois componentes novos e reutilizáveis (`StatTile` e `AreaTrendChart`), pra as
próximas telas do redesign reaproveitarem em vez de eu recriar o mesmo cartão
de novo a cada tela. Sem mudança de banco.

## v122

## Tráfego Pago: totais corrigidos pro seu fluxo real de exportação + Retorno (ROI)

Ajuste pedido antes de continuar a repaginação visual — três mudanças, todas só
no módulo Tráfego Pago.

**1. Os totais não somam mais exportações do mesmo mês.** Como você contou, o
fluxo real é exportar do Meta sempre a partir do dia 1 do mês, com a data final
crescendo (dia 1 ao 10, depois dia 1 ao 20, depois dia 1 ao 30...). Cada
exportação nova já contém as anteriores — antes, o painel somava todas cegamente
e inflava o total. Agora: quando várias entradas do mesmo mês começam no mesmo
dia (esse padrão de "mês corrido"), só a mais recente conta nos números de
Investido/Resultados/Impressões/Custo-por-resultado — as antigas continuam
salvas e aparecem certinho no gráfico de tendência, então nada se perde, só não
duplica mais. Se um dia você (ou alguém da equipe) lançar dias avulsos e
separados dentro do mesmo mês, esses continuam sendo somados normalmente entre
si — a lógica só "trava" a soma quando percebe que é o mesmo período crescendo.
Não precisa reimportar nada — os dados que já estão salvos passam a ser
somados do jeito certo automaticamente.

**2. O "R$0/mês" confuso ficou mais claro.** Esse número era a *meta* de verba
mensal da campanha (definida na hora de criar, editável), diferente do
*Investido* de verdade (que vem dos resultados lançados/importados). Como
ficava sem rótulo nenhum do lado da campanha, dava a entender que era o
investimento real. Agora: some quando a campanha não tem meta definida (a
maioria hoje, então os cartões ficam mais limpos), e quando você preenche uma
meta, aparece rotulado como "**Meta:** R$ X/mês" pra não confundir com
"Investido" (que continua só dentro de Resultados).

**3. Nova seção de Retorno.** No formulário de lançar/editar resultado, um
bloco separado "Fechamento do mês" com dois campos opcionais: quantos planos
fecharam naquele período e quanto isso gerou em R$. Pensado pro fechamento que
você faz no fim do mês — pega os leads do período, quantos viraram contrato, e
quanto voltou. O painel de Resultados ganhou um 5º cartão, "Retorno", com o
total em R$ e, embaixo, quantos planos fecharam e quantas vezes o investimento
voltou (ex: "40 planos · 5.2x") — a história de investimento x retorno que
você queria mostrar. Isso é só o registro manual do fechamento; os relatórios,
auto-postagem no Instagram, engajamento e monitoramento de concorrência
continuam de fora por enquanto, como combinado.

Sem quebra de dados — schema só ganhou campos novos opcionais, nada existente
mudou de lugar. Com isso resolvido, a repaginação visual do resto do painel
volta a ser o próximo passo.

## v121

## Repaginação visual — começando pela Visão Geral (Dashboard)

Você pediu pra repaginar o painel inteiro (gráficos mais bonitos, elementos
que dão pra arrastar, mais vida — mantendo preto/cinza/vermelho/branco).
Como são mais de 15 telas, combinamos começar por **uma só** — a Visão
Geral, que é a que você mais vê — pra você aprovar o estilo antes de eu
espalhar pro resto do painel. O que mudou nela:

**Gráfico de faturamento novo.** Logo abaixo dos números do topo, um
gráfico de área dos últimos 6 meses de faturamento, no mesmo estilo do
Tráfego Pago (gradiente vermelho, animado, tooltip ao passar o mouse).
Como você decidiu manter o Financeiro do jeito que está (números +
calendário, sem gráfico) — esse é o lugar novo onde a parte gráfica
"bonita e atual" que você pediu fica em destaque. Respeita o botão de
ocultar valores (fica todo borrado/oculto igual o resto).

**Cartão de Faturamento do mês ganhou uma setinha** mostrando a variação
percentual comparado ao mês anterior (verde subindo, vermelho descendo) —
o mesmo número que já aparecia no card "Insight Instaby" mais embaixo,
agora também de relance no topo.

**Afazeres virou um quadro com arraste de verdade (Kanban).** Em vez da
lista única de antes, agora são 3 colunas — A fazer / Em andamento / Feito
— e você arrasta o cartão da tarefa de uma coluna pra outra pra mudar o
status, soltando com o mouse mesmo. Arrastar pra "Feito" ainda pergunta se
quer registrar as horas (igual já funcionava antes, só que agora pelo
arraste). Delete continua disponível (ícone de lixeira que aparece ao
passar o mouse no cartão). A edição mais detalhada (descrição, prioridade,
prazo) continua na tela Tarefas — o quadro aqui é pra bater o olho e mudar
status rápido. Não usei nenhuma biblioteca nova de arrastar-e-soltar (o
sandbox não tem acesso de rede pra instalar pacote) — é feito com a API
nativa de drag-and-drop do navegador, então funciona liso no computador;
no celular, como toque não tem "arrastar" nativo do jeito clássico, o
status ainda dá pra trocar abrindo a tarefa (seletor), só o arraste em si
que é mais um recurso de desktop por enquanto.

Sem mudança de banco. Aprovando esse estilo, na sequência eu aplico o
mesmo padrão nas outras telas do dia a dia (Clientes, Financeiro,
Comercial, Tráfego Pago, Tarefas/Agenda/Horas) — Configurações/Equipe
ficam pra uma rodada posterior, como combinado.

## v120

## Correção: valor investido importado do Meta vinha errado (10x maior)

Bug real, confirmado com print seu comparando o app com o Gerenciador de Anúncios:
uma campanha com **R$ 10,19** gastos aparecia no app como **R$ 1.019**. Causa: o
relatório de campanhas do Meta exporta os números em formato internacional (ponto
= casa decimal, ex: "10.19"), só que a função que eu tinha usado pra ler o arquivo
foi copiada da importação antiga (relatório de redes sociais), que espera formato
brasileiro (vírgula = casa decimal, ponto = milhar) — "10.19" virava "1019" por
engano. Corrigido: a leitura agora distingue os dois formatos automaticamente.

**Isso não exige nenhuma ação manual sua** — é só reimportar o mesmo arquivo de
23/09 que você já subiu (ou qualquer um que tenha vindo com valor errado): como
cada resultado é único por campanha + dia exato, reimportar **atualiza** o valor
errado com o certo, não duplica.

## Tráfego Pago: parte visual (KPIs + gráficos) refeita

Você pediu pra deixar essa parte "mais legal", com números mais visíveis e
gráfico melhor — troquei tudo. Dentro de "Resultados" de cada campanha agora tem:

- **4 números grandes em destaque** (estilo "cartão de indicador"): total
  investido, total de resultados, custo médio por resultado e impressões —
  somando todos os períodos lançados/importados daquela campanha.
- **Dois gráficos de área lado a lado** (em vez de um só com dois eixos, que
  fica confuso de ler): "Custo por período" em vermelho (cor da marca) e
  "Resultados por período" em verde-azulado — cada um com gradiente suave,
  tooltip ao passar o mouse mostrando o valor exato do dia, e uma pequena
  animação de entrada. Aparecem a partir de 2 lançamentos na campanha.

Mantive a paleta preto/cinza/vermelho/branco da marca — as duas cores novas
(vermelho de custo, verde-azulado de resultado) foram conferidas com um
validador de contraste/daltonismo pra garantir que dá pra diferenciar uma da
outra mesmo lado a lado. Isso é a mesma base visual que dá pra evoluir depois
com mais animação, como você comentou que pretende ("essa plataforma que a
gente está desenvolvendo") — a estrutura (KPIs + gráfico por card) já fica
pronta pra crescer.

Sem mudança de banco nessa versão — só correção de leitura de número e troca
da parte visual.

## v119

## Importar campanhas do Meta Ads automaticamente (Tráfego Pago)

Em **Tráfego Pago** (tela geral ou na aba do cliente) tem um novo botão
**"Importar do Meta Ads"**. Você exporta um CSV ou Excel direto do
Gerenciador de Anúncios (Relatórios → Exportar) e joga o arquivo lá:

- Campanhas cujo **nome bate exatamente** com uma já cadastrada são
  atualizadas.
- Campanhas que não reconhece são **criadas automaticamente**, com o nome
  exato do Meta, plataforma "Meta Ads" e status conforme "Veiculação da
  campanha" (ativa/pausada) — sem precisar cadastrar na mão antes.
- Pra cada campanha, o período do relatório (Início/Encerramento) vira um
  registro em **Resultados**, com verba gasta, impressões, alcance e
  resultados (+ o texto que o Meta usa pra explicar o que "resultados"
  significa naquela campanha, ex: "Conversas por mensagem iniciadas").

**Sobre reimportar sem duplicar** (o ponto que você levantou): cada
resultado é único por campanha + período exato (início e fim). Reimportar
o **mesmo período exato** atualiza em vez de duplicar. Só que o Meta, por
padrão, exporta sempre "os últimos 30 dias" — um período que desliza a
cada exportação — então duas exportações em dias diferentes têm períodos
diferentes que se sobrepõem, e cada uma vira um registro separado (soma
errada se você olhar o total).

A solução é exportar com o detalhamento **"Dia"** ativado (no Gerenciador
de Anúncios, ao lado de "Exportar" tem a opção de agrupar por dia): aí
cada linha do arquivo vira um dia específico, e reimportar — mesmo com
exportações que se sobrepõem — nunca conta o mesmo dia duas vezes, porque
cada dia é seu próprio período único. O app detecta automaticamente se o
arquivo está nesse formato e avisa na tela se não estiver. Com
detalhamento por dia você também ganha o **gráfico de custo x resultados
ao longo do tempo** que aparece dentro de "Resultados" de cada campanha
assim que tiver pelo menos 2 lançamentos — funciona tanto com dados
importados quanto lançados na mão.

Cliques não vêm nesse tipo de relatório do Meta (só em outros formatos) —
por isso a importação não mexe no campo "cliques" de um resultado que já
tinha esse dado lançado manualmente, só atualiza o que o arquivo realmente
traz.

Banco: `ResultadoCampanha` ganhou `alcance`, `indicadorResultado`, `origem`
("manual" ou "meta_import") e uma restrição de unicidade em
(campanha, início, fim) — tudo aditivo. Lançamento manual de resultado
também passou a funcionar como "atualizar se já existir" pro mesmo
período, em vez de dar erro de duplicidade.

## v118

## Resumo de cobrança em PDF, pra enviar pro cliente atrasado (ou qualquer um)

Em **Contas a Receber**, toda cobrança pendente ou atrasada agora tem um
botão **"Resumo"**. Ele abre uma página limpa (sem menu, sem nada do painel)
com: nome do cliente, valor cobrado, vencimento, situação (com quantos dias
de atraso, se for o caso), os serviços inclusos na mensalidade dele com os
valores, e — se você preencher — suas instruções de pagamento (PIX, dados
bancários etc.).

Nessa página tem um botão **"Imprimir / Salvar PDF"** que abre a caixa de
impressão do navegador — você escolhe "Salvar como PDF" (ou "Microsoft Print
to PDF" no Windows) em vez de uma impressora, e o PDF fica salvo no seu
computador/celular pra você anexar e mandar pro cliente por WhatsApp, e-mail
etc. Não é um PDF gerado automaticamente/anexado sozinho — você que decide
quando e pra quem mandar.

Pra configurar suas instruções de pagamento (aparecem no resumo se
preenchidas): **Configurações → Instruções de pagamento**, novo campo de
texto livre.

Banco: `Configuracao` ganhou `instrucoesCobranca` (texto livre, opcional) —
aditivo.

## v117

## Tráfego Pago, fase 3 (última): registro manual de resultado/performance

Fecha o módulo de Tráfego Pago, seguindo a ordem combinada (Campanha+verba →
Rotina → Resultado/performance).

Dentro de cada campanha, em **Tráfego Pago → Campanhas** (ou na aba Tráfego
Pago de cada cliente), agora tem um botão **"Resultados"** que expande um
histórico de lançamentos por período, com: verba investida, impressões,
cliques, resultados (leads/vendas/conversões — o que fizer sentido pro
objetivo daquela campanha) e observações. CTR e custo por resultado são
calculados automaticamente a partir do que você lança.

Isso é **lançamento manual mesmo** — não é integração com a API do Meta/Google
Ads (isso continua sendo outro projeto, de aprovação, como já tínhamos falado
sobre a publicação automática). Você olha o painel de anúncios e digita os
números aqui, do jeito que já faz nos Relatórios de redes sociais.

Banco: nova tabela `ResultadoCampanha`, ligada à campanha (aditiva). Rotas de
API (`/api/campanhas/[id]/resultados` e `/api/resultados-campanha/[id]`) já
nascem com a mesma trava de permissão/cliente das outras áreas do Tráfego
Pago.

**Com essa versão, o módulo de Tráfego Pago está com as 3 fases combinadas
prontas**: Campanha+verba, Rotina de tarefas, e Resultado/performance.

## v116

## Tráfego Pago, fase 2: rotina de tarefas do gestor de tráfego

Segunda parte do módulo (depois de Campanha + verba na v115), seguindo a
ordem combinada. Em vez de criar um sistema novo, reaproveitei o sistema de
Tarefas que já existe — ele já tinha uma categoria "Campanha" pronta (ícone
de megafone, verde) que ninguém tinha usado ainda.

A tela **Tráfego Pago** ganhou duas abas: **Campanhas** (o que já existia na
v115) e **Rotina** — uma lista de tarefas só com categoria "Campanha"
(ex: trocar criativo, revisar públicos, ajustar verba), com os mesmos
filtros Abertas/Concluídas/Todas que a tela de Tarefas já usa, e um botão
pra criar tarefa rápida já vinculada à categoria certa (sem precisar
escolher categoria toda vez). Essas tarefas continuam aparecendo também na
tela de Tarefas normal e na Agenda, como qualquer outra — a Rotina do
Tráfego é só um recorte focado pra quem só cuida disso.

Sem mudança de schema — só reaproveitou o que já existia (`Tarefa` +
categoria "campanha"), com a mesma trava de permissão/cliente de sempre.

## v115

## Novo módulo: Tráfego Pago (fase 1 — Campanha + verba por cliente)

Primeira parte do módulo de Tráfego Pago pro gestor de tráfego que você vai
contratar, seguindo a ordem combinada (campanha+verba → depois tarefas/rotina
→ por último registro de resultado/performance).

**Configurações → capacidade "Tráfego Pago" já existia** desde a v113
(preparada, sem tela ainda) — agora ela dá acesso de verdade a uma seção nova
**Tráfego Pago** no menu, mais uma aba **Tráfego Pago** dentro de cada
cliente.

Cada campanha guarda: cliente, nome, plataforma (Meta Ads/Google Ads/TikTok
Ads/Outra), objetivo, verba mensal, status (ativa/pausada/encerrada), período
(início e fim opcional) e observações. Como você confirmou que a verba não
passa pela agência — vai direto do cliente pra plataforma —, isso **não tem
nenhuma ligação com o Financeiro**, é só organização e controle do seu
trabalho de gestão mesmo.

Segue o mesmo modelo de permissão das outras áreas: quem tem a capacidade
"Tráfego Pago" vê a seção e a aba; quem só tem clientes específicos
atribuídos só vê/edita campanha dos clientes dele — reforçado tanto na tela
quanto nas rotas de API (`/api/campanhas`).

Banco: nova tabela `Campanha` (aditiva, sem mexer em nada existente).

**Ainda não incluído nessa fase, por combinado:** tarefas/rotina do gestor de
tráfego (vai reaproveitar o sistema de Tarefas já existente, que já tem a
categoria "campanha") e registro de resultado/performance — ficam pras
próximas fases do módulo.

## v114

## Fechando os dois pontos que a v113 deixou avisado como pendente

Na v113 eu avisei que tinha ficado faltando: (1) as rotas de API do
Financeiro/Comercial não checavam ainda a permissão específica da pessoa
(só exigiam login), e (2) Tarefas/Agenda/Horas não filtravam por cliente
atribuído. Essa versão fecha os dois, sem mudança de schema/banco — só código:

**1) Rotas de API do Financeiro e Comercial agora checam a permissão certa**,
não só se a pessoa está logada: despesas, cobranças, pagamentos, patrimônio →
exigem `Ver Financeiro`/`Lançar cobrança/despesa`; oportunidades, orçamentos,
contratos, catálogo, pacotes → exigem `Comercial`. Quem não tem a permissão
recebe erro (403), mesmo chamando a API diretamente, sem passar pela tela.

**2) Tarefas, Agenda e Horas agora filtram por cliente atribuído**, igual já
acontecia em Clientes: quem não tem "todos os clientes" só vê/edita tarefas,
eventos da agenda e registros de horas dos clientes que foi atribuído (tarefas
e horas sem cliente vinculado — internas da agência — continuam visíveis pra
todo mundo). Isso vale tanto na tela quanto tentando mexer direto pela API.

Com isso, os dois avisos "ainda não protegido" da v113 estão fechados: agora
dá pra dar acesso a alguém sem depender só da pessoa usar a tela do jeito
certo.

## v113

## Multiusuário: cada pessoa da equipe com o próprio login e acesso configurável

Você comentou que vai trazer um editor e um gestor de tráfego pago pra equipe, e
pediu acesso configurável por pessoa (igual aos prints do concorrente que você
mandou). Essa versão traz a base disso:

**Configurações → Equipe** (novo, só aparece pra quem tem permissão de
gerenciar equipe): cadastra cada pessoa com nome, e-mail e senha próprios, e
liga/desliga por pessoa:
- **Ver Financeiro** — vê a área Financeiro e valores em R$.
- **Lançar cobrança/despesa** — cria e edita cobrança, despesa, contas a pagar/receber.
- **Comercial** — Oportunidades, Orçamentos, Contratos, Catálogo e Pacotes.
- **Tráfego Pago** — preparado pro módulo novo (ainda não construído, ver abaixo).
- **Configurações** — site, catálogo, automações etc.
- **Gerenciar equipe** — pode criar/editar outros logins (dê com cuidado).
- **Todos os clientes / só os atribuídos** — se desligado, a pessoa escolhe manualmente quais clientes vê, e só enxerga a Clientes e o cadastro desses.

O seu login continua com **acesso total automático** (não precisa configurar
nada pra você, e ninguém consegue restringir ou remover esse acesso pela
tela). O menu lateral também passou a mostrar só as seções que a pessoa logada
tem permissão de ver.

**O que já está protegido nessa versão:** menu lateral, acesso direto por URL
às seções Financeiro/Comercial/Configurações/Equipe, e a lista + página de
cada cliente (quem não tem "todos os clientes" só vê e só abre os que foi
atribuído).

**O que ainda não está protegido, sendo transparente:** as rotas de API por
trás de Financeiro/Comercial (ex: criar despesa direto por chamada, sem passar
pela tela) hoje só exigem estar logado, não checam ainda a permissão
específica da pessoa — e Tarefas/Agenda/Horas ainda não filtram por cliente
atribuído. Isso é seguro pro uso combinado com a tela normal, mas ainda não é
trava de segurança contra alguém tecnicamente curioso mexendo direto na API.
Recomendo eu fechar isso numa próxima versão antes de dar acesso a alguém em
quem você não confia 100%, mas pro editor/gestor de tráfego que você está
trazendo agora, já dá pra usar.

Banco: `Usuario` ganhou `cargo`, `master`, `ativo` e as capacidades acima
(todas aditivas — seu usuário existente já nasce com `master=true`
automaticamente, sem precisar mexer em nada); nova tabela `ClienteUsuario`
(quem vê qual cliente).

## v112

## Correção: "Lucro" do Financeiro não batia com o saldo real em caixa

Você notou que, na tela Financeiro (visão geral), o card "Lucro" não batia
com "Variação de caixa" nem com o que realmente sobra na conta. Achei a
causa: "Entradas" contava só cobrança já **recebida** (pago), mas "Custos
fixos"/"Custos flexíveis" contavam **toda** despesa não cancelada — inclusive
pendente/atrasada, que ainda nem saiu do banco. Misturar "só o que já entrou"
com "tudo que devo, pago ou não" faz o "Lucro" não fazer sentido — ele nunca
ia bater com o caixa de verdade.

Corrigido: agora "Custos fixos", "Custos flexíveis" e "Lucro" só contam
despesa **já paga**, igual "Entradas" já fazia — batendo com "Variação de
caixa". Apliquei a mesma correção no "Resumo por cliente" (a tabela por
cliente tinha exatamente o mesmo problema). As listas detalhadas de despesas
mais embaixo continuam mostrando tudo — pago e pendente — como sempre
mostraram; só os números-resumo dos cards mudaram. Adicionei uma legenda
curta acima desses cards explicando isso, pra não confundir de novo.

Nada mudou na DRE nem no Fluxo de Caixa (já estavam corretos e consistentes
com seus respectivos propósitos — competência e caixa puro).

Sem mudança de schema/banco nessa versão — só código.

## v111

## Horário de início "sumido" no Registrar horas + todo campo de data agora abre o calendário

Dois pedidos seus nessa versão.

**1) "Início" no Registrar horas parecia aleatório** — na real, ele não estava
aleatório, estava **em branco por padrão** (só o campo "Fim" nascia com o
horário atual). Um campo em branco, sem rótulo claro do que fazer, dá essa
sensação de "bugado"/aleatório. Voltei o comportamento de antes: os dois
campos (Início e Fim) já abrem com o horário atual, e você ajusta o Início
pra quando realmente começou. Corrigido nos dois lugares onde isso acontece:
o formulário "Registrar horas" avulso e o "Marcar feito e registrar horas"
direto na tarefa.

**2) Todo campo de data agora abre o calendário, igual o de Horas** — você
pediu isso pro site inteiro, e valia mesmo: vários formulários ainda usavam o
seletor de data nativo do navegador (que muda de aparência dependendo do
navegador/celular, sem gerar aquele calendário bonito que você já via em
Horas). Troquei TODOS — contei 16 campos, em 13 telas diferentes — pelo
mesmo componente de calendário: novo cliente (vencimento), editar cliente
(vencimento), aba Financeiro do cliente (data da cobrança), Agenda (editar
data de um item), tarefa rápida (prazo), linha de cobrança (vencimento),
Financeiro geral (período personalizado, vencimento, data do pagamento,
competência — 4 campos), Patrimônio (data de aquisição), Novo relatório
(início/fim do período), linha de despesa (vencimento, competência).

Agora é visualmente consistente em qualquer lugar do sistema que peça uma
data: você clica, abre o calendário, escolhe o dia — sem exceção.

Sem mudança de schema/banco nessa versão — só código.

## v110

## Correção: erro ao adicionar serviço contratado (e o mesmo bug em qualquer outra tela)

Você reportou: ao adicionar um serviço num cliente novo, às vezes dava
"Application error: a client-side exception has occurred" — mas ao voltar e
entrar de novo na página, o serviço aparecia certinho, já tinha sido salvo.

**Causa raiz:** todo campo de dinheiro no banco (`valor`, `valorUnitario`,
`descontoMensal` etc.) é guardado num tipo especial do Prisma chamado
`Decimal` (mais preciso que o `number` comum do JavaScript pra dinheiro). O
problema: quando uma rota de API devolve um registro assim **direto**, logo
depois de criar ou editar algo, esse `Decimal` se transforma sozinho numa
**string** dentro do JSON (`"150.00"` em vez de `150`). A tela recebe esse
valor como texto e quebra na hora de somar ou formatar com `.toFixed()` —
só usava a rota (a resposta imediata do "adicionar"), não usava a página
inteira. Por isso funcionava perfeitamente depois de atualizar a página:
nesse caminho (carregar a página do zero) o código já convertia esse valor
certinho pra número — só a resposta "ao vivo" do clique de adicionar que não
passava por essa conversão.

**A correção não foi só nessa tela** — apliquei um ajuste central (`lib/prisma.ts`)
que resolve isso pra sempre, em qualquer lugar do sistema, presente ou
futuro: agora, toda vez que qualquer rota de API responde com um valor desses,
ele já vem como número de verdade, não como texto. Antes desse ajuste, esse
mesmo tipo de erro podia acontecer (silenciosamente, ou às vezes visivelmente)
em qualquer tela que atualiza um valor em dinheiro sem recarregar a página
inteira — Financeiro, Patrimônio, Pacotes, Orçamentos, Contas a pagar/receber.
Não precisei mexer em nenhuma dessas telas uma por uma — a correção é numa
única raiz compartilhada por todas.

Sem mudança de schema/banco nessa versão — só código.

## v109

## Página /link: tudo virou card grande, sem bolinha de rede social

Você queria que TODOS os links da página `/link` ficassem no mesmo formato do
card vermelho "Falar no WhatsApp" — retângulo comprido, borda arredondada,
numa lista única, sem os ícones redondos pequenos — tipo Linktree mesmo, e
reorganizável.

**O que era o ícone redondo**: era um bloco separado (Instagram/YouTube/TikTok/
LinkedIn), que vinha de 4 campos fixos de configuração, fora da lista de links
que você edita/reordena. Por isso não dava pra deixar do tamanho dos outros
nem reordenar junto.

**O que mudei** (`components/landing/LinkPage.tsx` + `LinkBioForm.tsx`):
- Removi esse bloco de ícones redondos da página `/link` por completo.
- Agora **todo link da página `/link` vem da mesma lista** (a que você já usa
  com "+ Adicionar link", reordenar com as setas, marcar como destaque etc) —
  e todos saem no mesmo formato grande, tipo o card do WhatsApp.
- O ícone de cada link é escolhido sozinho pelo título — cadastre um link
  chamado "Instagram" que ele já sai com o ícone do Instagram, "TikTok" com o
  ícone certo, "Falar no WhatsApp" com o ícone de balão, e assim por diante
  (não precisa escolher o ícone manualmente).

**O que você precisa fazer** (dado que já estava preenchido nos campos antigos
de Instagram/YouTube/TikTok/LinkedIn não migra sozinho pra lista — são coisas
diferentes agora): em Configurações → Site & Link na bio → "Página de links
(/link)", use "+ Adicionar link" pra cada rede que você quer que apareça na
lista (título "Instagram", URL do seu perfil, por exemplo) — aí já nasce como
card grande, e você reordena/exclui como qualquer outro link.

**Os 4 campos antigos (Instagram/YouTube/TikTok/LinkedIn) continuam existindo**
e ainda servem pra uma coisa: o rodapé do site principal (`/`), que continua
mostrando os ícones pequenos ali — isso eu não mexi, só a página `/link`. Deixei
um aviso no próprio painel explicando essa diferença, pra não confundir de novo.

## v108

## Cartões de "Serviços" (site, mobile) — visual mais destacado

Você pediu pra melhorar o visual dos cartões de Serviços no site em mobile —
gostou do formato, mas achou que faltava algo, e perguntou se um fundo com cor
ou um contorno melhor ficaria melhor visualmente.

**O problema**: os cartões tinham fundo quase preto (`bg-black/40`) em cima de
uma seção que já é quase preta — o resultado é o que aparece no seu print,
os cartões praticamente se misturam com o fundo, sobra só uma linha bem fraca
de contorno.

**O que mudei** (`components/landing/LandingPage.tsx`, só CSS/Tailwind, sem
mexer em conteúdo nem em dado nenhum):
- Fundo do cartão passou a ser um cinza-claro bem sutil e transparente
  (`bg-white/[0.04]`) em vez de quase preto — separa visualmente do fundo da
  seção sem parecer um "card" genérico de app.
- Um brilho fino por dentro, na borda de cima (`inset shadow`), pra dar
  profundidade — truque comum em painéis escuros (Linear, Vercel, Stripe)
  pra não ficar "chapado".
- Ao tocar/passar o mouse: o cartão sobe levemente, a borda fica vermelha
  (cor da marca) e aparece uma sombra vermelha suave por baixo — dá a sensação
  de resposta ao toque, sem depender só da mudança de cor de borda que já
  existia (mudança bem sutil, difícil de notar).
- O ícone (quadradinho vermelho) fica com fundo mais forte no hover, virando
  vermelho sólido com o ícone branco — chama mais atenção pro card ativo.

Por que essa direção e não, por exemplo, um contorno mais grosso: um contorno
mais forte sozinho deixa o card parecendo uma caixa vazia; um fundo com
alguma cor (mesmo sutil) + um brilho interno é o que dá aquela sensação de
"painel com peso" que os sites de referência que você mandou também usam —
mantém a estética preto/vermelho da marca sem introduzir uma cor nova.

## v107

## Segurança parte 2: hash de senha, cookies, força bruta, links públicos e headers

Continuação da auditoria de segurança do v106 — dessa vez cobrindo especificamente
os pontos que você pediu: hash de senha, proteção de cookie, tentativas de força
bruta, e se algo sensível aparece "no Inspecionar" do navegador.

**O que já estava certo (conferido, não mudei):**
- Senha nunca é guardada em texto puro — é hash com `bcrypt` (fator de custo 10),
  então nem olhando direto no banco dá pra ver a senha real.
- O cookie de sessão (`__Secure-next-auth.session-token`) já tinha as três
  proteções corretas: `httpOnly` (JavaScript da página não consegue ler o
  cookie, nem um script malicioso injetado), `secure` (só trafega por HTTPS)
  e `sameSite: lax` (dificulta um site externo forçar uma ação no seu painel).
- Não achei nenhuma chave de API, senha ou segredo aparecendo em código que
  roda no navegador — tudo que é sensível fica só no servidor.
- Todos os IDs usados em links (cliente, orçamento, relatório, case) são UUID
  aleatório, não sequencial — ninguém adivinha o "próximo" ID trocando um
  número na URL.

**O que corrigi:**

1. **Força bruta no login** (`lib/auth.ts`) — antes, dava pra tentar senha
   infinitas vezes sem nenhum limite. Agora, depois de 5 senhas erradas
   seguidas pro mesmo login, ele fica bloqueado por 15 minutos (mesmo que a
   senha certa venha em seguida) — impede um script de ficar testando milhares
   de combinações. Acertar a senha zera o contador normalmente.

2. **Link de orçamento previsível** (`lib/slug.ts`) — esse foi o achado mais
   sério dessa segunda rodada. O link público `/orcamento/{slug}` (que o
   cliente abre e usa pra aceitar a proposta, sem precisar de login — de
   propósito) tinha um sufixo aleatório gerado com só 4 caracteres e por um
   método (`Math.random()`) que não é seguro pra isso — combinado com o nome
   do cliente (que muitas vezes é público, tipo o nome da empresa), um script
   conseguiria tentar todas as combinações possíveis e cair no orçamento — e
   até aceitar a proposta — de outro cliente seu. Troquei pro gerador
   criptográfico do próprio Node (`crypto.randomBytes`) com um sufixo bem mais
   longo — na prática, impossível de adivinhar por tentativa e erro.

3. **Upload de arquivo sem checar o tipo** (`upload-imagem`, `upload-logo`,
   `upload-contrato`) — antes aceitava qualquer arquivo, bastava o tamanho
   estar dentro do limite. Agora exige que seja realmente uma imagem (ou, no
   caso de contrato, imagem/PDF/Word) — evita que alguém suba um arquivo
   disfarçado que o navegador tentaria rodar como página.

4. **Cabeçalhos de segurança** (`next.config.js`) — adicionei os cabeçalhos
   HTTP que praticamente todo checklist de segurança pede: `X-Frame-Options`
   (impede seu painel ser aberto escondido dentro de outro site — proteção
   contra "clickjacking"), `X-Content-Type-Options` (impede o navegador de
   tentar "adivinhar" o tipo de um arquivo de um jeito perigoso),
   `Referrer-Policy` (não vaza a URL completa ao clicar num link pra fora) e
   `Strict-Transport-Security` (reforça que o navegador nunca tente acessar
   seu domínio por HTTP, só HTTPS — a Vercel já força isso, esse cabeçalho é
   uma segunda camada). Não adicionei uma política de `Content-Security-Policy`
   completa porque ela é fácil de configurar errado e travar imagens ou
   estilos do site sem eu conseguir testar isso localmente antes — prefiro
   deixar isso pra uma etapa separada, testando com calma.

**Sobre criptografia "em trânsito" e no banco:** o tráfego entre o navegador e
a Vercel já é sempre HTTPS (a própria Vercel cuida disso, automaticamente, em
qualquer domínio — inclusive o seu domínio próprio quando você configurar). A
conexão do servidor com o banco (Neon) também já é criptografada por padrão
(Neon exige SSL na string de conexão). Isso não depende de código do projeto,
é a infraestrutura que já garante.

**Recomendação que não mudei via código (decisão sua):** as rotas de manutenção
(`/api/resetar-senha`, `/api/setup` etc.) recebem o segredo (`SETUP_SECRET`) na
própria URL, via `?secret=...`. Isso significa que esse segredo pode acabar
salvo no histórico do navegador ou nos logs da Vercel. Como são rotas de uso
raro e manual, não mudei o formato pra não complicar seu fluxo — mas vale: (a)
usar um `SETUP_SECRET` bem longo e aleatório, (b) nunca compartilhar essa URL
com ninguém, e (c) se puder, trocar esse segredo de tempos em tempos.

**Teste depois de subir:**
1. Tentar logar errado 5x seguidas → a 6ª tentativa (mesmo com a senha certa)
   deve continuar negando por alguns minutos.
2. Pegar um link de orçamento novo que você gerar a partir de agora e conferir
   que o sufixo no final é bem mais longo que antes.
3. Testar upload de imagem/logo/contrato normalmente pra confirmar que
   continua funcionando.

## v106

## Segurança: as rotas de API não pediam login (falha grave, corrigida)

Você pediu uma análise de segurança pensando em deixar o `/link` no ar com
domínio próprio. O achado real não tinha a ver com o `/link` em si — é mais
sério que isso, e já valia mesmo antes de qualquer domínio novo.

**O que estava errado:** as páginas do painel (`/dashboard/...`) sempre
exigiram login (isso já funcionava, via middleware). O problema é que as
mais de 60 rotas de API que essas páginas usam por trás (`/api/clientes`,
`/api/despesas`, `/api/cobrancas`, `/api/contratos`, `/api/configuracao`,
`/api/cases`, etc.) **não verificavam login nenhum**. Isso é a categoria
"Broken Access Control", apontada pela OWASP como a falha mais comum em
aplicações web ([OWASP Top 10:2025 — A01](https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/),
[Auth0 sobre o tema](https://auth0.com/blog/why-broken-access-control-still-dominates-owasp-top-10/)).

Na prática: qualquer pessoa que descobrisse o endereço de uma dessas rotas
(visível no próprio código do navegador, sem nenhum segredo) conseguia, sem
fazer login, ler a lista completa de clientes (nome, WhatsApp, CNPJ),
despesas, cobranças, contratos e a configuração do site — e em vários casos
também **criar, editar ou apagar** esses dados. Isso já era verdade hoje, no
endereço `.vercel.app` atual, não é algo que só ia começar a valer com o
domínio próprio.

**O que eu corrigi:** reescrevi o `middleware.ts` (a camada que roda antes de
qualquer página ou rota de API) seguindo o padrão recomendado pela própria
documentação oficial do NextAuth/Auth.js
([Securing pages and API routes](https://next-auth.js.org/tutorials/securing-pages-and-api-routes)):
agora **toda rota de API exige uma sessão válida por padrão**, e só passa
sem login uma lista pequena e explícita do que precisa mesmo ser público:

- Cliente abrindo/aceitando uma proposta de orçamento pelo link (`/api/orcamento/[slug]` e `.../aceitar`)
- Cliente deixando um comentário no relatório público (`/api/relatorios/[id]`, só o PATCH)
- O feed de agenda (`.ics`) e as rotas de manutenção (`/api/setup`, `/api/resetar-senha`, etc.), que já exigiam um `?secret=` próprio

Importante: mesmo dentro dessas rotas "públicas", só o método específico que
precisa ser público ficou liberado — por exemplo, **ver** uma proposta
continua público, mas **apagar** essa mesma proposta agora exige login, algo
que antes também estava completamente aberto.

De brinde, corrigi também: o login agora volta pra página que você tentava
acessar antes de cair na tela de entrada (em vez de sempre te jogar pro
`/dashboard`), validando que esse destino é sempre uma página interna do
próprio painel — nunca um endereço de fora — pra não abrir uma brecha de
redirecionamento.

### O que eu validei
Revisei manualmente todas as ~64 rotas de API do projeto, uma por uma, pra
listar exatamente quais precisam ficar públicas e por quê — não tem como
rodar o build nem simular uma sessão aqui no sandbox, então o teste real é
depois do deploy (veja abaixo o que conferir).

### Depois de subir, teste assim
1. Sem estar logado (aba anônima), tente abrir `/dashboard` e um link direto
   de API, ex: `seusite.com/api/clientes` — os dois devem recusar (o
   dashboard te manda pro login, a API responde "Não autenticado").
2. Ainda deslogado, abra um link de proposta ou relatório que você já tenha
   mandado pra um cliente de verdade — tem que continuar abrindo normal.
3. Logado, confirme que o painel inteiro continua funcionando normal
   (criar/editar clientes, despesas, etc.) — nada nessa mudança altera o que
   você já faz logado, só fecha o que ficava aberto pra quem não loga.

### Recomendação extra (não fiz sozinho, mas vale considerar)
As rotas `/api/setup`, `/api/resetar-senha`, `/api/reset-catalogo` e
`/api/reset-catalogo-total` são protegidas por um `SETUP_SECRET` que só você
tem — confirme que essa variável no Vercel é uma senha longa e aleatória
(não algo como "123" ou o nome da agência), e considere apagar essas rotas
do projeto depois que não precisar mais delas, já que uma delas troca a
senha de login sozinha se alguém souber o secret.

## v105

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

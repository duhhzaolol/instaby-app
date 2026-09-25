# Instaby App — v128

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

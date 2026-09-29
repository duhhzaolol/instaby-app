// Registro de novidades do app, em linguagem simples — pensado pra qualquer
// pessoa da equipe entender o que mudou sem precisar entender de código.
// Alimenta a página /dashboard/novidades e o aviso (bolinha) no ícone de
// estrelinha do cabeçalho, do lado do sininho.
//
// PROCESSO PERMANENTE: a partir da v141, toda versão nova entregue ganha uma
// entrada nova aqui, sempre no TOPO da lista (a mais recente primeiro). Frase
// curta em "resumo" dizendo do que se trata, e cada item descrevendo o que
// mudou e, quando ajudar, o que isso significa pra quem usa o app no dia a
// dia — sem termo técnico, sem nome de arquivo ou de função.

export type ItemNovidade = {
  tipo: "adicionado" | "melhorado" | "corrigido" | "removido";
  texto: string;
};

export type VersaoNovidades = {
  versao: number;
  resumo: string;
  itens: ItemNovidade[];
};

export const NOVIDADES: VersaoNovidades[] = [
  {
    versao: 150,
    resumo:
      "Novo visual de ícone (escuro, com brilho vermelho) no menu do painel e na abertura do site; Facebook e Google entraram no time de ícones da abertura.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Os ícones do menu lateral do painel (Tarefas, Agenda, Clientes, Tráfego pago, Horas, Financeiro, Comercial) ganharam um visual novo — escuros, com um brilho vermelho na borda, no estilo das imagens de referência que ele mandou (claquete, alvo, cronômetro etc.). O ícone de Tarefas virou uma claquete de cinema.",
      },
      {
        tipo: "adicionado",
        texto:
          "A cena de abertura do site (os ícones que voam e formam o logo) ganhou o mesmo visual novo, e o Facebook e o Google entraram no meio dos ícones que convergem, ao lado do Instagram e do YouTube que já estavam lá.",
      },
    ],
  },
  {
    versao: 149,
    resumo: 'Corrigido o mapa "Onde a gente atende", que ficou com uma marca d\'água por cima depois da v148.',
    itens: [
      {
        tipo: "corrigido",
        texto:
          'O serviço que fornecia o mapa de fundo (introduzido na v148) passou a pedir uma chave de acesso que a gente não tinha, e isso aparecia como uma marca d\'água "API KEY REQUIRED" cobrindo o mapa inteiro (os pinos e nomes de cidade continuavam certos). Trocado por outro serviço de mapa, também gratuito — já corrigido.',
      },
    ],
  },
  {
    versao: 148,
    resumo:
      "Site principal: mapa de verdade com seletor de cidades, card vermelho de prova social de volta, carrossel do Processo com fotos, mais efeitos e vários ajustes visuais.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          '"Onde a gente atende" agora é um mapa de verdade (baseado no mapa real da região, sem custo nenhum) — em Configurações → Site, é só marcar quais cidades aparecem, sempre ligadas à base em Araras.',
      },
      {
        tipo: "adicionado",
        texto:
          'Voltou o card vermelho de destaque logo depois do "Quem somos" — título e texto editáveis em Configurações → Site (o texto original de antes desse site não foi encontrado em lugar nenhum, então esse aqui é um texto novo, no mesmo espírito).',
      },
      {
        tipo: "melhorado",
        texto:
          'A seção "Do planejamento ao resultado" (Processo) virou um carrossel grande, que dá pra arrastar, com espaço pra uma foto em cada uma das 4 etapas.',
      },
      {
        tipo: "corrigido",
        texto:
          "Os carrosséis que só respondiam ao toque (Serviços no celular e o novo do Processo) agora também arrastam com o mouse — resolve o problema de testar o site no computador numa janela estreita e não conseguir ver o resto.",
      },
      {
        tipo: "melhorado",
        texto: 'Fundo do site ficou preto de verdade (antes tinha um leve tom acinzentado).',
      },
      {
        tipo: "melhorado",
        texto:
          'Banners de fundo (abertura, "Quem somos", Processo e chamada final) ganharam um leve efeito de zoom contínuo, pra ficar menos parado.',
      },
      {
        tipo: "melhorado",
        texto: "Botão do menu no celular ficou maior e mais fácil de tocar.",
      },
      {
        tipo: "melhorado",
        texto:
          'Álbuns: cada cartão ganhou uma "pontinha" atrás e uma fitinha decorativa, pra nunca ficar com cara de vazio quando só tem um trabalho publicado.',
      },
      {
        tipo: "adicionado",
        texto:
          "Página /link ganhou mais ícones (câmera, edição, design) e alguns elementos flutuantes coloridos, além de balõezinhos decorativos no botão do WhatsApp.",
      },
      {
        tipo: "removido",
        texto:
          "Rodapé do site não mostra mais os links de navegação nem o link pro painel administrativo — no lugar, mostra as cidades marcadas no mapa.",
      },
    ],
  },
  {
    versao: 147,
    resumo:
      "Parte 3 do redesign do painel: configurações pessoais, quadro Kanban pro editor e tráfego pago, e vários ajustes de acesso e visual.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Configurações pessoais, pra qualquer pessoa da equipe (não só quem gerencia a equipe): foto de perfil, nome, e-mail, senha e links de contato (Discord, WhatsApp, Instagram etc.) — acessa clicando no seu nome no menu lateral.",
      },
      {
        tipo: "melhorado",
        texto:
          "Início do editor virou um quadro (A fazer / Fazendo / Pronto), no mesmo estilo do quadro de tarefas — com acesso rápido à pasta do Drive de cada tarefa direto no card, e sub-passos (checklist) que dá pra marcar conforme avança.",
      },
      {
        tipo: "adicionado",
        texto:
          'Ao criar uma tarefa, dá pra escolher um checklist pronto (ex.: "Básico" — corte sem som, remover ruído, música, legenda, logo) com um clique, ou digitar os próprios passos.',
      },
      {
        tipo: "melhorado",
        texto: "Agenda do editor mostra só os itens dele, com o prazo em vermelho quando está apertado ou atrasado.",
      },
      {
        tipo: "adicionado",
        texto: 'Editor ganhou acesso à aba "Links" dentro da página do cliente.',
      },
      {
        tipo: "adicionado",
        texto: "Tráfego pago ganhou um Início com quadro pessoal de tarefas e uma Agenda filtrada, no mesmo estilo do editor.",
      },
      {
        tipo: "melhorado",
        texto:
          "Página de Tarefas virou o mesmo quadro Kanban (em vez das abas Abertas/Concluídas/Todas) — mais fácil de ver tudo de uma vez.",
      },
      {
        tipo: "adicionado",
        texto:
          "Horas e Agenda agora mostram a foto (ou as iniciais) de quem fez cada coisa, em vez de só o nome escrito — mais fácil de reconhecer de relance.",
      },
      {
        tipo: "adicionado",
        texto: "Em Horas, o dono ganhou um seletor pra ver as horas lançadas por uma pessoa específica da equipe.",
      },
      {
        tipo: "corrigido",
        texto:
          "Cada pessoa (fora o dono) agora só vê as próprias horas e os próprios itens na Agenda — antes dava pra ver de todo mundo em algumas telas, mesmo sem ser o dono.",
      },
      {
        tipo: "corrigido",
        texto:
          "Auditoria completa de valores em R$: conferido o app inteiro pra garantir que ninguém sem a permissão de ver financeiro consegue ver nenhum valor — corrigidos 4 pontos que ainda vazavam (lista de clientes, o topo da página do cliente, a aba \"Visão Geral\" do cliente e a aba \"Serviços\" do cliente).",
      },
      {
        tipo: "corrigido",
        texto:
          "Corrigida uma falha de segurança: quem é desativado em Configurações → Equipe podia continuar acessando o painel normalmente por até 30 dias (enquanto a sessão antiga não expirasse) e, num ponto específico (a Agenda), até ver os dados de todo mundo em vez dos próprios. Agora é desconectado de verdade assim que a sessão dele é conferida de novo.",
      },
      {
        tipo: "melhorado",
        texto:
          'Início do dono: "Equipe agora" e "Precisa da sua atenção" ficaram compactos, lado a lado, do tamanho dos cards de cima — antes eram dois blocos enormes antes do gráfico de faturamento.',
      },
      {
        tipo: "melhorado",
        texto:
          'Financeiro e Comercial: a barra de abas no topo da página virou um menu que abre dentro do próprio item do menu lateral — clica em "Financeiro" ou "Comercial" pra ver as opções, sem sair do lugar.',
      },
    ],
  },
  {
    versao: 146,
    resumo: "Corrigido um erro que impedia o site de atualizar com a Parte 2 do redesign.",
    itens: [
      {
        tipo: "corrigido",
        texto:
          "A versão anterior (v145) tinha um erro que travava a atualização do site no ar — a página continuava na versão antiga até isso ser corrigido. Já corrigido; as novidades da Parte 2 (as 3 telas de Início) passam a valer a partir desta versão.",
      },
    ],
  },
  {
    versao: 145,
    resumo: "Parte 2 do redesign do painel: 3 telas de Início, uma pra cada função (dono, editor, tráfego).",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "O Início virou 3 telas diferentes — dono, editor e gestor de tráfego veem cada um só o que importa pro seu dia a dia ao entrar no painel.",
      },
      {
        tipo: "adicionado",
        texto:
          "Início do dono: \"Equipe agora\" mostra o que cada pessoa está fazendo neste momento e as horas já lançadas essa semana; tarefas por status (a fazer/em andamento/feitas essa semana); caixa dos próximos 7 dias; mais 2 alertas novos (tarefa sem responsável, proposta enviada sem resposta).",
      },
      {
        tipo: "adicionado",
        texto:
          "Início do editor: o que está fazendo agora — com checklist de sub-passos e botão de marcar como feito —, fila pessoal ordenada por prazo com botão de iniciar o cronômetro direto ali, tarefas disponíveis pra pegar pra si, próximas captações e horas da semana. Sem nenhum valor em R$ nessa tela.",
      },
      {
        tipo: "adicionado",
        texto:
          "Início do gestor de tráfego: investido, resultados, custo por resultado e retorno do mês; barra de ritmo de verba por cliente (mostra se o gasto está adiantado ou atrasado pro dia do mês); alertas, relatórios do mês e criativos pedidos ao editor.",
      },
      {
        tipo: "adicionado",
        texto:
          "Checklist dentro da tarefa — sub-passos simples (ex: roteiro, captação, edição) que dá pra marcar conforme avança, sem precisar separar em várias tarefas.",
      },
      {
        tipo: "adicionado",
        texto:
          "Tarefa agora pode ter um responsável. Por enquanto só dá pra assumir uma tarefa sem dono (\"Pegar pra mim\", no Início do editor) — escolher o responsável na hora de criar ou editar a tarefa vem numa próxima parte.",
      },
    ],
  },
  {
    versao: 144,
    resumo: "Parte 1 do redesign do painel: cores, fontes, menu lateral, barra do topo.",
    itens: [
      {
        tipo: "melhorado",
        texto:
          "Visual novo do painel (cores, fontes e cartões) — a primeira parte de um redesign maior, combinado de entregar aos poucos.",
      },
      {
        tipo: "melhorado",
        texto:
          "Menu lateral reorganizado, com números ao lado de Tarefas (atrasadas), Clientes (ativos) e Financeiro (cobranças vencidas). Configurações virou uma engrenagem no rodapé, junto com o botão de tema e o de sair.",
      },
      {
        tipo: "adicionado",
        texto:
          "Cronômetro na barra do topo — escolhe cliente e atividade e ele roda ao vivo até você parar, usando o mesmo registro de horas de sempre.",
      },
      {
        tipo: "adicionado",
        texto: "Botão \"Nova tarefa\" na barra do topo, disponível em qualquer tela do painel, não só dentro de Tarefas.",
      },
      {
        tipo: "melhorado",
        texto:
          "Financeiro e Comercial viraram 1 item cada no menu, com abas por dentro. O conteúdo de cada aba ainda é o de sempre — a atualização visual delas vem numa próxima parte.",
      },
    ],
  },
  {
    versao: 143,
    resumo: "Novo botão de sair da conta.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Botão de sair da conta, do lado do botão de trocar o tema, na caixa com seu nome no rodapé do menu lateral. Pede uma confirmação antes de sair de verdade, pra não acontecer sem querer.",
      },
    ],
  },
  {
    versao: 142,
    resumo: "Correção de um bug visual que a v141 introduziu, e a Novidades mudou de lugar.",
    itens: [
      {
        tipo: "corrigido",
        texto:
          "Bug da v141: várias caixas e cartões pelo app estavam perdendo o fundo escuro e ficando com uma borda clara chamativa — veio junto com a infraestrutura nova do tema cinza, corrigido na raiz agora. Afetava, por exemplo, o bloco \"Precisa da sua atenção\" do Dashboard e a caixa com o nome do usuário no menu lateral.",
      },
      {
        tipo: "melhorado",
        texto:
          "\"Novidades\" saiu do menu lateral e virou um ícone (estrelinha) no topo da tela, do lado do sininho de notificações — mais fácil de ver.",
      },
      {
        tipo: "corrigido",
        texto:
          "Tirado o pontinho vermelho do sininho que ficava sempre aceso, mesmo sem nenhuma notificação de verdade por trás dele. O sininho em si ainda não abre nada — isso já era assim antes da v141, não é coisa nova — fica pra decidir se vale construir um sistema de notificação de verdade.",
      },
    ],
  },
  {
    versao: 141,
    resumo:
      "Página de novidades, dashboard reorganizado, mais cor em alguns cartões, tema cinza e busca de verdade no topo.",
    itens: [
      {
        tipo: "adicionado",
        texto: "Esta página de Novidades — toda atualização a partir de agora aparece aqui, agrupada por versão.",
      },
      {
        tipo: "adicionado",
        texto:
          "Botão pra trocar o fundo do sistema entre o escuro padrão e um cinza mais neutro — fica ao lado do seu nome, no rodapé do menu lateral. (Cor ainda provisória — me manda a referência certa que eu ajusto fino.)",
      },
      {
        tipo: "melhorado",
        texto:
          "No Dashboard, o bloco \"Precisa da sua atenção\" agora aparece logo abaixo dos 4 cartões do topo, antes do gráfico de faturamento.",
      },
      {
        tipo: "melhorado",
        texto:
          "Os cartões \"Clientes ativos\" e \"Leads em aberto\" do Dashboard ganharam a borda colorida com degradê, no mesmo estilo do cartão \"Insight Instaby\".",
      },
      {
        tipo: "corrigido",
        texto:
          "A busca no topo da tela (\"Buscar cliente, orçamento...\") agora funciona de verdade — antes era só um desenho, não dava pra digitar nada nela.",
      },
      {
        tipo: "corrigido",
        texto:
          "O botão \"Novo cliente\" (e o mesmo tipo de botão em Serviços, Pacotes e Orçamentos) não aparece mais duplicado na tela.",
      },
    ],
  },
  {
    versao: 140,
    resumo: "Telas que salvavam algo sem avisar quando dava errado agora avisam.",
    itens: [
      {
        tipo: "corrigido",
        texto:
          "13 telas (Contratos, Onboarding, Links, Contatos e Solicitações dentro do cliente; Pipeline de Oportunidades; Tráfego Pago; quadro de Tarefas; Horas; Agenda; despesas do Financeiro; Relatórios; modelos de checklist) agora mostram um aviso quando salvar ou excluir algo falha, em vez de fechar a tela como se tivesse dado certo sem ter salvo nada.",
      },
    ],
  },
  {
    versao: 139,
    resumo: "O redesign visual chegou nas últimas telas que ainda estavam no estilo antigo.",
    itens: [
      {
        tipo: "melhorado",
        texto:
          "Financeiro (Patrimônio), Comercial (Oportunidades, Orçamentos, Contratos, Pacotes, Serviços), Agenda, Horas e Tráfego Pago ganharam o mesmo visual — cartões com entrada animada e resumo no topo — que Dashboard, Clientes e Tráfego Pago já tinham.",
      },
    ],
  },
  {
    versao: 138,
    resumo: "Novas métricas de tráfego pago e revisão de quem pode ver o quê dentro de um cliente.",
    itens: [
      {
        tipo: "adicionado",
        texto: "Campo de Alcance nos resultados de campanha lançados na mão (antes só vinha se importasse do Meta).",
      },
      {
        tipo: "adicionado",
        texto: "Frequência e CPM calculados sozinhos a partir dos números que já eram lançados de cada campanha.",
      },
      {
        tipo: "adicionado",
        texto:
          "Nova permissão \"Acesso completo dentro do cliente\" em Configurações → Equipe — desligada, a pessoa só vê Arquivos e Horas ao abrir um cliente. O preset \"Editor\" já vem configurado assim.",
      },
      {
        tipo: "adicionado",
        texto: "Todo registro de horas agora guarda quem lançou, e isso passou a aparecer em Horas e na Agenda.",
      },
    ],
  },
  {
    versao: 137,
    resumo: "As pastas de cada cliente no Drive passaram a ser criadas automaticamente.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Aba \"Arquivos\" dentro de cada cliente, com as pastas Logotipos, Conteúdo e Contratos criadas sozinhas dentro do Drive da agência.",
      },
      {
        tipo: "adicionado",
        texto: "Uma tarefa de \"Criar Reel\" só pode ser marcada como pronta se já tiver o vídeo bruto na pasta certa do Drive.",
      },
      { tipo: "adicionado", texto: "Nova permissão \"Ver arquivos (Drive)\" em Configurações → Equipe." },
    ],
  },
];

export const ULTIMA_VERSAO_NOVIDADES = NOVIDADES[0].versao;

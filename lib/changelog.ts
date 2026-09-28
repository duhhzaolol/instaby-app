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

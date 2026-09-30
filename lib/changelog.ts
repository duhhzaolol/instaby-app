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
    versao: 158,
    resumo:
      "Planejamento de capacidade da equipe, dependências entre tarefas e rotinas mensais automáticas por serviço contratado.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          'Tarefas ganharam "estimativa de horas". Nova página "Capacidade" compara, semana a semana, o trabalho previsto com as horas disponíveis de cada pessoa e avisa quando a semana passa do limite ou quando um prazo cai num dia de folga. Cada pessoa vê a própria linha; quem gerencia a equipe vê todo mundo.',
      },
      {
        tipo: "adicionado",
        texto:
          "Dá pra cadastrar folgas, férias, atestados e compromissos de cada pessoa, e definir as horas por semana de cada uma (no próprio perfil ou em Equipe).",
      },
      {
        tipo: "adicionado",
        texto:
          'Uma tarefa pode depender de outra. Antes de mudar um prazo, o painel mostra quais tarefas seguintes seriam afetadas e deixa você confirmar ("Salvar assim mesmo") ou cancelar. Dependências que formariam um círculo são recusadas.',
      },
      {
        tipo: "adicionado",
        texto:
          'Templates de tarefas agora podem ser um ciclo completo (planejamento, roteiro, captação, edição, aprovação, publicação, relatório), com o prazo de cada etapa calculado a partir da data de entrega/publicação. Na aba Tarefas do cliente, o botão "Aplicar template" gera o ciclo. Os templates de lista simples continuam funcionando igual.',
      },
      {
        tipo: "adicionado",
        texto:
          'Cada serviço do catálogo pode ser ligado a um ciclo: todo mês, clientes ativos com esse serviço ganham as tarefas geradas sozinhas, sem duplicar. Na aba Serviços do cliente dá pra pausar e retomar essa geração.',
      },
      {
        tipo: "corrigido",
        texto:
          "Fechadas lacunas de permissão: editar dados de um cliente agora exige acesso àquele cliente (e valores/contrato exigem acesso financeiro), e as rotas de templates passaram a respeitar as permissões.",
      },
    ],
  },
  {
    versao: 157,
    resumo:
      "Nova aba \"Entregas\" mostra o andamento mensal do que foi contratado, e o cliente ganhou um link próprio pra pedir coisas direto pro sistema.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          'Nova aba "Entregas" na ficha do cliente: mostra, mês a mês, quanto foi contratado de cada serviço (ex: reels) e quantos já foram publicados, aprovados, estão em edição ou aguardando material — sem contar correção ou reenvio como uma entrega a mais. Dá pra ligar, por serviço, se o que sobrar num mês soma no mês seguinte.',
      },
      {
        tipo: "adicionado",
        texto:
          'Cada serviço do catálogo agora pode ser ligado a um "tipo de entrega" (em Catálogo de Serviços) — é isso que alimenta a aba Entregas. Opcional; só vale a pena preencher em serviços com quantidade mensal pra acompanhar.',
      },
      {
        tipo: "adicionado",
        texto:
          'Novo link público pra cada cliente pedir o que precisa direto: escolhe o tipo de pedido, responde perguntas rápidas sobre ele, anexa uma imagem de referência e diz o prazo que gostaria — sem precisar de login. O botão "Copiar link pro cliente" fica na aba Solicitações.',
      },
      {
        tipo: "adicionado",
        texto:
          'Pedidos do cliente (ou anotados rápido pela equipe) agora viram tarefa com um clique, já com a descrição e os anexos preenchidos — sem digitar tudo de novo. Pedidos fora do que já foi contratado podem virar a base de um orçamento adicional, que só é cobrado se o cliente aceitar (igual todo orçamento).',
      },
      {
        tipo: "melhorado",
        texto:
          'Remover um serviço contratado deixou de apagar o registro pra sempre — agora fica guardado um histórico de quando a quantidade, o valor ou o próprio serviço mudou, com data e quem mexeu.',
      },
      {
        tipo: "corrigido",
        texto:
          'Duas telas de serviços contratados e duas de solicitações do cliente não conferiam a permissão de quem estava chamando — na prática, alguém sem acesso a valores ou contratos que soubesse o endereço certo conseguia ler ou mudar esses dados por fora da tela normal, mesmo a tela escondendo a opção. Corrigido; ninguém que já usava essas telas normalmente percebe diferença.',
      },
      {
        tipo: "corrigido",
        texto:
          'A tela de montar um orçamento novo pra um cliente não conferia nenhuma permissão específica — corrigido, agora exige a mesma permissão de sempre pra ver orçamentos.',
      },
    ],
  },
  {
    versao: 156,
    resumo:
      "Auditoria do Tráfego Pago contra a lista original: a conta de anúncios agora aparece na importação, e o orçamento do conjunto de anúncios (do próprio Meta) agora aparece em cada campanha.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          'A prévia de importação e o histórico de importações agora mostram o nome da conta de anúncios do arquivo, quando o Meta inclui essa coluna na exportação — antes esse dado nem era lido do arquivo.',
      },
      {
        tipo: "adicionado",
        texto:
          'O card de cada campanha (em Tráfego Pago e na aba de Tráfego Pago dentro do cliente) agora mostra o orçamento do conjunto de anúncios vindo da última importação do Meta, quando disponível — esse número já era guardado desde antes, só não aparecia em nenhuma tela.',
      },
    ],
  },
  {
    versao: 155,
    resumo: "Novo botão pra gerar (ou trocar) a pasta do Drive de uma tarefa na hora, sem precisar mexer em nada por fora.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          'Tarefas de "Criar Reel" e "Criar arte" ganharam um botão "Gerar pasta" (ou "Gerar pasta nova", se já tinha uma) dentro do próprio painel — útil pra tarefas mais antigas que ainda apontam pra pasta compartilhada da semana (de antes da correção da v153) e pra tarefas que nunca chegaram a ganhar pasta própria. Não move nenhum arquivo que já estivesse na pasta anterior — avisa disso antes de trocar.',
      },
    ],
  },
  {
    versao: 154,
    resumo: "Corrigido um erro que impedia abrir o Tráfego Pago depois de escolher um cliente.",
    itens: [
      {
        tipo: "corrigido",
        texto:
          'Escolher um cliente dentro do Tráfego Pago (Visão geral, Verba, Histórico de importações ou Relatórios) dava erro e a tela não abria — um problema no componente do seletor de cliente, presente desde a reconstrução desse módulo, que só se manifestava depois de escolher o cliente (a tela de "escolha um cliente" antes disso funcionava normal). Corrigido; nada mudou na aparência nem no jeito de usar.',
      },
    ],
  },
  {
    versao: 153,
    resumo:
      "Reels e artes agora têm um fluxo completo de revisão e aprovação (com página pública pro cliente comentar e aprovar), e o vídeo bruto de cada tarefa deixou de ser compartilhado com as outras da mesma semana.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          'Tarefas de "Criar Reel" e "Criar arte" ganharam um fluxo de revisão dentro do próprio painel da tarefa: Produção → Revisão interna → Aprovação do cliente → Agendado → Publicado. Dá pra enviar o material (vídeo/imagem + legenda), comentar, aprovar e registrar o link e a data de quando foi publicado de verdade — mesmo quando a publicação é feita na mão, fora do app.',
      },
      {
        tipo: "adicionado",
        texto:
          "Cada envio de material vira uma versão nova, guardada pra sempre — nada é substituído por cima. Se o conteúdo já tinha sido aprovado e alguém manda uma versão corrigida, a aprovação anterior não vale mais pra essa versão nova: precisa aprovar de novo antes de agendar ou publicar.",
      },
      {
        tipo: "adicionado",
        texto:
          "Nova página pública de revisão (link só da tarefa, sem precisar de login, igual já funcionava com os relatórios): o cliente assiste o vídeo ou vê a imagem, comenta num momento específico do vídeo ou aponta um lugar exato da imagem, e aprova a versão direto por ali, no celular.",
      },
      {
        tipo: "adicionado",
        texto:
          "Comentários de revisão podem ser marcados como internos (só a equipe vê) ou compartilhados — os internos nunca aparecem na página pública do cliente, em nenhuma hipótese.",
      },
      {
        tipo: "adicionado",
        texto:
          'Pra conteúdo que nunca teve gravação própria (ex.: reel feito só com banco de imagens), dá pra registrar uma exceção justificada em vez de ficar travado esperando um vídeo bruto que não existe.',
      },
      {
        tipo: "corrigido",
        texto:
          'A checagem de "vídeo bruto" de uma tarefa de "Criar Reel" olhava pra pasta da SEMANA no Drive, que era compartilhada por todas as tarefas do mesmo cliente com prazo naquela semana — então bastava UMA tarefa ter recebido a gravação pra todas as outras da semana passarem no teste, mesmo sem ter a própria gravação. Agora cada tarefa tem sua própria pasta (dentro da pasta da semana, que continua existindo só pra organização) — o teste do vídeo bruto olha só pra ela. Tarefas antigas continuam como estavam (pra não perder gravação já enviada) — só as tarefas que ainda não tinham pasta passam a usar a correção automaticamente.',
      },
    ],
  },
  {
    versao: 152,
    resumo:
      "Tarefas ganharam um painel completo de detalhes (comentários, histórico e bloqueio) e um sino de notificações de verdade; relatórios de cliente agora avisam a agência quando alguém comenta.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Toda tarefa agora abre um painel lateral com todos os detalhes — dá pra editar título, descrição, responsável, prioridade, prazo, checklist e link, tudo no mesmo lugar. Abre clicando em qualquer tarefa no Início, no quadro Kanban, na Agenda ou dentro da ficha do cliente.",
      },
      {
        tipo: "adicionado",
        texto:
          "Comentários internos dentro da tarefa (só a equipe vê, nunca o cliente) e um histórico de tudo que já foi alterado nela — quem mudou o quê e quando.",
      },
      {
        tipo: "adicionado",
        texto:
          'Novo status "Bloqueada", com motivo obrigatório e, se quiser, quem é responsável por desbloquear. Aparece como uma coluna própria (vermelha) em todos os quadros Kanban, entre "Em andamento" e "Feito".',
      },
      {
        tipo: "melhorado",
        texto:
          'No Início pessoal (editor e tráfego), a coluna "A fazer" agora separa o que já é seu do que ainda está disponível pra qualquer um pegar — mais fácil de ver o que falta assumir.',
      },
      {
        tipo: "adicionado",
        texto:
          "Sino de notificações de verdade, no lugar do antigo ícone decorativo: avisa quando uma tarefa é atribuída pra você, quando ela é bloqueada, quando alguém comenta nela, e agora também quando um cliente comenta um relatório. Cada notificação já vem com atalho pra abrir, responder, revisar ou atribuir, sem precisar procurar a tarefa em outro lugar.",
      },
      {
        tipo: "melhorado",
        texto:
          'Notificações repetidas do mesmo assunto se agrupam numa só (com um contador, tipo "3x"), em vez de empilhar uma embaixo da outra. Dá pra marcar como lida ou adiar pra depois (1 hora, amanhã de manhã ou semana que vem).',
      },
      {
        tipo: "adicionado",
        texto:
          'Comentário que um cliente deixa no relatório público agora chega pra dentro do painel: a agência recebe uma notificação e pode responder ali mesmo, ou depois direto no card do relatório dentro da ficha do cliente — antes, esse comentário só existia se alguém entrasse na página pública do relatório pra conferir.',
      },
      {
        tipo: "corrigido",
        texto:
          "Cronômetro nunca mais duplica hora lançada: se você inicia o cronômetro de uma tarefa e depois marca ela como feita (ou bloqueada) por qualquer caminho do app, o sistema fecha o cronômetro sozinho, em vez de deixar ele aberto ou pedir pra lançar a hora de novo na mão.",
      },
      {
        tipo: "corrigido",
        texto:
          'Corrigidas duas falhas de segurança: a página pública de relatório permitia, sem login nenhum, apagar relatórios e escrever no "comentário da agência" que aparece pro cliente; e criar tarefas num cliente também não pedia login. As duas agora exigem estar logado e ter acesso àquele cliente especificamente — a única coisa que continua aberta sem login, de propósito, é o cliente comentar no próprio relatório dele.',
      },
    ],
  },
  {
    versao: 151,
    resumo:
      "Tráfego Pago virou um módulo completo: importação do Meta Ads com reconciliação automática, controle de verba/saldo por cliente, avaliação de campanha e relatórios em PDF.",
    itens: [
      {
        tipo: "adicionado",
        texto:
          "Importação de relatórios do Meta Ads (CSV ou Excel) direto na tela — reconhece as campanhas automaticamente e, antes de confirmar, mostra o que vai mudar (campanhas novas, já conhecidas, quanto cada uma gastou a mais e o impacto no saldo do cliente). Reimportar o mesmo arquivo nunca duplica campanha nem desconta o gasto duas vezes, e um arquivo mais antigo nunca sobrescreve sozinho um dado mais recente.",
      },
      {
        tipo: "adicionado",
        texto:
          "Cada cliente agora tem um controle de verba: quanto foi disponibilizado, aportes e devoluções ao longo do tempo, e o saldo restante calculado sozinho conforme os gastos importados. Esse saldo é um controle interno da agência — não é uma consulta ao saldo de verdade dentro do Meta.",
      },
      {
        tipo: "adicionado",
        texto:
          'Nova tela "Visão Geral" por cliente: verba, gasto, saldo restante e o desempenho de cada campanha ativa, tudo num só lugar, com os números em destaque.',
      },
      {
        tipo: "adicionado",
        texto:
          "Status da campanha agora tem dois níveis: o que o Meta reporta (ativa/pausada) e uma organização própria da equipe (em acompanhamento, pausada, finalizada, arquivada). Finalizar ou arquivar aqui é só organização interna — não desliga a campanha lá no Meta, e não quer dizer que ela foi mal.",
      },
      {
        tipo: "adicionado",
        texto:
          "Avaliação de campanha: marcar se ficou dentro da meta, abaixo da meta ou inconclusiva, com objetivo, meta e observações — fica registrado quem avaliou e quando.",
      },
      {
        tipo: "adicionado",
        texto:
          "Histórico de importações: cada arquivo enviado fica guardado, com link pro arquivo original, mostrando exatamente o que mudou em cada campanha naquela importação.",
      },
      {
        tipo: "adicionado",
        texto:
          "Relatórios de tráfego em PDF: escolhe cliente, período e campanhas, vê uma prévia e gera um relatório com investimento, resultados e avaliação de cada campanha. Cada versão gerada fica salva pra sempre — nunca é sobrescrita por uma nova.",
      },
      {
        tipo: "melhorado",
        texto:
          "Os números de resultado nunca misturam coisas incompatíveis: resultados de tipos diferentes (conversas, engajamentos, visualizações de vídeo) ficam sempre separados uns dos outros, e alcance de campanhas diferentes não é somado como se fosse a mesma pessoa alcançada duas vezes.",
      },
      {
        tipo: "melhorado",
        texto:
          "Acesso à verba, ao gasto e ao saldo de tráfego pago segue as mesmas permissões de sempre: só quem gerencia tráfego vê, só dos clientes autorizados pra essa pessoa, e nunca aparece pra quem só tem acesso de Editor — vale também pros relatórios em PDF.",
      },
    ],
  },
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

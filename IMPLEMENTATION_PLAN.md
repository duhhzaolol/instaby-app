# Instaby App — Plano de Evolução (Sistema Operacional da Agência)

> Baseado no documento de escopo recebido em 10/09/2026. Este plano consolida as 64 subtarefas do documento original em tarefas técnicas reais, adaptadas à arquitetura existente (Next.js 14 App Router + Prisma + Postgres/Neon, sem migration formal — usa `db push`).

## Como usar este arquivo
- [ ] = não iniciado · [~] = em andamento · [x] = concluído
- Cada tarefa concluída deve ter um resumo curto anexado abaixo dela (implementado / banco / arquivos / pendências)
- **Este plano não deve ser executado inteiro sem check-in do Duhzao.** Cada fase abaixo é grande o suficiente pra merecer confirmação antes de começar — o histórico deste projeto mostra que documentos desse tamanho sempre passaram por uma rodada de "o que vale a pena pro uso solo" antes de virar código.

---

## FASE 1 — Conteúdo (evolui o Calendário de Conteúdo atual)

### TAREFA 01 — Entidade Conteúdo + vínculo com Tarefa
- **Objetivo**: criar a entidade `Conteudo`, com pipeline de status próprio, sem quebrar o Calendário de Conteúdo atual (que hoje é só uma view sobre Tarefa)
- **Banco**: novo model `Conteudo` (cliente, título, campanha, formato, objetivo, pilar, redes[], orgânico/anúncio, briefing, roteiro, legenda, CTA, referências, link de arquivos, datas de captação/edição/aprovação/publicação, status, URL publicada). `Tarefa` ganha `conteudoId String?` opcional (uma tarefa pode pertencer a um conteúdo, sem obrigar)
- **Páginas afetadas**: novo `/dashboard/conteudo` (lista + pipeline), aba dentro do cliente, o Calendário de Conteúdo atual passa a mostrar Conteúdo em vez de Tarefa solta (tarefas continuam existindo soltas quando não vinculadas)
- **Reaproveita**: `CalendarioTarefas`/`AgendaGrid` (padrão de grade+popup), `DatePicker`, `TarefaRow` (pra listar as tarefas vinculadas dentro do conteúdo)
- **Critério de concluído**: criar conteúdo, vincular tarefas nele, ver no calendário por data de publicação, pipeline por status funcionando, nada quebrado no que já existia

### TAREFA 02 — Visão de Captações [x]
- **Objetivo**: tela agrupando conteúdos por data de captação, pra equipe saber tudo que precisa produzir num dia
- **Páginas**: `/dashboard/conteudo/captacoes`
- **Critério**: agrupa por dia, mostra cliente + formato + o que precisa

**Concluída (v61)**: nova página agrupando por dia (e dentro do dia, por cliente), listando
cada item com ícone do formato — exatamente o exemplo do documento ("SEXTA — SKYFIT: Reel
institucional, Reel professor..."). Dias futuros aparecem primeiro, passados ficam
recolhidos embaixo. Como o campo "Data de captação" já existia no banco desde a Tarefa 01
mas não tinha onde ser preenchido na interface, também adicionei ele no modal de detalhe do
conteúdo e na criação rápida — sem isso, a Visão de Captações ficaria sempre vazia.

---

## FASE 2 — Escopo mensal
### TAREFA 03 — Escopo por cliente
- **Objetivo**: contratado x planejado x entregue, calculado a partir de Serviços Contratados + Conteúdo (nunca digitado a mão, exceto ajuste manual quando necessário)
- **Banco**: nenhuma tabela nova provavelmente — é um cálculo sobre `ServicoContratado` (quantidade contratada) + `Conteudo` (status = planejado/publicado, filtrado por mês)
- **Páginas**: aba nova ou seção na Visão Geral do cliente
- **Critério**: SkyFit mostra "8 Reels contratados, 4 publicados, 3 planejados, 1 faltando" batendo com o dado real

**Concluída (v62)**: `Servico` ganhou `formatoConteudo` opcional (liga um serviço tipo "8 Reels/mês" ao formato Reel do Conteúdo — configurável em Servicos → editar). Nova aba "Escopo" dentro do cliente, mostrando contratado/entregue/planejado/faltando por serviço vinculado, com barra de progresso (verde=entregue, azul=planejado), calculado a partir de Conteudo do mês atual — sem nenhum número digitado à mão. Se o serviço não estiver vinculado a um formato, simplesmente não aparece no Escopo (nada quebra, nada é forçado).

---

## FASE 3 — Projetos
### TAREFA 04 — Entidade Projeto
- **Objetivo**: agrupar tarefa/conteúdo/hora/despesa/cobrança sob um trabalho específico (opcional, não obrigatório)
- **Banco**: novo model `Projeto` (cliente, título, tipo, datas, status, valor vendido). `Tarefa`, `Conteudo`, `RegistroTempo`, `Despesa`, `Cobranca` ganham `projetoId String?` opcional
- **Critério**: criar projeto, vincular itens dos 5 módulos, ver rentabilidade dele (receita − despesas − custo das horas)

---

## FASE 4 — Cliente: Visão Geral, Contatos, Links
### TAREFA 05 — Aba "Visão Geral" do cliente + timeline
- **Objetivo**: central do cliente (status, mensalidade, próxima cobrança, escopo do mês, horas, rentabilidade, próxima atividade) — tudo calculado, nada duplicado
- **Critério**: abrir o cliente já mostra o que importa sem entrar em cada aba

**Concluída (v63)**: nova aba "Visão Geral" (agora a primeira aba, aberta por padrão ao
entrar no cliente) — mensalidade, próxima cobrança, contrato vigente, horas do mês,
receita/despesas/rentabilidade do mês, conteúdo publicado/planejado + itens faltando do
escopo, situação do relatório, próxima atividade, e uma linha do tempo (pagamentos,
contrato assinado, proposta aceita, conteúdo publicado) — tudo calculado a partir do que
já existia, zero campo novo digitado à mão. TAREFA 04 (Projetos) foi pulada por decisão
dele.

### TAREFA 06 — Múltiplos contatos
- **Banco**: novo model `Contato` (cliente, nome, cargo, telefone, WhatsApp, email, observações, flags: principal/financeiro/aprovação/contratos). Campo antigo de contato único do Cliente vira o "contato principal" migrado automaticamente (sem perder dado)
- **Critério**: cliente antigo continua funcionando com 1 contato; dá pra adicionar mais

**Concluída (v64)**: novo model `Contato` (aditivo), nova aba "Contatos" no cliente —
lista com nome/cargo/WhatsApp/e-mail e as flags (Principal/Financeiro/Aprovação de
conteúdo/Assina contratos). Diferente do planejado, **não migrei automaticamente** o
contato antigo (`Cliente.contatoNome`) pra um Contato novo — decidi não inventar dado
que o usuário não confirmou (o campo antigo continua sendo mostrado como "Contato do
cadastro" na mesma aba, só como referência, e edita-se onde sempre editou). Se quiser
que eu migre automaticamente, é rápido de fazer depois.

### TAREFA 07 — Links e referências do cliente
- **Banco**: novo model `LinkCliente` (cliente, tipo, url, label). Campo antigo `linkDrive` vira o primeiro link migrado
- **Critério**: gerenciador de links organizado, sem perder o Drive que já existia

**Concluída (v69)**: novo model `LinkCliente` (aditivo), aba "Links" no cliente —
12 tipos (Drive/Canva/Site/Instagram/TikTok/Meta Business/Google Ads/Linktree/
Brandbook/Fotos/Vídeos/Outro), cada um com ícone. `Cliente.linkDrive` não foi
migrado automaticamente (mesma decisão da Tarefa 06) — aparece como item de
referência na mesma aba se ainda não tiver sido adicionado à lista nova.

---

## FASE 5 — Onboarding
### TAREFA 08 — Módulo de Onboarding completo
- **Objetivo**: checklist operacional por cliente, com tempo lançado manualmente **alimentando o módulo Horas já existente** (sem duplicar), timeline, e página pública compartilhável
- **Banco**: `Onboarding` (cliente, data início, status), `ItemOnboarding` (onboarding, título, responsável, status, observação, dataConclusao). Ao marcar horas numa etapa, cria um `RegistroTempo` vinculado
- **Páginas**: dentro do cliente + `/onboarding/[token]` pública (mesmo padrão das páginas de orçamento/contrato/relatório)
- **Critério**: checklist funcional, horas aparecem em Horas normalmente, página pública mostra timeline profissional

**Concluída (v69)**: models `Onboarding` + `ItemOnboarding` (aditivos). Aba "Onboarding"
no cliente — inicia com checklist padrão de 17 itens (do documento), marca
concluído/bloqueado, define responsável (Agência/Cliente/Terceiro), lança tempo gasto
por item (cria um `RegistroTempo` de verdade, aparece no módulo Horas normalmente — zero
duplicação), adiciona item customizado. Página pública `/onboarding/[id]` com timeline
profissional (dias até a primeira publicação, checklist concluído, horas da agência,
itens aguardando com a responsabilidade indicada), linguagem neutra como pedido.

---

## FASE 6 — Financeiro (revisão de modelo)
### TAREFA 09 — Pagamentos parciais + status calculado
- **Objetivo**: permitir baixa parcial em cobrança/despesa; "Atrasado" deixa de ser campo manual e vira cálculo (vencimento < hoje E saldo > 0)
- **Banco**: novo model `Pagamento` (cobrançaId ou despesaId, valor, data, conta). Mantém `status` na Cobrança/Despesa mas ele passa a ser só pendente/pago/cancelado — atrasado é derivado na leitura
- **Impacto**: telas de Contas a Pagar/Receber e DRE precisam ler o novo cálculo de atraso — testar com cuidado, é o coração do Financeiro

**Concluída (v70)**: model `Pagamento` (aditivo, liga a Cobrança OU Despesa). Nova lib
`lib/statusFinanceiro.ts` calcula o status de verdade (pendente/parcial/pago/atrasado/
cancelado) a partir de vencimento+saldo, em vez de depender só do campo salvo — "Atrasado"
não é mais uma opção no formulário de editar cobrança (fica escondido, é calculado).
`CobrancaRow` ganhou botão "+ Baixa" pra lançar pagamento parcial, mostra "recebido Rx,
saldo Ry" quando tem baixa parcial. Contas a Receber atualizado: card "Em atraso" e aba
"Atrasadas" agora pegam qualquer pendente vencida (não só quem tinha o status antigo
"atrasado" salvo à mão), e o "Total a receber" desconta o que já foi pago parcialmente.
**Ainda falta**: mesma interface de baixa parcial no lado da Despesa (a API já existe,
`DespesaRow`/Contas a Pagar não foram atualizados ainda — deixei pra não alongar mais
essa entrega).

**Pendência fechada (v77)**: `DespesaRow` ganhou o mesmo botão "+ Baixa", saldo mostrado
na linha, status calculado (removido "Atrasado" do menu manual de edição também aqui).
Contas a Pagar atualizado igual Contas a Receber (Em atraso e aba Atrasadas calculadas
pelo saldo, Total a pagar desconta baixas parciais). Agora os dois lados do Financeiro
(Cobrança e Despesa) funcionam de forma simétrica.

### TAREFA 10 — Contas financeiras + recorrência como regra
- **Banco**: novo model `ContaFinanceira` (nome, tipo, saldo inicial). Cobrança/Despesa ganham `contaId` opcional. Recorrência (já existe pra Despesa) vira uma regra que gera ocorrências independentes editáveis uma a uma — revisar a lógica atual de "gerar cópia do mês" pra suportar isso
- **Critério**: recorrência antiga continua gerando certo; nova ocorrência pode ser editada sem afetar as outras

---

## FASE 7 — Rentabilidade
### TAREFA 11 — Custo/hora e rentabilidade por cliente/projeto
- **Banco**: `Configuracao` ganha `custoHoraPadrao`. Cálculo: receita do período − despesas diretas do cliente (já existe) − (horas × custo/hora)
- **Critério**: número bate com o "Resumo por cliente" que já existe no Financeiro, só que com o custo da hora entrando na conta

**Concluída (v71)**: `Configuracao.custoHoraPadrao` (novo campo em Configurações — "Custo
por hora"). A aba Visão Geral do cliente agora mostra 4 números no "Resultado do mês":
Receita, Despesas diretas, **Custo das horas** (horas do mês × custo/hora configurado) e
Rentabilidade já descontando tudo isso. Se o custo por hora não estiver configurado,
aparece um aviso claro (em vez de fingir que está certo com R/bin/sh). TAREFA 10 (Contas
financeiras/múltiplas contas) foi pulada — ele confirmou que usa só uma conta, não
compensa a complexidade.

---

## FASE 8 — Comercial / CRM simples
### TAREFA 12 — Pipeline de oportunidades
- **Banco**: novo model `Oportunidade` (nome, contatos, origem, serviços de interesse, valor estimado, próxima ação, data, status, motivo de perda, orçamentoId). Cliente com status "Lead" vira ponto de entrada, ganhar oportunidade pode gerar o Cliente
- **Critério**: não duplica cliente ao converter lead→cliente

**Concluída (v72)**: novo model `Oportunidade` (aditivo, existe antes de virar Cliente de
verdade). Nova tela `/dashboard/oportunidades` (menu Comercial, primeiro item) — pipeline
em colunas (Novo lead → Contato feito → Reunião → Proposta enviada → Negociação → Ganho/
Perdido), clica num card abre o detalhe editável (contato, origem, interesse, valor
estimado, próxima ação com data). Botão "Ganhou" cria o Cliente automaticamente (nome,
contato, WhatsApp, status inicial "Lead" — segue o fluxo normal de orçamento→aceite→
ativo) e liga a oportunidade a ele via `clienteId`, sem nunca duplicar (se já foi
convertida, só reaproveita o cliente que já existe). Botão "Perdeu" pede o motivo.

---

## FASE 9 — Orçamentos e Contratos
### TAREFA 13 — Snapshot do orçamento aceito + alertas de renovação de contrato
- **Objetivo**: aceitar orçamento congela os dados (não muda mais se o catálogo mudar depois); contrato ganha datas de renovação e alerta
- **Banco**: `Orcamento` aceito passa a guardar uma cópia congelada dos itens/valores (hoje já referencia `ItemOrcamento` vivo — mudar pra snapshot). `Contrato` ganha `dataInicio`, `dataFim`, `proximaRenovacao`
- **Cuidado**: é a área mais delicada de mexer sem quebrar orçamentos antigos — auditar antes

**Concluída (v73)**: `ItemOrcamento` ganhou `nomeServico`/`descricaoServico` (congelados
na hora de criar o orçamento) — a proposta pública, o contrato público e o gerador de
contrato agora usam esse nome congelado, com fallback pro catálogo ao vivo em orçamentos
antigos (nunca quebra o que já existia). `Orcamento` ganhou `dataAceite` (registrado no
momento exato do aceite). Pra renovação de contrato, **não criei campo novo** —
reaproveitei `Cliente.prazoContratoMeses` (que já existia) + a data de criação do
contrato pra calcular sozinho quando ele renova. Alerta aparece na aba Visão Geral do
cliente (se faltar 30 dias ou menos) e um resumo geral no topo da lista de Contratos,
juntando todo mundo que está perto de renovar.

---

## FASE 10 — Aprovação pública de conteúdo, Solicitações, Templates
### TAREFA 14 — Aprovação pública + Solicitações do cliente + Templates básicos
- **Objetivo**: `/aprovacao/[token]` (aprovar ou pedir alteração), model `Solicitacao` (pedido do cliente fora do escopo), templates simples de checklist reaproveitável no Onboarding/Projeto
- **Reaproveita**: padrão das páginas públicas já existentes (orçamento/contrato/relatório)

**Concluída (v74)**: `Conteudo` ganhou campos de aprovação (tokenAprovacao, datas de
envio/visualização/aprovação, quem aprovou, comentário) — botão "Enviar pra aprovação"
no modal de conteúdo gera o link público `/aprovacao/[token]`, o cliente vê o material +
legenda e clica Aprovar ou Pedir alteração (com comentário, que volta pro status
"alteração solicitada"). Novo model `Solicitacao` (aditivo) + aba "Solicitações" no
cliente — descrição, prioridade, marca se é fora do escopo ("pode precisar orçamento
extra"). Templates: em vez de um sistema genérico grande, fiz o mais valioso primeiro —
o checklist de Onboarding virou configurável em Configurações (`Configuracao.
templateOnboarding`), com o checklist do documento original como padrão se você não
mexer em nada.

---

## FASE 11 — Agenda, Dashboard, Criação rápida global
### TAREFA 15 — Agenda com camadas + Dashboard "Precisa da sua atenção" + Central de Comando expandida
- **Agenda**: Horas trabalhadas passa a ser camada desligada por padrão (toggle), sem remover a opção
- **Dashboard**: novo bloco consolidando atrasos/aprovações pendentes/escopo insuficiente/onboarding travado, ordenado por urgência
- **Central de Comando**: adiciona atalhos pra Conteúdo, Projeto, Lead — sem IA, só formulário (confirmado no documento: nada de linguagem natural)

**Concluída (v75)**: Agenda ganhou toggles de camada (pílulas clicáveis) — Cobrança,
Tarefa e Conteúdo ligados por padrão, **Horas trabalhadas desligada por padrão** (é
registro histórico, não pede atenção futura); Conteúdo com data de publicação virou uma
camada nova, com ícone próprio. Dashboard ganhou o bloco "Precisa da sua atenção" logo
no topo — tarefas atrasadas, cobranças vencidas, conteúdo aguardando aprovação, contrato
renovando, despesa sem classificação, item de onboarding bloqueado, oportunidade sem
próxima ação — só mostra o que tem número maior que zero, cada linha leva direto pra
tela certa. Central de Comando ganhou atalhos de navegação (Novo conteúdo/Registrar
horas/Nova cobrança/Nova despesa/Novo lead/Novo orçamento) — sem IA, só links diretos,
como o documento pediu explicitamente.

### TAREFA 16 — Templates de tarefas
**Concluída (v76)**: novo model `TemplateTarefas` (nome + lista de itens, aditivo).
Gerenciado em Configurações — cria/edita/exclui templates (ex: "Captação": preparar
pauta, conferir equipamento, captação, backup, seleção, edição). Dentro do modal de
Conteúdo, um seletor "Aplicar template" cria todas as tarefas do template de uma vez,
já vinculadas àquele conteúdo e cliente — sem digitar tarefa por tarefa. Com isso,
fecha a lista de 16 tarefas técnicas do plano.

---

## Resumo de bancos novos (visão geral)
`Conteudo`, `Contato`, `LinkCliente`, `Onboarding`, `ItemOnboarding`, `Pagamento`, `Oportunidade`, `Solicitacao`, `TemplateTarefas` — todos aditivos, nenhum remove campo existente. `Projeto` e `ContaFinanceira` não foram criados (Tarefas 04 e 10 puladas por decisão dele).

## O que fica fora desta rodada (por instrução explícita do documento)
Cronômetro, IA dentro do app, Portal do Cliente completo, integração bancária automática, app mobile nativo.

## O que fica em aberto pra você decidir o tamanho certo
Antes de eu seguir da Tarefa 01 em diante: dado que você trabalha sozinho, vale a pena revisar se **Contato múltiplo com flags**, **Onboarding com "responsável"/"bloqueado por"**, e **Projeto separado de Conteúdo** vão ser preenchidos de verdade no seu dia a dia, ou se viram campo vazio. Recomendo começar pela Fase 1 (Conteúdo) — é a que mais aproveita o que já construímos juntos (Calendário de Conteúdo) — e reavaliar o resto conforme usar.

---

## REMOÇÃO — Módulo Conteúdo (por decisão do Duhzao, pós-entrega)

Depois de testar, o Duhzao não gostou do formato pipeline/kanban do módulo Conteúdo
(Tarefa 01) e pediu pra remover — "não vou usar, vamos remover, deixar só a tarefa,
com calendário". Removido por completo:

- Entidade `Conteudo` e tudo que dependia dela: pipeline (`/dashboard/conteudo`),
  Visão de Captações, aprovação pública (`/aprovacao/[token]`)
- `Tarefa.conteudoId` (vínculo)
- `Servico.formatoConteudo` (usado só pro Escopo)
- Aba **Escopo** inteira dentro do cliente (dependia 100% do Conteúdo pra calcular
  contratado x entregue x planejado)
- Camada "Conteúdo" na Agenda, alerta "Conteúdo aguardando aprovação" no Dashboard
- Item "Conteúdo" no menu lateral

**O que continua**: o Calendário de conteúdo original (construído direto em cima da
Tarefa, bem antes desse módulo — `/dashboard/tarefas/calendario`) nunca dependeu da
entidade Conteúdo e continua funcionando exatamente como sempre funcionou. Templates
de tarefas, Onboarding, Contatos, Links, Solicitações, Oportunidades e o resto do
plano não foram afetados.

---

## FASE — Atualização grande (documento "Landing/Agenda/Financeiro conservador")

O Duhzao mandou um documento grande pedindo várias melhorias, mas explicitamente
conservador em algumas áreas ("não mexer", "não recriar do zero"). Essa fase entrega
a parte de menor risco e maior impacto no dia a dia — o que envolve rotas públicas
novas (Landing Page em `/`, página de links em `/link`, reestruturação pra `/app`)
ficou de fora dessa entrega e depende de confirmação antes de mexer em rotas que
afetam o domínio público.

### Entregue nesta versão

- **Logo clicável**: clicar no logo da Instaby (sidebar) sempre volta pra Visão Geral.
- **Dashboard reorganizado**: Afazeres subiu pra logo depois de Hoje/Amanhã, antes de
  onde ficava a lista "Clientes ativos". A seção "Clientes ativos" (grid de cards)
  foi removida por ser informação duplicada do card de métrica que já existe no topo
  (e do menu Clientes). Corrigido também um link quebrado: "Novo conteúdo" apontava
  pra `/dashboard/conteudo`, rota que não existe mais desde a remoção do módulo
  Conteúdo — virou "Nova tarefa".
- **Clientes agrupados**: a listagem (quando "Todos" está selecionado) agora separa
  em seções recolhíveis — Ativos, Avulsos, Leads, Inativos (nessa ordem, Inativos por
  último). Clicar no título expande/recolhe. Os filtros por status continuam existindo
  e mostram lista simples (sem agrupar) quando um status específico é escolhido.
- **Bug corrigido — "Próxima cobrança" vazio**: a causa raiz era a mesma classe de bug
  já corrigida nas despesas recorrentes — a mensalidade configurada num cliente nunca
  virava de fato uma `Cobrança` todo mês (só existia "configurada", nunca lançada).
  Criei `lib/garantirRecorrentes.ts` (unificando a lógica que já existia pras despesas
  recorrentes) com uma segunda função, `garantirCobrancasMensaisDoMes()`, que lança uma
  Cobrança "pendente" pro mês atual pra todo cliente ativo com mensalidade > 0, caso
  ainda não exista uma. Roda no layout do dashboard (cobre qualquer página, não só o
  Financeiro), com um cache em memória de 10 minutos pra não pesar a navegação.
- **Contrato — anexar PDF assinado**: além do fluxo que já existia (gerar texto do
  contrato a partir de serviços/orçamento, editar, marcar enviado/assinado na mão),
  agora dá pra anexar o PDF do contrato assinado de verdade (upload via Vercel Blob,
  mesmo mecanismo já usado pro logo do cliente). Anexar marca o contrato como
  assinado automaticamente. Campo novo `Contrato.arquivoUrl` (aditivo).
- **Resultado do mês do cliente**: a Rentabilidade virou o número de destaque
  (maior, no topo do card), sem alterar nenhum cálculo existente — só reorganização
  visual, exatamente como pedido ("não alterar os cálculos sem verificar a lógica").
- **Ajuda contextual**: criado `components/ui/AjudaContextual.tsx` — ícone de "?" que
  abre um popover curto (pra que serve, como usar, exemplo). Adicionado em Clientes,
  Tarefas, Serviços (catálogo), Horas, Financeiro, Agenda, Relatórios (dentro do
  cliente) e Solicitações (dentro do cliente). Não mexi em Oportunidades/Pipeline
  porque isso é Comercial, e a regra explícita foi não mexer no Comercial nessa etapa.
- **Financeiro — gráficos de linha removidos**: tirei os dois gráficos de área/linha
  da Visão Geral do Financeiro ("Progresso do mês" e "Entradas x Custos fixos x Custos
  flexíveis") como pedido. Os dados que eles mostravam continuam disponíveis: o
  histórico mensal pelos cards de resumo por período, e o dia-a-dia pelo novo
  calendário financeiro.
- **Financeiro — calendário financeiro (novo)**: `CalendarioFinanceiro.tsx` mostra o
  mês atual com entradas/saídas por dia (baseado em cobranças pagas e despesas não
  canceladas já cadastradas), clicando no dia abre o detalhe de cada movimentação.
  Nenhum cálculo dos cards (Entradas/Custos/Flexíveis/Lucro) foi alterado.
- **Agenda reformulada**:
  - Removida a camada de cobranças vencendo (informação financeira não aparece mais
    na Agenda — fica só no Financeiro, como pedido).
  - Tarefas e horas trabalhadas agora são classificadas num tipo comum (Captação,
    Edição, Reunião, Trabalho interno, Compromisso) via `lib/tipoAtividadeAgenda.ts` —
    isso resolve o problema relatado de "captação aparece, edição não": antes a
    camada "hora" vinha desligada por padrão; agora todos os tipos vêm ligados por
    padrão e horas de edição aparecem igual às de captação.
  - Filtros por tipo de atividade substituem os antigos filtros de "camada".
  - Clicar no dia abre um modal com todas as atividades daquele dia (por horário);
    clicar numa atividade abre o detalhe/edição de sempre.
  - Preparado pra futura integração com Google/Apple Calendar — o `.ics` já existente
    (`/api/agenda.ics`) não foi alterado, continua servindo esse propósito.
- **Horas — calendário com até 3 atividades por dia**: cada dia mostra até 3 linhas
  tipo "Cliente – Atividade" (nome do cliente com a cor dele, em negrito), e
  "+N atividades" quando tem mais — clicar no dia continua mostrando todas. O nome do
  cliente também ganhou mais destaque visual (cor do cliente) na lista de registros
  do dia (não só no calendário).

### Ficou de fora desta versão (por decisão consciente)

- Landing Page pública (`/`), página de links (`/link`), reestruturação de rotas pra
  `/app`/`/painel` — o documento pede isso, mas mexe em rotas públicas e no domínio;
  prefiro confirmar com você antes de tocar nisso, já que é maior e mais visível.
- DRE, Contas a Pagar, Contas a Receber, Comercial (Oportunidades/Pipeline) — o
  próprio documento pediu explicitamente pra não alterar essas áreas nessa etapa.
- Importação de relatórios de outras plataformas — arquitetura atual (RelatorioPeriodo
  por rede/período) já não impede isso no futuro; nenhuma integração foi implementada
  sem credenciais/definição de quais plataformas, como pedido.
- Resumo mensal do cliente — já existe (aba Visão Geral do cliente mostra o resumo do
  mês corrente); não criei uma seção nova separada pra não duplicar.

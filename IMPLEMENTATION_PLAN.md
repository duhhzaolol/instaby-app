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

### TAREFA 06 — Múltiplos contatos
- **Banco**: novo model `Contato` (cliente, nome, cargo, telefone, WhatsApp, email, observações, flags: principal/financeiro/aprovação/contratos). Campo antigo de contato único do Cliente vira o "contato principal" migrado automaticamente (sem perder dado)
- **Critério**: cliente antigo continua funcionando com 1 contato; dá pra adicionar mais

### TAREFA 07 — Links e referências do cliente
- **Banco**: novo model `LinkCliente` (cliente, tipo, url, label). Campo antigo `linkDrive` vira o primeiro link migrado
- **Critério**: gerenciador de links organizado, sem perder o Drive que já existia

---

## FASE 5 — Onboarding
### TAREFA 08 — Módulo de Onboarding completo
- **Objetivo**: checklist operacional por cliente, com tempo lançado manualmente **alimentando o módulo Horas já existente** (sem duplicar), timeline, e página pública compartilhável
- **Banco**: `Onboarding` (cliente, data início, status), `ItemOnboarding` (onboarding, título, responsável, status, observação, dataConclusao). Ao marcar horas numa etapa, cria um `RegistroTempo` vinculado
- **Páginas**: dentro do cliente + `/onboarding/[token]` pública (mesmo padrão das páginas de orçamento/contrato/relatório)
- **Critério**: checklist funcional, horas aparecem em Horas normalmente, página pública mostra timeline profissional

---

## FASE 6 — Financeiro (revisão de modelo)
### TAREFA 09 — Pagamentos parciais + status calculado
- **Objetivo**: permitir baixa parcial em cobrança/despesa; "Atrasado" deixa de ser campo manual e vira cálculo (vencimento < hoje E saldo > 0)
- **Banco**: novo model `Pagamento` (cobrançaId ou despesaId, valor, data, conta). Mantém `status` na Cobrança/Despesa mas ele passa a ser só pendente/pago/cancelado — atrasado é derivado na leitura
- **Impacto**: telas de Contas a Pagar/Receber e DRE precisam ler o novo cálculo de atraso — testar com cuidado, é o coração do Financeiro

### TAREFA 10 — Contas financeiras + recorrência como regra
- **Banco**: novo model `ContaFinanceira` (nome, tipo, saldo inicial). Cobrança/Despesa ganham `contaId` opcional. Recorrência (já existe pra Despesa) vira uma regra que gera ocorrências independentes editáveis uma a uma — revisar a lógica atual de "gerar cópia do mês" pra suportar isso
- **Critério**: recorrência antiga continua gerando certo; nova ocorrência pode ser editada sem afetar as outras

---

## FASE 7 — Rentabilidade
### TAREFA 11 — Custo/hora e rentabilidade por cliente/projeto
- **Banco**: `Configuracao` ganha `custoHoraPadrao`. Cálculo: receita do período − despesas diretas do cliente (já existe) − (horas × custo/hora)
- **Critério**: número bate com o "Resumo por cliente" que já existe no Financeiro, só que com o custo da hora entrando na conta

---

## FASE 8 — Comercial / CRM simples
### TAREFA 12 — Pipeline de oportunidades
- **Banco**: novo model `Oportunidade` (nome, contatos, origem, serviços de interesse, valor estimado, próxima ação, data, status, motivo de perda, orçamentoId). Cliente com status "Lead" vira ponto de entrada, ganhar oportunidade pode gerar o Cliente
- **Critério**: não duplica cliente ao converter lead→cliente

---

## FASE 9 — Orçamentos e Contratos
### TAREFA 13 — Snapshot do orçamento aceito + alertas de renovação de contrato
- **Objetivo**: aceitar orçamento congela os dados (não muda mais se o catálogo mudar depois); contrato ganha datas de renovação e alerta
- **Banco**: `Orcamento` aceito passa a guardar uma cópia congelada dos itens/valores (hoje já referencia `ItemOrcamento` vivo — mudar pra snapshot). `Contrato` ganha `dataInicio`, `dataFim`, `proximaRenovacao`
- **Cuidado**: é a área mais delicada de mexer sem quebrar orçamentos antigos — auditar antes

---

## FASE 10 — Aprovação pública de conteúdo, Solicitações, Templates
### TAREFA 14 — Aprovação pública + Solicitações do cliente + Templates básicos
- **Objetivo**: `/aprovacao/[token]` (aprovar ou pedir alteração), model `Solicitacao` (pedido do cliente fora do escopo), templates simples de checklist reaproveitável no Onboarding/Projeto
- **Reaproveita**: padrão das páginas públicas já existentes (orçamento/contrato/relatório)

---

## FASE 11 — Agenda, Dashboard, Criação rápida global
### TAREFA 15 — Agenda com camadas + Dashboard "Precisa da sua atenção" + Central de Comando expandida
- **Agenda**: Horas trabalhadas passa a ser camada desligada por padrão (toggle), sem remover a opção
- **Dashboard**: novo bloco consolidando atrasos/aprovações pendentes/escopo insuficiente/onboarding travado, ordenado por urgência
- **Central de Comando**: adiciona atalhos pra Conteúdo, Projeto, Lead — sem IA, só formulário (confirmado no documento: nada de linguagem natural)

---

## Resumo de bancos novos (visão geral)
`Conteudo`, `Projeto`, `Contato`, `LinkCliente`, `Onboarding`, `ItemOnboarding`, `Pagamento`, `ContaFinanceira`, `Oportunidade`, `Solicitacao`, `Template` — todos aditivos, nenhum remove campo existente.

## O que fica fora desta rodada (por instrução explícita do documento)
Cronômetro, IA dentro do app, Portal do Cliente completo, integração bancária automática, app mobile nativo.

## O que fica em aberto pra você decidir o tamanho certo
Antes de eu seguir da Tarefa 01 em diante: dado que você trabalha sozinho, vale a pena revisar se **Contato múltiplo com flags**, **Onboarding com "responsável"/"bloqueado por"**, e **Projeto separado de Conteúdo** vão ser preenchidos de verdade no seu dia a dia, ou se viram campo vazio. Recomendo começar pela Fase 1 (Conteúdo) — é a que mais aproveita o que já construímos juntos (Calendário de Conteúdo) — e reavaliar o resto conforme usar.

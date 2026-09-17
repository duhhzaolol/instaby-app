# Instaby App — Auditoria Final (evolução pra sistema operacional da agência)

Documento de fechamento, pedido no plano original de 10/09/2026. Cobre da v60 até a v76.

---

## IMPLEMENTADO

**Conteúdo** — entidade própria (não é mais só uma view sobre Tarefa), pipeline de 10 status, vínculo opcional com Tarefa, Visão de Captações agrupada por dia, aprovação pública com link (`/aprovacao/[token]`).

**Escopo mensal** — serviço contratado liga a um formato de Conteúdo, aba "Escopo" no cliente calcula contratado x entregue x planejado x faltando sozinha.

**Cliente — Visão Geral** — nova aba, primeira a abrir, central de tudo: mensalidade, próxima cobrança, contrato, horas do mês, receita/despesas/custo de horas/rentabilidade, conteúdo do mês, situação do relatório, próxima atividade, linha do tempo.

**Múltiplos contatos** — aba "Contatos" no cliente, com flags de responsabilidade (Principal/Financeiro/Aprovação de conteúdo/Assina contratos).

**Links e referências** — aba "Links" no cliente, 12 tipos com ícone.

**Onboarding** — checklist configurável, marca bloqueado com responsável, lança tempo (vira `RegistroTempo` de verdade), página pública compartilhável com timeline.

**Financeiro — pagamentos parciais** — baixa parcial em cobrança, status "Atrasado" calculado sozinho (vencimento + saldo), nunca mais escolhido à mão.

**Rentabilidade** — custo por hora configurável, Visão Geral do cliente desconta o custo das horas trabalhadas do resultado.

**Comercial/CRM** — pipeline de oportunidades (Novo lead → Ganho/Perdido), "Ganhou" cria o Cliente automaticamente sem duplicar.

**Orçamentos/Contratos** — nome e descrição do serviço congelados no momento da proposta (editar catálogo depois não muda propostas antigas), renovação de contrato calculada e avisada.

**Solicitações do cliente** — registra pedidos fora do fluxo normal, marca se é fora do escopo.

**Templates** — checklist de Onboarding configurável; Templates de tarefas reaplicáveis (ex: "Captação"), aplica tudo de uma vez num conteúdo/cliente.

**Agenda** — camadas ligáveis/desligáveis (Cobrança, Tarefa, Conteúdo, Horas), Horas desligada por padrão.

**Dashboard** — bloco "Precisa da sua atenção" (7 tipos de alerta, só mostra o que tem algo pendente); Central de Comando ganhou atalhos de navegação pros módulos novos (sem IA).

---

## ALTERAÇÕES DE BANCO

**Modelos novos** (todos aditivos): `Conteudo`, `Contato`, `LinkCliente`, `Onboarding`, `ItemOnboarding`, `Pagamento`, `Oportunidade`, `Solicitacao`, `TemplateTarefas`.

**Campos novos em modelos existentes**: `Tarefa.conteudoId`; `Servico.formatoConteudo`; `ItemOrcamento.nomeServico`/`descricaoServico`; `Orcamento.dataAceite`; `Cobranca.pagamentos`/`Despesa.pagamentos` (relação); `Configuracao.custoHoraPadrao`/`templateOnboarding`; `Cliente.conteudos`/`contatos`/`links`/`onboarding`/`solicitacoes` (relações).

**Nada foi removido ou renomeado.** Nenhum dado antigo foi migrado à força — onde fazia sentido (contato único, link do Drive), o campo antigo continua existindo e visível como referência.

---

## ROTAS NOVAS

`/dashboard/conteudo` (+ `/calendario`, `/captacoes`), `/dashboard/oportunidades`, `/onboarding/[id]`, `/aprovacao/[token]` — além de ~25 rotas de API novas (conteúdos, onboarding, contatos, links, solicitações, templates, pagamentos, oportunidades).

---

## FUNCIONALIDADES ALTERADAS

- Cliente abre na aba **Visão Geral** por padrão (antes era Tarefas)
- Status "Atrasado" de cobrança não é mais escolhido manualmente — é calculado
- Agenda não mostra mais Horas por padrão
- Proposta pública e contrato gerado usam nome/descrição **congelados** do serviço, não mais ao vivo do catálogo

---

## FUNCIONALIDADES NÃO IMPLEMENTADAS (conscientemente)

- **Projeto** (entidade separada de Conteúdo) — pulada por decisão do Duhzao, uso solo não justificava a complexidade
- **Contas financeiras múltiplas / cartão de crédito** — pulada, ele usa só uma conta
- **Centro de custo** — não avaliado como necessário nesta rodada
- Baixa parcial no lado de **Despesa** (Contas a Pagar) — API pronta, interface não

---

## PRÓXIMA VERSÃO (sugestões, não implementadas)

- Portal do Cliente completo
- Integrações reais (Meta, Google Calendar/Drive automático, WhatsApp)
- Automações mais avançadas
- Interface de baixa parcial em Despesa (citado acima)
- Permissões multi-usuário (hoje é login único)
- App mobile nativo

**Confirmado explicitamente fora de escopo** (por instrução do documento original, não esquecimento): cronômetro de horas, IA dentro do app, chat com IA, criação automática de conteúdo por IA, comandos em linguagem natural.

---

## ATUALIZAÇÃO — 17/09/2026 (pós documento "Landing/Agenda/Financeiro conservador")

Desde a auditoria acima (fechamento do documento de 10/09), o módulo Conteúdo foi
removido por completo (decisão do Duhzao — não gostou do formato pipeline/kanban) e
um novo documento grande trouxe mais uma rodada de mudanças, entregues em duas fases:

**Fase 1 (painel)**: bug de "Próxima cobrança" vazia corrigido (mensalidade configurada
não virava Cobrança de verdade todo mês); Clientes agrupados por status; Contrato
ganhou anexo de PDF assinado (`Contrato.arquivoUrl`, Vercel Blob); ajuda contextual
(ícone "?") em Clientes/Tarefas/Serviços/Horas/Financeiro/Agenda/Relatórios/
Solicitações; Financeiro perdeu 2 gráficos de linha e ganhou calendário financeiro;
Agenda reformulada (sem info financeira, tarefas+horas classificadas por tipo,
filtros, clique no dia); Horas com calendário de até 3 atividades por dia.

**Fase 2 (rotas públicas)**: `/` virou Landing Page pública de verdade (antes
redirecionava pra `/login`); `/link` — página de links estilo Linktree; `/app` —
atalho que redireciona pro painel real em `/dashboard` (nada duplicado).

**Confirmado explicitamente fora de escopo nessa rodada** (por instrução do próprio
documento, não esquecimento): DRE, Contas a Pagar, Contas a Receber e Comercial
(Oportunidades/Pipeline) — nenhum mudou. Nenhum cálculo financeiro existente foi
alterado, só reorganização visual.

**Novidade no banco** (aditiva): `Contrato.arquivoUrl` (link do PDF assinado).

**Limitação de ambiente que se repete**: não foi possível rodar `npx prisma generate`,
`prisma validate` ou `next build` de verdade nesse sandbox (sem acesso de rede ao
binário do Prisma) — toda verificação dessa rodada foi revisão manual, linha por
linha, dos arquivos alterados, mais checagem de referências órfãs (grep) nos itens
removidos (gráficos, camada financeira da Agenda, etc). O build de verdade acontece
no Vercel, como já é seu fluxo.

---

## v95 — Financeiro: DRE, Fluxo de Caixa e Patrimônio separados

A DRE já estava conceitualmente correta (investimentos já não entravam no lucro
operacional) — não precisou de correção, só de melhor apresentação (resumo
"lucro operacional − investimentos = geração de caixa", aviso de sem classificação
virou link). Entregue: model + página de Patrimônio (bens/ativos da empresa, com
opção de nascer automaticamente ao lançar uma despesa como Investimento/Ativo),
página de Fluxo de Caixa (entradas/saídas efetivamente pagas, separada da DRE),
4 novos cards na Visão Geral do Financeiro (Saldo atual, Resultado do mês, Variação
de caixa, Patrimônio) e filtros de categoria/período em Contas a Pagar. Nenhum
cálculo existente da DRE foi alterado — só itens novos e cross-links.

Revisão manual (sem acesso de rede ao binário do Prisma nesse sandbox): confirmado
que os novos arquivos importam apenas exports que existem, e que nenhuma página
existente ficou com referência quebrada.

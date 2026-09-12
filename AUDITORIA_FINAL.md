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

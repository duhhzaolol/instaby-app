# Instaby App

Painel interno da Instaby Agência — v41.

## O que entrou nesta versão

**Edição rápida direto na Agenda** — clicar em qualquer item do
calendário (tarefa, cobrança ou hora trabalhada) agora abre um popup
pequeno pra corrigir data e horário na hora, sem sair da tela. Tem
também um botão de excluir, e um link "Ver detalhes completos" pra quem
quiser ver tudo (descrição, status, etc.) na tela de origem.

- **Tarefa**: edita data e horário (horário é opcional)
- **Cobrança**: edita a data de vencimento
- **Hora trabalhada**: edita data, início e fim

## Bônus: corrigido mais um caso do bug de fuso horário

Enquanto mexia nisso, achei e corrigi o ponto que eu tinha avisado como
"não confirmado" na entrega anterior: perto da meia-noite, um evento
podia cair no dia seguinte por engano na Agenda (o cálculo de "que dia é
esse horário" não considerava o fuso de Brasília). Agora considera —
tanto pra mostrar quanto pra editar.

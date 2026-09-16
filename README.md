# Instaby App — v91

## Calendário de horas — clicar no dia mostra tudo, editável

### O que mudou
Clicar em qualquer dia do calendário de Horas (que tenha algo registrado) abre um
popup com a lista completa daquele dia: o que foi feito, pra qual cliente, horário de
início e fim de cada atividade — na ordem que aconteceram.

Exatamente pro caso que você descreveu: esqueceu de marcar um trabalho e precisa ver
a que horas terminou a tarefa anterior antes de lançar a nova — agora é só clicar no
dia e já vê tudo, sem precisar adivinhar ou rolar lista solta.

O popup usa o mesmo cartão de edição que já existia (lápis pra editar, lixeira pra
excluir) — então também dá pra corrigir algo ali mesmo, sem sair do popup.

Dias sem nada registrado não abrem popup (não tem o que mostrar).

## Arquivos novos
- `components/dashboard/CalendarioHoras.tsx`

## Arquivo alterado
- `app/dashboard/horas/page.tsx`

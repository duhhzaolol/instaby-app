# Instaby App

Painel interno da Instaby Agência — v40 (correção de fuso horário).

## O bug

O servidor onde o app roda (Vercel) usa o horário de Greenwich (UTC) por
padrão. Quando você digitava um horário tipo "05:00", o app mandava só o
número puro pro servidor — e o servidor entendia como "05:00 em
Greenwich", que, na volta pro horário de Brasília (3 horas atrás), virava
"02:00". Por isso os horários apareciam sempre 3 horas adiantados do que
você digitou.

## A correção

Em todo lugar que registra horário (Registrar horas, editar um registro
de horas, e concluir uma tarefa com horário de início/fim), o app agora
já avisa explicitamente pro servidor "esse horário é de Brasília" — então
ele grava certo, na hora certa, sem depender de qual fuso o servidor está
rodando.

## Um ponto que fiquei de olho, mas não mexi ainda

Esse mesmo tipo de problema, em teoria, pode também afetar campos que só
têm **data** (sem hora) — tipo vencimento de cobrança, data de despesa,
ou o prazo de uma tarefa quando você não marca o horário. Nesses casos o
risco é mostrar o dia errado (um dia antes), não a hora errada. Não
apareceu isso na sua mensagem, mas se você notar alguma data de cobrança
ou despesa aparecendo um dia antes do que devia, me avisa que eu resolvo
isso também — é a mesma causa, só que numa parte diferente do app.

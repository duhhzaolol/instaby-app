# Instaby App

Painel interno da Instaby Agência — v38 (correção do feed de calendário).

## O bug de verdade

Não era demora de atualização — o link do calendário nunca incluiu as
**horas trabalhadas**. Ele só levava tarefas com prazo e cobranças com
vencimento. Por isso só aparecia a tarefa "Criar arte" (que tinha prazo
marcado) e nada das horas, mesmo elas já aparecendo certinho na Agenda de
dentro do app.

## A correção

O mesmo link de sempre agora também manda os registros de Horas
(qualquer um que já tenha horário de fim marcado), com o nome da
atividade e do cliente. **Não precisa trocar o link nem assinar de
novo** — é a mesma URL, só que agora com mais informação dentro dela. Na
próxima vez que o Calendário da Apple for buscar atualização (pode
adiantar isso removendo e assinando de novo com o mesmo link, como te
expliquei antes), as horas já devem aparecer.

# Instaby App — v90

## 1. Calendário geral de horas, com filtro por cliente sem trocar de tela

A tela principal de Horas (`/dashboard/horas`) ganhou um **calendário do mês**, logo
acima do que já existia — mostra o total de horas de cada dia. Por padrão mostra tudo
misturado (todos os clientes).

Clica no nome de um cliente (pílulas logo acima do calendário, ou nos cards de
ranking) e o **mesmo calendário** já filtra só pra ele — sem navegar pra outra URL,
sem sair da tela. Clica em "Todos" pra voltar à visão geral.

## 2. Data com calendário, em vez de digitar
No formulário "Registrar horas", o campo Data agora abre o mesmo mini-calendário que
já usamos em outras partes do app — clica e escolhe o dia, sem digitar manualmente.

## 3. Horário com seletor, e atalho "agora" nos dois
Criei um seletor de horário (`TimePicker`) — abre uma listinha de horas e minutos pra
escolher, em vez do relógio nativo do navegador. E adicionei um botãozinho **"agora"**
tanto no Início quanto no Fim — clica e já preenche com o horário atual (antes só o
Fim vinha assim por padrão; agora os dois têm esse atalho disponível quando quiser).

## Arquivos novos
- `components/ui/TimePicker.tsx`

## Arquivos alterados
- `app/dashboard/horas/page.tsx` (calendário + filtro inline)
- `components/dashboard/NovoRegistroTempoForm.tsx` (DatePicker + TimePicker + atalho "agora")

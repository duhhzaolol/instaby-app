# Instaby App

Painel interno da Instaby Agência — v54.

## O que entrou nesta versão

### 1. Horas geral — navegação por mês
A tela de Horas (menu lateral) sempre mostrava só o mês atual, sem jeito
de voltar. Agora tem as setinhas ao lado do nome do mês, igual a Agenda —
navega pra trás e pra frente livremente. A seção "Hoje" só aparece
quando você está vendo o mês atual (não faz sentido num mês passado).

### 2. Aba Horas do cliente — trocada a bagunça por um calendário
Aquela lista enorme e desorganizada de registros dentro do cliente saiu
de cena. No lugar: um resumo do total do mês + um botão "Ver calendário
de horas", que leva pro calendário que já existia (construído faz tempo,
com dias marcados e setas de mês) — só que agora ele fica fácil de
achar, direto na aba.

## Onde ficou tudo isso
- `/dashboard/horas` — navegação por mês nova
- Dentro do cliente → aba Horas → botão "Ver calendário de horas" leva
  pro calendário por dia, com as setas de mês

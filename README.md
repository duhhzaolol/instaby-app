# Instaby App

Painel interno da Instaby Agência — v58.

## 1. Calendário pequeno pra escolher data (estilo Apple)

Novo componente `DatePicker` — em vez do seletor nativo do navegador,
abre um calendário do mês, com setas pra trocar de mês, dia de hoje
marcado, e um botão "Hoje" pra pular direto. Troquei em todo lugar de
tarefa que tinha campo de data:

- Central de Comando (prazo da tarefa rápida)
- Painel de detalhe de qualquer tarefa (editar data)
- Popup do Calendário de conteúdo
- Formulário de nova tarefa dentro do cliente

Deixei o componente em `components/ui/DatePicker.tsx`, então dá pra
trocar em outros formulários do app (financeiro, relatórios etc.) depois
se você quiser — não mexi neles agora pra manter o escopo focado em
tarefa.

## 2. Amanhã, destacado no Dashboard

Nova seção "Amanhã" na Visão Geral, logo abaixo de "Hoje" — mesmo
formato, um pouco mais discreta (opacidade menor, sem contorno colorido
no título) pra não competir visualmente com o que é urgente de verdade
hoje. Só mostra tarefas ainda não concluídas.

Combinado com a cor de urgência que já entrou na v57, agora o prazo que
está chegando fica visível em várias camadas: a seção Amanhã no
Dashboard, e a cor mudando gradualmente em qualquer lista de tarefa.

# Instaby App

Painel interno da Instaby Agência — v31 (correção do gráfico).

## O bug

Quando o período escolhido era "Este mês" ou "Mês anterior" (só 1 mês),
o gráfico de linha ficava só com um ponto — e uma linha não dá pra
desenhar com um ponto só, por isso apareciam bolinhas soltas sem traço
nenhum, do jeito que apareceu no seu print.

## A correção

Separei as duas coisas:
- Os **cards de resumo** (Entradas, Custos fixos, Custos flexíveis,
  Lucro) continuam seguindo exatamente o período que você escolhe no
  seletor
- O **gráfico de linha** agora sempre mostra pelo menos 6 meses de
  histórico, não importa qual período esteja selecionado nos cards —
  assim sempre tem linha de verdade pra ver a tendência

Adicionei uma notinha embaixo do título do gráfico deixando isso claro
("Histórico dos últimos meses — os cards acima seguem o período
escolhido"), pra não confundir.

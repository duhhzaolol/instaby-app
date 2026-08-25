# Instaby App

Painel interno da Instaby Agência — v48 (correção).

## O bug

Na aba Relatórios, clicar numa rede (Instagram, TikTok, etc.) pra marcar
que a Instaby gerencia ela não fazia nada. Causa: esqueci de conectar o
campo `redesGerenciadas` na API que salva o cliente — o clique mandava a
informação certinha, mas o servidor não tinha instrução pra guardar ela.

## A correção

Um ponto só, no arquivo da API do cliente. Agora clicar na rede marca
(ou desmarca) de verdade, salva, e libera o formulário de lançar
relatório pra ela.

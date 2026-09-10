# Instaby App

Painel interno da Instaby Agência — v56.

## Calendário de conteúdo

Nova tela: `/dashboard/tarefas/calendario` — acessível pelo botão
"Calendário de conteúdo" na tela de Tarefas, e também dentro de cada
cliente (aba Tarefas → "Ver calendário de conteúdo desse cliente").

### O que ela faz
- Calendário mensal com todas as tarefas pendentes (por padrão — dá pra
  trocar pra "Mostrando todas"), cada uma na cor do cliente
- **Filtro por cliente**: pílulas no topo — clica no nome do cliente e o
  calendário mostra só o cronograma dele (exatamente o cenário de
  apresentar pro cliente separado)
- Navegação por mês com as setinhas
- Clica em qualquer item do calendário e abre um popup rápido pra mudar
  data, trocar status, marcar como feito, ou excluir — sem sair da tela

### Como cadastrar o cronograma
Não criei nada novo de cadastro — reaproveitei o formulário de tarefa
que já existe (dentro do cliente, aba Tarefas → "+ Nova tarefa" ou pela
Central de Comando no Dashboard). Pra cada linha do seu cronograma:

- **Conteúdo** → Título da tarefa
- **Formato** → Categoria (Arte = arte/carrossel, Reel = reels, Campanha
  = quando tiver tráfego pago envolvido)
- **Objetivo** → Descrição
- **Data sugerida** → Prazo

Cadastra um por um, e eles já aparecem certinho no calendário — sem
precisar de nenhuma tela nova de cadastro.

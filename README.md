# Instaby App — v66

## Loading discreto em todo o painel (não só no + / -)

### A causa raiz
A tela cheia com o logo pulsando foi feita pra troca de página (ex: sair de Tarefas e
entrar em Financeiro). O problema é que o Next.js usa essa mesma tela toda vez que uma
parte da página pede pra atualizar os dados — o que acontece em praticamente TODO botão
do app (marcar tarefa como feita, editar despesa, mudar status, etc.), não só no `+`/`-`
que você reportou.

### A correção
- **Dentro do painel** (`/dashboard/**`), a tela cheia virou uma **barrinha fina no
  topo**, discreta, que aparece e some rápido — sem cobrir a tela, sem parecer que
  recarregou tudo
- A tela cheia com o logo continua existindo, só que agora reservada pra troca de
  página de verdade (saindo do painel)

### Além disso, o `+`/`-` ficou instantâneo de verdade
Na aba Serviços do cliente, clicar no `+`/`-` agora muda o número **na hora**, sem
esperar nem um pouquinho — o pedido pro servidor continua acontecendo por trás, mas a
tela já mostra o resultado antes dele terminar. Mesma coisa pra editar valor e excluir
um serviço contratado.

### Arquivos alterados
- `components/ui/BarraCarregamentoDiscreta.tsx` (novo)
- `app/dashboard/loading.tsx` (troca a tela cheia pela barra)
- `app/globals.css` (animação da barra)
- `app/dashboard/clientes/[id]/ServicosContratadosTab.tsx` e
  `components/dashboard/ServicoContratadoRow.tsx` (atualização instantânea)

### O que não mudou
`app/loading.tsx` (fora do painel) continua com a tela cheia — é só pra quando você
realmente troca de página, onde faz sentido esperar um pouco.

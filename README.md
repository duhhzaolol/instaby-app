# Instaby App

Painel interno da Instaby Agência — v33.

## Novidade: sincronizar com Google Agenda e Calendário da Apple

Adicionei um "feed de calendário" (arquivo .ics) que junta os prazos de
tarefa e os vencimentos de cobrança do Instaby, no formato que qualquer
app de calendário entende.

### Como ativar

1. Adiciona a variável de ambiente `AGENDA_SECRET` no Vercel (Settings →
   Environment Variables) — pode ser qualquer texto aleatório, só seu.
   Redeploy depois de adicionar.
2. Entra em `/dashboard/agenda` — vai aparecer um card com o link pronto
   (já monta a URL certa com o secret dentro)
3. Copia esse link

### No Google Agenda (computador)
Configurações → Adicionar calendário → **A partir de URL** → cola o link
→ Adicionar calendário.

### No Calendário da Apple (Mac)
Arquivo → **Nova assinatura de calendário** → cola o link → Assinar.

### No iPhone
Ajustes → Calendário → Contas → Adicionar Conta → Outra → **Adicionar
Calendário Assinado** → cola o link.

## Como funciona (e o que não faz)

- É **de leitura** — o Google/Apple não escrevem de volta no Instaby, só
  mostram o que já está lá
- Atualiza sozinho, mas não é instantâneo — cada app de calendário decide
  de quanto em quanto tempo ele revisita o link (geralmente a cada
  algumas horas, não dá pra configurar isso)
- Se quiser sincronização de verdade nos dois sentidos (criar evento no
  Google e aparecer no Instaby), isso é um projeto bem maior — precisa de
  autenticação OAuth com o Google, e o Calendário da Apple não tem um
  caminho parecido fácil. Não fiz isso porque o custo não compensa o
  ganho pro seu uso (você sozinho, controlando tudo pelo Instaby mesmo)

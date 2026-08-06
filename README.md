# Instaby App

Painel interno da Instaby Agência — v8.

## O que entrou nesta versão

- **Catálogo de serviços populado de uma vez**: rota `/api/seed-servicos`
  (mesmo padrão do `/api/setup`) que adiciona os 14 serviços específicos que
  você definiu, já organizados nas categorias certas (📱 Social Media, 🎥
  Produção de Conteúdo, 🎯 Tráfego Pago, 📊 Relatórios, 🛠️ Ferramentas).
  Pode rodar de novo sem duplicar — ela pula os que já existem pelo nome.

  Acesse uma vez, trocando pelo seu `SETUP_SECRET`:
  ```
  https://SEU-DOMINIO/api/seed-servicos?secret=SEU_SETUP_SECRET
  ```

- **Pacotes** (`/dashboard/pacotes`): combine vários serviços do catálogo
  num pacote com nome (ex: "Plano Crescimento"). Cadastre uma vez.
- **Aplicar pacote no orçamento**: dentro do construtor de orçamento, se
  houver pacotes cadastrados, aparece um atalho no topo — clicar nele já
  marca todas as pílulas daquele pacote de uma vez, com as quantidades
  certas. Você ainda pode ajustar item por item depois.

## Como você pode expandir o catálogo depois

A lista de serviços que você mandou (Desenvolvimento Web, Design, Captação,
etc.) cabe toda no mesmo catálogo — é só ir cadastrando em
`/dashboard/servicos/novo` conforme for oferecendo. As categorias não são
fixas: qualquer texto que você digitar no campo Categoria vira uma seção
nova automaticamente.

## Ideia registrada pra mais pra frente (ainda não construída)

Usar os itens do orçamento pra gerar tarefas automaticamente e acompanhar
se cada entrega do mês foi cumprida (ex: orçamento tem "Reels 8/mês" →
o sistema cria/acompanha 8 tarefas de reel naquele mês). Isso conecta com a
ideia de "conteúdos" que você mencionou — se for isso, me confirma que eu
desenho certo.

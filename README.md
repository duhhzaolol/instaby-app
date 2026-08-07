# Instaby App

Painel interno da Instaby Agência — v19.

## O que entrou nesta versão

### 1. Botão "Novo orçamento" de volta (dessa vez em mais lugares)

- Lista global de Orçamentos ganhou o botão direto na tela (igual Pacotes
  já tinha)
- Esse botão leva pra uma tela de "escolher o cliente" primeiro, já que
  todo orçamento pertence a um
- O botão do header também aponta pra essa tela quando você está em
  `/dashboard/orcamentos`

### 2. Catálogo reorganizado — do zero

O catálogo antigo tinha o problema que você notou: "Reels" cadastrado 4
vezes (4un, 6un, 8un, avulso) em vez de um serviço só com preço por
unidade. Isso é o que já existe no seu app — o construtor de orçamento já
deixa você escolher a quantidade e multiplica pelo valor sozinho. O
catálogo não estava usando esse recurso direito.

Reescrevi a lista toda seguindo a estrutura que você descreveu — 26
serviços, organizados por categoria, cada um com a unidade certa (mês,
vídeo, hora, evento, criação, dia). Alguns pontos de como resolvi as
partes mais complicadas:

- **Serviços "escaláveis"** (edição de vídeo, captação bruta) — viram só
  1 serviço com preço por vídeo. Quando você monta o orçamento, escolhe a
  quantidade e o valor multiplica sozinho — não precisa de "tier" separado.
- **Formato muda o preço** (Reels/TikTok/YouTube) — como cada formato tem
  valor diferente, virou 3 serviços separados: "Captação e edição — Reels",
  "— TikTok", "— YouTube".
- **Taxas extras** (plataforma de agendamento, investimento em anúncios,
  deslocamento, tempo real) — viraram itens próprios do catálogo, que você
  soma junto com o serviço principal na hora de montar o orçamento/contrato
  (ex: "Gestão de Instagram" + "Taxa de plataforma" juntos).
- **Foco de campanha** (leads, remarketing, eventos, lançamentos) — deixei
  como texto dentro da descrição do serviço de tráfego pago, já que isso
  parece mais uma conversa de briefing do que um item com preço à parte.
  Se quiser cada foco com preço próprio, me avisa que separo em serviços
  distintos.

**Todos os valores entram com R$ 0** — a estrutura e os nomes eu defini,
mas o preço é seu. Depois de rodar a rota abaixo, entra em
`/dashboard/servicos` e edita cada um com o valor real.

### Como rodar a limpeza (uma vez só)

Essa rota apaga o catálogo confuso antigo e cria o novo. Serviços antigos
que já estão em uso em algum orçamento/pacote/cliente **não são apagados**
(ficam protegidos) — a resposta te avisa quais não puderam ser removidos.

```
https://SEU-DOMINIO/api/reset-catalogo?secret=SEU_SETUP_SECRET
```

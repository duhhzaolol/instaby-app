# Instaby App — v81

## Design System implementado

Você mandou o `Instaby_Design_System.zip` — um sistema de design que foi gerado
analisando o próprio código do seu app (cores, tipografia, espaçamento batem 100%
com o que já existia). Implementei da forma que faz sentido de verdade, sem reescrever
telas que já funcionam:

### 1. Tokens de verdade no CSS
Copiei os 4 arquivos de tokens (`styles/tokens-*.css` — cores, tipografia, espaçamento,
efeitos/sombra/animação) pro projeto e importei no `globals.css`. Agora o app tem
variáveis CSS formais (`--accent`, `--card`, `--space-6`, `--shadow-premium` etc)
disponíveis em qualquer lugar — antes os valores estavam só espalhados no
`tailwind.config.ts` e repetidos como hex direto pelo código.

### 2. Componentes novos, que o kit identificou como "faltando"
O Design System apontou 4 padrões que se repetem dezenas de vezes no seu código sem
nunca terem virado componente próprio. Criei eles, no mesmo estilo do resto do app
(Tailwind, não CSS inline como no kit original):

- **`IconTile`** — aquele quadradinho com fundo de cor suave (10%) e o ícone na cor
  cheia, usado em métricas, categorias, atividades
- **`StatusDot`** — o pontinho colorido (cliente, coluna de pipeline, status)
- **`TintPill`** — a pilulazinha com fundo suave (o truque `${cor}1A` que aparece em
  várias telas — categoria de despesa, badge de cliente, etc.)
- **`Select`** — um `<select>` com o mesmo visual do `Input`, pra parar de repetir
  aquela classe gigante toda vez que crio um dropdown

Esses componentes ficam disponíveis pra eu usar daqui pra frente (e você pode pedir
pra eu trocar algum trecho repetido antigo por eles, se quiser — não fiz retrofit em
tudo que já existe, pra não arriscar quebrar coisa que já funciona à toa).

### 3. Guia de referência salvo no projeto
`DESIGN_SYSTEM.md` na raiz — o guia completo de voz ("pra quem o app fala", tom,
como escrever texto de botão/estado vazio/aviso), regras visuais (cor, tipografia,
sombra, animação, ícones) que o kit documentou. Fica registrado no projeto, então
qualquer trabalho futuro (meu ou de outra IA) consulta isso pra manter consistência.

## O que eu NÃO fiz
Não recriei as telas do kit (Login, Financeiro, Oportunidades, Proposta, Relatório) —
seu app já tem elas de verdade, refazer do zero por cima seria arriscado sem ganho
nenhum. O próprio kit também não cobre boa parte do que seu app já tem hoje (Agenda,
Onboarding, Contratos, Configurações) e ainda tinha uma tela de "Aprovação" que eu
já tirei do app.

## Arquivos novos
- `styles/tokens-colors.css`, `tokens-typography.css`, `tokens-spacing.css`,
  `tokens-effects.css`
- `components/ui/IconTile.tsx`, `StatusDot.tsx`, `TintPill.tsx`
- `components/ui/Input.tsx` (ganhou o `Select`)
- `DESIGN_SYSTEM.md`

## Arquivo alterado
- `app/globals.css` (import dos tokens no topo)

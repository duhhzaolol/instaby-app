# Instaby App

Painel interno da Instaby Agência — v27.

## O que entrou nesta versão

**Tela de loading personalizada** — o obturador do logo. As duas metades
da marca (a caixa preta "INSTA" e a clara "BY") abrem como um diafragma
de câmera, revelando um número de crescimento (+128, +947, +2.3K...) no
vão a cada "clique", com um flash sutil no fechamento — juntando a
referência de câmera, o significado "instantâneo" da marca, e o gráfico
de números que você queria.

Aparece automaticamente:
- Ao navegar entre páginas do dashboard (loading do Next.js — não precisei
  adicionar em cada tela manualmente, ele intercepta sozinho enquanto os
  dados carregam)
- No carregamento inicial do app (login, orçamento público, contrato
  público)

Não precisa configurar nada — é automático, do mesmo jeito que funcionava
no app do Juninho.

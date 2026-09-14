# Instaby App — v83

## Barra lateral ganhou rolagem

### O problema
A lista de menu (Geral, Financeiro, Comercial, Configurações) crescimento muito ao
longo dessa sessão toda, e a barra lateral nunca tinha rolagem — em telas menores
(notebook, zoom mais alto no navegador), os itens de baixo simplesmente ficavam cortados
e inalcançáveis, sem nenhum jeito de chegar neles.

### A correção
O logo (topo) e o cartão com seu nome/e-mail (rodapé) continuam sempre fixos — só a
lista de navegação no meio ganhou rolagem própria. Agora, não importa quantos itens
tenham, dá pra rolar até o fim.

Vale tanto pra versão desktop quanto pro menu mobile (aquele que abre pelo ícone de
hambúrguer).

## Arquivo alterado
- `components/layout/Sidebar.tsx`

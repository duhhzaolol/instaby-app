# Instaby App

Painel interno da Instaby Agência — v18 (correção de bug).

## O bug

O botão **"Novo"** que fica sempre visível no canto superior direito do
header nunca teve nenhuma ação — ficou decorativo desde a repaginação
visual (v4). Se você clicava nele esperando criar um orçamento novo (ou
qualquer coisa), nada acontecia. O botão "+ Novo orçamento" que fica
dentro da aba Orçamentos do cliente sempre funcionou normalmente — o
problema era só esse botão do topo.

## A correção

Agora o botão do header muda de acordo com onde você está:
- Na lista de Clientes → "Novo cliente"
- Dentro de um cliente, na aba Orçamentos → "Novo orçamento"
- No catálogo de Serviços → "Novo serviço"
- Em Pacotes → "Novo pacote"
- Nas demais telas (onde não faz sentido um "novo" genérico) → o botão
  simplesmente some, em vez de ficar ali sem fazer nada

## Se ainda travar

Me manda print de exatamente onde você clicou — pode ser que exista mais
algum botão sem ação que eu não peguei nessa varredura.

# Instaby App — v88

## Financeiro revisado — Contas a Pagar/Receber agora funcionam de verdade

### 1. A causa raiz do "não mostra nada"
Achei o problema: quando o mês virava, a cópia automática de uma despesa recorrente
(tipo Aluguel) nascia com status **"Pago" por padrão**, sem querer — nunca aparecia
em Contas a Pagar porque tecnicamente "já estava paga" assim que era criada.

**Corrigido**: a partir de agora, toda despesa recorrente nasce **Pendente**, com
vencimento no mesmo dia do mês que você configurou originalmente. Assim que o mês
virar, o Aluguel (e qualquer outra recorrente) aparece em Contas a Pagar sozinho,
exatamente como você esperava.

> Nota: despesas recorrentes que já foram geradas pra esse mês atual, antes dessa
> correção, podem ter nascido como "Pago" incorretamente — se for o caso, edita elas
> uma vez e muda pra "Pendente" manualmente. Daqui pra frente, geram certo sozinhas.

### 2. Agora dá pra cadastrar direto nas duas telas
- **Contas a Pagar** → botão "Nova conta a pagar" no topo — descrição, valor,
  vencimento, categoria, cliente (opcional). Nasce sempre como Pendente.
- **Contas a Receber** → botão "Nova conta a receber" no topo — cliente (obrigatório,
  já que toda cobrança pertence a alguém), valor, vencimento, categoria, tipo. Nasce
  sempre como Pendente.

Confirmando o que você já intuiu: pra algo que **já foi pago**, continua sendo na
Visão Geral do Financeiro (ou no botão "Lançar despesa" que adicionamos no topo dela)
— lá o normal é lançar já como Pago. Contas a Pagar/Receber é pro que ainda **não**
aconteceu.

### 3. Revisão das rotas
Conferi as principais (criar/editar/excluir despesa, criar/editar/excluir cobrança,
lançar baixa parcial nos dois) — todas corretas e consistentes entre si.

## Resumo do fluxo, do jeito mais simples
- **Já pagou/recebeu** → Financeiro (Visão Geral) → "Lançar despesa" / dentro do
  cliente → "Lançar cobrança" → status Pago
- **Ainda vai pagar/receber** (aluguel do mês que vem, cartão de crédito, cliente que
  ainda não pagou) → Contas a Pagar / Contas a Receber → cadastra direto ali como
  Pendente, com a data de vencimento
- **Recorrente** (aluguel, assinatura) → marca "recorrente" uma vez na Visão Geral, e
  todo mês uma cópia pendente nasce sozinha em Contas a Pagar

## Banco
Nenhuma mudança de schema — só correção de lógica e novas telas de cadastro.

## Arquivos principais
- `app/dashboard/financeiro/page.tsx` (correção da geração recorrente)
- `components/dashboard/NovaContaPagarForm.tsx`,
  `components/dashboard/NovaContaReceberForm.tsx` (novos)
- `app/dashboard/financeiro/contas-a-pagar/page.tsx`,
  `contas-a-receber/page.tsx`

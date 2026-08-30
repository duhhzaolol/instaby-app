# Instaby App

Painel interno da Instaby Agência — v51 (Financeiro, Fase 2).

## O que mudou

### Competência separada de pagamento
Toda despesa agora tem:
- **Data de competência** (o campo "Data" de sempre, só renomeado) — o
  mês a que o gasto pertence
- **Status**: Pendente, Pago, Atrasado ou Cancelado
- **Vencimento** — aparece só quando o status é Pendente/Atrasado
- **Data de pagamento** — quando o status é Pago, e pode ser diferente da
  competência (ex: competência em agosto, mas você só pagou em setembro)

Cobranças (receitas) ganharam o mesmo tipo de campo por baixo (data de
competência e data de recebimento), e o status ganhou a opção
**Cancelado**, que faltava.

### Cancelado não conta em nada
Igual já valia pra Transferência/Retirada (Fase 1), agora despesa
**Cancelada** também some dos totais e gráficos — só fica registrada
pra você não perder o histórico de que aquilo foi lançado e depois
cancelado.

### Onde aparece
- No formulário de nova despesa: Status + (Vencimento OU Data de
  pagamento, dependendo do que você escolher)
- Ao editar qualquer despesa: os mesmos campos
- Na lista, cada despesa com status diferente de "Pago" ganha uma
  etiqueta colorida (laranja pra pendente, vermelho pra atrasado, cinza
  pra cancelado) mostrando o vencimento
- Cobranças: o formulário de edição ganhou o seletor de status completo

## O que não mudou
Nada foi apagado, nenhum lançamento antigo foi alterado — todos entram
com status "Pago" por padrão (do jeito que sempre funcionou), então nada
quebra.

## Próxima fase
Fase 3 — DRE de verdade (Receita Bruta → Custos → Lucro Bruto → Despesas
→ Lucro Operacional → Lucro Líquido, com as margens), usando a
competência que agora já está separada.

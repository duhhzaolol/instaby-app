# Instaby App — v77

## Fechando a última pendência — baixa parcial em Despesa (Contas a Pagar)

A única coisa que tinha ficado pra trás na Tarefa 09 (v70) — a API já existia, faltava
a interface. Agora fechado, simétrico com o que já tinha em Cobrança:

- `DespesaRow` ganhou o botão **"+ Baixa"** — lança um valor parcial, mostra "pago R$X,
  saldo R$Y" na linha
- "Atrasado" também não é mais escolhido manualmente na edição de despesa — calculado
  sozinho (vencimento passou + ainda tem saldo)
- **Contas a Pagar**: card "Em atraso" e aba "Atrasadas" agora identificam qualquer
  despesa pendente vencida (não só quem tinha o status antigo salvo à mão), "Total a
  pagar" desconta o que já foi pago parcialmente

Com isso, Cobrança e Despesa funcionam exatamente do mesmo jeito no Financeiro.

## Arquivos alterados
- `components/dashboard/DespesaRow.tsx`
- `app/dashboard/financeiro/page.tsx`, `contas-a-pagar/page.tsx`
- `app/dashboard/clientes/[id]/page.tsx`

## Status do projeto
As 16 tarefas do `IMPLEMENTATION_PLAN.md` + essa pendência fechada = tudo que foi
planejado no documento de 10/09 está concluído. `AUDITORIA_FINAL.md` continua valendo
como o resumo de fechamento.

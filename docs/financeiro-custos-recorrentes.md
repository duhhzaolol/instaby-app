# Financeiro — custos e recorrências (v175)

O Resumo separa **recebimentos e pagamentos reais** das **obrigações do período**.
No mês atual, as listas de custos incluem o mês completo, mesmo quando o
vencimento ainda não chegou. Cada grupo informa total previsto, já pago e saldo
a pagar; pagamentos parciais reduzem somente o saldo em aberto.

A classificação financeira escolhida prevalece sobre o antigo campo de tipo.
Uma despesa classificada como fixa pertence aos custos operacionais mesmo se
um formulário antigo gravou tipo flexível. Registros sem classificação usam o
tipo antigo como referência. Essa correção acontece na leitura, sem regravar
o histórico. Novos cadastros e alterações de classificação sincronizam o tipo.
Investimentos e retiradas ficam fora dos custos da operação e continuam no
fluxo de caixa; Patrimônio e A receber permanecem com os fluxos existentes.

**Repetir esta conta todo mês**, no cadastro ou na edição da conta original,
ativa a geração mensal. Contas já pagas podem receber essa configuração sem
novo pagamento. O dia do vencimento orienta a recorrência; sem vencimento,
usa-se o dia da competência. Quando o dia não existe no mês, vale o último dia.
Desmarcar interrompe as próximas gerações e preserva as contas já lançadas.
Uma ocorrência gerada não pode virar outro modelo, evitando recorrências em
cascata. Contas antigas não são ativadas automaticamente só pela categoria.

O próximo mês é uma previsão calculada, sem criar dívidas futuras. Se já houver
uma ocorrência vinculada, ela prevalece, com seu valor e pagamentos, inclusive
se estiver paga ou cancelada. No início do mês, o gerador cria somente a
ocorrência pendente necessária, protegido contra acessos simultâneos. Resumo,
A pagar e DRE aguardam a geração antes de consultar o mês.

Resultado financeiro abre em **Recebido e pago**, com baixas reais e suas datas.
**DRE por competência** apresenta o valor integral dos lançamentos do período,
incluindo os abertos, com aviso explícito e saldo ainda a receber/pagar. Uma
baixa de obrigação cancelada continua no caixa; o cancelamento não é estorno.

Verificações sem banco real: `node tests/financeiro.cjs`,
`node tests/recorrencias-financeiras.cjs` e
`node tests/despesas-recorrentes-api.cjs`.
Não há mudança de esquema, migração ou limpeza de registros nesta versão.

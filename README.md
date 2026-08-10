# Instaby App

Painel interno da Instaby Agência — v30.

## O que entrou nesta versão

### 1. Custos operacionais sem cliente + cobrança recorrente
O formulário de "Novo" em Custos operacionais mudou:
- Não pergunta mais cliente (faz sentido, água/aluguel não é de ninguém
  específico)
- Ganhou um checkbox **"Ativar cobrança recorrente"** — marcado, essa
  despesa aparece sozinha todo mês, sem você precisar cadastrar de novo.
  O sistema gera a cópia do mês automaticamente na primeira vez que você
  abre o Financeiro naquele mês (não precisa de nada rodando em segundo
  plano, é gerado na hora que você acessa)
- Despesas recorrentes ganham um ícone de repetição do lado do nome, pra
  você saber quais são automáticas

Os Custos flexíveis continuam exatamente como estavam (cliente opcional,
sem recorrência).

### 2. Rodapé em todas as páginas do painel
Adicionei um rodapé simples (logo pequeno + "Instaby App · painel interno
da agência") no fim de toda tela do dashboard — ajuda a preencher o
espaço em páginas mais curtas como o Financeiro, em vez do botão ficar
colado perto do topo.

## Sobre o DRE

Já te expliquei o conceito na conversa, mas resumindo aqui: Receita −
Custos fixos − Custos flexíveis = Lucro. O gráfico de linha do Financeiro
já é isso, e agora que os fixos podem ser recorrentes, o DRE dos próximos
meses vai se montando sozinho conforme o tempo passa — você só cadastra
o custo fixo uma vez.

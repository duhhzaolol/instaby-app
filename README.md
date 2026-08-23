# Instaby App

Painel interno da Instaby Agência — v42.

## As três coisas da análise do mockup

### 1. Meta do mês
Configurações → novo campo "Meta de faturamento". Configurado, aparece
um card na Visão Geral logo abaixo dos indicadores, com barra de
progresso mostrando quanto já faturou esse mês vs. a meta. Some sozinho
se você não configurar nenhuma meta.

### 2. Performance por cliente
Novo card na Visão Geral — ranking dos clientes que mais pagaram esse
mês, com barrinha proporcional (na cor de cada cliente) e o valor.
Calculado a partir das cobranças pagas reais, sem precisar cadastrar
nada novo.

### 3. Últimas atividades
Feed simples ao lado do anterior — pega os últimos pagamentos recebidos,
clientes novos, contratos gerados e propostas aceitas, e mostra em ordem
cronológica ("hoje 14:32", "ontem", ou a data). Também 100% a partir de
dado que já existe.

## Onde ficou tudo isso na tela

Visão Geral, logo depois dos 4 indicadores do topo: Meta do mês (se
configurada) → Central de Comando → Hoje → Clientes ativos →
**Performance por cliente + Últimas atividades** (lado a lado) →
Afazeres.

## Lembrando da conversa

As outras partes do mockup (pipeline comercial, insight automático,
projetos, aprovações com imagem) ficaram de fora por enquanto — ou
precisam de modelo de dados novo, ou contradizem decisões que você já
tinha tomado (tarefas sem agrupar em projeto, sem guardar arquivo no
app). Se quiser tocar em alguma dessas depois, é só puxar o assunto.

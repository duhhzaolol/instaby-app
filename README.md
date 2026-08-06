# Instaby App

Painel interno da Instaby Agência — v5.

## Sobre esta versão

Continuação da v4 (repaginação visual). Aqui entraram os dois módulos que
ainda faltavam: **Financeiro** e **Contrato**. Prisma não foi alterado — só
foram criadas novas rotas de API (necessárias pra essas features
funcionarem: despesas, marcar cobrança como paga, criar/editar contrato).

## O que entrou nesta versão

- **Financeiro** (`/dashboard/financeiro`): resumo de entradas/saídas/lucro
  dos últimos 6 meses, gráfico de barras comparando entrada x saída por mês,
  gráfico de linha do lucro, lista de cobranças pendentes com botão "marcar
  como pago", lista de despesas com formulário pra adicionar novas
- **Financeiro por cliente**: dentro do cliente, a aba Financeiro agora
  mostra as cobranças e despesas daquele cliente específico
- **Contrato**: dentro do cliente, a aba Contratos permite gerar um rascunho
  automaticamente a partir de um orçamento aceito (puxa os serviços e o
  valor), editar o texto, copiar, e avançar o status (rascunho → enviado →
  assinado)

## O que falta (próximas entregas)

- Orçamento em duas colunas (edição + preview), estilo Notion
- Seções "Nosso processo" e depoimentos na página pública do orçamento
- Lista global de Contratos (hoje só existe por cliente, como o Financeiro
  por cliente — o Orçamento já tem essa lista global em
  `/dashboard/orcamentos`)

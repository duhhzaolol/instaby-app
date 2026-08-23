# Instaby App

Painel interno da Instaby Agência — v44.

## 1. Mensalidade unificada

Removida a ambiguidade de vez:
- A **mensalidade** de um cliente agora vem **só** dos Serviços
  Contratados (soma − desconto + acréscimo). Sem exceção, sem fallback
  escondido.
- O campo antigo que aparecia ao ativar um cliente foi renomeado pra
  "Lançar uma primeira cobrança agora? (opcional)" — deixa claro que é
  só uma cobrança pontual pra começar, não define mais a mensalidade
  oficial dele. Tem um aviso explicando isso no próprio formulário.
- Cliente sem nenhum serviço cadastrado agora mostra "Sem serviços" na
  lista, em vez de puxar silenciosamente um valor antigo que podia estar
  desatualizado.

Isso evita o tipo de confusão que rolou com a Sky lá atrás — daqui pra
frente só tem um lugar de verdade pra saber quanto um cliente paga.

## 2. Refino visual — card de Insight automático

Novo card "✨ Insight Instaby" no Dashboard — compara o faturamento desse
mês com o mês anterior e mostra a frase pronta ("Seu faturamento cresceu
X% esse mês!"), no mesmo estilo do card vermelho do mockup que você
mandou. É regra simples (matemática, sem IA) — só aparece quando já tem
faturamento do mês anterior pra comparar.

## Onde ficou tudo isso

Dashboard, na mesma sequência: indicadores → Meta do mês → Central de
Comando → Hoje → Clientes ativos → **Insight** → Performance/Atividades →
Afazeres.

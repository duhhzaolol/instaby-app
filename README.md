# Instaby App

Painel interno da Instaby Agência — v22 (repaginação da proposta pública).

## O que entrou nesta versão

### Página pública do orçamento, redesenhada do zero
Baseado na referência que você mandou:
- Cabeçalho com código da proposta (#PC-2026-XXX) e "Válido até" (15 dias
  a partir da criação, automático)
- Hero com gradiente e um gráfico decorativo de performance
- Etapas do processo com barra de progresso visual
- Cada serviço ganhou um ícone colorido por categoria (Social Media =
  azul, Produção de Conteúdo = vermelho, Captação = roxo, Tráfego Pago =
  verde, Desenvolvimento Web = ciano, Eventos = âmbar) — é a paleta extra
  que você pediu, sem perder a identidade preto/vermelho
- Sidebar fixa com "Resumo do investimento" (lista + total), "Por que a
  Instaby?" (checklist) e um card de contato
- Banner final "Vamos crescer juntos?" com dois botões

### Remover item da proposta (já existia, ficou mais claro)
O botão "−" já deixava o item em 0 desde a v21 (o cliente pode "zerar" um
serviço que não quer, tipo Deslocamento) — só deixei mais visível: quando
zera, o card fica esmaecido.

### Botão extra: "Marcar uma conversa" (WhatsApp)
Junto do "Aceitar proposta", agora tem um segundo botão que abre o
WhatsApp da agência com uma mensagem pronta. Só aparece se você
cadastrar o número em Configurações.

### Logo dos seus clientes na vitrine
Em Configurações, nova seção "Logos na proposta": lista todo cliente que
tem um link de logo cadastrado, com um botão pra ativar/desativar se ele
aparece na vitrine "Empresas que confiam" no fim de toda proposta pública.
O logo aparece sempre em cinza (grayscale via CSS), mesmo que o original
seja colorido — não precisa editar a imagem.

## Antes de usar

1. Configurações → cole o WhatsApp da agência (só números, com DDI+DDD,
   ex: 5519999999999)
2. Configurações → ative os logos dos clientes que quiser na vitrine
   (precisa ter um link de logo cadastrado no cliente primeiro)

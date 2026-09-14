# Instaby App — v86 (correção)

## Ocultar valores — todos os cartões atualizam juntos agora

### O problema
Cada cartão (Mensalidade, Resultado do mês, Serviços, etc.) tinha sua própria cópia
independente do estado "oculto" — cada um só lia o navegador (localStorage) na hora
de aparecer na tela pela primeira vez. Clicar o botão de olho num lugar mudava só
aquele cartão; os outros que já estavam na tela continuavam com o valor antigo, até
você recarregar a página inteira.

Foi exatamente o que aconteceu no seu print: você clicou o olho, a Mensalidade
mostrou (porque foi ali que você clicou), mas o "Resultado do mês" continuou
escondido, porque não tinha como saber que algo mudou.

### A correção
Troquei o mecanismo por um estado de verdade compartilhado (usando
`useSyncExternalStore`, o jeito correto do React pra isso) — agora clicar o botão em
qualquer lugar da tela atualiza **todos** os cartões ao mesmo tempo, sem precisar
recarregar a página.

## Arquivo alterado
- `components/ui/OcultarValores.tsx`

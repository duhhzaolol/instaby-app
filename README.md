# Instaby App — v65

## Quantidade editável direto na linha (Serviços do cliente)

### O que mudou
Na aba Serviços do cliente, cada serviço contratado agora tem um `− quantidade +` direto
na linha — clica no `+` ou `−` e já muda na hora, sem precisar clicar no lápis pra abrir
o modo de edição.

O valor ajusta sozinho, mantendo a mesma "taxa por unidade" que já estava valendo — se
você tinha um desconto aplicado (R$ 150 em vez do R$ 200 de tabela pra 2 unidades, por
exemplo), aumentar pra 3 unidades mantém a proporção do desconto, não volta pro preço
cheio do catálogo.

O lápis continua ali, só que agora é mais pra ajustar o **valor manualmente** (aplicar
um desconto específico) — pra só mudar quantidade, não precisa mais abrir nada.

### Arquivos alterados
- `components/dashboard/ServicoContratadoRow.tsx`

Nenhuma API nova precisou ser criada — a rota de editar já aceitava quantidade e valor.

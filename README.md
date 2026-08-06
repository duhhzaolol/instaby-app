# Instaby App

Painel interno da Instaby Agência — v9.

## O que entrou nesta versão

- **Campo de valor em reais, sem erro de digitação**: todo lugar onde você
  digita um valor (serviço, mensalidade, cobrança, despesa) agora usa um
  campo com máscara — você digita os números e ele já formata como
  "1.200,00" sozinho. Não tem mais como "1.200" virar "1,20" sem querer.
- **Editar cobrança**: no Financeiro (geral e do cliente), cada cobrança
  tem um ícone de lápis — clica, corrige valor/tipo/data de vencimento,
  salva.
- **Editar despesa**: mesma coisa, ícone de lápis em cada despesa.
- **Editar serviço do catálogo**: clicar num serviço na lista agora abre a
  edição (antes só dava pra criar).
- **Editar pacote**: cada pacote tem um ícone de editar — ajusta nome,
  descrição e quais serviços fazem parte, sem precisar excluir e recriar.

## Antes de subir

Nenhuma mudança de schema além das que já existiam (Pacote/PacoteItem já
tinham entrado na v8). O build sincroniza sozinho, como sempre.

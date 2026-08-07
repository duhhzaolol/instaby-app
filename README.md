# Instaby App

Painel interno da Instaby Agência — v20 (faxina completa).

## O que aconteceu

O print mostrou que a v19 não resolveu — os serviços antigos (de várias
fases diferentes: cadastro manual, seed v8, e a tentativa v19) continuaram
lá porque muitos já tinham sido usados em orçamentos ou pacotes de teste,
e minha proteção contra exclusão bloqueava a remoção deles. Resultado:
catálogo bagunçado com duplicatas.

## A solução — rota de faxina total

Nova rota `/api/reset-catalogo-total`, bem mais agressiva: apaga **todos**
os orçamentos, pacotes e serviços contratados existentes (removendo o que
travava a exclusão), depois apaga o catálogo inteiro e recria do zero, já
limpo, com os 26 serviços na estrutura que você descreveu.

**O que ISSO apaga:** orçamentos (todos, inclusive os que já foram
aceitos), pacotes, serviços contratados de cada cliente, e o catálogo de
serviços inteiro.

**O que ISSO NÃO toca:** Cliente, Tarefa, Cobrança, Despesa, Contrato (o
texto salvo continua existindo, só perde o vínculo com o orçamento de
origem), Horas, Depoimentos.

Como você ainda está em fase de teste (vi que era um orçamento de teste
pro "Victor Coelho" no print), presumi que tudo bem apagar os
orçamentos/pacotes de teste pra sanear o catálogo. Se algum desses já era
de verdade e você precisa recuperar, me avisa antes de rodar.

### Como rodar

Por segurança, essa rota exige uma confirmação explícita na URL:

```
https://SEU-DOMINIO/api/reset-catalogo-total?secret=SEU_SETUP_SECRET&confirmar=sim
```

Se você acessar sem o `&confirmar=sim`, ela só avisa o que vai acontecer
e não apaga nada.

### Depois de rodar

Vá em `/dashboard/servicos` e preencha o valor real de cada um dos 26
serviços (todos entram com R$ 0).

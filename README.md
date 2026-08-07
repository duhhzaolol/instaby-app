# Instaby App

Painel interno da Instaby Agência — v21.

## O que entrou nesta versão

### 1. Valor final editável no construtor de orçamento
Cada item selecionado agora tem, além da quantidade, um campo de valor
editável — pode digitar o valor final que quiser, não fica preso ao
cálculo automático (quantidade × valor de tabela).

### 2. Deslocamento com cálculo automático de distância
Quando você adiciona o serviço "Deslocamento" a um orçamento, aparece uma
calculadora: digita a cidade de destino, clica em "Calcular" e ele busca
a distância rodoviária desde Araras/SP automaticamente (usando serviços
gratuitos de mapa, sem precisar de chave de API paga). O KM vem editável
(caso queira ajustar), tem um campo de "Valor por KM" (você define, já
que vai pesquisar quanto cobrar), e um checkbox de "ida e volta" que
dobra o KM. O valor final calculado já entra automaticamente no item,
mas continua editável se quiser ajustar na mão.

**Se a cidade não for encontrada** (nome mal escrito, cidade pequena
demais pro mapa gratuito reconhecer), ele avisa e você digita o KM
manualmente — nada trava.

### 3. Página pública agora é interativa — cliente ajusta quantidade
Na proposta que o cliente recebe, cada item tem botões de **+ e −** pra
ele mesmo calibrar quanto quer (ex: "quero 6 reels em vez de 4"). O total
recalcula na hora, ao vivo. Quando ele clica em "Aceitar proposta", as
quantidades e valores finais que ELE escolheu são salvos de verdade no
orçamento — a cobrança gerada automaticamente já reflete a escolha final
dele, não o que você mandou originalmente.

## Como usar o deslocamento

1. No orçamento, selecione o serviço "Deslocamento" do catálogo
2. Digita a cidade, clica em "Calcular"
3. Preenche o "Valor por KM" (pesquisa quanto cobram na sua região)
4. Confirma se é ida e volta (vem marcado por padrão)
5. O valor final já aparece no item — ajusta na mão se quiser

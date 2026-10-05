# Cronograma compartilhado do cliente

Abra **Clientes → cliente → Cronograma**. A Agenda também tem o atalho
**Compartilhar cronograma** quando um cliente está selecionado.

1. Escolha o mês. As pautas vêm das tarefas com postagem planejada nesse mês.
2. Marque as pautas que deseja apresentar. Novas tarefas começam desmarcadas.
3. Confira o título, formato e texto para o cliente. O roteiro é próprio da
   apresentação; a descrição interna pode ser consultada e copiada por escolha
   da equipe. Somente um trecho identificado como roteiro é sugerido inicialmente.
4. Abra **Prévia do cliente** e confira o conteúdo liberado.
5. Clique em **Compartilhar cronograma** e copie o link.

O cliente abre o link sem conta, informa o nome e comenta dentro de cada pauta.
A equipe lê os comentários e responde na própria aba Cronograma. Comentários
não aprovam conteúdo nem alteram o estado de produção.

Atualizar a seleção mantém o endereço. Desmarcar uma pauta esconde o conteúdo e
preserva os comentários. **Desativar link** invalida o endereço antigo; reativar
gera outro endereço. Pautas que saíram do mês ficam no histórico interno.

As datas apresentadas são propostas. A função não muda tarefas, prazos de
produção, datas de postagem, checklists ou comentários internos.

## Validação e publicação

- Schema Prisma validado e cliente Prisma gerado.
- Verificação TypeScript sem erros.
- `node tests/cronograma.cjs`: autenticação, acesso por cliente, seleção por mês,
  datas desatualizadas, revogação e limites de comentários com dados simulados.
- Apresentação renderizada em testes: texto escapado, roteiro, formulário de
  comentários e prévia sem envio.
- Compilação Next passou. A conclusão do build local parou em páginas existentes
  por falta de conexão com o banco. O fluxo completo com banco e navegador ainda
  precisa ser verificado antes da liberação aos clientes.

A versão online ainda precisa ser publicada. O build já configurado no projeto
executa `prisma generate` e `prisma db push` antes de `next build`. O novo schema
acrescenta três tabelas; uma atualização SQL equivalente está em
`prisma/updates/2026-10-04-cronogramas.sql`. Não é necessário executar os dois
métodos de atualização. Nenhuma atualização do banco foi executada nesta etapa.

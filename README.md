# Instaby App — v68

## 1. Corrigido o erro do "Cobertura em tempo real"

### A causa
Quando o servidor recusava adicionar um serviço (por algum motivo — valor inválido, por
exemplo), a tela tentava usar a resposta como se tivesse dado certo, e travava com
aquele "Application error". Isso é código meu de uma atualização recente, não é bug
antigo.

### A correção
- A API agora sempre responde de forma limpa quando algo dá errado, em vez de deixar
  vazar um erro cru
- A tela agora confere se deu certo antes de atualizar a lista — se não deu, mostra um
  aviso explicando (em vez de travar)
- Apliquei o mesmo cuidado nas rotas de criar e editar serviço no catálogo, pra evitar
  que um valor inválido fique salvo silenciosamente

Se "Cobertura em tempo real" continuar dando problema depois de subir esse zip, agora em
vez de travar a tela, vai aparecer um aviso dizendo exatamente o que está errado.

## 2. Onde gerenciar o catálogo sem programar (já existia!)

`/dashboard/servicos` — no menu lateral, seção Comercial → "Catálogo de serviços". Já
faz tudo que você pediu:
- **Criar** → botão "Novo serviço" no topo
- **Editar** → clica em qualquer serviço da lista
- **Mudar valor base** → dentro da edição, campo "Valor unitário"
- **Mudar categoria** → dentro da edição, campo "Categoria"

### O que melhorei agora
- **Aviso visual** pra serviço sem valor definido (R$ 0) — fica com borda laranja e a
  etiqueta "Sem valor", e tem um aviso no topo contando quantos estão assim. Isso ajuda
  você a achar o "Cobertura em tempo real" (ou qualquer outro) rapidinho
- **Categoria virou uma lista com sugestão** — ao digitar, aparecem as categorias que já
  existem, pra você escolher uma delas em vez de digitar errado e criar sem querer uma
  categoria nova parecida (tipo "Cobertura de Evento" vs "Cobertura de Eventos")

### Arquivos alterados
- `app/api/clientes/[id]/servicos-contratados/route.ts`
- `app/api/servicos/route.ts` e `[id]/route.ts`
- `app/dashboard/clientes/[id]/ServicosContratadosTab.tsx`
- `app/dashboard/servicos/page.tsx`
- `app/dashboard/servicos/novo/page.tsx`
- `app/dashboard/servicos/[id]/editar/EditarServicoForm.tsx`

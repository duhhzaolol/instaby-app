# Acessos de clientes (v173)

Clientes → Dados do cliente → Acessos é restrito ao usuário ativo com `master=true`.
A senha atual do Instaby libera o cliente selecionado por dez minutos. Alterar a
senha da conta invalida os desbloqueios anteriores.

## Configuração e recuperação

Defina `ACESSOS_ENCRYPTION_KEY` no servidor: 32 bytes aleatórios codificados em
base64, armazenados como segredo privado. Nunca use o prefixo `NEXT_PUBLIC_`.
Sem uma chave válida, a área não permite salvar nem revelar acessos.

Guarde uma cópia privada desta chave junto da estratégia de backup do banco.
Perder a chave impede recuperar os acessos existentes. Não substitua a chave em
produção sem um processo de migração que recifre os registros com a chave nova.
A chave não pode ir para o Git, logs ou relatórios.

Os modelos novos são `AcessoCliente`, `EventoAcessoCliente` e
`ControleDesbloqueioAcessos`. O fluxo de build existente aplica o schema; esta
versão não remove nem altera colunas existentes.

## Proteções

- Login, senha, URL, responsável e observações são cifrados juntos com AES-256-GCM,
  vinculados ao cliente e ao registro. O nome da plataforma fica legível.
- Cada rota verifica sessão ativa, administrador principal e existência do cliente.
- As alterações exigem a mesma origem do aplicativo e um desbloqueio válido.
- Senhas não aparecem na listagem: a revelação exige um POST explícito e auditado.
- Respostas usam `no-store`. O cookie de desbloqueio é HttpOnly, SameSite Strict e
  Secure em produção. Tentativas de desbloqueio têm limite persistente e atômico.
- A auditoria guarda apenas IDs, ação e data; não registra o conteúdo dos acessos.

## Validação desta versão

Tipos verificados e testes independentes dos helpers e handlers, com sessão e
persistência simuladas: integridade, isolamento, permissões, origem, limites,
concorrência, CRUD, auditoria e cookies. Os fluxos visuais foram conferidos em
prévia local com dados fictícios, em computador e celular. Não foram cadastradas
credenciais de clientes nem executadas alterações no banco real durante os testes.

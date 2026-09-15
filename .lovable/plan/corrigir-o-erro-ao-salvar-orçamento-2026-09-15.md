# Corrigir o erro ao salvar orçamento

## O que está acontecendo

A mensagem "new row violates row-level security policy for table orcamentos" significa que o banco recusou a gravação: quem enviou o orçamento não tem permissão para gravar em nome do dono dos dados.

Hoje o app está no **modo de teste sem login**: as telas de Orçamentos entram direto e gravam usando um dono fixo (a conta do QualPreço). Como as regras de permissão desse modo nunca foram aplicadas no banco (o arquivo `db/modo_teste_acesso_anon.sql` ficou pendente de execução), o banco continua aceitando gravação só de quem está realmente logado — por isso o erro aparece justamente ao clicar em Salvar.

Observação: isso é coerente com o alerta anterior sobre privacidade — o modo de teste sem login também deixaria seus clientes e orçamentos abertos a qualquer pessoa com o endereço.

## Correção proposta (recomendada)

Desligar o modo de teste e voltar a exigir a conta no módulo de Orçamentos:

- `src/lib/modo-teste.ts`: `MODO_TESTE_SEM_LOGIN` passa a `false`.
- Com isso, `AuthGate` volta a pedir e-mail e senha e o orçamento é gravado com o ID do usuário realmente logado — que é exatamente o que as regras do banco esperam.
- Retirar o aviso "Modo de teste — acesso sem login" da tela de orçamentos.
- Nenhuma mudança no banco, nas tabelas, no PDF, na busca de preços ou nas demais telas.

Resultado: salvar orçamento volta a funcionar e os dados ficam protegidos por conta.

## Alternativa (só se você quiser continuar testando sem login)

Executar no editor de SQL do banco o arquivo `db/modo_teste_acesso_anon.sql`, que libera gravação sem conta para o dono fixo. Isso destrava o Salvar, mas deixa clientes e orçamentos acessíveis a qualquer pessoa com o link — e deve ser revertido depois com `db/modo_teste_revogar.sql`.

## Depois da correção

Testar no preview: entrar com a conta, montar um orçamento com dois itens, salvar e conferir que ele aparece na lista de orçamentos sem mensagem de erro.

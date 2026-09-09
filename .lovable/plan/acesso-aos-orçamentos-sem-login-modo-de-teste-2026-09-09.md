# Acesso aos Orçamentos sem login (modo de teste)

Objetivo: durante os testes, abrir Orçamentos, Clientes e a criação de orçamentos sem precisar digitar e-mail e senha.

## Aviso importante

Liberar o acesso sem conta significa que qualquer pessoa com o endereço do app poderá ver e alterar seus clientes (782 importados) e seus orçamentos. É aceitável só enquanto o app está em teste. O plano deixa a volta atrás pronta em um único arquivo.

## O que muda na tela

- As telas de Orçamentos (lista, novo, editar, visualizar) deixam de pedir login e abrem direto.
- Um aviso discreto no topo da lista: "Modo de teste — acesso sem login".
- Nada muda na consulta de preços, na busca, no leitor de código de barras, no PDF nem no compartilhamento.

## Como funciona por dentro

1. Um interruptor único em `src/lib/modo-teste.ts` (`MODO_TESTE_SEM_LOGIN = true`) e o "dono" fixo dos dados de teste: o UUID `ff9ab6e6-0bfa-45e0-a771-75cc4540356f`, que já é o dono dos clientes importados.
2. `src/components/AuthGate.tsx`: quando o interruptor está ligado, entrega esse UUID aos filhos sem checar sessão; quando desligado, volta ao formulário de login atual (código preservado, não removido).
3. Banco (script novo `db/modo_teste_acesso_anon.sql`, executado por você no SQL Editor):
   - `grant select, insert, update, delete` em `clientes`, `orcamentos`, `orcamento_itens` para `anon`;
   - políticas RLS adicionais nomeadas com prefixo `teste_anon_` para `to anon`, permitindo leitura e escrita das linhas cujo `user_id` é o UUID de teste (itens seguem o orçamento correspondente);
   - RLS continua ligada e as políticas atuais de `authenticated` ficam intactas.
4. Script de reversão `db/modo_teste_revogar.sql`: apaga todas as políticas `teste_anon_%` e revoga os grants de `anon`. Voltar ao normal = rodar esse script e pôr o interruptor em `false`.
5. `products` e a consulta de preços não são tocados.

## Testes

- Abrir `/orcamentos` sem sessão: lista carrega, aviso de teste aparece.
- Criar orçamento novo, buscar cliente por nome, salvar, ver detalhe e gerar PDF sem login.
- Conferir que a consulta de preços continua igual.

## Pendente por sua conta

Executar `db/modo_teste_acesso_anon.sql` no SQL Editor. Antes disso as telas abrem, mas os dados não carregam.

# Importação de Clientes do Outro Projeto

## Objetivo
Copiar (uma única vez) os clientes do outro projeto para a tabela `public.clientes` deste projeto, preenchendo apenas os campos usados no orçamento.

## Pré-requisito
- O arquivo `db/clientes.sql` já precisa ter sido executado no SQL Editor do banco (cria a tabela `clientes`).

## O que você precisa me enviar
Exporte a tabela de clientes do outro projeto em **CSV** e anexe aqui na conversa. O arquivo deve conter as colunas originais (pelo menos estas):

```text
CL_CODIGO, CL_NOME, CL_NOMFAN, CL_CGC, CL_CPF, CL_FONE, CL_EMAIL
```

Se vier com todas as colunas da tabela origem, sem problema — eu uso só as necessárias.

## Mapeamento (origem → destino)

```text
CL_NOME            → nome
CL_NOMFAN          → empresa
CL_CGC ou CL_CPF   → cpf_cnpj   (usa CL_CGC; se vazio/zero, usa CL_CPF)
CL_FONE            → telefone
CL_EMAIL           → email
(sempre)           → user_id = id da sua conta neste projeto
```

Regras de limpeza na importação:
- Ignorar linhas sem `CL_NOME` (campo obrigatório).
- Campos vazios viram `null`, nunca texto vazio.
- `CL_CGC`/`CL_CPF` em zero ou vazio viram `null`.
- Acolher duplicados como estão na origem (sem mesclar), a menos que você peça deduplicação por nome.

## Etapas
1. Você anexa o CSV exportado do outro projeto.
2. Eu valido o arquivo (colunas, encoding, contagem de linhas, exemplos de valores).
3. Eu identifico o `user_id` da sua conta (único usuário de autenticação do projeto).
4. Eu importo os dados na tabela `clientes` (carga em lote via COPY/INSERT), com o `user_id` correto em todas as linhas.
5. Validação: contagem importada = contagem válida do CSV; conferir 3 registros de amostra; testar a busca no editor de orçamento (`/orcamentos/novo` → Cliente → "Buscar cliente cadastrado...").

## Detalhes técnicos
- Importação direta no banco (não via código do app), respeitando as políticas RLS existentes (todas as linhas ficam com o seu `user_id`).
- Nada é alterado em `products`, orçamentos, autenticação ou interface.
- Sem sincronização contínua: é uma cópia única; clientes novos serão cadastrados pelo próprio editor de orçamento.

## Fora de escopo
- Edição/exclusão em lote de clientes importados, deduplicação automática e tela de gestão de clientes.

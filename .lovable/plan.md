# Seleção de Clientes no Orçamento

## Objetivo
No campo "Cliente (opcional)" do editor de orçamento, permitir selecionar um cliente cadastrado, preenchendo os campos automaticamente — com cadastro rápido de novo cliente no próprio editor.

## Base
Tabela de clientes do outro projeto (estrutura legada enviada pelo usuário), trazida por **cópia única** (exportar lá / importar aqui). Colunas origem:

```text
CL_CODIGO bigint (pk)   CL_NOME text       CL_ENDERECO text
CL_BAIRRO text          CL_CIDADE text     CL_UF text
CL_CEP text             CL_FONE text       CL_FAX text
CL_CONTATO text         CL_CGC bigint      CL_INSCRICAO bigint
CL_DATAFICHA text       CL_CI text         CL_CPF text
CL_VENDEDOR float8      CL_EMAIL text      CL_NOMFAN text
```

## Etapas

### 1. Banco de dados — `db/clientes.sql` (usuário executa no SQL editor)
- Criar `public.clientes` **espelhando todas as colunas CL_*** (mesmos nomes e tipos), mais:
  - `user_id uuid references auth.users(id) not null`
  - `created_at timestamptz default now()`
  - PK: manter `CL_CODIGO bigint` como código do cliente; chave primária nova `id uuid default gen_random_uuid()` para evitar conflito de códigos entre origem e cadastros novos
- RLS habilitado, políticas por `auth.uid()` (select/insert/update/delete só do próprio usuário)
- Grants: `authenticated` SELECT/INSERT/UPDATE/DELETE; `service_role` ALL; **nenhum grant para `anon`**
- Índices em `user_id` e `CL_NOME`

### 2. Importação — `db/clientes_import.sql`
- Eu gero os INSERTs a partir dos dados exportados do outro projeto (o usuário exporta em CSV/SQL e me envia), mapeando as colunas CL_* diretamente e definindo o `user_id` da conta dona.
- **Pendente do usuário:** enviar os dados exportados.

### 3. Camada de dados — `src/lib/clientes.ts` (novo)
- Tipo `Cliente` com as colunas CL_*.
- `listarClientes(userId, busca?)`: SELECT por nome (`CL_NOME` / `CL_NOMFAN` / `CL_FONE`), filtro parcial case-insensitive, ordenado por `CL_NOME`.
- `proximoCodigo(userId)`: `max(CL_CODIGO)+1` para cadastros novos.
- `criarCliente(userId, dados)`: INSERT e retorno do registro.

### 4. Editor de orçamento — `src/components/OrcamentoEditor.tsx`
- Acima dos campos de cliente, seletor "Buscar cliente cadastrado":
  - Campo de busca com lista suspensa (mesmo padrão do `BuscaProdutos`), mobile-first.
  - Ao escolher, preenche o formulário do orçamento (valores ficam **copiados no orçamento**, preservando o histórico):
    - `CL_NOME` → Nome
    - `CL_NOMFAN` → Empresa
    - `CL_CGC` ou `CL_CPF` → CPF/CNPJ
    - `CL_FONE` → Telefone
    - `CL_EMAIL` → E-mail
  - Botão "Novo cliente": formulário rápido expansível (nome, empresa, CPF/CNPJ, telefone, e-mail) que salva em `clientes` e já seleciona.
- Campos continuam editáveis após a seleção.

### 5. Validação
- `bunx tsgo --noEmit`; rota `/orcamentos/novo` respondendo 200.
- Testes autenticados de banco após o usuário rodar os SQLs.

## Fora de escopo
- Sem tela separada de gestão de clientes; sem alterar `products`, autenticação, PDF, compartilhamento ou scanner; sem sincronização contínua com o outro projeto.

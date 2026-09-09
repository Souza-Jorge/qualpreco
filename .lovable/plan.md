# Seleção de Clientes no Orçamento

## Objetivo
No campo "Cliente (opcional)" do editor de orçamento, permitir selecionar um cliente já cadastrado, preenchendo os campos automaticamente — com opção de cadastro rápido de um novo cliente no próprio editor.

## Decisões confirmadas
- Origem: tabela de clientes de outro projeto, trazida por **cópia única** (exportar lá / importar aqui). Sem vínculo permanente entre os projetos.
- A estrutura (SQL de criação / colunas) será **colada pelo usuário** — o SQL da tabela aqui espelhará essa estrutura, adaptada com `user_id`, RLS e grants do padrão QualPreço.
- Cadastro novo: **cadastro rápido dentro do editor de orçamento** (sem tela separada).

## Etapas

### 1. Banco de dados (arquivo SQL para o usuário executar)
- Criar `db/clientes.sql` espelhando a estrutura enviada pelo usuário, mais:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid references auth.users not null`
  - `created_at timestamptz default now()`
  - RLS habilitado com políticas por `auth.uid()` (select/insert/update/delete apenas do próprio usuário)
  - Grants: `authenticated` com SELECT/INSERT/UPDATE/DELETE; `service_role` ALL; **nenhum grant para `anon`** (corrigindo o padrão que gerou o problema anterior)
  - Índice em `user_id` e em coluna de nome para busca

### 2. Importação dos dados
- O usuário exporta os clientes do outro projeto (SQL `INSERT` ou CSV).
- Eu gero `db/clientes_import.sql` com os INSERTs adaptados (mapeando colunas e definindo o `user_id` correto do dono da conta).
- **Bloqueio:** preciso da estrutura colada pelo usuário antes de escrever os SQLs finais.

### 3. Camada de dados — `src/lib/clientes.ts` (novo)
- `listarClientes(userId, busca?)`: SELECT ordenado por nome, com filtro parcial por nome/empresa/telefone.
- `criarCliente(userId, dados)`: INSERT retornando o registro criado.
- Tipos `Cliente` mapeados das colunas reais da tabela.

### 4. Editor de orçamento — `src/components/OrcamentoEditor.tsx`
- Acima dos campos de cliente, um seletor "Selecionar cliente cadastrado":
  - Campo de busca com lista suspensa (mesmo padrão visual do `BuscaProdutos`).
  - Ao escolher: preenche `cliente_nome`, `cliente_empresa`, `cliente_cpf_cnpj`, `cliente_telefone`, `cliente_email` no formulário (valores continuam sendo **salvos no orçamento como cópia**, preservando histórico mesmo se o cadastro mudar).
  - Botão "Novo cliente": formulário rápido (modal ou seção expansível) que salva na tabela `clientes` e já seleciona o cliente criado.
- Campos continuam editáveis após a seleção (são cópia para o orçamento).

### 5. Validação
- `bunx tsgo --noEmit` e verificação de rota `/orcamentos/novo` (HTTP 200).
- Testes autenticados de banco ficam a cargo do usuário após rodar os SQLs.

## Fora de escopo
- Sem tela separada de gestão de clientes.
- Sem alterar `products`, autenticação, PDF, compartilhamento, scanner ou funcionalidades existentes.
- Sem sincronização contínua com o outro projeto.

## Pendente do usuário
Colar a estrutura da tabela de clientes do outro projeto (CREATE TABLE ou lista de colunas) e, depois, os dados exportados para importação.

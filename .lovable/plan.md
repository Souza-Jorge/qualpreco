# Módulo Orçamentos — base de dados e segurança

Somente banco de dados. Nada de tela, PDF ou compartilhamento nesta fase. A tabela de produtos, a busca, o scanner e o histórico ficam intocados.

## Antes de começar

O banco onde estão os produtos ainda não está conectado a este projeto — hoje o app apenas lê os produtos usando uma chave pública. Para eu criar as tabelas, é preciso conectar esse banco em Configurações do Projeto → Conectores → Supabase. Se preferir, eu entrego o script pronto e você executa no painel do banco.

Como combinado, o login fica para depois: as tabelas já nascem protegidas por usuário, então os orçamentos só passam a funcionar quando o login existir.

## O que será criado

### Tabela `orcamentos`
Campos: id, numero, user_id, cliente_nome, cliente_empresa, cliente_cpf_cnpj, cliente_telefone, cliente_email, observacao, subtotal, desconto, total, status, created_at, updated_at.

Padrões: subtotal/desconto/total = 0, status = 'Rascunho', datas = agora.

O número do orçamento vem de uma sequência do próprio banco, então nunca se repete mesmo com várias pessoas criando ao mesmo tempo.

### Tabela `orcamento_itens`
Campos: id, orcamento_id, product_id, codigo, produto_nome, ean, quantidade, preco_unitario, subtotal, created_at.

Código, nome, código de barras e preço unitário são gravados como uma "fotografia" do produto no momento da inclusão — mudanças futuras de preço não alteram orçamentos antigos. Ao excluir um orçamento, seus itens saem junto.

### Status
Apenas Rascunho, Finalizado e Cancelado (validado pelo banco).

### Proteção de acesso (RLS)
Ativada nas duas tabelas, sempre por `auth.uid()`:
- criar, ver e alterar apenas os próprios orçamentos;
- excluir apenas os próprios rascunhos;
- criar, ver, alterar e excluir itens somente de orçamentos próprios.

Sem login, nenhum acesso. Nenhuma política da tabela de produtos é tocada.

### Regras de integridade
Quantidade maior que zero; preço unitário, subtotal, desconto e total nunca negativos; número do orçamento único; item sempre ligado a um orçamento existente.

### Índices
Em `orcamentos.user_id`, `orcamentos.numero`, `orcamentos.created_at` e `orcamento_itens.orcamento_id`.

### Atualização automática de data
Gatilho que atualiza `updated_at` a cada alteração de orçamento.

## Detalhes técnicos

- Migração única, na ordem: CREATE TABLE → GRANT (`authenticated` com SELECT/INSERT/UPDATE/DELETE; `service_role` com ALL; sem acesso para `anon`) → ENABLE ROW LEVEL SECURITY → CREATE POLICY.
- `numero`: `bigint` com `DEFAULT nextval('orcamentos_numero_seq')` + UNIQUE.
- `user_id uuid NOT NULL DEFAULT auth.uid()` referenciando `auth.users(id)`.
- `status text NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho','Finalizado','Cancelado'))`.
- `orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE`.
- `product_id` acompanha o tipo da chave de produtos (`codigo` inteiro), sem foreign key rígida, para que exclusões em produtos não quebrem orçamentos antigos.
- Políticas de itens usam `EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid())`.
- DELETE em orçamentos restrito a `status = 'Rascunho'`.
- Função `public.set_updated_at()` (`SECURITY DEFINER`, `search_path = public`) + trigger `BEFORE UPDATE`.

## Validação após aplicar

Consultas ao catálogo do banco confirmando tabelas, chaves estrangeiras, constraints, índices, RLS ativa e políticas; teste de leitura sem login (deve retornar vazio/negado) e verificação de que as políticas filtram por `auth.uid()`. O teste entre dois usuários reais fica pendente até o login existir e será relatado como tal.

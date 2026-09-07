-- QualPreco :: Modulo Orcamentos
-- Infraestrutura de banco de dados e seguranca (RLS).
-- NAO altera a tabela public.products nem suas policies.
-- Executar uma unica vez no SQL Editor do banco do projeto.

begin;

-- ============================================================
-- 1) Sequencia do numero do orcamento (unico e concorrente-safe)
-- ============================================================
create sequence if not exists public.orcamentos_numero_seq;

-- ============================================================
-- 2) Tabela: orcamentos
-- ============================================================
create table if not exists public.orcamentos (
  id                uuid primary key default gen_random_uuid(),
  numero            bigint not null default nextval('public.orcamentos_numero_seq'),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_nome      text,
  cliente_empresa   text,
  cliente_cpf_cnpj  text,
  cliente_telefone  text,
  cliente_email     text,
  observacao        text,
  subtotal          numeric(14,2) not null default 0,
  desconto          numeric(14,2) not null default 0,
  total             numeric(14,2) not null default 0,
  status            text not null default 'Rascunho',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orcamentos_numero_key        unique (numero),
  constraint orcamentos_status_check      check (status in ('Rascunho','Finalizado','Cancelado')),
  constraint orcamentos_subtotal_check    check (subtotal >= 0),
  constraint orcamentos_desconto_check    check (desconto >= 0),
  constraint orcamentos_total_check       check (total >= 0)
);

alter sequence public.orcamentos_numero_seq owned by public.orcamentos.numero;

-- ============================================================
-- 3) Tabela: orcamento_itens (snapshot do produto/preco)
-- ============================================================
create table if not exists public.orcamento_itens (
  id              uuid primary key default gen_random_uuid(),
  orcamento_id    uuid not null references public.orcamentos(id) on delete cascade,
  product_id      integer,               -- referencia logica a products.codigo (sem FK rigida)
  codigo          text,                  -- snapshot
  produto_nome    text,                  -- snapshot
  ean             text,                  -- snapshot
  quantidade      numeric(14,3) not null,
  preco_unitario  numeric(14,2) not null,
  subtotal        numeric(14,2) not null default 0,
  created_at      timestamptz not null default now(),
  constraint orcamento_itens_quantidade_check     check (quantidade > 0),
  constraint orcamento_itens_preco_check          check (preco_unitario >= 0),
  constraint orcamento_itens_subtotal_check       check (subtotal >= 0)
);

-- ============================================================
-- 4) GRANTS (Data API) - somente usuarios autenticados
-- ============================================================
grant usage, select on sequence public.orcamentos_numero_seq to authenticated;
grant all on sequence public.orcamentos_numero_seq to service_role;

grant select, insert, update, delete on public.orcamentos to authenticated;
grant all on public.orcamentos to service_role;

grant select, insert, update, delete on public.orcamento_itens to authenticated;
grant all on public.orcamento_itens to service_role;

-- ============================================================
-- 5) RLS
-- ============================================================
alter table public.orcamentos      enable row level security;
alter table public.orcamento_itens enable row level security;

-- orcamentos
drop policy if exists "orcamentos_select_own" on public.orcamentos;
create policy "orcamentos_select_own"
  on public.orcamentos for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "orcamentos_insert_own" on public.orcamentos;
create policy "orcamentos_insert_own"
  on public.orcamentos for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "orcamentos_update_own" on public.orcamentos;
create policy "orcamentos_update_own"
  on public.orcamentos for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "orcamentos_delete_own_rascunho" on public.orcamentos;
create policy "orcamentos_delete_own_rascunho"
  on public.orcamentos for delete to authenticated
  using (user_id = auth.uid() and status = 'Rascunho');

-- orcamento_itens (herdam a dona do orcamento)
drop policy if exists "orcamento_itens_select_own" on public.orcamento_itens;
create policy "orcamento_itens_select_own"
  on public.orcamento_itens for select to authenticated
  using (exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id and o.user_id = auth.uid()
  ));

drop policy if exists "orcamento_itens_insert_own" on public.orcamento_itens;
create policy "orcamento_itens_insert_own"
  on public.orcamento_itens for insert to authenticated
  with check (exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id and o.user_id = auth.uid()
  ));

drop policy if exists "orcamento_itens_update_own" on public.orcamento_itens;
create policy "orcamento_itens_update_own"
  on public.orcamento_itens for update to authenticated
  using (exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id and o.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id and o.user_id = auth.uid()
  ));

drop policy if exists "orcamento_itens_delete_own" on public.orcamento_itens;
create policy "orcamento_itens_delete_own"
  on public.orcamento_itens for delete to authenticated
  using (exists (
    select 1 from public.orcamentos o
    where o.id = orcamento_itens.orcamento_id and o.user_id = auth.uid()
  ));

-- ============================================================
-- 6) Indices
-- ============================================================
create index if not exists idx_orcamentos_user_id     on public.orcamentos (user_id);
create index if not exists idx_orcamentos_numero      on public.orcamentos (numero);
create index if not exists idx_orcamentos_created_at  on public.orcamentos (created_at desc);
create index if not exists idx_orcamento_itens_orcamento_id on public.orcamento_itens (orcamento_id);

-- ============================================================
-- 7) Trigger de updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orcamentos_updated_at on public.orcamentos;
create trigger trg_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

commit;

-- ============================================================
-- 8) VALIDACAO (executar apos o script acima)
-- ============================================================
-- Tabelas e RLS
-- select relname, relrowsecurity from pg_class
--   where relname in ('orcamentos','orcamento_itens');
-- Policies
-- select tablename, policyname, cmd, roles from pg_policies
--   where tablename in ('orcamentos','orcamento_itens') order by tablename, policyname;
-- Constraints
-- select conrelid::regclass as tabela, conname, pg_get_constraintdef(oid)
--   from pg_constraint
--   where conrelid in ('public.orcamentos'::regclass,'public.orcamento_itens'::regclass)
--   order by 1,2;
-- Indices
-- select tablename, indexname, indexdef from pg_indexes
--   where tablename in ('orcamentos','orcamento_itens') order by 1,2;
-- Acesso anonimo (deve retornar 0 privilegios)
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_name in ('orcamentos','orcamento_itens') and grantee = 'anon';

-- QualPreço — Tabela de clientes (somente campos usados no orçamento)
-- Execute no SQL Editor do Supabase.

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  empresa text,
  cpf_cnpj text,
  telefone text,
  email text,
  created_at timestamptz not null default now()
);

-- Grants: somente usuários autenticados (nenhum acesso anon)
grant select, insert, update, delete on public.clientes to authenticated;
grant all on public.clientes to service_role;

alter table public.clientes enable row level security;

create policy "Usuário vê apenas seus clientes"
  on public.clientes for select to authenticated
  using (auth.uid() = user_id);

create policy "Usuário cria apenas seus clientes"
  on public.clientes for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Usuário edita apenas seus clientes"
  on public.clientes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário exclui apenas seus clientes"
  on public.clientes for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists clientes_user_idx on public.clientes (user_id);
create index if not exists clientes_nome_idx on public.clientes (nome);

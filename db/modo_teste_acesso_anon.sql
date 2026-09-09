-- ============================================================
-- MODO DE TESTE: acesso sem login (papel anon)
-- Libera clientes, orcamentos e orcamento_itens do usuario de teste
-- para o papel anonimo. Use APENAS durante os testes.
-- Reverter com: db/modo_teste_revogar.sql
-- ============================================================

begin;

-- Usuario dono dos dados de teste
-- ff9ab6e6-0bfa-45e0-a771-75cc4540356f

grant select, insert, update, delete on public.clientes         to anon;
grant select, insert, update, delete on public.orcamentos       to anon;
grant select, insert, update, delete on public.orcamento_itens  to anon;

alter table public.clientes         enable row level security;
alter table public.orcamentos       enable row level security;
alter table public.orcamento_itens  enable row level security;

-- ---------------- clientes ----------------
drop policy if exists "teste_anon_clientes_select" on public.clientes;
create policy "teste_anon_clientes_select"
  on public.clientes for select to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_clientes_insert" on public.clientes;
create policy "teste_anon_clientes_insert"
  on public.clientes for insert to anon
  with check (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_clientes_update" on public.clientes;
create policy "teste_anon_clientes_update"
  on public.clientes for update to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid)
  with check (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_clientes_delete" on public.clientes;
create policy "teste_anon_clientes_delete"
  on public.clientes for delete to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

-- ---------------- orcamentos ----------------
drop policy if exists "teste_anon_orcamentos_select" on public.orcamentos;
create policy "teste_anon_orcamentos_select"
  on public.orcamentos for select to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_orcamentos_insert" on public.orcamentos;
create policy "teste_anon_orcamentos_insert"
  on public.orcamentos for insert to anon
  with check (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_orcamentos_update" on public.orcamentos;
create policy "teste_anon_orcamentos_update"
  on public.orcamentos for update to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid)
  with check (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid);

drop policy if exists "teste_anon_orcamentos_delete" on public.orcamentos;
create policy "teste_anon_orcamentos_delete"
  on public.orcamentos for delete to anon
  using (user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid
         and status = 'Rascunho');

-- ---------------- orcamento_itens ----------------
drop policy if exists "teste_anon_itens_select" on public.orcamento_itens;
create policy "teste_anon_itens_select"
  on public.orcamento_itens for select to anon
  using (exists (select 1 from public.orcamentos o
                 where o.id = orcamento_itens.orcamento_id
                   and o.user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid));

drop policy if exists "teste_anon_itens_insert" on public.orcamento_itens;
create policy "teste_anon_itens_insert"
  on public.orcamento_itens for insert to anon
  with check (exists (select 1 from public.orcamentos o
                      where o.id = orcamento_itens.orcamento_id
                        and o.user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid));

drop policy if exists "teste_anon_itens_update" on public.orcamento_itens;
create policy "teste_anon_itens_update"
  on public.orcamento_itens for update to anon
  using (exists (select 1 from public.orcamentos o
                 where o.id = orcamento_itens.orcamento_id
                   and o.user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid))
  with check (exists (select 1 from public.orcamentos o
                      where o.id = orcamento_itens.orcamento_id
                        and o.user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid));

drop policy if exists "teste_anon_itens_delete" on public.orcamento_itens;
create policy "teste_anon_itens_delete"
  on public.orcamento_itens for delete to anon
  using (exists (select 1 from public.orcamentos o
                 where o.id = orcamento_itens.orcamento_id
                   and o.user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid));

commit;

-- VALIDACAO
-- select tablename, policyname, cmd, roles from pg_policies
--   where policyname like 'teste_anon_%' order by tablename, policyname;

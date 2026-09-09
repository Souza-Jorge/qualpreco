-- ============================================================
-- REVERTER O MODO DE TESTE: remove o acesso sem login
-- Apaga todas as policies teste_anon_% e revoga os grants de anon.
-- Depois de rodar, coloque MODO_TESTE_SEM_LOGIN = false
-- em src/lib/modo-teste.ts
-- ============================================================

begin;

do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and policyname like 'teste_anon_%'
  loop
    execute format('drop policy if exists %I on %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

revoke all on public.clientes         from anon;
revoke all on public.orcamentos       from anon;
revoke all on public.orcamento_itens  from anon;

commit;

-- VALIDACAO (deve retornar zero linhas)
-- select tablename, policyname from pg_policies where policyname like 'teste_anon_%';
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_name in ('clientes','orcamentos','orcamento_itens') and grantee = 'anon';

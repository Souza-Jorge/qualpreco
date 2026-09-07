-- ============================================================
-- CORRECAO DE PERMISSOES - modulo Orcamentos
-- Remove acesso do papel anonimo e garante acesso apenas a usuarios logados.
-- Rodar no SQL Editor do banco.
-- ============================================================

begin;

-- 1) Revogar tudo do papel anonimo (e do publico, que propaga para anon)
revoke all on public.orcamentos       from anon, public;
revoke all on public.orcamento_itens  from anon, public;

-- 2) Conceder apenas o necessario
grant select, insert, update, delete on public.orcamentos      to authenticated;
grant select, insert, update, delete on public.orcamento_itens to authenticated;
grant all on public.orcamentos      to service_role;
grant all on public.orcamento_itens to service_role;

-- 3) Garantir RLS ativa (e obrigatoria tambem para o dono da tabela)
alter table public.orcamentos       enable row level security;
alter table public.orcamento_itens  enable row level security;

commit;

-- ============================================================
-- VALIDACAO
-- ============================================================
-- Deve retornar ZERO linhas:
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_name in ('orcamentos','orcamento_itens')
--     and grantee in ('anon','PUBLIC');

-- Deve retornar apenas authenticated / service_role:
-- select table_name, grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_name in ('orcamentos','orcamento_itens')
--   order by table_name, grantee, privilege_type;

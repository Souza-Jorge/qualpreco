-- QualPreço — Corrige o dono dos clientes importados
-- Sintoma: a busca de clientes não retorna nada, mesmo com 782 registros.
-- Causa: os registros foram vinculados a um usuário diferente do que está logado
-- no app, e a segurança por usuário (RLS) esconde os dados dos demais.

-- 1) Conferir a situação atual (quantos clientes por usuário)
select c.user_id, u.email, count(*) as total
from public.clientes c
left join auth.users u on u.id = c.user_id
group by 1, 2
order by total desc;

-- 2) Passar todos os clientes para a conta usada no app.
--    Este é o ID da conta que está conectada no QualPreço.
update public.clientes
set user_id = 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid
where user_id is distinct from 'ff9ab6e6-0bfa-45e0-a771-75cc4540356f'::uuid;

-- 3) Conferência final (deve mostrar todos na sua conta)
select u.email, count(*) as total
from public.clientes c
join auth.users u on u.id = c.user_id
group by 1;

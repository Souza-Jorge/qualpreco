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
--    Troque o e-mail abaixo pelo e-mail com que você entra no QualPreço.
update public.clientes
set user_id = (select id from auth.users where email = 'SEU-EMAIL-AQUI')
where user_id is distinct from (select id from auth.users where email = 'SEU-EMAIL-AQUI');

-- 3) Conferência final (deve mostrar todos na sua conta)
select u.email, count(*) as total
from public.clientes c
join auth.users u on u.id = c.user_id
group by 1;

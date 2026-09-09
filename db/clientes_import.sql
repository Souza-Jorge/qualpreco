-- QualPreço — Importação única: copia clientes da tabela `fornecedores` (CL_*) para `clientes`
-- Execute no SQL Editor do Supabase, DEPOIS de ter rodado db/clientes.sql.
-- É uma cópia única; rodar de novo duplica os registros.

insert into public.clientes (user_id, nome, empresa, cpf_cnpj, telefone, email)
select
  (select id from auth.users order by created_at limit 1) as user_id,
  nullif(trim(f."CL_NOME"), '') as nome,
  nullif(trim(f."CL_NOMFAN"), '') as empresa,
  case
    when f."CL_CGC" is not null and f."CL_CGC" <> 0 then f."CL_CGC"::text
    when f."CL_CPF" is not null and nullif(trim(f."CL_CPF"), '') is not null then trim(f."CL_CPF")
    else null
  end as cpf_cnpj,
  nullif(trim(f."CL_FONE"), '') as telefone,
  nullif(trim(f."CL_EMAIL"), '') as email
from public.fornecedores f
where nullif(trim(f."CL_NOME"), '') is not null;

-- Conferir o resultado:
-- select count(*) from public.clientes;
-- select nome, empresa, cpf_cnpj, telefone, email from public.clientes order by nome limit 5;

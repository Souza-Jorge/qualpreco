-- QualPreco :: Orcamentos - quantidade por caixa
-- Executar uma unica vez no SQL Editor do banco do projeto.
-- Nao altera products, RLS, policies nem dados existentes.

alter table public.orcamento_itens
  add column if not exists quantidade_por_caixa integer;

alter table public.orcamento_itens
  drop constraint if exists orcamento_itens_qtd_caixa_check;

alter table public.orcamento_itens
  add constraint orcamento_itens_qtd_caixa_check
  check (quantidade_por_caixa is null or quantidade_por_caixa > 0);

-- Validacao:
-- select column_name, data_type, is_nullable from information_schema.columns
--   where table_name = 'orcamento_itens' and column_name = 'quantidade_por_caixa';

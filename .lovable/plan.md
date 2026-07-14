## Objetivo
Gerar um script SQL que você executa no SQL Editor do Supabase para sincronizar completamente a tabela `products` a partir de `import_products` (espelho completo).

## Estratégia
Como as colunas são idênticas e queremos espelho completo, o script fará tudo dentro de uma transação:

1. `BEGIN` — segurança para poder dar `ROLLBACK` se algo der errado.
2. `INSERT ... ON CONFLICT (codigo) DO UPDATE SET ...` — insere novos e atualiza existentes com base em `codigo` (chave).
3. `DELETE FROM products WHERE codigo NOT IN (SELECT codigo FROM import_products)` — remove os que não existem mais.
4. `COMMIT`.

Observação: como não altero código do app, esta é uma entrega apenas de SQL. Você roda no Dashboard → SQL Editor sempre que atualizar `import_products`.

## Entrega
Vou te entregar em uma mensagem:

- O script SQL completo, pronto para colar no SQL Editor.
- Uma versão de "dry-run" (só `SELECT COUNT` de quantos serão inseridos/atualizados/deletados) para você conferir antes de rodar de verdade.
- Instruções curtas de como executar.

## Pré-requisitos que preciso confirmar antes de gerar
- `codigo` é PRIMARY KEY (ou UNIQUE) em `products`? Se não for, o `ON CONFLICT (codigo)` falha e preciso ajustar.
- Posso assumir que `import_products` tem exatamente as mesmas colunas: `codigo, name, barcode, unit, pack, stock_quantity, cost_price, sale_price, promo_price, promo_start, promo_end, category_code, category_name, data_validade`?

Ao aprovar o plano, eu já gero o SQL final na próxima mensagem.
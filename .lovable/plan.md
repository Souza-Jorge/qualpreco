## Problema

Ao escanear `7898650400171`, a query usa `.or('codigo.eq.7898650400171,barcode.eq.7898650400171')`. Como `codigo` é `integer` no Postgres e o valor ultrapassa o limite (2.147.483.647), o banco rejeita a comparação inteira **antes** de avaliar a parte do `barcode`, retornando o erro `out of range for type integer`.

## Correção

Em `src/routes/index.tsx`, dentro de `runSearch`, ajustar o ramo numérico para só incluir `codigo.eq.<q>` quando o valor couber em `int4`. Caso contrário, consultar apenas por `barcode`.

```ts
const INT4_MAX = 2147483647;
const asInt = Number(q);
const fitsInt = Number.isSafeInteger(asInt) && asInt <= INT4_MAX;

const filter = fitsInt
  ? `codigo.eq.${q},barcode.eq.${q}`
  : `barcode.eq.${q}`;

const { data, error } = await supabase
  .from("products")
  .select(COLUMNS)
  .or(filter)
  .limit(NUM_LIMIT);
```

Resto da lógica (seleção única, histórico, mensagens de erro) permanece igual.

## Arquivo alterado

- `src/routes/index.tsx` — apenas o trecho do ramo `isNumeric(q)` em `runSearch`.

Nenhuma alteração em schema, scanner ou outros componentes.
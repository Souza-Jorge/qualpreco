## Ajuste na lógica de promoção ativa

**Arquivo:** `src/components/ProdutoCard.tsx`

Trocar a regra atual (`promoIniciada` via `promo_start` + tolerância de 1 dia em `promo_end`) por uma regra simples baseada apenas em `promo_end`:

```ts
const hoje = new Date(); hoje.setHours(0,0,0,0);
const promoAtiva =
  precoPromo != null &&
  (!produto.promo_end || new Date(produto.promo_end).getTime() >= hoje.getTime());
```

- Remove a checagem de `promo_start`.
- Considera promoção ativa quando `promo_price` existe **e** `promo_end >= data de hoje` (ou `promo_end` é nulo).
- Comparação feita a partir do início do dia atual, para que o último dia da promo conte como ativo.

Nada mais muda: o badge "PROMOÇÃO até DD/MM", o preço em verde e o preço original riscado continuam funcionando como hoje.
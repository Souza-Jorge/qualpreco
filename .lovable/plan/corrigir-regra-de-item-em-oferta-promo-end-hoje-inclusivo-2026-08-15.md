# Corrigir regra de "item em oferta" (promo_end >= hoje, inclusivo)

## Problema confirmado

No navegador do usuário (fuso de São Paulo, UTC-3), uma promoção cuja data final é **hoje** aparece como **vencida** em vez de ativa.

Causa raiz (confirmada por reprodução em `TZ=America/Sao_Paulo`):

```ts
// ProdutoCard.tsx — código atual
const hoje = new Date(); hoje.setHours(0,0,0,0);
const promoAtiva =
  precoPromo != null &&
  (!produto.promo_end || new Date(produto.promo_end).getTime() >= hoje.getTime());
```

- `promo_end` vem da base como string date-only `"2026-08-15"`.
- `new Date("2026-08-15")` é interpretado como **meia-noite UTC** → `2026-08-15T00:00:00Z`.
- `hoje` (meia-noite local em UTC-3) → `2026-08-15T03:00:00Z`.
- Logo `promo_end (00:00Z) >= hoje (03:00Z)` = **false** → promoção de hoje marcada como expirada.

Há **10 promoções terminando exatamente hoje** (2026-08-15) na base que estão sendo exibidas como vencidas.

## Decisão de escopo (confirmada com o usuário)

Apenas a **data final** será tratada. A data de início (`promo_start`) continua sendo ignorada — não há promoções com início futuro na base e o usuário optou por manter o comportamento atual.

## Mudança

Arquivo: `src/components/ProdutoCard.tsx`

Trocar a comparação baseada em `Date.getTime()` por uma comparação **timezone-safe** de strings `YYYY-MM-DD` (ordem lexicográfica = ordem cronológica para esse formato):

```ts
// data de hoje no fuso local, no formato YYYY-MM-DD
const todayStr = new Date().toLocaleDateString("en-CA");

const promoAtiva =
  precoPromo != null &&
  (!produto.promo_end || produto.promo_end >= todayStr);
```

- `promo_end == todayStr` (termina hoje) → `true` (ativo) ✓ — atende "maior ou igual a hoje".
- `promo_end` no futuro → `true` ✓
- `promo_end` no passado → `false` (vencido) ✓
- Funciona igual em qualquer fuso, sem depender de `Date`/UTC.

Remover a variável `hoje` se ela não for usada em outro lugar do componente (ela só é usada nesta regra hoje).

## Verificação

- Typecheck (`tsgo`).
- Screenshot via Playwright consultando um dos 10 produtos que terminam hoje (ex.: código `37`) e confirmar que o selo "PROMOÇÃO" e o preço promocional aparecem como ativos.

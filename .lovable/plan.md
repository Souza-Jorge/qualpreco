# Corrigir regra de itens em oferta sem data de término

## Objetivo
Itens com preço promocional mas **sem data de término** (`promo_end` vazio) não devem aparecer na lista de ofertas. Ao consultar o produto diretamente (card) ou em orçamento, deve aparecer o **preço principal** (`sale_price`), não o promocional.

## Regra nova
Uma promoção só é considerada **ativa** se `promo_end` tiver uma data **e** essa data for >= hoje. Se `promo_end` estiver vazio/nulo, o preço promocional é desconsiderado em todas as visualizações.

## Mudanças

### 1. `src/lib/produtos-busca.ts`
- **`aplicarPromo`**: trocar `.or(`promo_end.is.null,promo_end.gte.${todayStr}`)` por `.not("promo_end", "is", null).gte("promo_end", todayStr)` — exige data preenchida e válida. Afeta `listarPromocoes` e buscas com filtro "Apenas ofertas".
- **`precoVigente`**: mudar `promoAtiva` para exigir `p.promo_end != null` (além de `>= hojeStr()`). Assim o card e a busca de orçamento mostram o preço principal quando não há data.

### 2. `src/components/ProdutoCard.tsx`
- **`promoAtiva`** (linha ~54): adicionar `produto.promo_end != null &&` à condição. O selo "PROMOÇÃO até dd/mm" só aparece com data; sem data, mostra o preço normal.

### 3. `src/routes/index.tsx`
- **`promoAtiva`** na lista de resultados (linha ~424): adicionar `p.promo_end != null &&`.
- Remover o fallback `"Oferta sem prazo"` (linha ~450-456) — com a regra nova, `promoAtiva` implica `promo_end` preenchido, então o branch nunca dispara. Manter apenas `até ${fmtDateList(p.promo_end)}`.

## O que não muda
- Tabela `products`, Supabase, autenticação, rotas, orçamentos, PDF, mobile/Capacitor.
- Itens **com** data de promoção válida continuam aparecendo normalmente na lista de ofertas e com preço promocional no card/busca.

## Validação
- Typecheck (`tsgo`) sem erros.
- Conferir no preview: ativar "Apenas ofertas" não lista itens sem data; consultar um produto sem `promo_end` mostra o preço principal.

# "Oferta Dia X" quando promo_start == promo_end

## Objetivo

Para itens em oferta, quando a data de início (`promo_start`) e a data de fim (`promo_end`) forem **a mesma**, exibir **"Oferta Dia X"** (X = data formatada) em vez de "até data". Quando as datas forem diferentes, manter o comportamento atual ("até data").

## Regra

```text
promo_start == promo_end  →  "Oferta Dia <data>"
promo_start != promo_end  →  "até <data>"  (comportamento atual)
```

`promo_start` e `promo_end` vêm da base como strings `YYYY-MM-DD`; a comparação é direta por string. Ambos já estão incluídos em `COLUMNS` (`src/lib/produtos-busca.ts`).

## Mudanças

### 1. `src/routes/index.tsx` — item da lista de resultados (~linha 463)

Hoje:
```tsx
{promoAtiva && (
  <span className="shrink-0 text-sm font-medium text-destructive">
    até {fmtDateList(p.promo_end)}
  </span>
)}
```

Trocar por lógica que decide o rótulo:
```tsx
{promoAtiva && (
  <span className="shrink-0 text-sm font-medium text-destructive">
    {p.promo_start && p.promo_start === p.promo_end
      ? `Oferta Dia ${fmtDateList(p.promo_end)}`
      : `até ${fmtDateList(p.promo_end)}`}
  </span>
)}
```

### 2. `src/components/ProdutoCard.tsx` — selo PROMOÇÃO (~linha 127)

Hoje:
```tsx
<Badge ...>
  PROMOÇÃO
  {produto.promo_end && ` até ${fmtDate(produto.promo_end)}`}
</Badge>
```

Trocar por:
```tsx
<Badge ...>
  {produto.promo_start && produto.promo_start === produto.promo_end
    ? `OFERTA DIA ${fmtDate(produto.promo_end)}`
    : `PROMOÇÃO até ${fmtDate(produto.promo_end)}`}
</Badge>
```

Quando `promo_start == promo_end`, o selo passa a mostrar **"OFERTA DIA 22/09/2026"** (em maiúsculas, padrão do selo); nos demais casos continua **"PROMOÇÃO até 30/09/2026"**.

## Validação

- `tsgo --noEmit` sem erros.
- Conferir no preview: um produto com `promo_start == promo_end` deve aparecer como "Oferta Dia X"; um com datas diferentes continua como "até data".

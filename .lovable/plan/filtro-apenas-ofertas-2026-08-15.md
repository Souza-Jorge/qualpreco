# Filtro "Apenas ofertas"

## Objetivo

Adicionar um filtro na tela principal que, quando ativo, traz **apenas** os produtos em oferta — ou seja, aqueles com `promo_price` preenchido e `promo_end` dentro da validade (>= hoje, ou nulo).

## Regra de "produto em oferta" (já usada no app)

```ts
promo_price != null && (!promo_end || promo_end >= todayStr)   // todayStr = YYYY-MM-DD
```

## Mudanças

Arquivo: `src/routes/index.tsx`

### 1. Novo estado
- `const [onlyPromo, setOnlyPromo] = useState(false)`
- Helper que monta o filtro PostgREST para ofertas ativas, reutilizável em todos os caminhos de busca:
  ```ts
  const todayStr = new Date().toLocaleDateString("en-CA");
  // retorna um array de filtros Supabase aplicáveis com .or()/.not()
  ```
  Filtros a aplicar quando `onlyPromo` é true:
  - `.not("promo_price", "is", null)` — tem preço promocional
  - `.or(`promo_end.is.null,promo_end.gte.${todayStr}`)` — dentro da validade

### 2. Botão de filtro na UI
- Adicionar um botão toggle logo abaixo/ao lado do campo de busca, dentro do header.
- Estilo: `outline` quando inativo, `default`/destaque (ex.: `destructive` ou cor de promoção) quando ativo.
- Ícone `Percent` (lucide) + texto "Apenas ofertas".
- Ao alternar para ON sem query: dispara uma busca listando todos os produtos em oferta (ordenados por nome, limite 100).
- Ao alternar para OFF: limpa resultados e volta ao estado inicial (histórico/vazio).
- Ao alternar com query ativa: re-executa a busca aplicando/removendo o filtro.

### 3. Aplicar o filtro em todos os caminhos de busca
- `buscarPorNome(q)`: aplicar filtros de oferta quando `onlyPromo`.
- Caminho numérico (`codigo`/`barcode` exato): aplicar filtros de oferta quando `onlyPromo`.
- Caminho numérico fallback (parcial por nome/barcode): aplicar filtros de oferta quando `onlyPromo`.
- Novo caminho: `onlyPromo` ON + sem query → `listarPromocoes()` que consulta produtos com os filtros de oferta, ordenados por nome, limite 100.

### 4. Re-executar busca ao mudar o filtro
- Adicionar `onlyPromo` às dependências do `useEffect` de debounce (ou um `useEffect` dedicado) para re-buscar quando o filtro muda e há query.
- Para o caso "sem query + filtro ON", chamar `listarPromocoes()` diretamente no toggle.

### 5. Indicador visual no resultado
- No header da lista de resultados, quando `onlyPromo` ativo, mostrar "X produtos em oferta" em vez de "X produtos encontrados".
- O selo "PROMO" já existe nos itens da lista e no `ProdutoCard` — sem mudança.

## Verificação

- Typecheck (`tsgo`).
- Playwright: ativar o filtro sem query e confirmar que a lista mostra apenas produtos com selo PROMO; digitar um termo com o filtro ativo e confirmar que só retornam produtos em oferta.

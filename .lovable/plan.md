# Reduzir a fonte do "R$" no preço

## Contexto
No `src/components/ProdutoCard.tsx`, o preço final é renderizado pela função `brl()`, que retorna uma única string formatada como `R$ 11,20` (símbolo + número juntos). Hoje o símbolo "R$" usa o mesmo tamanho grande (`text-4xl md:text-5xl`) que o número.

## Mudança
Separar o símbolo de moeda do número para que o "R$" fique em um tamanho menor, enquanto o valor numérico mantém o tamanho atual.

### Detalhes técnicos
1. Substituir a função `brl` (linha 6-9) por uma versão que retorna as partes separadas usando `Intl.NumberFormat` com `formatToParts`, extraindo `currency` e `number`.
2. No `<span>` do preço final (linhas 81-87), renderizar o "R$" em um `<span>` menor (`text-2xl md:text-3xl`) seguido do número no tamanho atual (`text-4xl md:text-5xl`), alinhados por `baseline`.
3. Manter a mesma coloração (`text-success` em promoção, `text-primary` no normal) para ambas as partes.

### Escopo
- Apenas `src/components/ProdutoCard.tsx`.
- Sem alterações de schema, dados ou lógica de negócio.
- A formatação do valor cortado (`precoVenda` na linha 89) pode continuar usando a string completa, sem separar partes.

# Corrigir a posição da data/"Oferta sem prazo" na lista de resultados

## Problema
Hoje a linha de cada item da lista de resultados está na ordem:

```text
[ data/Oferta sem prazo ]  [ nome do produto ]  [ selo PROMO ]
```

A data ficou colada antes do nome, longe do selo. Deve ficar logo na frente do selo "PROMO":

```text
[ nome do produto ]  [ data/Oferta sem prazo ]  [ selo PROMO ]
```

## Mudança
Arquivo único: `src/routes/index.tsx`, dentro do bloco `results.map` (por volta da linha 523).

Reordenar os três elementos do `flex items-center gap-2` para:

1. `<span>` do nome do produto (`truncate`)
2. `<span>` da data/"Oferta sem prazo" (em `text-destructive`), exibido só quando `promoAtiva`
3. `<span>` do selo `PROMO`

Nenhuma outra alteração de lógica — só mover o bloco de data para entre o nome e o selo.

## Validação
- `tsgo --noEmit` sem erros.
- Conferir no preview que a data (ou "Oferta sem prazo") aparece imediatamente antes do selo PROMO.

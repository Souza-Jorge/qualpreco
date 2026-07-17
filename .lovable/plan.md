## Objetivo
Mover os campos **Emb.**, **Pack** e **Custo** para dentro do mesmo bloco do preço (o card destacado com fundo `bg-accent`), com fonte maior e visual mais integrado — em vez de ficarem soltos em uma `<dl>` abaixo dos badges.

## Mudanças em `src/components/ProdutoCard.tsx`

1. **Remover** o bloco `<dl className="grid grid-cols-2 ...">` no final do card.
2. **Reestruturar o bloco do preço** (`div.rounded-lg.bg-accent`) para ter duas áreas:
   - **Topo:** badge de PROMOÇÃO + preço grande (como já é hoje).
   - **Rodapé do mesmo bloco:** uma linha divisória sutil (`border-t border-border/40`) seguida de uma faixa horizontal com Emb., Pack e Custo, cada um em formato:
     - rótulo pequeno em `text-xs uppercase text-muted-foreground`
     - valor em `text-lg font-semibold` (maior que o `text-sm` atual)
     - separação por `divide-x` ou gap generoso, distribuídos com `flex flex-wrap gap-6`
3. **Renderização condicional:** cada item só aparece se tiver valor (mantém o comportamento atual).
4. **Custo** ganha destaque visual leve — cor `text-foreground` normal, mas fica ao lado do preço para dar contexto de margem.

## Layout final do bloco de preço (esquemático)

```text
┌─────────────────────────────────────────────┐
│ [PROMOÇÃO até 20/07]                        │
│                                             │
│  R$ 29,90     R̶$̶ ̶3̶5̶,̶0̶0̶                       │
│  ─────────────────────────────────────────  │
│  EMB.     PACK     CUSTO                    │
│  CX       12       R$ 31,02                 │
└─────────────────────────────────────────────┘
```

## Fora de escopo
- Não altera a lista de resultados (linha por item).
- Não altera badges de estoque/validade (continuam abaixo do bloco de preço).
- Não altera lógica de negócio nem consulta ao Supabase.

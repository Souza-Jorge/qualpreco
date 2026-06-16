## Problema
A busca por nome limita resultados a 20 itens (`.limit(20)`) e a busca numérica limita a 5. Produtos além desse limite não aparecem.

## Ajustes em `src/routes/index.tsx`

1. **Aumentar limite da busca por nome** de 20 para 100 (suficiente sem travar a UI).
2. **Aumentar limite da busca numérica** de 5 para 50 (caso códigos/barras tenham múltiplos matches).
3. **Indicador de "mais resultados"**: se `data.length === limite`, mostrar mensagem no rodapé da lista: *"Mostrando os primeiros 100 — refine a busca para ver mais."*
4. **Lista rolável**: adicionar `max-h-[70vh] overflow-y-auto` no `Card` da lista de resultados para não estourar a tela com muitos itens.

## Sem alteração
- `ProdutoCard.tsx`, lógica de histórico, scanner e seleção continuam iguais.
- Layout compacto de uma linha por item preservado.

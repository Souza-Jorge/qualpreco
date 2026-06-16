### Objetivo
Melhorar a visualização da lista de resultados de busca (quando há múltiplos produtos), adicionando mais informações sem aumentar a altura do item, mantendo **uma linha por produto**.

### O que será ajustado
Arquivo `src/routes/index.tsx`, seção da lista de resultados (`showResultsList`).

### Mudanças detalhadas
1. **Layout horizontal compacto por item**
   - Estrutura em grid de 3 áreas: `(info) | (metadados) | (preço/ações)`
   - Altura fixa por item (~56-64px), sem quebra de linha
2. **Novas informações adicionadas**
   - **Barcode**: exibido como tag pequena (ex: `78912345`) quando disponível
   - **Unidade (`unit`)**: exibida ao lado do código
   - **Categoria (`category_name`)**: tag discreta
   - **Estoque (`stock_quantity`)**: indicador visual pequeno (verde/vermelho) — apenas cor + número
   - **Promoção ativa**: badge vermelho "PROMO" se `promo_price` estiver válido e `promo_end >= hoje`
3. **Preço enriquecido**
   - Se promoção ativa: preço original riscado + preço promo em destaque (cor de destaque)
   - Se sem promo: apenas `sale_price`
4. **Responsividade**
   - Usar `min-w-0` + `truncate` para que textos longos não quebrem linha
   - Em telas estreitas (mobile), ocultar `barcode` e `category_name` para não comprimir demais
   - Ícones do Lucide em `h-3 w-3` para economizar espaço

### O que NÃO será alterado
- O card detalhado (`ProdutoCard.tsx`) permanece igual
- O histórico de consultas permanece igual
- A lógica de busca e estado não muda

### Resultado esperado
Cada linha da lista exibe nome, código, barcode, unidade, categoria, estoque e preço (com destaque para promoção) de forma compacta, legível e sem quebra de linha.
# Campos de quantidade (CX/UN) vazios e fáceis de editar

## Objetivo
No editor de orçamento, os campos de quantidade por caixa (CX) e por unidade (UN) hoje mostram "0" preenchido. O usuário quer que comecem **vazios** e que, ao clicar/tocar no campo, o conteúdo atual seja **selecionado inteiro** para digitar a nova quantidade diretamente, sem precisar apagar antes.

## Alterações — apenas `src/components/OrcamentoEditor.tsx`

1. **Exibição vazia quando o valor é 0** (linhas ~480 e ~501):
   - CX: `value={i.caixas ? String(i.caixas) : ""}`
   - UN: `value={i.unidades ? String(i.unidades) : ""}`
   - O `placeholder="0"` existente passa a aparecer quando vazio, mantendo a dica visual.

2. **Selecionar tudo ao focar** (ambos os campos):
   - `onFocus={(e) => e.currentTarget.select()}`
   - Assim, qualquer valor existente fica selecionado e a nova digitação o substitui de uma vez.

3. **Apagar tudo volta a vazio**: ao apagar o conteúdo, `setQtdCampo` já converte vazio para `0` internamente (cálculos inalterados), e o campo volta a exibir vazio — sem comportamento estranho.

## O que não muda
- Regras de cálculo (`totalUnidades`, subtotal, PDF), gravação no banco, validações e demais telas.
- Nenhuma alteração em Supabase, rotas ou demais componentes.

## Verificação
- `npx tsgo --noEmit`
- Playwright: criar novo orçamento, adicionar produto com pack, conferir campos vazios, focar/digitar e validar o resumo `N CX + M UN = X unid`.

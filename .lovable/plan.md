# Campo de desconto: vazio por padrão, formato 0,00

## Contexto

Os campos de quantidade (CX/UN) já começam vazios com placeholder `"0"` e selecionam o conteúdo ao focar. O campo de desconto (`Desconto R$`) ainda começa preenchido com `"0"`, sem select-on-focus, e não segue o formato decimal brasileiro.

Arquivo afetado: `src/components/OrcamentoEditor.tsx`.

## Mudanças

1. **Estado inicial vazio** — `descontoTxt` passa de `useState("0")` para `useState("")`.

2. **Carga de orçamento existente** — ao carregar, se `o.desconto` for `0` (ou nulo), deixar vazio; se for maior que zero, formatar em padrão brasileiro com 2 casas (`ex.: 10,50`) usando `Number(o.desconto).toFixed(2).replace(".", ",")`.

3. **Input do desconto** — adicionar:
   - `placeholder="0,00"`
   - `onFocus={(e) => e.currentTarget.select()}` (igual aos campos CX/UN)
   - manter `inputMode="decimal"` e o `onChange` atual (já aceita vírgula).

4. **Parsing** — sem mudança: o `useMemo` em `desconto` já faz `parseFloat(descontoTxt.replace(",", "."))` e trata `NaN`/vazio como `0`. Vazio continua válido.

5. **Salvamento** — sem mudança: `calcTotais` já recebe `desconto` numérico e grava `0` quando vazio.

## Verificação

- `npx tsgo --noEmit`
- Playwright (mobile 393×852): abrir novo orçamento → campo de desconto aparece vazio com placeholder `0,00`; clicar seleciona; digitar `5,50` reflete no total; salvar funciona.

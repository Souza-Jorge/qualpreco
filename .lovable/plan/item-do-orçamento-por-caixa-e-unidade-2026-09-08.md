# Item do orçamento por caixa e unidade

## Como vai ficar

Ao escolher um produto, o item mostra:

```text
Coca-Cola 350ml                         [remover]
#12345 · 7891000  ·  Pack: 12 UN/CX
[ CX  1 ]  [ UN  6 ]   × R$ 3,39/UN        R$ 61,02
Total: 18 UN | 1 CX + 6 UN
```

- Descrição do produto com o pack logo em seguida (somente exibição, vem do cadastro do produto).
- Na mesma linha: campo CX (caixas), campo UN (unidades avulsas), preço unitário e subtotal.
- Pode usar só CX, só UN, ou os dois juntos.
- Produto sem pack: some o campo CX, fica só UN, como hoje.

## Cálculo

Quantidade total em unidades = (caixas × pack) + unidades avulsas.
Subtotal = quantidade total × preço unitário. Nada muda no total, desconto ou no restante das contas.

Exemplo: pack 12, 1 CX + 6 UN = 18 UN × R$ 3,39 = R$ 61,02.

## Onde aparece

- Tela de edição do orçamento: novos campos CX/UN.
- Visualização do orçamento e PDF: continuam mostrando "18 UN | 1 CX + 6 UN" como já está.

## Detalhes técnicos

- `src/components/OrcamentoEditor.tsx`: substituir o controle atual de quantidade (−/+ e campo único) por dois campos numéricos, CX e UN, na mesma linha; o campo "Qtde por caixa" editável sai. O pack vira texto ao lado do código. Estado do item passa a derivar `quantidade = caixas * pack + unidades`.
- `src/lib/orcamentos.ts`: `ItemLocal` ganha `caixas` e `unidades` como estado de tela; o que é salvo continua `quantidade` (unidades totais) + `quantidade_por_caixa` (pack do produto, para o histórico). Ao carregar um orçamento existente, reconstituir CX/UN a partir de quantidade e pack.
- Sem alteração em `products`, busca, scanner, autenticação, RLS ou cálculos financeiros.
- Continua necessário rodar `db/orcamento_itens_quantidade_por_caixa.sql` no banco antes de salvar itens com caixa.

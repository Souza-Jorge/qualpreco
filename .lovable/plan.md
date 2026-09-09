# Papel timbrado no PDF do orçamento

Aplicar ao PDF o mesmo layout do modelo enviado (Papel_Timbrado.docx): logo no topo à esquerda, linha divisória e, no rodapé de todas as páginas, os dados oficiais da empresa.

## Cabeçalho

- Logo Xapadão no canto superior esquerdo (o arquivo de logo já existente no projeto).
- Linha horizontal logo abaixo do logo, como no modelo.
- À direita permanecem: título "ORÇAMENTO", número, data e status.
- Sai o texto grande "XAPADÃO BEBIDAS / Orçamento de produtos" ao lado do logo, já que a identificação da empresa passa a ficar no rodapé timbrado.

## Rodapé (em todas as páginas)

Linha divisória e, centralizado, em negrito e fonte pequena:

```text
COMÉRCIO DE BEBIDAS CHAPADA D'OESTE LTDA
CNPJ. 08.859.942/0001-31            INSC. EST. 373.111.107.116
Rua Angelina Barreto Fernandes Nº. 54 – Vila Aurora, Itapevi-SP – 06657-060
TEL.: 4141-5209 - 4142-3787 – 4773-8902
```

CNPJ à esquerda e Inscrição Estadual à direita, na mesma linha, como no modelo. A numeração "Página X de Y" continua, discreta, acima ou ao lado do bloco.

## Ajustes técnicos

- Alterar apenas `src/lib/orcamento-pdf.ts`.
- Reservar mais espaço inferior (aprox. 30 mm) na margem da tabela para o rodapé timbrado não sobrepor itens.
- Recalcular as quebras de página dos blocos de totais e observação com a nova área útil.
- Nada muda em tabelas do banco, telas, compartilhamento ou geração/salvamento do arquivo.

# Fase 4 — Geração do PDF do orçamento

Gerar um PDF A4 profissional a partir de um orçamento já salvo, direto no aparelho (sem servidor), usando exatamente os valores gravados no banco.

## O que o usuário vai ver

- Na tela de detalhes do orçamento, um botão **Gerar PDF**, disponível nos três status (Rascunho, Finalizado, Cancelado).
- No navegador: o arquivo é baixado como `Orcamento-000125.pdf` (número real do orçamento).
- No aplicativo Android: o arquivo é gravado na pasta de documentos do aparelho e uma mensagem confirma onde ficou, já pronto para a etapa futura de compartilhamento.

## Conteúdo do documento

- **Cabeçalho**: logo Xapadão Bebidas, "XAPADÃO BEBIDAS", título "ORÇAMENTO", número, data de criação e status.
- **Cliente**: nome, empresa, CPF/CNPJ, telefone, e-mail — apenas os campos preenchidos; se nenhum, a seção é omitida.
- **Itens**: tabela com Código, Produto, Qtd., Preço unit. e Subtotal, com repetição do cabeçalho a cada página.
- **Totais**: Subtotal, Desconto e TOTAL em destaque.
- **Observação**: só aparece quando preenchida.
- **Rodapé**: identificação da empresa e "Página X de Y".
- Moeda em R$ com duas casas, datas em DD/MM/AAAA, quebra de página automática.

## Detalhes técnicos

- Biblioteca: `jspdf` + `jspdf-autotable` (geração no cliente, funciona igual em Web e no WebView do Android; nenhuma API externa).
- Novo arquivo `src/lib/orcamento-pdf.ts`: recebe o orçamento e os itens já carregados e devolve o documento; nenhuma consulta a `products` — preço unitário e subtotal vêm de `orcamento_itens`, e subtotal/desconto/total vêm de `orcamentos`.
- Logo: cópia reduzida do arquivo existente `site/assets/logo-xapadao.png` para `src/assets/`, importada como imagem no cabeçalho (o original tem 1,7 MB e pesaria demais no app).
- Salvamento: `src/lib/salvar-arquivo.ts` decide o destino — no navegador, download normal; no Android, `@capacitor/filesystem` (dependência nova) gravando em Documents e retornando o caminho para uso futuro no compartilhamento.
- Alteração em `src/routes/orcamentos.ver.$id.tsx`: apenas o botão e a chamada da geração; nenhuma mudança nas regras de status, edição ou nas telas existentes.
- Sem alterações no banco, na tabela `products`, na autenticação ou no RLS.

## Validação

Geração conferida em: 1 item; vários itens; com desconto; cliente incompleto; com observação; volume grande de itens com quebra de página; e nos status Rascunho, Finalizado e Cancelado — inspecionando as páginas renderizadas para checar valores, número, data, alinhamento da tabela e rodapé. Também conferir que a consulta de preços, a lista e a edição de orçamentos seguem funcionando.

## Fora do escopo desta fase

Compartilhamento nativo, WhatsApp, e-mail, API externa e conversão em pedido.

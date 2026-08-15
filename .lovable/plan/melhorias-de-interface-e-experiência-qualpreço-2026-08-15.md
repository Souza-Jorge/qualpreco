# Melhorias de interface e experiência — QualPreço

O app já busca no Supabase (tabela `products`) e já tem scanner, histórico e card de produto. O plano abaixo mantém tudo isso e melhora o que falta, sem tocar na conexão, credenciais ou estrutura da tabela.

## Nota sobre o campo "key"

A tabela `products` não tem coluna `key`. O código do produto é a coluna `codigo` (numérica), e o código de barras é `barcode`. A busca exata por código continuará usando `codigo` (e `barcode`), como já funciona hoje.

## O que será feito

### 1. Corrigir o erro que quebra o scanner
Hoje há um erro de execução ao carregar a biblioteca de leitura (`DecodeHintType` do `@zxing/library` não é um export nomeado válido na renderização do servidor). Correção: importar via default import. Sem isso, a tela pode falhar antes mesmo de abrir a câmera.

### 2. Leitor de código de barras
- Abrir direto na câmera traseira (já é a preferência atual) e pedir permissão só ao tocar no botão.
- Adicionar uma **moldura de enquadramento** visível (cantos + área escurecida em volta) para orientar onde posicionar o código.
- Manter: mensagens claras de erro em português, botão "Tentar novamente", troca de câmera, desligar a câmera ao fechar.
- Fechar sem ler não dispara nenhuma consulta (já é o comportamento).
- Após leitura bem-sucedida: preenche o campo e consulta automaticamente (já funciona).

### 3. Tela principal (mobile-first)
- Mantidos o título "Consulta de Preços" e a descrição "Busque por código, nome ou escaneie o código de barras".
- Campo de busca maior e mais confortável no celular (altura ~56px, texto 16px para evitar zoom automático do iOS), com botão de limpar.
- Botão de câmera com rótulo visível "Escanear" no celular (não só o ícone), bem destacado ao lado da busca.
- Barra de busca fixa no topo ao rolar no celular, para consultar sem voltar ao início.
- Revisão de todas as linhas com texto + elementos fixos para eliminar qualquer rolagem horizontal no celular.
- Largura máxima do conteúdo mantida e adequada no desktop.

### 4. Estados de carregamento e vazio
- Skeleton (esqueleto animado) do card durante a consulta, em vez de apenas o texto "Consultando...".
- Estado vazio ilustrado e claro quando nada é encontrado, com o termo pesquisado e sugestões ("confira o código", "tente parte do nome", "escanear").
- Estado inicial (sem busca) com dica rápida + consultas recentes, como já existe.

### 5. Resultado
- Card do produto com o **preço como maior elemento visual** (já é, mantendo o "R$" menor), destaque de promoção, nome e código bem legíveis, e código de barras exibido quando existir.
- Nova ação **"Nova consulta"** abaixo do resultado: limpa a busca e devolve o foco ao campo (com atalho Esc no desktop).
- Lista de resultados múltiplos com toque mais confortável no celular.

### 6. Desempenho
- Busca por nome continua com atraso (debounce) e limite de resultados; busca numérica dispara direto.
- Termos são limpos de espaços extras antes de consultar e consultas repetidas/idênticas em sequência são evitadas.
- Requisições antigas são descartadas quando uma nova busca começa (evita resultado fora de ordem).

## Detalhes técnicos

- `src/components/BarcodeScanner.tsx`: default import do `@zxing/library` para `DecodeHintType`; overlay de enquadramento com máscara e cantos; restante da lógica preservada.
- `src/routes/index.tsx`: header/busca sticky, botão de escanear com rótulo responsivo, skeleton de carregamento, componente de estado vazio, botão "Nova consulta", guarda de última query consultada e ref de requisição para descartar respostas obsoletas.
- `src/components/ProdutoCard.tsx`: ajustes de espaçamento/tipografia responsiva; regra de promoção e margem inalteradas.
- Nenhuma mudança em `src/integrations/supabase/client.ts`, no schema ou nas credenciais.

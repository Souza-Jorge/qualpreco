# Corrigir campo de busca invisível e busca por parte do nome

## 1. Texto digitado não aparece

O campo de busca fica dentro do cabeçalho azul, que define a cor de texto `text-primary-foreground` (branco). O `Input` não define cor própria, então herda branco sobre fundo branco — o texto digitado existe, mas fica invisível.

Correção: definir explicitamente `text-foreground` (e placeholder em `text-muted-foreground`) no campo de busca, além de garantir cor visível também no ícone e no botão de limpar.

## 2. Busca por qualquer parte do nome enquanto digita

Hoje:
- Termos só de dígitos não disparam busca automática — só ao apertar Enter — e procuram apenas código/código de barras exatos.
- Termos com letras já buscam por parte do nome com atraso de 350 ms.

Ajustes:
- Buscar automaticamente enquanto digita em todos os casos (a partir de 2 caracteres), com o mesmo atraso curto.
- Para termos numéricos: continuar priorizando código exato e código de barras exato; quando não houver correspondência exata, buscar também por parte do nome e por parte do código de barras, para não ficar sem resultado.
- Para termos com letras: manter busca por qualquer parte do nome (já é `%termo%`), ignorando maiúsculas/minúsculas, com espaços extras removidos.
- Enter continua forçando a consulta imediata; a proteção contra respostas fora de ordem e o limite de resultados permanecem.

## Detalhes técnicos

- `src/routes/index.tsx`: adicionar `text-foreground placeholder:text-muted-foreground` ao `Input`; estender o `useEffect` de debounce para também cobrir termos numéricos (mínimo 2 caracteres); em `runSearch`, no ramo numérico, fazer fallback para `ilike` em `name` e `barcode` quando a busca exata retornar vazio.
- Sem mudanças no Supabase, no schema, nas credenciais ou no scanner.

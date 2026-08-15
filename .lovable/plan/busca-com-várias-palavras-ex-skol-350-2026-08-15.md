# Busca com várias palavras (ex.: "skol 350")

Hoje a busca por nome usa o texto inteiro como um único pedaço (`nome contém "skol 350"`). Se o cadastro for "SKOL LATA 350ML" ou "CERVEJA SKOL 350ML LT", nada é encontrado, porque as palavras aparecem separadas e em outra ordem.

## Ajuste

- Dividir o que foi digitado em palavras (por espaço) e exigir que **todas** apareçam no nome, em qualquer ordem e em qualquer posição. "skol 350" passa a encontrar "CERVEJA SKOL LATA 350ML".
- Ignorar maiúsculas/minúsculas e espaços extras (já é o caso).
- Manter o atalho de código: se o termo for só dígitos, continua tentando código exato e código de barras exato primeiro; sem resultado, cai na busca por palavras.
- Quando o termo tiver várias palavras e uma delas for numérica (350, 1L, 500), ela também será tratada como parte do nome — não como código.
- Continuam valendo: busca enquanto digita (a partir de 2 caracteres), limite de resultados, ordenação por nome e descarte de respostas fora de ordem.

## Detalhes técnicos

- `src/routes/index.tsx`, ramo de busca por nome: em vez de um único `.ilike("name", "%q%")`, encadear um `.ilike("name", "%token%")` por token (encadeamento no PostgREST equivale a AND), com no máximo ~5 tokens e ignorando tokens de 1 caractere quando houver outros maiores.
- Mesmo tratamento no fallback do ramo numérico (hoje `name.ilike` / `barcode.ilike` com o termo inteiro).
- Sem mudanças no Supabase, no schema, nas credenciais ou no scanner.

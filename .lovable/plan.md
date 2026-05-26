## Plano atualizado (Supabase manual, sem Lovable Cloud)

Como você forneceu URL e anon key de um Supabase próprio, vou configurar manualmente — sem ativar Lovable Cloud nem usar server functions/admin client. A consulta será feita direto do browser com a anon key (pública, segura no frontend).

## Configuração

- Criar `src/integrations/supabase/client.ts` com `createClient` apontando para:
  - URL: `https://ztnyvrmiwmrqhquavfhl.supabase.co`
  - anon key fornecida (pública, fica no código)
- Instalar `@supabase/supabase-js` e `@zxing/browser`.

## Premissas sobre a tabela `produto`

Você confirma que a tabela já existe com os campos: `codigo` (PK / key), `nome`, `emb`, `pack`, `estoque`, `preco_custo`, `preco_venda`, `preco_promocional`, `data_fim_promocao`, `data_validade`. **Pré-requisitos no seu Supabase** (fora do que eu controlo):
- RLS habilitada com policy `SELECT` para `anon` (`USING (true)`)
- `GRANT SELECT ON public.produto TO anon`
- Recomendado: índices `btree` em `codigo` e `GIN` (pg_trgm) em `nome` para 3500 produtos

Se algum desses faltar, a busca retorna vazio/erro — me avise que te passo o SQL.

## UI (rota única `/`)

- Input de busca grande, sempre focado (compatível com leitor USB → digita + Enter)
- Auto-detecção: numérico puro → busca exata por `codigo` (`eq`); texto → `ilike` em `nome` (debounce 300ms, limite 20)
- Botão "Escanear" → Dialog com câmera (`@zxing/browser`, suporta EAN-13/8, UPC, Code128) → preenche o input e busca
- Card de resultado:
  - Preço de venda em destaque grande (azul)
  - Promoção ativa (tem `preco_promocional` e `data_fim_promocao >= hoje`): badge vermelha "PROMOÇÃO", preço promocional verde, venda riscado
  - Estoque: badge verde (>0) ou vermelha (=0)
  - Validade: alerta amarelo (<30 dias) ou vermelho (vencido)
  - Demais campos (`emb`, `pack`, `preco_custo`) em layout secundário
- Histórico das 10 últimas consultas em localStorage

## Design

Tokens em `src/styles.css` (oklch):
- `--primary` azul · `--success` verde · `--warning` amarelo · `--destructive` vermelho
- Mobile-first, input/botão touch-friendly, alto contraste

## Fora do escopo

Login, cadastro/edição de produto, carrinho.

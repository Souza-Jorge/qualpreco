## Visão geral

App responsivo, público (sem login), para consultar a tabela `produto` no Supabase (3500 registros). Busca por código (`key`), nome ou leitura de código de barras (câmera no celular ou leitor USB no desktop).

## Stack

- TanStack Start (já configurado) + Tailwind + shadcn/ui
- Lovable Cloud (Supabase) — apenas leitura pública da tabela `produto`
- `@zxing/browser` para leitura de código de barras via câmera

## Passos

1. **Ativar Lovable Cloud** e confirmar a tabela `produto` existente com os campos:
   `codigo` (key), `nome`, `emb`, `pack`, `estoque`, `preco_custo`, `preco_venda`, `preco_promocional`, `data_fim_promocao`, `data_validade`.
   - Garantir RLS com policy de `SELECT` público (`USING (true)`) e GRANT `SELECT` para `anon` e `authenticated`.
   - Criar índices: `btree` em `codigo` e `GIN` (`pg_trgm`) em `nome` para busca rápida por nome em 3500 produtos.

2. **Rota única `/` (`src/routes/index.tsx`)** com a UI de consulta:
   - Campo de busca unificado com auto-detecção:
     - Numérico puro → busca exata por `codigo`
     - Texto → busca `ilike` por `nome` (debounce 300ms, limite 20 resultados)
   - Botão "Escanear" que abre o leitor de câmera (`@zxing/browser`) em um Dialog — preenche o campo automaticamente ao detectar.
   - Suporte a leitor USB: o input fica em foco; leitores USB digitam o código + Enter, disparando a busca automaticamente.

3. **Card de resultado** mostrando todos os campos, com destaque visual:
   - Preço de venda em destaque grande
   - Se houver `preco_promocional` válido (dentro de `data_fim_promocao`): badge "PROMOÇÃO" vermelha, preço promocional verde, preço normal riscado
   - `estoque` com badge colorida (verde > 0, vermelho = 0)
   - Alerta amarelo se `data_validade` próxima (< 30 dias) ou vermelho se vencida

4. **Design system** (em `src/styles.css`) usando as 4 cores como tokens semânticos:
   - Amarelo → `--warning` (validade próxima, alertas)
   - Vermelho → `--destructive` (promoção, sem estoque, vencido)
   - Verde → `--success` (em estoque, preço promocional)
   - Azul → `--primary` (CTAs, foco, header)
   - Layout mobile-first, input grande e touch-friendly, botão de scanner proeminente.

5. **Histórico local** das últimas 10 consultas (localStorage) para acesso rápido.

## Detalhes técnicos

- Consultas via `createServerFn` usando `supabaseAdmin` (leitura pública, sem auth) com projeção explícita das colunas seguras.
- Scanner: `@zxing/browser` com `BrowserMultiFormatReader` (suporta EAN-13, EAN-8, UPC, Code128). Pedir permissão de câmera; tratar erro graciosamente.
- Detecção de leitor USB: input sempre focado quando não há modal aberto; aceita Enter para submeter.
- Sem login, sem cadastro, sem edição — somente consulta.

## Fora do escopo

- Cadastro/edição de produtos
- Carrinho ou checkout
- Autenticação

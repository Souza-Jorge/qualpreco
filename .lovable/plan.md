# Transformar botões "Ofertas" e "Orçamentos" em menu lateral (sidebar)

## Contexto
Hoje na home (`src/routes/index.tsx`) há dois botões lado a lado abaixo da barra de busca:
- **Apenas ofertas** — alterna o filtro `onlyPromo` (estado local) que mostra só produtos em promoção.
- **Orçamentos** — link (`<Link to="/orcamentos">`) para a listagem de orçamentos.

A meta é substituir esses dois botões por um **menu lateral (sidebar)** shadcn, com ícones, que funciona como navegação principal do app. No mobile (Capacitor/Android) o sidebar vira uma folha deslizante (sheet) aberta por um botão hambúrguer; no desktop ele fica fixo e recolhível.

## Decisão de design para o filtro "Apenas ofertas"
"Apenas ofertas" é um filtro de tela, não uma rota. Para virar item de menu de navegação, ele passa a ser representado por um **parâmetro de busca na URL**: `/?ofertas=1` ativa o filtro; `/` (sem o parâmetro) desativa. Assim o estado sobrevive a recarregamento e fica visível no endereço, e o item do sidebar mostra ativo quando o filtro está ligado.

## Mudanças

### 1. `src/routes/__root.tsx` — envolver o app com o Sidebar
- Importar `SidebarProvider`, `SidebarInset`, `SidebarTrigger` de `@/components/ui/sidebar`.
- Importar o novo `AppSidebar` de `@/components/app-sidebar`.
- Em `RootComponent`, envolver `<Outlet />` com `<SidebarProvider>` + layout flex:
  ```tsx
  <QueryClientProvider client={queryClient}>
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
    <Toaster />
  </QueryClientProvider>
  ```
- Usar `var(--sidebar-width)` para respeitar a largura do sidebar (fix do Tailwind 4).

### 2. `src/components/app-sidebar.tsx` — novo componente
- Sidebar com `collapsible="icon"` (recolhe a ícones no desktop; no mobile vira sheet).
- Cabeçalho com a logo Xapadão (`logoXapadao`).
- Grupo "Principal":
  - **Consultar preços** → `/` (ícone `Search`)
  - **Apenas ofertas** → `/` com search `{ ofertas: true }` (ícone `Percent`). Ativo quando a rota `/` tiver `ofertas=true`.
- Grupo "Orçamentos":
  - **Listar orçamentos** → `/orcamentos` (ícone `FileText`)
  - **Novo orçamento** → `/orcamentos/novo` (ícone `Plus`)
- Itens usam `<Link>` com `activeProps`/`activeOptions` para destacar a rota atual (via `useRouterState`).
- O item "Apenas ofertas" usa `Link to="/"` com `search` ligando/desligando `{ ofertas: true }` conforme o estado atual.

### 3. `src/routes/index.tsx` — ler o filtro da URL e remover os botões
- Adicionar `validateSearch` na rota para `{ ofertas: boolean }` (default `false`).
- Substituir o estado local `onlyPromo`/`onlyPromoRef` por `Route.useSearch()` → `ofertas`.
- `togglePromo` passa a navegar (`useNavigate`) alternando o search param `ofertas`.
- `runSearch`/`runListarPromocoes` usam o valor vindo do search param (lido via ref atualizada a cada render).
- Adicionar um `SidebarTrigger` no cabeçalho sticky (botão hambúrguer) para abrir o sidebar no mobile.
- Remover o bloco `<div className="mt-2 flex gap-2">` com os dois botões "Apenas ofertas" e "Orçamentos".
- Manter a barra de busca, o seletor de ofertas via sidebar, e o restante da UX intacto.

### 4. Ajustes de layout do conteúdo
- Como o conteúdo agora fica dentro de `SidebarInset`, garantir que o cabeçalho sticky e o `main` continuem responsivos (`max-w-3xl mx-auto`). O `SidebarInset` já provê o `flex-1`.

## Escopo / Fora de escopo
- **Muda:** `__root.tsx`, novo `app-sidebar.tsx`, `index.tsx` (URL search param + remoção dos botões).
- **Não muda:** lógica de busca, scanner, Supabase, tabelas, rotas de orçamento, PDF, auth, modo de teste, mobile/Capacitor. Funcionalidades existentes permanecem.
- **Mobile:** o sidebar em mobile é um sheet aberto pelo `SidebarTrigger`; nenhum botão some de funcionalidade — "Apenas ofertas" e "Orçamentos" ficam acessíveis pelo menu.

## Validação
- `npx tsgo --noEmit` sem erros.
- Abrir `/` no preview: sidebar visível no desktop, `SidebarTrigger` no mobile.
- Alternar "Apenas ofertas" pelo sidebar reflete na URL (`/?ofertas=1`) e filtra a lista.
- "Orçamentos" e "Novo orçamento" navegam corretamente.
- Sem overflow horizontal; logo e título preservados.

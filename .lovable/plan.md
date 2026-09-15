# Botão "Fechar app" + menu no rodapé no celular

## 1. Por que o "Fechar app" não funciona

No navegador (é onde você está testando, no preview) o próprio navegador bloqueia o
fechamento de uma aba que não foi aberta por código — por isso nada acontece.
No aplicativo Android instalado, o fechamento funciona de verdade.

Correção:
- Detectar se está rodando dentro do aplicativo Android (Capacitor) ou no navegador.
- No aplicativo: fecha normalmente.
- No navegador: tenta fechar e, se o navegador bloquear, mostra um aviso curto
  explicando que o fechamento só funciona no aplicativo instalado.
- O botão continua sem desconectar a conta (sessão preservada).

## 2. Menu no rodapé no celular

No celular o menu deixa de ser uma gaveta lateral e passa a ser uma barra fixa no
rodapé, sempre visível, com os itens principais em ícone + rótulo curto:

```text
[ Buscar ]  [ Ofertas ]  [ Orçamentos ]  [ Novo ]  [ Mais ]
```

- "Mais" abre uma folha deslizante de baixo com "Entrar"/"Sair da conta" e "Fechar app".
- O item ativo fica destacado.
- O botão de menu (hambúrguer) do cabeçalho some no celular, já que a navegação
  está sempre à mão no rodapé.
- No computador nada muda: o menu lateral continua igual.
- O conteúdo das telas ganha um espaço extra embaixo para a barra não cobrir
  nada (inclusive respeitando a área segura do celular).

## Detalhes técnicos

- Novo `src/components/mobile-nav.tsx`: barra `fixed bottom-0` (z acima do conteúdo,
  `pb-[env(safe-area-inset-bottom)]`), links TanStack com `useRouterState` para o
  estado ativo, e um `Sheet side="bottom"` para as ações de conta.
- `src/routes/__root.tsx`: renderiza `<AppSidebar />` apenas no desktop e
  `<MobileNav />` no mobile (via `useIsMobile`), com `pb-16 md:pb-0` no `SidebarInset`.
- `src/components/app-sidebar.tsx`: extrair `sair`/`fecharApp` para
  `src/lib/app-sessao.ts` e reutilizar nos dois componentes; `fecharApp` usa
  `Capacitor.isNativePlatform()` e cai em `toast` quando o navegador bloqueia.
- `SidebarTrigger` em `src/routes/index.tsx` fica `hidden md:inline-flex`.

## Verificação

- `npx tsgo --noEmit`
- Playwright 393x852: barra no rodapé visível, navegação entre itens, folha "Mais"
  com Entrar/Sair e Fechar app (aviso no navegador); 1280px: menu lateral intacto.

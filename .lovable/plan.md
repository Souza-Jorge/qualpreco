# Corrigir o CSS global no Web Preview

## Diagnóstico (verificado)

A resposta HTML do servidor (`curl http://localhost:8080/`) começa direto na `<div>` da página: não há `<html>`, `<head>`, nem a tag `<link rel="stylesheet">` do `src/styles.css`. Em `src/routes/__root.tsx` existe um componente `RootShell` (que renderiza `<html>/<head><HeadContent /></head><body>{children}<Scripts /></body>`), mas ele está comentado na definição da rota (`// shellComponent: RootShell`). Sem shell, o `head()` da rota — que inclui o `links: [{ rel: "stylesheet", href: appCss }]` — nunca é emitido, então nenhum CSS chega ao navegador na versão web/SSR.

## Correção

Alterar apenas `src/routes/__root.tsx`:

1. Ativar `shellComponent: RootShell` na definição da rota (remover o comentário).
2. Ajustar o `<html lang="pt-BR">` no shell (o app é em português).
3. Manter `HeadContent` e `Scripts` como já estão escritos no `RootShell`.

Nada mais é tocado: `src/mobile.tsx`, `vite.config.ts`, `package.json`, `src/styles.css`, rotas, Supabase e funcionalidades permanecem iguais.

## Verificação

- `curl http://localhost:8080/` deve retornar `<!DOCTYPE html>` com `<head>` contendo o `<link rel="stylesheet">` do styles.css.
- Screenshot via Playwright do preview para confirmar o visual estilizado (header azul, cards).

# Correções: menu lateral, tela inicial e botões de saída

## 1. Largura do menu (corrigir interpretação)
O pedido era **diminuir a largura do menu**, não o logo. Ações:
- Reduzir a largura do menu lateral: desktop de 12rem para ~10rem; mobile de 15rem para ~13rem (`src/components/ui/sidebar.tsx`).
- Restaurar o logo para tamanho maior/legível dentro do menu mais estreito (voltar de `h-7` para algo como `h-9`, mantendo `object-contain`), em `src/components/app-sidebar.tsx`.
- Verificar que os textos dos itens continuam sem cortes; se algum cortar, ajustar só o espaçamento.

## 2. Tela inicial: abrir mostrando ofertas
- Na abertura do app, a tela inicial já abre com a **listagem de ofertas** (filtro "Apenas ofertas" ligado por padrão).
- Implementação: `validateSearch` da rota "/" passa a tratar `ofertas` como `true` por padrão (só fica falso com `?ofertas=false` explícito).
- As duas visualizações nunca se misturam:
  - **Ofertas**: só a lista de ofertas (sem consultas recentes).
  - **Consultar preços** (menu ou `ofertas=false`): tela limpa, campo de busca focado, sem ofertas e sem lista misturada; consultas recentes só aparecem aqui se já existirem no histórico — confirmar: manter as recentes apenas nesta visão.

## 3. Botões de saída (confirmar comportamento)
As duas opções já existem no rodapé do menu. Comportamento pretendido:
- **"Sair da conta"**: encerra a sessão (login) e permanece no app, voltando para a tela inicial — o app NÃO fecha. Adicionar navegação para "/" após o sign-out.
- **"Fechar app"**: fecha o aplicativo SEM sair da conta (no Android via Capacitor `App.exitApp()`; no navegador tenta `window.close()`). A sessão permanece para a próxima abertura.
- Quando não houver sessão, mostrar "Entrar" + "Fechar app".

## Verificação
- `npx tsgo --noEmit`
- Playwright desktop (1280px) e mobile (393px): abrir app (deve mostrar ofertas), alternar para "Consultar preços" (tela limpa), conferir menu estreito sem cortes e botões do rodapé.

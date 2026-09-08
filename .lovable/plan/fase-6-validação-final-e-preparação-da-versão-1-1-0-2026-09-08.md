# Fase 6 — Validação final e preparação da versão 1.1.0

## O que será feito aqui

1. **Validação Web (automatizada)**
   - Abrir o app no navegador e percorrer: consulta de produtos, busca por código/nome/EAN, filtro de promoções, acesso a Orçamentos, criação, adição/alteração de itens, cálculos, salvamento, histórico, visualização, finalização e cancelamento.
   - Conferir geração e download do PDF e o caminho de compartilhamento do navegador (com o aviso de download quando o navegador não aceita arquivos).
   - Observação: telas que exigem login só podem ser percorridas com uma conta de teste. Se não houver sessão disponível, valido tudo o que é público e reporto o que ficou pendente.

2. **Testes do PDF**
   - Gerar PDFs de exemplo com os mesmos valores salvos e conferir número, data, dados do cliente, produtos, desconto, total, logo e quebra em várias páginas (caso com muitos itens).

3. **Verificação de regressão**
   - Conferir que preços, pesquisa, scanner, promoções, histórico e login continuam iguais; rodar a verificação de tipos e a build web.

4. **Preparação da build Android**
   - Rodar `npm run build:mobile` e `npx cap sync android` e relatar erros exatos, se houver.
   - Sem alterar applicationId, keystore, assinatura ou configuração Android existente.

5. **Versão 1.1.0**
   - Atualizar em `android/app/build.gradle`: `versionName "1.1.0"` e `versionCode 2`.
   - Criar `releases/1.1.0/VERSAO-1.1.0.txt` no mesmo formato do 1.0.0, registrando as novidades (Orçamentos, PDF, compartilhamento).

## O que não consigo fazer daqui

O APK Release assinado precisa da sua chave de assinatura, que fica no seu computador (`C:\Users\Dell\Documents\AndroidKeys\qualpreco-release.p12`). Este ambiente não tem Android SDK nem a chave, então o build final é executado por você:

```text
npm run build:mobile
npx cap sync android
cd android
gradlew.bat assembleRelease
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. Me envie o resultado (ou o erro) e eu confiro versão, versionCode, caminho e tamanho.

Nada será publicado no GitHub nesta etapa.

## Detalhes técnicos

- Alterações de arquivo previstas: `android/app/build.gradle` (apenas versionCode/versionName) e um novo `releases/1.1.0/VERSAO-1.1.0.txt`.
- Nenhuma mudança em código do app, banco, autenticação, RLS, `products` ou configuração do Capacitor.
- Verificações: `bunx tsgo --noEmit`, `bun run build`, `bun run build:mobile`, `npx cap sync android`, e navegação com Playwright em `http://localhost:8080`.

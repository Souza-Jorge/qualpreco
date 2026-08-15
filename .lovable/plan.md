# Abrir a câmera traseira ao clicar no scanner

O componente `BarcodeScanner` já pede a câmera traseira (`facingMode: { ideal: "environment" }`) ao abrir. O problema real que impede o scanner de funcionar é um erro de runtime na importação de `@zxing/library` durante o SSR:

```
Named export 'DecodeHintType' not found. The requested module '@zxing/library' is a CommonJS module...
```

O Vite (SSR) não consegue resolver os named exports `BarcodeFormat`/`DecodeHintType` do pacote CommonJS `@zxing/library`, o que derruba a renderização do servidor e pode impedir o componente de carregar.

## O que será feito

1. **Corrigir o import do `@zxing/library`** em `src/components/BarcodeScanner.tsx`:
   - Importar `BarcodeFormat` a partir de `@zxing/browser` (que já reexporta e funciona no SSR).
   - Importar `DecodeHintType` via default import de `@zxing/library` (`import zxingLibrary from "@zxing/library"; const { DecodeHintType } = zxingLibrary;`), evitando o erro de named export CommonJS.

2. **Confirmar o comportamento da câmera traseira**: a regra atual `facingMode: { ideal: "environment" }` já abre a câmera traseira quando disponível, com fallback para qualquer câmera. Sem mudança necessária na lógica de câmera.

3. Verificar o build/tipo após a edição.

## Detalhes técnicos

`@zxing/browser@0.2.0` reexporta `BarcodeFormat` mas não `DecodeHintType`. O default import contorna a limitação de named exports de módulos CommonJS no SSR do Vite.

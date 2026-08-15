# Abrir a câmera traseira direto ao tocar em "Escanear"

O scanner atual (`src/components/BarcodeScanner.tsx`) já abre a câmera automaticamente, sem etapa de seleção, e já prefere a traseira. O ajuste é refinar essa mesma implementação — não haverá um segundo scanner nem mudanças na busca/Supabase.

## Ajustes

1. **Preferência mais firme pela traseira**: tentar `facingMode: { exact: "environment" }` primeiro; se falhar, `{ ideal: "environment" }`; se falhar, qualquer câmera (`video: true`). Assim o Android/iPhone abre na traseira sem o usuário escolher, e notebooks com uma webcam só continuam funcionando.
2. **Aguardar o vídeo estar pronto** antes de marcar como "rodando", evitando o quadro preto entre a abertura do diálogo e o primeiro frame (a animação do diálogo pode montar o vídeo depois do pedido da câmera).
3. **Navegador sem suporte**: se `navigator.mediaDevices.getUserMedia` não existir, mostrar mensagem clara em português ("Este navegador não suporta leitura pela câmera — digite o código na busca") em vez de erro genérico.
4. **Liberar a câmera de forma garantida ao fechar**: além de parar o leitor e as trilhas do `srcObject`, guardar o `MediaStream` obtido numa ref e pará-lo também no fechamento, no Esc/clique fora, na detecção bem-sucedida e ao desmontar — para o indicador de câmera ativa sumir na hora.
5. **"Trocar câmera" discreto**: manter o botão só quando houver 2+ câmeras, como link/ícone discreto no canto do vídeo, nunca bloqueando o início.
6. **Enquadramento**: manter a moldura com máscara e cantos já existente, exibida também durante o "Iniciando câmera..." para não piscar.

Sem alteração: detecção automática, preenchimento do campo e consulta após leitura, fechar sem consultar, mensagens de permissão negada/câmera em uso, e toda a lógica de produtos.

## Detalhes técnicos

- `src/components/BarcodeScanner.tsx`: cadeia de tentativas de constraints numa função `iniciar(constraints[])`; `streamRef` para o `MediaStream`; `video.onloadedmetadata`/`await video.play()` antes de `setStatus("running")`; guarda de suporte a `mediaDevices`; enumeração de dispositivos só depois da permissão concedida.
- Nenhuma mudança em `src/routes/index.tsx`, no cliente Supabase ou no schema.

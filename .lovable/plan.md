# Corrigir o scanner de código de barras

Hoje o botão de escanear abre a janela, mas o vídeo fica preto/estático. O log do navegador mostra o erro real: `NotFoundError: The object can not be found here` — a câmera nunca chegou a ser aberta, e o componente não avisa nada na tela, então parece "travado".

## Causas a corrigir

1. A câmera é pedida sem nenhuma preferência (`decodeFromVideoDevice(undefined, ...)`), então em celular pode escolher a câmera frontal ou nenhuma; em desktop sem webcam falha direto.
2. Quando falha, o erro só vai para o console: a janela continua aberta com um quadrado preto e sem explicação.
3. Não há aviso quando a permissão foi negada, quando o dispositivo não tem câmera, ou quando a página não está em HTTPS (a câmera só funciona em HTTPS ou localhost).
4. Dentro da pré-visualização em iframe a câmera pode estar bloqueada; é preciso testar/abrir em nova aba.

## O que será feito

- Pedir a câmera traseira explicitamente (`facingMode: environment`), com queda para qualquer câmera disponível caso não exista traseira.
- Mostrar estados claros na janela: "Iniciando câmera...", vídeo ao vivo, ou mensagem de erro em português com botão "Tentar novamente".
- Mensagens específicas por tipo de falha: permissão negada, nenhuma câmera encontrada, câmera em uso por outro app, contexto não seguro (HTTP).
- Se houver mais de uma câmera, permitir alternar entre elas.
- Garantir que a câmera é totalmente desligada ao fechar a janela (parar as trilhas do stream, não só o controle do leitor).
- Manter o leitor físico USB/Bluetooth como está: continua funcionando sem a câmera.

## Detalhes técnicos

- `src/components/BarcodeScanner.tsx`: trocar por `BrowserMultiFormatReader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, videoEl, cb)`; guardar `controls` e também o `MediaStream` do `video.srcObject` para `getTracks().forEach(t => t.stop())` na limpeza.
- Estado local `status: "idle" | "starting" | "running" | "error"` + `errorMsg`, mapeando `err.name` (`NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`) para textos em português.
- Enumerar dispositivos com `BrowserCodeReader.listVideoInputDevices()` após obter permissão para popular o seletor de câmera.
- Restringir os formatos lidos (EAN-13, EAN-8, UPC-A, UPC-E, CODE-128, ITF) via `DecodeHintType.POSSIBLE_FORMATS` para leitura mais rápida e menos falsos positivos.
- Nenhuma mudança na busca de produtos nem no banco de dados.

Observação: se o dispositivo de teste realmente não tiver câmera (caso comum ao testar no desktop dentro da pré-visualização), o resultado esperado passa a ser uma mensagem clara em vez de uma tela preta — o teste real deve ser feito no celular pela URL publicada.

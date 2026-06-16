## Problema

Leitor de mão (USB/Bluetooth) funciona como um teclado: digita os dígitos muito rápido e envia `Enter` no final. Hoje isso só funciona se o campo de busca estiver focado. Quando o usuário está vendo um produto selecionado, no histórico, ou clicou em outro lugar, o foco se perde e o "tiro" do leitor não dispara nada.

## Solução

Adicionar um **listener global de teclado** em `src/routes/index.tsx` que detecta o padrão típico de um leitor de mão e dispara a busca, independente do foco.

### Como detectar leitor vs digitação humana

- Buffer acumula teclas; cada tecla zera um timer.
- Se chegarem **vários caracteres em < ~30 ms entre teclas** e terminar com `Enter`, é leitor.
- Aceita apenas caracteres imprimíveis (dígitos/letras/`-`).
- Ignora se o foco já estiver em `<input>`, `<textarea>` ou campo editável (deixa o fluxo normal do form cuidar).
- Ignora se um `Dialog` estiver aberto (scanner de câmera, etc.).

### Comportamento ao detectar

1. Limpa o buffer.
2. Seta `query` com o código lido.
3. Chama `runSearch(code)` imediatamente (sem esperar o debounce).
4. Foca o input para feedback visual.

### Detalhes técnicos

- `useEffect` em `Index()` registra `window.addEventListener("keydown", …)` e remove no cleanup.
- Estado via `useRef` (buffer, timestamp da última tecla) para não causar re-renders.
- Limiares: `MAX_INTERKEY_MS = 30`, `MIN_LENGTH = 4` (evita falso positivo de duas teclas rápidas humanas).
- Não mexe em `BarcodeScanner.tsx` (câmera continua igual) nem no form atual (digitação manual + Enter continua funcionando).

### Arquivos alterados

- `src/routes/index.tsx` — apenas adicionar o `useEffect` global e os refs.

Nenhuma mudança em backend, schema ou outros componentes.
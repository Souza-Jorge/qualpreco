# Destravar o scanner de código de barras

Ao tocar em "Escanear" a janela abre e fica em "Iniciando câmera..." para sempre. O componente só sai desse estado em dois casos: quando o vídeo fica pronto ou quando a câmera dá erro. Hoje existem caminhos em que nenhum dos dois acontece — a tela fica presa no spinner sem mensagem nenhuma.

Diagnóstico ainda não confirmado no dispositivo real (o ambiente de teste não tem câmera). O primeiro passo do trabalho é instrumentar e confirmar; as correções abaixo cobrem os caminhos que podem travar.

## Correções

1. **Tempo limite de segurança**: se em ~12s a câmera não estiver transmitindo, sair de "Iniciando câmera..." e mostrar erro em português com "Tentar novamente", em vez de girar indefinidamente.
2. **Evitar reinício em laço**: a troca automática para a câmera traseira altera o `deviceId`, o que reinicia todo o efeito. Se essa troca puder acontecer de novo a cada reinício, o scanner nunca estabiliza. A troca automática passa a acontecer no máximo uma vez por abertura e só quando a câmera traseira encontrada for diferente da atual.
3. **Não depender de eventos que podem não disparar**: além de `loadeddata`, considerar o vídeo pronto quando houver dimensões (`videoWidth > 0`) ou quando `play()` resolver; usar polling curto como rede de segurança em vez de esperar um único evento.
4. **Marcar como rodando assim que houver stream**: se o stream de vídeo já está ativo, mostrar a imagem e o estado "rodando" imediatamente; a espera pelo primeiro frame deixa de bloquear a interface.
5. **Mensagem de ajuda em caso de bloqueio**: quando o travamento for por câmera bloqueada dentro da pré-visualização em iframe, informar que é preciso abrir o app em uma aba/URL publicada.
6. **Diagnóstico**: logar no console o estágio alcançado (constraint aceita, stream obtido, vídeo pronto) para identificar o ponto exato caso ainda trave no seu aparelho.

Sem mudanças na busca, no card de produto, no banco ou nas credenciais.

## Detalhes técnicos

- `src/components/BarcodeScanner.tsx`: `esperarVideoPronto` com corrida entre `loadeddata`, `playing`, checagem de `videoWidth` e timeout; `setStatus("running")` disparado pelo primeiro que ocorrer; timeout global (`watchdogRef`) que leva a `status="error"`; `autoSelecionadaRef` garantindo troca única; limpeza de todos os timers em `stopCamera` e no cleanup do efeito.

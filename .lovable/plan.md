# Fase 5 — Compartilhamento do PDF

Adicionar o compartilhamento do PDF do orçamento usando os recursos nativos do aparelho, sem mudar nada do que já funciona.

## O que o usuário vai ver

Na tela de detalhes do orçamento, duas ações lado a lado:

```text
[ Gerar PDF ]   [ Compartilhar PDF ]
```

- **Compartilhar PDF** é o botão principal (destacado), pensado para o celular.
- No aparelho Android: abre o menu de compartilhamento do sistema com o PDF em anexo — o usuário escolhe WhatsApp, Gmail, Outlook ou outro app. Nada é enviado automaticamente; cancelar volta ao QualPreço sem mensagem de erro.
- No navegador: se ele permitir compartilhar arquivos, abre a janela de compartilhamento com o PDF. Se não permitir, o arquivo é baixado e aparece o aviso "Arquivo baixado. Compartilhe manualmente."
- Mensagens durante o processo: "Gerando PDF..." e "Preparando arquivo...". Em caso de falha: "Não foi possível compartilhar o PDF. Tente gerar o PDF novamente." — sem termos técnicos.
- Disponível nos três status (Rascunho, Finalizado, Cancelado), como o botão de gerar.

## Detalhes técnicos

- Nova dependência: `@capacitor/share` (v8, compatível com o Capacitor 8 já usado). Nenhuma mudança em `capacitor.config.ts`; o `FileProvider` e o `file_paths.xml` do projeto já cobrem o diretório de cache usado.
- Novo `src/lib/compartilhar-pdf.ts`: recebe o `jsPDF` já pronto e o nome do arquivo, e decide o caminho:
  - Android: grava em `Directory.Cache` via `@capacitor/filesystem` (reaproveitando a lógica de `salvar-arquivo.ts`) e chama `Share.share({ files: [uri] })`.
  - Web: monta um `File` a partir do `doc.output("blob")` e usa `navigator.share` quando `navigator.canShare({ files })` for verdadeiro; caso contrário, chama o download já existente e devolve o resultado "baixado".
  - Cancelamento do usuário é detectado e tratado como silêncio (sem toast de erro).
- `src/lib/salvar-arquivo.ts`: pequena extensão para aceitar o diretório de destino (Documents no "Gerar PDF", Cache no compartilhamento). O comportamento atual de download/gravação permanece idêntico.
- `src/lib/orcamento-pdf.ts`: sem alterações.
- `src/routes/orcamentos.ver.$id.tsx`: os dois botões em uma linha, estado de carregamento próprio para cada ação e as mensagens acima.
- Sem alterações em banco, `products`, autenticação, RLS, busca, scanner ou lista de orçamentos.

## Validação

No navegador: gerar PDF, compartilhar quando suportado e conferir o caminho de download quando não houver suporte a arquivos; conferir os avisos de progresso e erro. Conferir que a consulta de preços, o scanner, a lista de orçamentos e a geração do PDF continuam funcionando.

O teste no Android Release (menu nativo, WhatsApp como anexo, cancelamento) precisa ser feito por você no aparelho após gerar a nova versão — não consigo executar o app Android daqui.

## Fora do escopo

Envio automático, API do WhatsApp, API de e-mail, cadastro de clientes e conversão em pedido.

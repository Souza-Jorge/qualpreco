# Remover logo duplicado do cabeçalho

## O que muda
Remover o `<img>` da logo do Xapadão do cabeçalho azul em `src/routes/index.tsx` (linhas 311-315), pois ela já aparece no topo do menu lateral. A barra de cabeçalho passa a ter apenas o botão de menu e o título "Consulta Preços e Gere Orçamentos".

## Detalhe técnico
- Excluir o `<img src={logoXapadao.url} ...>` (linhas 311-315).
- Remover o divisor vertical do `<h1>` (`border-l border-primary-foreground/30 pl-4`) já que não há mais elemento à esquerda para separar.
- Manter o `SidebarTrigger` e o título.
- Remover o import `logoXapadao` se não for usado em mais nenhum lugar do arquivo.

## Nada mais muda
Sem alterar sidebar, busca, ofertas, orçamentos ou qualquer outra funcionalidade.

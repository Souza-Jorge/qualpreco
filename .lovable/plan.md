# Sugestões de Melhoria — QualPreço

Após revisar todo o código e testar o app (mobile e desktop), identifiquei melhorias em três áreas: **texto/SEO**, **recursos** e **interface**. Você escolhe quais implementar.

---

## 1. Texto e SEO (inconsistências e tradução)

### 1a. Título inconsistente entre tela e meta tags
- O `<h1>` diz **"Consulta Preços e Gera Orçamentos"** (linha 312), mas as meta tags `title` e `og:title` ainda dizem **"Gere Orçamentos"** (linhas 34 e 40). Hoje o Google e o compartilhamento mostram um texto diferente do título da tela.
- **Correção:** unificar para o mesmo texto em todos os lugares.

### 1b. Páginas 404 e de erro em inglês
- `__root.tsx` tem "Page not found", "The page you're looking for doesn't exist", "This page didn't load", "Something went wrong on our end", "Try again", "Go home" — tudo em inglês num app 100% em português.
- **Correção:** traduzir para pt-BR ("Página não encontrada", "Voltar ao início", etc.).

### 1c. Meta tags genéricas do Lovable no `__root.tsx`
- `title: "Lovable App"`, `description: "Lovable Generated Project"`, `author: "Lovable"`, `twitter:site: "@Lovable"`. Isso aparece quando alguém compartilha a raiz do site.
- **Correção:** trocar por metadados reais do QualPreço.

### 1d. Gramática do título
- "Consulta Preços e **Gera** Orçamentos" mistura imperativo ("Consulta") com indicativo ("Gera"). O correto seria "Consulta Preços e **Gere** Orçamentos" (ambos imperativos). *Nota: você mudou para "Gera" num edit visual anterior — confirmar se prefere manter ou voltar para "Gere".*

---

## 2. Recursos (funcionalidades novas)

### 2a. Página de download (/site) desatualizada
- Ainda mostra **versão 1.0.0** e não menciona o módulo de Orçamentos, que agora é a principal novidade do app (v1.1.0).
- **Correção:** atualizar versão para 1.1.0, adicionar "Geração de orçamentos com PDF" na lista de recursos, e atualizar o link do APK para a release 1.1.0.

### 2b. Botão "Adicionar ao orçamento" no resultado de consulta
- Hoje, ao consultar um produto, não há como levá-lo direto para um orçamento. O usuário precisa abrir "Novo orçamento" e buscar de novo.
- **Sugestão:** adicionar um botão "Adicionar ao orçamento" no `ProdutoCard` que abre o editor de orçamento com o produto pré-carregado.

### 2c. Promoções do dia na tela inicial
- A tela inicial vazia mostra só "Comece uma consulta". Poderia mostrar as promoções ativas como ponto de partida, já que o usuário tem o filtro "Apenas ofertas" no menu.
- **Sugestão:** quando não há busca ativa, carregar automaticamente as promoções do dia abaixo do histórico, com um título "Promoções ativas hoje".

### 2d. Compartilhar preço do produto
- Não há como compartilhar/copiar o preço de um produto consultado (ex.: enviar pelo WhatsApp).
- **Sugestão:** botão "Compartilhar" no `ProdutoCard` que usa `navigator.share` (texto com nome + preço).

---

## 3. Interface (polimento visual)

### 3a. Placeholder cortado no mobile
- No celular, o placeholder do campo de busca aparece cortado: "Código, nome ou cód...". 
- **Correção:** encurtar para "Código ou nome" no mobile, mantendo o completo no desktop.

### 3b. Rodapé informativo
- O app não tem rodapé. Um rodapé discreto com "QualPreço · Xapadão Bebidas · v1.1.0" daria identidade e mostrará a versão.
- **Sugestão:** adicionar rodapé fixo discreto no final da tela de consulta.

---

## Recomendação de prioridade

| Pri | Item | Impacto |
|-----|------|---------|
| Alta | 1a (meta tags inconsistentes) | SEO e compartilhamento |
| Alta | 1b (404/erro em inglês) | Experiência |
| Alta | 1c (meta genéricas Lovable) | SEO/identidade |
| Alta | 2a (site desatualizado) | Download correto |
| Média | 3a (placeholder cortado) | Mobile |
| Média | 2c (promoções na home) | Engajamento |
| Baixa | 1d (gramática) | Estilo |
| Baixa | 2b (add ao orçamento) | Novo fluxo |
| Baixa | 2d (compartilhar preço) | Conveniência |
| Baixa | 3b (rodapé) | Identidade |

---

**Próximo passo:** me diga quais itens deseja implementar (ex.: "faça 1a, 1b, 1c e 2a") e eu executo tudo na sequência.

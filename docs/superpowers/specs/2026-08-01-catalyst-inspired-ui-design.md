# Design: UI/UX inspirada no Catalyst (CarreiraPRO)

## Contexto e restrição de licenciamento

O usuário pediu para replicar a experiência do [Catalyst](https://catalyst-demo.tailwindui.com/), kit de aplicação do Tailwind Plus. O Catalyst é um produto comercial (não open source) e o usuário **não possui licença**. Portanto este design **não copia o código-fonte proprietário do Catalyst** — implementa uma linguagem visual e estrutural *inspirada* no espírito do Catalyst (sidebar com menu do usuário no rodapé, paleta neutra, itens de navegação como "pill", ausência de topbar fixa no desktop), construída inteiramente com Tailwind v4 + shadcn já presentes no projeto.

Se o usuário adquirir uma licença do Tailwind Plus no futuro, os componentes originais do Catalyst podem ser integrados diretamente — mas isso está fora do escopo deste design.

## Escopo

**Shell de navegação + componentes de página**, aplicado ao app existente (Next.js 16 + Tailwind v4 + shadcn), preservando toda a lógica/dados atuais (mock store, rotas, `useRequireAuth`, etc.). Nenhuma página é reescrita do zero — o restyle acontece principalmente via tokens de design e nos componentes de shell compartilhados; páginas e cards herdam o novo visual automaticamente por já serem 100% token-driven.

## Decisões

1. **Paleta:** substituir a identidade verde atual por uma paleta neutra (zinc), no espírito Catalyst. Cor deixa de ser usada em elementos estruturais (botão primário, item ativo) e fica reservada para estados semânticos (erro já existe via `--destructive`; sucesso não existe hoje e não será criado sem necessidade real).
2. **Navegação mobile:** mantém o `BottomNav` fixo (decisão do usuário — melhor ergonomia para uso prolongado tipo "save" de carreira). O padrão Catalyst de navegação 100% via sheet lateral não é adotado no mobile.
3. **Seletor de contexto:** adicionar um seletor de carreira ativa no topo da sidebar (equivalente ao seletor de workspace/team do Catalyst), aproveitando o conceito de "carreiras" que já existe no domínio do app.
4. **Menu do usuário:** migra do Topbar (canto superior direito) para o rodapé da sidebar (avatar + nome + email + chevron), como no Catalyst.
5. **Topbar:** deixa de existir como barra fixa no desktop. No mobile vira um header fino, só com botão de menu (abre o Sheet com a sidebar completa).

## Componentes afetados

### `src/app/globals.css`
Tokens de cor (`--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--ring`, e equivalentes em `--sidebar-*`) trocados de oklch verde para oklch zinc/neutro, em light e dark mode. `--destructive` mantido. Radius mantido (já está próximo do padrão Catalyst).

### `src/components/shared/Sidebar.tsx`
Reestruturado em três blocos:
- **Topo:** `CareerSwitcher` (novo componente) no lugar da logo estática.
- **Meio:** nav atual (`NAV_ITEMS`), item ativo como pill neutro (`bg-zinc-950/5` light / `bg-white/10` dark) em vez do highlight verde atual.
- **Rodapé:** menu do usuário (avatar, nome, email, badge de plano, dropdown com Configurações/Sair) — lógica migrada do `Topbar.tsx` atual.

### `src/components/shared/CareerSwitcher.tsx` (novo)
Botão/dropdown no topo da sidebar. Mostra a carreira ativa quando a rota atual está dentro de `/careers/[careerSlug]/*` (via `usePathname`), ou um estado neutro ("CarreiraPRO") nas demais rotas. Lista as carreiras do `useMockData()` e permite trocar; inclui atalho para "Minhas Carreiras".

### `src/components/shared/Topbar.tsx`
Simplificado: sem menu de usuário (migrado pra sidebar). Sem barra visível no desktop. No mobile, header fino com botão de menu que abre o `Sheet` existente contendo `SidebarNav`.

### `src/components/shared/BottomNav.tsx`
Sem mudança estrutural — herda a paleta neutra automaticamente pelos tokens.

### `src/components/ui/card.tsx`
Hover state trocado de `hover:shadow-md` para `hover:ring-foreground/20` (cards não "flutuam" no hover, só a borda escurece — padrão Catalyst).

### Demais componentes (`Badge`, `DropdownMenu`, `Avatar`, `Dialog`, `Sheet`, `CareerCard`, `TransferCard`, `ArticleCard`, etc.)
Não são reescritos individualmente — herdam a nova paleta automaticamente por serem token-driven. Revisão pontual apenas se, durante a implementação/verificação visual, algum contraste quebrar ou for encontrada cor hardcoded fora dos tokens (ex. `text-green-*`/`bg-green-*` literal em vez de `text-primary`/`bg-primary`).

## Fora de escopo

- Reescrever páginas individuais (dashboard, mercado, configurações, timeline, etc.) além do que os componentes de shell/tokens já propagam.
- Adotar o padrão de navegação mobile 100% sheet do Catalyst (BottomNav é mantido).
- Copiar código-fonte do Catalyst (sem licença).
- Criar estados semânticos de cor (ex. "sucesso") que não têm uso real hoje no app.

## Verificação

Após implementar, rodar o dev server e conferir visualmente: sidebar (desktop), sheet mobile, dropdown do `CareerSwitcher`, dropdown do usuário no rodapé da sidebar, dashboard e página de carreiras em light e dark mode.

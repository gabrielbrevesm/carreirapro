# Design: Loading animado, imagem editorial em destaque e Contatos (chat com personagens)

## Contexto

Após a entrega dos 5 personagens paralelos (Diretor Esportivo, Presidente, Auxiliar Técnico,
Departamento Médico, Capitão), o usuário testou o fluxo real e pediu 6 ajustes de experiência:

1. Loading mais interessante na criação da 1ª carreira (onboarding).
2. A imagem editorial demora muito e aparece separada da matéria — melhorar a percepção.
3. O componente de imagem é pequeno demais — precisa parecer uma foto de jornal, com zoom.
4. Acesso às interações com personagens deve estar no menu principal, no lugar de "Mercado",
   chamado "Contatos".
5. Cada personagem precisa de uma foto de perfil.
6. A interação com personagens deve funcionar como um chat de WhatsApp: uma resposta do
   usuário, uma resposta do personagem, depois trava até a próxima fala espontânea dele.

Decisões confirmadas com o usuário antes deste design:
- A tela de Mercado (feed de rumores) é **removida** do app por ora.
- Contatos tem um **switcher de carreira** — cada carreira mostra só os seus próprios contatos.
- As fotos dos personagens são **geradas uma vez por IA** (ilustração fixa por papel, reaproveitada
  para sempre — não é regerada por carreira).

## Escopo

Ajustes de UX/experiência sobre a base já existente de personagens paralelos e do pipeline de
imagem. Não inclui: paralelizar geração de imagem com o texto da matéria (mudaria a arquitetura
do pipeline — a imagem depende do texto final já pronto), nem permitir mais de uma troca de
mensagem por gatilho de personagem.

## 1. Loading animado no onboarding

Novo componente `src/components/shared/GoalKickLoader.tsx`: SVG + CSS keyframes (sem
dependências novas) de um jogador chutando a bola repetidamente em direção a um gol, em loop.
Substitui o spinner genérico em:
- `onboarding/page.tsx`, step `generating`.
- Estado `sending` do hub da carreira ("Escrevendo a matéria...").

## 2 e 3. Imagem editorial: componente "jornal" + loading em etapas

Novo componente `src/components/article/EditorialPhoto.tsx`, substituindo o `<img>` pequeno
atual em `ArticleRenderer`:
- Ocupa a largura total do artigo, proporção 2:3 (igual à geração real, 1024x1536), com moldura
  estilo jornal (borda + legenda usando o headline, como legenda de foto).
- Estado `generating`: mensagens sequenciais que trocam a cada poucos segundos, refletindo os 3
  estágios reais do pipeline (Brief Editorial → Diretor de Arte → Geração da imagem) — melhora a
  percepção de progresso sem mudar o tempo real (~20-40s, 3 chamadas de IA sequenciais).
- Clique na imagem pronta abre um lightbox (`Dialog` do shadcn) com a imagem em tamanho grande.

## 4. Tela "Contatos" (substitui Mercado)

- `NAV_ITEMS`: remove a entrada "Mercado" (`/market`), adiciona "Contatos" (`/contacts`).
- Página `/market` e o feed de rumores (`market-seed.ts`, `state.market`) são removidos.
- Rotas novas:
  - `/contacts` → redireciona para `/contacts/[slug]` da carreira mais recente (ou estado vazio
    "crie uma carreira" se não houver nenhuma).
  - `/contacts/[careerSlug]` → lista de contatos daquela carreira (personagens que já falaram),
    estilo WhatsApp: avatar, nome, última mensagem, badge de não lida, horário. Inclui um
    switcher de carreira no topo (mesmo padrão do `CareerSwitcher`) para trocar sem passar pelo
    hub — cada carreira mostra só os seus próprios contatos.
  - `/contacts/[careerSlug]/[characterId]` → tela de conversa (seção 6).
- Rotas antigas `/careers/[slug]/characters` e `/careers/[slug]/character/[messageId]` são
  removidas; o ícone de "bastidores" no cabeçalho do hub da carreira também sai. A notificação
  (toast) passa a levar direto para `/contacts/[slug]/[characterId]`.

## 5. Fotos dos personagens

Script único `scripts/generate-character-avatars.ts` (rodado uma vez agora, fora do runtime),
usando `client.images.generate` (mesma infra já configurada) para gerar 5 ilustrações de perfil,
salvas em `public/characters/{characterId}.png`. `CHARACTER_META` ganha `avatarUrl`, usado nos
avatares do chat e nas notificações.

## 6. Chat com personagens (WhatsApp-like)

- `CharacterMessage` ganha 4 campos opcionais: `userReply`, `userReplyAt`, `characterResponse`,
  `characterResponseAt` (todos `string | null`).
- Regra de trava: o composer só fica ativo quando a **última** `CharacterMessage` daquele
  personagem na carreira tem `userReply === null`. Ao responder, o app chama a IA (prompt siloed
  do personagem + mensagem original + resposta do usuário) para gerar `characterResponse`; depois
  disso o composer trava até a próxima fala espontânea (novo gatilho de evento).
- Nova rota `/api/characters/reply` (mesma família de `/api/characters/generate`) +
  `tryGenerateCharacterReplyWithAI` em `client-api.ts` + fallback mock simples.
- `/contacts/[careerSlug]/[characterId]`: header com avatar+nome, histórico de todas as
  `CharacterMessage` daquele personagem renderizado como conversa contínua (bolha do personagem →
  bolha do usuário → bolha de resposta, em ordem cronológica), composer no rodapé (desabilitado
  com texto explicativo quando travado).

## Fora de escopo

- Paralelizar geração de imagem com o texto da matéria.
- Múltiplas trocas de mensagem por gatilho (a regra é sempre 1 resposta → 1 retorno → trava).
- Fotos de personagem diferentes por carreira (ficam fixas por papel).

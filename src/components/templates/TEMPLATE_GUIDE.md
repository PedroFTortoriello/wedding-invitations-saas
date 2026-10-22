# Guia de um modelo de convite (Noivar)

Como um modelo de site/convite é construído, o que ele recebe e o que precisa
cumprir. Vale para os 30 modelos da biblioteca e para qualquer modelo novo.

## 1. Arquivos e registro

```
src/lib/templates/catalog.ts                 id, nome, família, descrição, swatch, fontes, shows, giftAspect, demoShoot
src/components/templates/registry.tsx        id -> componente (next/dynamic: um chunk por modelo)
src/components/templates/<id>/<Nome>Template.tsx   "use client", export function <Nome>Template({ wedding })
src/components/templates/<id>/<id>.module.css      todo o estilo do modelo, escopado em .template
```

Modelo novo = uma entrada no catálogo + uma linha no registry + a pasta. Nada mais:
rota pública (`/casamento/[slug]`), demo (`/modelo/<id>/helena-e-lucas`), editor,
onboarding, IA, admin e vitrine leem o catálogo. O teste `tests/template-catalog.test.ts`
confere a coerência.

O componente recebe `{ wedding: WeddingSite }` (src/types/wedding.ts) e devolve um
`<main className={styles.template}>` completo. Roda no servidor (SSR do site público)
e no cliente (prévia ao vivo do editor, que re-renderiza a cada tecla): sem efeitos
colaterais no render, sem `window` fora de `useEffect`.

## 2. O que renderizar (todos os dados vêm de `wedding`; nada fixo no layout)

| Seção | Campos | Regra |
| --- | --- | --- |
| Nav | `monogram`, âncoras das seções | opcional; se existir, some no celular atrás de um botão "Menu" |
| Capa (hero) | `coupleNames`, `weddingDateLabel`, `weddingTime`, `locations[0].venue/city`, `heroImage` | `heroImage` pode estar vazia: a capa precisa continuar completa e bonita só com tipografia/ornamento. `min-height: calc(100svh - var(--demo-bar-h, 0px))` para a barra da demo não cobrir a data |
| Convite | `invitationWords` (lista de palavras), `welcomeText` | palavras podem ser 3 ou 12; texto de 1 a 4 frases |
| História | `storyEyebrow`, `storyTitle`, `storyMoments[]` (`number`, `title`, `headline` com `\n`, `description`) | fotos dos capítulos: `storyImage(gallery, i)` de `shared/gallery`; `headline` pode ser vazia (site novo): não deixe um bloco em branco |
| Contagem | `weddingDate` (ISO) | `useCountdown` de `shared/motion`; sem data válida, mostre só a legenda |
| Programação | `detailsTitle`, `detailsSubtitle`, `schedule[]` (`time`, `title`, `note?`) | `program(wedding)` do kit; lista vazia = seção não aparece (nunca inventar horários) |
| Local | `locations[0]` (`venue`, `city`, `address?`, `note`, `mapUrl`) | `mainLocation(wedding)` null = seção não aparece. Mapa: `<iframe src={mapEmbedUrl(loc)} loading="lazy">` + link `mapLink(loc)` |
| Informações | `detailCards[]` ativos (`title`, `subtitle`, `body`, `image`) | `activeCards(wedding)`; vazio = sem seção |
| Presentes | `gifts[]` | `<GiftRegistry wedding={wedding} variant="inherit" />` dentro de uma `<section id="presentes">` sua; `activeGifts(wedding).length === 0` = sem seção |
| Galeria | `gallery[]` | `galleryRest(wedding)` (tira hero e fotos da história); vazio = sem seção; lightbox com `kit/Lightbox` |
| Confirmação + recados | `rsvp` | `<GuestForms wedding={wedding} variant="inherit" mode="both" sectionId="confirmar" />` (ele já some quando `rsvp.enabled` é false e cuida da demo). Se o modelo tiver um RSVP próprio, use `GuestNameField` no campo de nome e `mode="messages"` no GuestForms |
| Encerramento | `finalText`, `footerImage` (opcional) | `footerImage` vazia = composição só com texto |
| Rodapé | `footerText`, `monogram`, `coupleNames`, `weddingDateLabel`, cidade, "Feito com Noivar" | |

Casos de borda obrigatórios: nomes longos ("Maria Fernanda Albuquerque & João Pedro
Cavalcanti de Souza": use `nameScale()` para reduzir a escala, `text-wrap: balance`,
`overflow-wrap: anywhere`; nunca cortar), sem `&` nos nomes (`splitCouple` devolve o
nome inteiro e ""), campos opcionais vazios, textos longos (parágrafos de 600
caracteres), endereços longos, galeria com 0, 1, 3 ou 20 fotos, 360px de largura.

Demo: `isDemoWedding(wedding.id)` (lib/demo-id) quando um formulário próprio precisa
simular o envio. Os widgets compartilhados já fazem isso.

## 3. Widgets compartilhados (presentes, Pix, confirmação, recados)

`variant="inherit"`: o modelo define no `.template` as variáveis que os widgets leem.
Defina TODAS (os valores são exemplos):

```css
.template {
  /* fontes dos widgets (título serif 400, UI sans) */
  --font-serif: var(--xx-display), Georgia, serif;
  --font-sans: var(--xx-sans), "Segoe UI", sans-serif;
  --widget-card-radius: 4px;      /* cantos dos cartões dos widgets */
  --widget-btn-radius: 999px;     /* cantos dos botões */
  --widget-btn-case: uppercase;   /* ou none */
  --widget-btn-tracking: 0.14em;

  /* GiftRegistry (--g-*) */
  --g-card: #fff; --g-dialog-bg: #fff; --g-border: rgba(0,0,0,.14);
  --g-ink: #1a1a1a; --g-muted: #4a4a4a; --g-accent: #1a1a1a; --g-on-accent: #fff;
  --g-price: #1a1a1a; --g-radius: 4px; --g-img-radius: 2px;
  --g-img-filter: none; --g-scrim: rgba(0,0,0,.55); --g-error: #8d3d33;
  /* --g-aspect vem do catálogo (giftAspect): não defina */

  /* GuestForms (--gf-*) */
  --gf-bg: #f3efe4; --gf-card: #fff; --gf-ink: #1a1a1a; --gf-muted: #4a4a4a;
  --gf-border: rgba(0,0,0,.14); --gf-field: #fff; --gf-accent: #1a1a1a; --gf-on-accent: #fff;
  --gf-radius: 4px; --gf-eyebrow: #4a4a4a; --gf-error: #8d3d33;
}
```

`--g-muted`, `--gf-muted` e `--gf-eyebrow` são lidos como TEXTO: >= 4,5:1 sobre o
fundo do cartão. Em modelo escuro, `--g-error`/`--gf-error` claros (ex.: #e6a99f).

## 4. Movimento

- Entrada da capa: classe global `hero-rise` (CSS puro, visível sem JS, desligada em
  reduced-motion) com `style={{ animationDelay: "120ms" }}` para escalonar.
- Revelar no scroll: `<Reveal>` de `shared/motion` (props `as`, `y`, `delay`,
  `duration`). O HTML do servidor sai visível; só com JS e sem reduced-motion ele
  esconde até entrar na tela. Use em blocos, não em cada palavra.
- `framer-motion` já está instalado (parallax leve de capa com `useScroll` +
  `useReducedMotion`, como no editorial-luxury). Sem outras bibliotecas.
- Animações contínuas (folhas balançando, ondas) só em CSS, baratas (transform/opacity),
  e dentro de `@media (prefers-reduced-motion: no-preference)`.
- Transições de hover: 150–250ms. Nada que atrapalhe a leitura.

## 5. Tipografia

Fontes do Google via `next/font/google` no próprio arquivo do modelo, com
`variable: "--xx-display"` / `"--xx-sans"` e `display: "swap"`; as classes
`display.variable` e `sans.variable` entram no `className` do `<main>`. Confira o nome
exato e os pesos em `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`.
Remapeie `--font-serif` e `--font-sans` (seção 3). Script/caligráfica só em um detalhe
(eyebrow, "&", assinatura), nunca em texto corrido. As fontes de cada modelo estão no
catálogo (`fonts`); use essas.

Hierarquia obrigatória: nomes do casal >> títulos de seção > subtítulos > corpo >
legendas/eyebrows. Escala com `clamp()`; corpo entre 1rem e 1.125rem com
`line-height` 1.55–1.75; eyebrows em sans, caixa alta, `letter-spacing` 0.16–0.3em.

## 6. Cor e contraste (não negociável)

- Corpo de texto sempre em tinta escura sobre fundo claro (ou clara sobre escuro) com
  >= 4,5:1; títulos grandes (>= 24px) >= 3:1. Dourado/oliva/pastel só em eyebrows
  grandes o bastante, ornamentos e fios. Nunca dourado como texto sobre verde escuro.
- Conte o contraste (fórmula WCAG) para cada par texto/fundo que usar e anote o valor
  em comentário no CSS quando for apertado (ex.: `/* 4,8:1 sobre #efe8dc */`).
- Texto sobre foto: só com scrim (gradiente escuro) que garanta o contraste na pior
  foto (clara), inclusive no celular.
- Paleta própria do modelo em variáveis `--xx-*` no `.template`; ignore `wedding.theme`.
- Placeholder e legendas no mínimo no "muted" do modelo (nunca mais claro).

## 7. Composição e layout

- Mobile first: desenhe para 390px e depois amplie. Teste 360px (sem rolagem
  horizontal: `overflow-x: clip` no `.template`), 768px, 1024px e 1440px.
- Alvos de toque >= 44px, foco de teclado visível em todo link/botão (anel na cor
  do texto, como `:where(.template) :where(a, button):focus-visible { outline: 2px solid currentColor; outline-offset: 3px }`).
- Varie a composição entre seções: full-bleed, split assimétrico, sobreposição,
  faixa de cor, coluna estreita. Não repita "título centralizado + padding gigante".
  Nenhuma seção com 40% de altura vazia; se o conteúdo é curto, a seção é baixa.
- Sem cards com sombra e raio grande como solução para tudo; sem gradientes aleatórios;
  sem ícones/emojis decorativos; sem imagens remotas de decoração (só as fotos do casal
  via `next/image`, que já aceita Pexels/Unsplash/Supabase). Ornamentos: SVG do kit.
- `next/image`: capa com `fill` + `priority` + `sizes="100vw"`; o resto `loading="lazy"`
  com `sizes` realista. Fotos têm `alt` da galeria; decorativas `alt=""`.
- Classes só do CSS module (`styles.*`) mais as globais `hero-rise`. Nada de Tailwind
  dentro do modelo (o estilo não pode contaminar nem ser contaminado).

## 8. Kit (`src/components/templates/kit/`)

- `utils.ts`: `splitCouple`, `firstNames`, `initials`, `weddingYear`, `dateParts`,
  `monthName`, `mainLocation`, `placeLine`, `mapEmbedUrl`, `mapLink`, `program`,
  `activeCards`, `activeGifts`, `headlineLines`, `storyMoments`, `nameScale`.
- `hooks.ts`: `useScrolled(px)`, `useMenu()`.
- `Lightbox.tsx`: `useLightbox()` + `<Lightbox images active onClose classNames>`.
- `ornaments.tsx` (SVG, `currentColor`, dimensionados por CSS): botânicos
  `OliveBranch`, `EucalyptusSprig`, `FernFrond`, `WildflowerCluster`, `LaurelWreath`,
  `OrangeBlossom`, `MonsteraLeaf`, `PalmFrond`, `BromeliaBloom`, `LemonBranch`,
  `Cypress`, `RollingHills`, `WheatStalk`, `VineTendril`; geométricos `Arch`,
  `DoubleRule`, `CornerFlourish`, `FrameDouble`, `Diamond`, `Flourish`, `SunRays`,
  `Wave`, `StarSpark`, `TileAzulejo`, `MonogramRing`.
- `watercolor.tsx`: `WatercolorWash({ color, seed })`, `WatercolorEdge`.
- `textures.ts`: `GRAIN`, `PAPER`, `LINEN`, `CANVAS` (data-URI para `background-image`).
- `shared/motion.tsx`: `Reveal`, `useCountdown`, `pad`. `shared/gallery.ts`:
  `storyImage`, `galleryRest`.

## 8.1 Armadilhas já encontradas

- `next/font/google` com `axes: ["opsz"]` exige `weight: "variable"` (com pesos listados o
  build quebra: "Axes can only be defined for variable fonts").
- `<Reveal>` só repassa `className`, `style`, `id`, `role`, `aria-label` e `aria-labelledby`:
  para `data-*` use uma classe ou um elemento interno.
- Ornamentos de traço (`Diamond`, `Flourish`, `DoubleRule`) somem abaixo de ~48px: use
  `fill="currentColor"` ou um tamanho maior. `FrameDouble` tem `preserveAspectRatio="none"`:
  em retângulos muito alongados o vão entre as molduras distorce; prefira `border` +
  `outline` com `outline-offset` no CSS para molduras duplas.
- O iframe do Google Maps não renderiza no Chromium headless das capturas (no navegador
  carrega); não é defeito do modelo.
- Capturas: `scripts/capture-templates.py` rola a página antes do print (fotos lazy) e
  zera `--demo-bar-h`; salve recortes próprios numa subpasta com o id do modelo (o
  scratchpad é compartilhado).

## 9. Pronto quando

1. `npx tsc --noEmit -p tsconfig.typecheck.json` e `npx eslint src/components/templates/<id>` limpos.
2. `/modelo/<id>/helena-e-lucas` aberto a 390px e 1440px: capa com nomes, data e local
   sem cortes; todas as seções com dados; nada vazando na horizontal; contraste ok.
3. Capa sem foto (`heroImage: ""`) e site novo (textos iniciais, galeria vazia, sem
   presentes, sem programação) continuam elegantes, sem seções vazias.
4. O modelo é claramente diferente dos outros da biblioteca em composição, não só na cor.

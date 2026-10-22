# Biblioteca de modelos de convite

Registro da ampliação da biblioteca (21/10/2026): de 8 para 38 modelos, em 10 famílias.
Arquitetura, estado e próximos passos. O contrato de cada modelo está em
`src/components/templates/TEMPLATE_GUIDE.md`.

## Arquitetura

| Peça | Onde | Papel |
| --- | --- | --- |
| Catálogo | `src/lib/templates/catalog.ts` | Fonte única: id (tipo `TemplateId`), nome, família, descrição, estilos, swatch, fontes, `shows` (programação/foto do rodapé), `giftAspect`, ensaio da demo, status (`active`/`legacy`). |
| Registry do editor | `src/components/templates/registry.client.tsx` | id → componente via `next/dynamic` sem SSR (prévia ao vivo); também é a lista de onde o gerador de rotas lê os componentes. |
| Segmentos por modelo | `src/app/tpl/<id>/{site,demo}/[slug]/page.tsx` | Gerados por `node scripts/gen-template-routes.mjs`. O Next só põe no HTML o CSS dos componentes importados estaticamente pelo segmento, então cada modelo tem o seu (sem flash sem estilo e sem carregar o CSS dos outros 37). |
| Reescrita | `next.config.ts` e `src/middleware.ts` | `/modelo/<id>/<slug>` → `/tpl/<id>/demo/<slug>` (rewrite estático em next.config); `/casamento/<slug>` → `/tpl/<modelo do casal>/site/<slug>` no middleware (consulta `content->>templateId` por RLS; sem linha, cai no modelo padrão, cuja página mostra "em breve"/404). |
| Páginas compartilhadas | `src/components/templates/site-page.tsx` | `makeSitePage` (site público), `makeDemoPage` + `DemoFrame` (demos com a barra). |
| Demos | `src/lib/demo-wedding.ts`, `src/lib/demo-photos.ts` | Casal de exemplo com 10 ensaios do Pexels (um por clima) e os slugs de QA `site-novo` (sem fotos, textos iniciais) e `nomes-longos` (nomes compostos, textos longos). |
| Widgets | `GiftRegistry` e `GuestForms` com `variant="inherit"` | O modelo define as vars `--g-*`/`--gf-*` no `.template`; `--g-aspect` vem do catálogo. |
| Kit | `src/components/templates/kit/` | `utils.ts` (nomes, datas, local, mapa, listas), `hooks.ts`, `Lightbox.tsx`, `ornaments.tsx` (25 SVGs), `watercolor.tsx`, `textures.ts`. |
| Vitrine | `src/app/modelos/page.tsx` | Biblioteca pública por família com filtros sem JS (família e estilo), iPhone com a página inteira rolando no hover, demo e cadastro. |
| Seletor | `src/components/app/TemplatePicker.tsx` | Editor e onboarding: agrupado por família, miniatura real, paleta, fontes e link da demo. |
| Prévias | `public/assets/templates/<id>-{phone,full,desktop}.webp` | `python scripts/capture-templates.py assets <url> all` (servidor de produção no ar). |
| QA | `scripts/qa-templates.py`, `scripts/capture-templates.py shots` | Checagens mecânicas (rolagem lateral, texto cortado, alt, alvos, seções vazias, dados fixos, vars dos widgets) e capturas de página inteira. |
| Testes | `tests/template-catalog.test.ts` | Catálogo, registries, pastas, rotas geradas e seletor coerentes. |

Modelo novo: entrada no catálogo + linha em `registry.client.tsx` + pasta
`src/components/templates/<id>/` + `node scripts/gen-template-routes.mjs` + capturas.

## Estado (21/10/2026)

Famílias e modelos (ids): Editorial — editorial-ivory, modern-heirloom, black-tie
(+ editorial-luxury, cinema-noir); Botânico — botanical-garden, wildflower, secret-garden
(+ jardim-romantico); Minimalismo — pure-form, architectural, soft-minimal
(+ civil-minimalista); Clássico — royal-monogram, classic-invitation, heritage
(+ garden-classico, classico-romantico); Destination — amalfi, tuscan, tropical-escape
(+ pe-na-areia, legado); Romântico — blush, poetry, silk-champagne; Arte — watercolor,
fine-line, painted-memories; Moderno — bold-type, contemporary-contrast, avant-garde;
Campestre — countryside, olive-branch, sunset-fields (+ olive-burgundy, legado);
Brasil — tropical-editorial, jardim-brasileiro, modern-celebration.

Os 30 novos estão completos: construídos por agentes a partir de briefings de direção de
arte, revisados visualmente (capa, meio e fim da página, celular e desktop, com e sem
foto, nomes longos), passados pelo QA mecânico e pelo build de produção; prévias geradas
em `public/assets/templates/`. Os 8 modelos antigos continuam como estavam (não foram
redesenhados); as demos de QA valem para eles também, e os widgets compartilhados ganharam
alvo de toque de 44px no "Não poderei ir".

## Limitações conhecidas

- CSS por página no build (Turbopack): globais (~98 KB) + um chunk compartilhado de
  ~117 KB (widgets de presentes/formulários mais o CSS de 5 modelos que o Turbopack
  agrupa: amalfi, avant-garde, cinema-noir, civil-minimalista, wildflower) + o CSS do
  próprio modelo (7–50 KB). Antes da separação por segmento, cada página levaria o CSS
  dos 38; o chunk compartilhado restante vem da heurística de agrupamento do Turbopack
  (persiste mesmo sem o registry dinâmico do servidor) e comprime bem; vale revisitar se
  o peso incomodar.
- O seletor do editor/onboarding (`TemplatePicker`) exige login e não foi aberto no
  navegador nesta sessão; compila, está coberto pelo typecheck e usa as mesmas prévias
  da vitrine.
- Avisos de hidratação só em desenvolvimento quando `prefers-reduced-motion` está ativo
  (parallax do framer-motion em alguns modelos, inclusive o editorial-luxury antigo).

## Próximos passos conhecidos

- Recapturar as prévias (`assets`) sempre que um modelo mudar; a landing continua com as
  4 capturas próprias em `public/assets/landing/`.
- `editorial-luxury`: aviso de hidratação pré-existente do framer-motion sob
  `prefers-reduced-motion` (`style` vazio vs `transform: none`).
- `jardim-romantico`: função `OliveBranch` não usada (aviso de lint pré-existente).

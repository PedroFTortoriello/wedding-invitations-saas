# Wedding Invitations SaaS

A premium, editorial wedding-website platform for Brazilian couples. Built as **Vows**, it lets couples publish elegant, shareable wedding sites with RSVP, photo galleries, live countdowns, and a cash-gift registry powered by **Pix** — Brazil's instant-payment system. The current codebase is an early-stage prototype: the public sites, couple dashboard, and admin area are fully designed and navigable, the Pix BR Code generator is genuinely functional, and the data layer is in-memory demo content rather than a production database.

## Overview

- **What it does:** Renders polished, mobile-first wedding websites from a structured content model, across four distinct editorial templates. Couples get a marketing landing page, a guided onboarding flow, a site editor, guest/RSVP and message views, and a cash-gift registry. Platform operators get a read-only admin area for weddings, users, templates, and Pix revenue.
- **Business objective:** Monetize wedding-site cash gifts by charging a small platform fee (default **1.5%**) on each Pix contribution, while offering couples a beautiful, no-code wedding presence.
- **Target audience:** Brazilian couples planning a wedding (Pix payments, Portuguese pt-BR copy), plus the SaaS operator running the platform.
- **Core benefits:**
  - Premium, editorial template designs ready out of the box.
  - Real, standards-compliant Pix "Copia e Cola" payloads and QR codes for cash gifts.
  - Gift registry that can import product details by scraping a product URL.
  - An exclusive, shareable per-couple link concept (`/casamento/<slug>`).

> **Branding note:** The in-code platform name is **Vows** (`platformName` in `src/lib/platform-data.ts`), but the root document title shown in the browser tab is **"SaaS Wedding"** (`src/app/layout.tsx`), and the package name is `saas-wedding`. These are all real and currently inconsistent.

## Features

> **Maturity note:** This is a prototype. Many flows are intentionally demo/mock with no persistence. The genuinely functional, networked pieces are the **Pix charge generator** and the **gift-link extractor**. Items below are labeled where it matters.

### Public Wedding Sites & Templates

- **Marketing landing page (Vows):** Fixed nav with anchor links (Modelos, Recursos, Presentes em dinheiro) and CTAs to signup/checkout. Hero markets premium editorial wedding sites; benefits grid; template showcases with preview links; and a cash-gift revenue pitch (1.5% Pix fee).
- **Public wedding site by slug** (`/casamento/[slug]`): Server-rendered site resolved by slug, with SEO metadata and OpenGraph built from the wedding content. Renders the flagship **Clássico Romântico** template.
- **Four editorial templates:**
  - **Clássico Romântico** (flagship) — decomposed into section components: scroll-animated hero with floating gallery, story timeline, editorial gallery with lightbox, live countdown, details cards with modals, cash-gift / Pix gift list, final text, and footer. Sticky nav with monogram and RSVP button; requestAnimationFrame + IntersectionObserver scroll effects; theme CSS variables injected from the wedding's theme.
  - **Civil Minimalista** — single-file black/white/beige editorial layout with split giant names, story, ceremony details, gallery, and a gifts grid.
  - **Jardim Clássico (garden-classico)** — botanical layout with about, photo break, event program, details, a 3-image gallery, and a gifts preview with a full-list modal.
  - **Olive Burgundy** — a save-the-date style experience: closed envelope cover with wax seal, save-the-date card, invite scene with live countdown, and a marble footer. Uses IntersectionObserver reveals and a live countdown hook.
- **Gallery + lightbox** (Clássico Romântico): Editorial gallery with a native `<dialog>` lightbox.
- **Live countdown:** Client-side countdown to the wedding date (Clássico Romântico and Olive Burgundy).
- **RSVP dialog** *(mock — Clássico Romântico only)*: Native `<dialog>` modal with Nome, Sobrenome, and optional Acompanhantes. Submitting only flips local state to show a success message — no data is sent or stored. Other templates have no RSVP form.
- **Gift list / cash gifts** *(visual)*: Gifts render as outbound links; the public templates do not implement a Pix checkout (cash gifts are marketed on the landing page and processed via the dashboard tools).

### Couple Dashboard (authenticated app)

- **AppShell navigation:** Shared sidebar + header chrome with active-state highlighting and a link to the published site.
- **Overview metrics:** Site status, live countdown, RSVP confirmations (computed from demo guests), and message count, plus a cash-gift revenue summary.
- **Onboarding flow** *(demo)*: An 8-step guided creation checklist plus a prefilled (uncontrolled) form and the cash-gift revenue model card.
- **Site editor** *(demo)*: Identity panel and section cards prefilled from demo content; a public preview link.
- **Gift link importer** *(functional):* Validates a product URL and POSTs to `/api/gifts/extract`, then renders an editable preview from the real scrape response.
- **Live editor demo** (`/editor-demo`) *(in-memory)*: Real local interactivity — couple names, date, welcome message, primary color, and hero image selection with a live preview.
- **Guests & RSVP table** *(demo)*: Read-only table of demo guests with status badges, companions, and dietary notes.
- **Cash-gift registry** *(demo + functional Pix)*: Revenue cards, a list of gifts, a received-transactions list, and the functional **PixChargeGenerator** for active gifts.
- **Guest messages inbox** *(demo)*: Read-only list of demo messages.
- **Cash-gift checkout / financial simulation** *(demo)*: Displays computed gross/fee/net totals over demo transactions. No payment processor or billing.

### Payments — Pix (the real payment mechanism)

- **BR Code (EMV) Pix payload generation** *(functional):* Builds a valid Brazilian Pix "Copia e Cola" static EMV payload by hand (TLV fields, GUI `br.gov.bcb.pix`, MCC, currency 986/BRL, amount, country BR, merchant name/city, txid) with a CRC16-CCITT checksum.
- **Pix charge creation with fee split** *(functional):* Validates amount and guest name, generates a txid, computes fee (default 1.5%) and net, and returns a complete charge with a 30-minute expiry. Discrete, reusable helpers `createPixTxid`, `calculatePixFee`, `buildPixPayload`, and `getPixSettings` are exported from `src/lib/pix.ts`.
- **QR code SVG rendering** *(functional):* Renders the payload as an SVG QR code via the `qrcode` library.
- **Payment confirmation** *(mock):* A simulator endpoint stamps the charge as `paid` — there is no real settlement, webhook, or bank verification.

### Gift Extraction

- **Gift link extraction** *(functional):* Scrapes a public product URL with an SSRF-guarded native fetch (blocks private/loopback/link-local hosts and non-http(s) schemes; 12s timeout; ~1.2 million character HTML cap). Extracts title/price/image/description from JSON-LD, OpenGraph/Twitter/meta tags, or a Brazilian R$ price regex. Dependency-free parsing (no cheerio/puppeteer).

### Admin Area (platform administration)

- **Platform metrics dashboard** *(demo)*: Total users, total weddings, published weddings, draft weddings, and Pix-fee revenue, computed from demo arrays at module load.
- **Weddings list** *(demo)*: Couple names, public slug, status badge, and an "Abrir" (open-site) link. Read-only. The list includes both demo weddings — `pedro-e-rafaela` (published) and `maria-e-joao` (draft). Note that the "Abrir" link for `maria-e-joao` points to `/casamento/maria-e-joao`, which resolves to a 404 because `getDemoWeddingBySlug` only returns `pedro-e-rafaela`.
- **Users list** *(demo)*: Name, email, and role badge (client/admin). Read-only.
- **Templates library** *(demo)*: Gallery of the four templates with preview, name, and description. Read-only.
- **Pix cash-gift revenue (Receita Pix)** *(demo)*: Gross volume, platform revenue, base fee %, and a transactions list. Read-only. Served at `/admin/pacotes`.
- **AdminShell navigation:** Shared layout with a pill nav across Dashboard, Usuários, Casamentos, Modelos, and Receita Pix.

### Shared UI components

- **`MetricCard`** and **`StatusBadge`** (`src/components/app/`) are reused across both the couple dashboard and the admin area. `StatusBadge` maps status keys to pt-BR labels and three color variants: positive (`published` / `paid` / `confirmed`), warning (`draft` / `pending`), and negative (everything else, e.g. `declined` / `suspended` / `expired`).

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`), local custom fonts loaded with plain CSS `@font-face` in `globals.css` (Instrument Serif / Instrument Sans — **not** `next/font`), `next/image`, `next/link` |
| **Backend** | Next.js App Router route handlers; `qrcode` for server-side QR SVG generation; hand-rolled Pix EMV/CRC16 and gift-scraper libraries. Only the gift-extract route pins the Node.js runtime (`export const runtime = "nodejs"`); the two Pix routes use Next.js defaults with no explicit runtime |
| **Database** | None. All content is in-memory TypeScript demo data; no DB, ORM, CMS, or client-side persistence |
| **Infrastructure** | Vercel + standard `next build` pipeline; remote images allowlisted from `images.unsplash.com` |

No Material UI, Express, Supabase, Stripe, or external payment/auth SDKs are used. Runtime dependencies are limited to `next`, `react`, `react-dom`, and `qrcode`.

## Architecture

### Frontend structure
- **App Router** under `src/app` with route segments for the public site (`/casamento/[slug]`, `/modelo/<template>/[slug]`), the couple dashboard (`/dashboard`, `/onboarding`, `/editor`, `/editor-demo`, `/convidados`, `/presentes`, `/mensagens`, `/checkout`), auth screens (`/login`, `/cadastro`), and the admin area (`/admin/*`).
- **Templates** live in `src/components/templates/<template>/`. Clássico Romântico is decomposed into section components; the other three are largely single-file editorial layouts with CSS modules.
- **Shared app/admin chrome** (`AppShell`, `AdminShell`) and presentational components (`MetricCard`, `StatusBadge`) live in `src/components/app/`.
- **Fonts** are loaded via plain CSS `@font-face` rules in `src/app/globals.css`; `src/app/layout.tsx` does not import `next/font`, so there is no Next.js font optimization.
- Most pages are **React Server Components**; only `editor-demo`, `GiftLinkImporter`, and `PixChargeGenerator` are client components.

### Backend structure (Next.js route handlers)
- Exactly **three POST-only route handlers** under `src/app/api`: `pix/charge`, `pix/simulate`, and `gifts/extract`. Only `gifts/extract` pins the Node.js runtime.
- Business logic lives in `src/lib/`: `pix.ts` (EMV payload, CRC16, fee math, txid generation), `gift-scraper.ts` (SSRF-guarded scraping and parsing), `platform-data.ts` and `demo-wedding.ts` (demo content).
- Typed contracts live in `src/types/` (`pix.ts`, `gift-extraction.ts`, `wedding.ts`).

### Data layer / structure
- **No persistence of any kind.** There is no database, ORM, CMS, API data store, cookie, or `localStorage`/`sessionStorage`.
- All platform content (users, weddings, guests, messages, transactions, templates, metrics) is hardcoded in `src/lib/platform-data.ts` and `src/lib/demo-wedding.ts`.
- **Public routes** are backed by a single demo couple (`pedro-e-rafaela`); `getDemoWeddingBySlug` returns that one object or `null`. The **admin area and platform metrics**, however, are driven by a `demoWeddings` array containing **two** weddings: `pedro-e-rafaela` (published) and `maria-e-joao` (draft, owner `user_maria`). This is why the admin Casamentos list and metrics (`totalWeddings = 2`, plus `draftWeddings`) show a second wedding that has no resolvable public page.
- Metrics are computed at module-load time from the static arrays, giving an appearance of dynamism over fixed values.
- Pix charges and "paid" confirmations are generated in memory and returned, but never stored. Interactive widgets keep edits only in ephemeral React state.

### API flow
1. **Cash gift (Pix):** A client widget POSTs gift/amount details to `/api/pix/charge` → the server builds the EMV payload + CRC16, computes fee/net, renders a QR SVG, and returns the charge → the user can POST the charge to `/api/pix/simulate` to receive a `paid` echo (demo only).
2. **Gift import:** The importer POSTs a product URL to `/api/gifts/extract` → the server validates the URL against an SSRF allowlist, fetches and parses the page, and returns inferred gift metadata for an editable preview.

## Installation

Prerequisites: **Node.js 20+** and npm.

```bash
# 1. Clone
git clone https://github.com/pedrotortoriellotech-lab/wedding-invitations-saas.git
cd wedding-invitations-saas

# 2. Install dependencies
npm install

# 3. Configure environment (optional — demo fallbacks exist)
#    Create a .env file in the project root (see Environment Variables below)
#    e.g.:
#    PIX_KEY=your-pix-key
#    PIX_MERCHANT_NAME=YOUR MERCHANT NAME
#    PIX_MERCHANT_CITY=SAO PAULO
#    PIX_FEE_PERCENT=1.5

# 4. Run the dev server
npm run dev
```

The app starts on `http://localhost:3000`. Visit `/` for the landing page and `/casamento/pedro-e-rafaela` for the demo wedding site. All `.env` files are gitignored.

## Environment Variables

All Pix variables are optional and fall back to demo values; set them for any real-world use of the Pix payload generator. They are read only in `src/lib/pix.ts`.

| Variable | Purpose |
| --- | --- |
| `PIX_KEY` | Pix recipient key (chave Pix) embedded in the EMV merchant account info (field 26/01). Defaults to a demo key. |
| `PIX_MERCHANT_NAME` | Merchant name in EMV field 59. Defaults to a demo merchant name. |
| `PIX_MERCHANT_CITY` | Merchant city in EMV field 60. Defaults to a demo city. |
| `PIX_FEE_PERCENT` | Platform fee percentage applied to compute fee/net amounts. Defaults to `1.5`. |

## Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `next dev --webpack` | Runs the Next.js dev server explicitly with the Webpack bundler. |
| `build` | `next build` | Produces a standard Next.js production build. |
| `start` | `next start` | Serves the production build. |
| `typecheck` | `tsc --noEmit -p tsconfig.typecheck.json` | Type-checks `src` without emitting, using the typecheck-specific tsconfig. |
| `lint` | `eslint .` | Lints the repository using the flat ESLint config. |

## Deployment

The project targets **Vercel** and uses the standard Next.js build pipeline.

1. Push the repository to your Git provider and import it into Vercel (or run `vercel`).
2. No `vercel.json` overrides exist, so Vercel uses the default Next.js settings (`next build`).
3. Configure the `PIX_*` environment variables in the Vercel project settings if you need non-demo Pix values.
4. Remote images are allowlisted from `images.unsplash.com` via `next.config.ts`; add any additional hosts there if you change image sources.

For self-hosting, run `npm run build` followed by `npm run start` behind your preferred Node.js host.

## Folder Structure

```text
wedding-invitations-saas/
├── public/
│   └── assets/
│       ├── canva-garden/            # Garden template hero imagery
│       ├── canva-intimate/          # Civil Minimalista hero imagery
│       ├── olive-burgundy/          # Olive Burgundy save-the-date assets
│       ├── fonts/                   # Instrument Serif / Instrument Sans (woff2)
│       └── images/                  # Gallery, story, hero & details photos
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── admin/                   # Read-only platform admin
│   │   │   ├── casamentos/          #   Weddings list
│   │   │   ├── pacotes/             #   Pix revenue report
│   │   │   ├── templates/           #   Templates library
│   │   │   ├── usuarios/            #   Users list
│   │   │   └── page.tsx             #   Admin metrics dashboard
│   │   ├── api/                     # POST-only route handlers
│   │   │   ├── gifts/extract/       #   Gift-link scraper (runtime: nodejs)
│   │   │   └── pix/
│   │   │       ├── charge/          #   Pix BR Code + QR generator
│   │   │       └── simulate/        #   Demo "paid" simulator
│   │   ├── casamento/[slug]/        # Public wedding site (Clássico Romântico)
│   │   ├── modelo/                  # Template preview routes
│   │   │   ├── civil-minimalista/[slug]/
│   │   │   ├── garden-classico/[slug]/
│   │   │   └── olive-burgundy/[slug]/
│   │   ├── cadastro/                # Signup (static)
│   │   ├── login/                   # Login (static)
│   │   ├── onboarding/              # Guided onboarding (demo)
│   │   ├── dashboard/               # Couple overview metrics
│   │   ├── editor/                  # Site editor (demo)
│   │   ├── editor-demo/             # Live in-memory editor
│   │   ├── convidados/              # Guests & RSVP table (demo)
│   │   ├── presentes/              # Cash-gift registry (+ functional Pix)
│   │   ├── mensagens/               # Guest messages inbox (demo)
│   │   ├── checkout/                # Financial simulation (demo)
│   │   ├── layout.tsx               # Root layout & metadata
│   │   ├── page.tsx                 # Marketing landing page
│   │   ├── not-found.tsx            # 404 page
│   │   └── globals.css              # Global styles & @font-face
│   ├── components/
│   │   ├── app/                     # AppShell, AdminShell, MetricCard,
│   │   │                            #   StatusBadge, GiftLinkImporter,
│   │   │                            #   PixChargeGenerator
│   │   └── templates/
│   │       ├── classico-romantico/  # Flagship template (decomposed sections)
│   │       ├── civil-minimalista/
│   │       ├── garden-classico/
│   │       └── olive-burgundy/
│   ├── lib/                         # pix.ts, gift-scraper.ts,
│   │                                #   platform-data.ts, demo-wedding.ts
│   └── types/                       # pix.ts, gift-extraction.ts, wedding.ts
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── tsconfig.typecheck.json
```

## API Documentation

All endpoints are POST-only Next.js route handlers and are stateless (nothing is persisted).

### `POST /api/pix/charge`
- **Purpose:** Generate a Brazilian Pix charge (EMV BR Code + QR) for a cash gift. Fully local — no payment provider is contacted.
- **Request (JSON):** `{ weddingSiteId: string, guestName: string, amount: number, message?: string, giftId?: string }`. `amount` must be ≥ 1 and `guestName` non-empty.
- **Response (200, JSON):** `{ id, txid, status: 'pending', grossAmount, feeAmount, netAmount, feePercent, pixKey, merchantName, merchantCity, payload, expiresAt, qrCodeSvg }`.
- **Errors:** `400 { error: string }` on validation failure.
- **Behavior:** Validates input, generates a txid, computes fee (default 1.5%) and net amounts, builds the EMV "Copia e Cola" payload with a CRC16-CCITT checksum, renders an SVG QR code, and sets a 30-minute expiry. The charge is not stored. Uses the Next.js default runtime (no explicit runtime declaration).

### `POST /api/pix/simulate`
- **Purpose:** Demo-only — pretend a previously generated Pix charge was paid. No real settlement.
- **Request (JSON):** `{ charge: PixChargeResponse }`. Requires `charge.id`, `charge.txid`, and `charge.payload`.
- **Response (200, JSON):** The charge spread with `status: 'paid'`, `paidAt: <ISO now>`, `simulator: true`.
- **Errors:** `400 { error: string }` on missing fields.
- **Behavior:** Pure transformation; no verification, ledger, or persistence. Uses the Next.js default runtime (no explicit runtime declaration).

### `POST /api/gifts/extract`
- **Purpose:** Scrape a public product URL and return inferred gift metadata (title/price/image). Runtime pinned to `nodejs`.
- **Request (JSON):** `{ url: string }`. Empty/missing URL, private/local hosts, and non-http(s) schemes are rejected.
- **Response (200, JSON):** `{ title: string, price: string | null, image: string | null, url: string, source: string, description?: string | null }`.
- **Errors:** `400 { error: string }` for invalid URL, blocked host, timeout, or non-OK upstream status.
- **Behavior:** SSRF-guarded fetch (12s timeout, browser-like User-Agent, ~1.2 million character read cap via `MAX_HTML_CHARS = 1_200_000`) followed by precedence-based extraction (JSON-LD → OpenGraph/Twitter/meta → R$ price regex → URL-slug title). Prices formatted via `Intl.NumberFormat` pt-BR/BRL; image URLs resolved absolute.

## Security

This is an **early-stage prototype**, and security posture should be understood accordingly.

- **Authentication:** None. `/login` and `/cadastro` are static pages whose inputs are unwired; their only action is a `Link` that navigates to `/dashboard` or `/onboarding`. No credentials are checked, and no session, token, or cookie is created. There is no auth library in the project.
- **Authorization:** None enforced. There is no `middleware.ts`, no route protection, and no role gate. The `admin` role exists only as static demo data and is never checked — so **all dashboard and `/admin` routes are publicly reachable** by anyone who knows the URLs.
- **Data protection:** No personal data is persisted — there is no database, cookie, or browser storage. RSVP submissions and gift selections are not saved; Pix charges and "paid" confirmations are generated in memory and discarded. The Pix payment confirmation is a **simulator** and must not be treated as real settlement.
- **Hardening present:** The gift-extract endpoint includes an **SSRF guard** (blocks loopback, RFC1918 private ranges, link-local, `.local`, and non-http(s) schemes), an HTTP timeout, and a ~1.2 million character HTML read cap.

Before any production use, add real authentication, route/role protection, a persistent and access-controlled data store, server-side validation of all inputs, and integration with a real Pix PSP plus webhook-based settlement.

## Roadmap

Plausible next steps that build directly on the current codebase:

- **Real authentication & sessions** for couples and admins, with route/middleware protection for the dashboard and `/admin`.
- **Persistent data layer** (database + per-couple multi-tenant content) to replace the in-memory demo weddings and enable true multi-site rendering — including making the second demo wedding (`maria-e-joao`) resolvable as a real public page instead of a 404.
- **Functional RSVP intake** wired to a server action/API and stored per guest, surfaced in the couple dashboard.
- **End-to-end Pix settlement** via a real PSP: register charges, receive payment webhooks, and update a transactions ledger (replacing the simulator).
- **Editable, savable sites:** wire the editor's identity/section inputs and onboarding form to a publish/save pipeline.
- **Gift registry persistence:** save imported gifts and link them to Pix quotas and received contributions.
- **Guest management CRUD** and **message moderation/export** in the dashboard.
- **Template selection & theming per couple**, plus showcasing Olive Burgundy on the landing page.
- **Billing & plans** in the admin area (the current `/admin/pacotes` is a Pix revenue report, not plan management).
- **Unify branding** between the in-code "Vows" platform name and the "SaaS Wedding" root document title.

## License

Released under the **MIT License**. See the [LICENSE](LICENSE) file for the full text.

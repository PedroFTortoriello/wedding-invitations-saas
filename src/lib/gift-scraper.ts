import { lookup } from "node:dns/promises";
import type { IncomingMessage } from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import type { LookupFunction } from "node:net";
import { BlockList, isIP } from "node:net";
import { pipeline } from "node:stream";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";
import type { GiftExtractionResponse } from "@/types/gift-extraction";

// ponytail: arquivo único e só `import type` de alias — assim scripts/check-gift-import.mjs
// roda este .ts direto no Node (type stripping), sem Next nem bundler.

export type Store = "mercadolivre" | "amazon" | "generic";
type Headers = Record<string, string>;
type ProductCandidate = { title?: string; price?: string; currency?: string; image?: string; description?: string };
export type ParsedProduct = { title?: string; price: string | null; image: string | null; description: string | null };
export type FetchedPage = { status: number; url: URL; html: string };
export type PageFetcher = (url: URL, headers: Headers, timeoutMs: number) => Promise<FetchedPage>;

const MAX_REDIRECTS = 5;
const HTML_MAX_BYTES = 3 * 1024 * 1024;
const ATTEMPT_TIMEOUT_MS = 9_000;
const TOTAL_BUDGET_MS = 22_000;
const IMAGE_TIMEOUT_MS = 8_000;
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const GIFT_IMPORT_MESSAGES = {
  invalid: "Informe um link válido de produto, começando com http ou https.",
  private: "Por segurança, não dá para importar links de endereços locais ou privados.",
  hostNotFound: "Não encontramos esse site. Confira se o link está completo.",
  productNotFound:
    "Não encontramos esse produto na loja (o anúncio pode ter sido encerrado). Confira o link ou preencha o nome e envie a foto.",
  // Sem atalho de teclado aqui: a tela acrescenta a dica certa para o aparelho (Ctrl+V, ⌘V ou nada no celular).
  manual: "A loja não deixou a gente ler esse link agora. Preencha o nome e envie a foto."
};

/** Erro com `message` pronta para o casal (pt-BR). `detail` é técnico e vai só para o log. */
export class GiftImportError extends Error {
  detail: string;

  constructor(message: string, detail: string) {
    super(message);
    this.name = "GiftImportError";
    this.detail = detail;
  }
}

/* ------------------------------------------------------------------ rede segura */

const BLOCKED_IPS = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4]
] as const) {
  BLOCKED_IPS.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 96], // não especificado, ::1 e IPv4-compatível
  ["64:ff9b::", 96], // NAT64
  ["64:ff9b:1::", 48],
  ["100::", 64],
  ["2001::", 32], // Teredo
  ["2001:2::", 48], // benchmarking
  ["2001:10::", 28], // ORCHID
  ["2001:20::", 28], // ORCHIDv2
  ["2001:db8::", 32],
  ["2002::", 16], // 6to4
  ["3fff::", 20], // documentação
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8]
] as const) {
  BLOCKED_IPS.addSubnet(network, prefix, "ipv6");
}
// IPv6 só passa se for unicast global (2000::/3) ou IPv4-mapped (que cai nas regras IPv4 acima).
const ALLOWED_V6 = new BlockList();
ALLOWED_V6.addSubnet("2000::", 3, "ipv6");
ALLOWED_V6.addSubnet("::ffff:0:0", 96, "ipv6");

/** true para qualquer IP que não seja unicast público (IPv4-mapped IPv6 é checado como IPv4). */
export function isBlockedIp(ip: string) {
  const version = isIP(ip);
  if (version === 0) return true;
  try {
    if (version === 6 && !ALLOWED_V6.check(ip, "ipv6")) return true;
    return BLOCKED_IPS.check(ip, version === 6 ? "ipv6" : "ipv4");
  } catch {
    return true;
  }
}

/** Valida forma da URL (cada salto de redirect passa por aqui). O IP é checado na conexão. */
export function assertPublicUrl(raw: string | URL, base?: URL): URL {
  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    throw new GiftImportError(GIFT_IMPORT_MESSAGES.invalid, "invalid-url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new GiftImportError(GIFT_IMPORT_MESSAGES.invalid, "protocol");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  // Loja não usa IP literal, porta fora do padrão, credencial na URL nem host sem ponto.
  if (url.username || url.password || url.port || isIP(host) || !host.includes(".")) {
    throw new GiftImportError(GIFT_IMPORT_MESSAGES.private, "non-public-url");
  }
  return url;
}

// Resolve o DNS e valida TODOS os IPs no momento da conexão (o socket usa o IP validado):
// fecha host público apontando para IP privado e DNS rebinding entre checagem e fetch.
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true }).then(
    (addresses) => {
      if (addresses.length === 0 || addresses.some(({ address }) => isBlockedIp(address))) {
        callback(new GiftImportError(GIFT_IMPORT_MESSAGES.private, "private-ip"), "");
      } else if (options.all) {
        callback(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    },
    (error: NodeJS.ErrnoException) => callback(error, "")
  );
};

function openRequest(url: URL, headers: Headers, signal: AbortSignal) {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    const req = send(url, { headers, lookup: guardedLookup, signal }, resolve);
    req.on("error", reject);
    req.end();
  });
}

async function readBody(res: IncomingMessage, maxBytes: number) {
  const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
  const noop = () => undefined;
  const stream =
    encoding === "br"
      ? pipeline(res, createBrotliDecompress(), noop)
      : encoding === "gzip" || encoding === "x-gzip"
        ? pipeline(res, createGunzip(), noop)
        : encoding === "deflate"
          ? pipeline(res, createInflate(), noop)
          : res;
  const chunks: Buffer[] = [];
  let total = 0;
  let truncated = false;
  try {
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
      total += chunk.length;
      if (total > maxBytes) {
        truncated = true;
        break;
      }
    }
  } finally {
    res.destroy();
  }
  return { body: Buffer.concat(chunks).subarray(0, maxBytes), truncated };
}

type RawPage = { status: number; url: URL; contentType: string; body: Buffer; truncated: boolean };

/** GET com redirects manuais (máx. 5, cada salto revalidado), timeout total e teto de bytes. */
async function safeFetch(start: URL, headers: Headers, maxBytes: number, timeoutMs: number): Promise<RawPage> {
  const signal = AbortSignal.timeout(timeoutMs);
  let url = assertPublicUrl(start);
  for (let hop = 0; ; hop += 1) {
    const res = await openRequest(url, headers, signal);
    const status = res.statusCode ?? 0;
    const location = res.headers.location;
    if (status >= 300 && status < 400 && location) {
      res.destroy();
      if (hop >= MAX_REDIRECTS) throw new Error("too-many-redirects");
      url = assertPublicUrl(location, url);
      continue;
    }
    const { body, truncated } = await readBody(res, maxBytes).catch((error: unknown) => {
      throw signal.aborted ? signal.reason : error; // corpo cortado pelo timeout vira TimeoutError, não ECONNRESET
    });
    return { status, url, contentType: String(res.headers["content-type"] ?? ""), body, truncated };
  }
}

const fetchHtml: PageFetcher = async (url, headers, timeoutMs) => {
  const page = await safeFetch(url, headers, HTML_MAX_BYTES, timeoutMs);
  const charset = /charset=["']?([\w-]+)/i.exec(page.contentType)?.[1] ?? "utf-8";
  let html: string;
  try {
    html = new TextDecoder(charset).decode(page.body);
  } catch {
    html = new TextDecoder().decode(page.body);
  }
  return { status: page.status, url: page.url, html };
};

/* ------------------------------------------------------------ lojas e estratégias */

const LANG = "pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5";
const HTML_ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const ENCODING = "gzip, deflate, br";
const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

// Sem Sec-Fetch-*: com eles a Amazon responde captcha.
const BROWSER: Headers = { "User-Agent": BROWSER_UA, Accept: HTML_ACCEPT, "Accept-Language": LANG, "Accept-Encoding": ENCODING, "Cache-Control": "no-cache" };
const IPHONE: Headers = {
  ...BROWSER,
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
};
// Crawlers de prévia de link recebem a página completa onde navegador comum cai em muro.
const FACEBOOK: Headers = {
  "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  Accept: HTML_ACCEPT,
  "Accept-Language": LANG,
  "Accept-Encoding": ENCODING
};
const WHATSAPP: Headers = { ...FACEBOOK, "User-Agent": "WhatsApp/2.24.10.78 A" };

export const STRATEGIES: Record<Store, { name: string; headers: Headers }[]> = {
  mercadolivre: [
    { name: "facebook", headers: FACEBOOK },
    { name: "whatsapp", headers: WHATSAPP }
  ],
  amazon: [
    { name: "browser", headers: BROWSER },
    { name: "iphone", headers: IPHONE },
    { name: "facebook", headers: FACEBOOK }
  ],
  generic: [
    { name: "browser", headers: BROWSER },
    { name: "facebook", headers: FACEBOOK }
  ]
};

export function storeForHost(hostname: string): Store {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (/(^|\.)mercadoli(?:vre|bre)\.(?:com(?:\.[a-z]{2})?|[a-z]{2})$/.test(host)) return "mercadolivre";
  if (/(^|\.)amazon\.(?:com?(?:\.[a-z]{2})?|[a-z]{2})$/.test(host)) return "amazon";
  return "generic";
}

const SHORT_HOSTS = new Set(["amzn.to", "amzn.eu", "amzn.asia", "a.co", "meli.la"]);

export function isShortLink(url: URL) {
  const host = url.hostname.toLowerCase();
  return SHORT_HOSTS.has(host) || (storeForHost(host) === "mercadolivre" && url.pathname.startsWith("/sec/"));
}

/** Segue o encurtador (redirects validados) só até sair dele; a loja final escolhe o adaptador. */
async function expandShortLink(start: URL): Promise<URL> {
  let url = start;
  for (let hop = 0; hop < MAX_REDIRECTS && isShortLink(url); hop += 1) {
    const res = await openRequest(url, BROWSER, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS));
    res.destroy();
    const status = res.statusCode ?? 0;
    if (status < 300 || status >= 400 || !res.headers.location) break;
    url = assertPublicUrl(res.headers.location, url);
  }
  return url;
}

/** Motivo do bloqueio (muro de login, captcha, HTTP de erro) ou null se a página é utilizável. */
export function detectBlock(store: Store, page: FetchedPage): string | null {
  if (page.status >= 400) return `http-${page.status}`;
  if (store === "mercadolivre") {
    if (/account-verification|\/lgz\/|\/login/i.test(page.url.pathname)) return "wall";
    if (!/og:title|application\/ld\+json/i.test(page.html)) return "no-product";
  }
  if (store === "amazon" && (/validateCaptcha|opfcaptcha/i.test(page.html) || /^Robot Check/i.test(titleText(page.html) ?? ""))) {
    return "captcha";
  }
  return null;
}

/* ----------------------------------------------------------------------- parsing */

// HTML de loja é entrada hostil (até 3 MB) e regex roda síncrona: nada de quantificador solto
// no documento inteiro (`<meta\s+[^>]*>`, `[\s\S]*?</script>`), que fica quadrático e trava o
// event loop. Acha um literal com indexOf e só aplica regex em fatia curta ou ancorada.

const SCRIPT_END = /<\/script\s*>/gi;
const STYLE_END = /<\/style\s*>/gi;
const TITLE_END = /<\/title\s*>/gi;

/** Início do próximo `closer` (regex /g) a partir de `from`; `closer.lastIndex` fica no fim dele. -1 se não houver. */
function indexOfCloser(html: string, closer: RegExp, from: number) {
  closer.lastIndex = from;
  return closer.exec(html)?.index ?? -1;
}

/** Regex ancorada (^) logo depois de um literal: até 20 ocorrências, janela de 2 KB cada. */
function matchAfter(html: string, literal: string, pattern: RegExp) {
  // ponytail: teto de 20 ocorrências mantém o custo linear em HTML hostil; na página real o bloco certo vem antes.
  for (let at = html.indexOf(literal), tries = 0; at >= 0 && tries < 20; at = html.indexOf(literal, at + 1), tries += 1) {
    const from = at + literal.length;
    const match = pattern.exec(html.slice(from, from + 2_000));
    if (match) return match;
  }
  return undefined;
}

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    cent: "¢",
    copy: "©",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    reg: "®"
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const normalized = code.toLowerCase();

    if (normalized.startsWith("#")) {
      const hex = normalized.startsWith("#x");
      const parsed = Number.parseInt(normalized.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(parsed) && parsed <= 0x10ffff ? String.fromCodePoint(parsed) : entity;
    }

    return namedEntities[normalized] ?? entity;
  });
}

function normalizeText(value?: string | null) {
  if (!value) return undefined;
  const text = decodeHtmlEntities(value).replace(/\u0000/g, "").replace(/\s+/g, " ").trim();
  return text || undefined;
}

const attributePatterns = new Map<string, RegExp>();

function getTagAttribute(tag: string | undefined, attribute: string) {
  if (!tag) return undefined;
  let pattern = attributePatterns.get(attribute);
  if (!pattern) {
    pattern = new RegExp(`(?:^|\\s)${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
    attributePatterns.set(attribute, pattern);
  }
  const match = tag.match(pattern);

  return normalizeText(match?.[2] ?? match?.[3] ?? match?.[4]);
}

/** content de cada <meta>, pela 1ª tag com aquele property/name/itemprop — uma passada por página. */
function metaContents(html: string) {
  const contents = new Map<string, string | undefined>();
  const open = /<meta\s/gi;
  for (let match = open.exec(html); match; match = open.exec(html)) {
    const end = html.indexOf(">", match.index);
    if (end < 0) break;
    const tag = html.slice(match.index, end + 1);
    open.lastIndex = end + 1;
    const content = getTagAttribute(tag, "content");
    for (const attribute of ["property", "name", "itemprop"]) {
      const key = getTagAttribute(tag, attribute)?.toLowerCase();
      if (key && !contents.has(key)) contents.set(key, content);
    }
  }
  return contents;
}

function getMetaContent(contents: Map<string, string | undefined>, keys: string[]) {
  return keys.map((key) => contents.get(key)).find(Boolean);
}

function titleText(html: string) {
  const open = /<title\b/i.exec(html);
  const start = open ? html.indexOf(">", open.index) : -1;
  const end = start < 0 ? -1 : indexOfCloser(html, TITLE_END, start);
  return end < 0 ? undefined : normalizeText(html.slice(start + 1, end));
}

/** Texto sem tags (script/style inteiros somem). Tag sem fechamento descarta o resto. */
function stripTags(html: string) {
  const parts: string[] = [];
  let pos = 0;
  while (pos < html.length) {
    const lt = html.indexOf("<", pos);
    if (lt < 0) {
      parts.push(html.slice(pos));
      break;
    }
    parts.push(html.slice(pos, lt), " ");
    const block = /^<(script|style)\b/i.exec(html.slice(lt, lt + 8))?.[1].toLowerCase();
    const closer = block === "script" ? SCRIPT_END : block === "style" ? STYLE_END : undefined;
    const end = closer ? indexOfCloser(html, closer, lt) : html.indexOf(">", lt);
    if (end < 0) break;
    pos = closer ? closer.lastIndex : end + 1;
  }
  return parts.join("");
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return normalizeText(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = firstString(item);
      if (result) return result;
    }
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    return firstString(objectValue.url) ?? firstString(objectValue.contentUrl) ?? firstString(objectValue.src);
  }

  return undefined;
}

function readObjectString(objectValue: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const result = firstString(objectValue[key]);
    if (result) return result;
  }

  return undefined;
}

function findJsonLdProducts(value: unknown, products: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => findJsonLdProducts(item, products));
    return products;
  }

  if (!value || typeof value !== "object") return products;

  const objectValue = value as Record<string, unknown>;
  const type = objectValue["@type"];
  const types = Array.isArray(type) ? type : [type];
  const isProduct = types.some((item) => typeof item === "string" && item.toLowerCase().includes("product"));

  if (isProduct) products.push(objectValue);

  findJsonLdProducts(objectValue["@graph"], products);
  findJsonLdProducts(objectValue.itemListElement, products);

  return products;
}

function firstObject(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = firstObject(item);
      if (result) return result;
    }
  }

  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

/** Corpo de cada <script type="application/ld+json">. */
function jsonLdScripts(html: string) {
  const scripts: string[] = [];
  const marker = "application/ld+json";
  for (let at = html.indexOf(marker); at >= 0; at = html.indexOf(marker, at + 1)) {
    if (!/<script\b[^<>]*$/i.test(html.slice(Math.max(0, at - 300), at))) continue;
    const start = html.indexOf(">", at);
    const end = start < 0 ? -1 : indexOfCloser(html, SCRIPT_END, start);
    if (end < 0) break;
    scripts.push(html.slice(start + 1, end));
    at = end;
  }
  return scripts;
}

function extractJsonLdCandidate(html: string): ProductCandidate | undefined {
  for (const script of jsonLdScripts(html)) {
    const rawJson = script.trim();
    if (!rawJson) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      try {
        parsed = JSON.parse(decodeHtmlEntities(rawJson));
      } catch {
        continue;
      }
    }

    const product = findJsonLdProducts(parsed)[0];
    if (!product) continue;

    const offer = firstObject(product.offers) ?? {};
    const priceSpecification = firstObject(offer.priceSpecification) ?? {};

    return {
      title: readObjectString(product, ["name", "headline"]),
      description: readObjectString(product, ["description"]),
      image: firstString(product.image),
      price:
        readObjectString(offer, ["price", "lowPrice", "highPrice", "minPrice", "maxPrice"]) ??
        readObjectString(priceSpecification, ["price"]),
      currency: readObjectString(offer, ["priceCurrency"]) ?? readObjectString(priceSpecification, ["priceCurrency"])
    };
  }

  return undefined;
}

function extractMetaCandidate(html: string): ProductCandidate {
  const meta = metaContents(html);
  return {
    title: getMetaContent(meta, ["og:title", "twitter:title", "product:title", "title", "name"]) ?? titleText(html),
    image: getMetaContent(meta, ["og:image:secure_url", "og:image", "twitter:image", "image"]),
    price: getMetaContent(meta, ["product:price:amount", "og:price:amount", "price", "sale_price"]),
    currency: getMetaContent(meta, ["product:price:currency", "og:price:currency", "pricecurrency"]),
    description: getMetaContent(meta, ["og:description", "twitter:description", "description"])
  };
}

/** Tag de abertura com esse id, nome da tag e onde ela termina. */
function tagById(html: string, id: string) {
  for (const needle of [`id="${id}"`, `id='${id}'`]) {
    // ponytail: só as 10 primeiras ocorrências (id é único na página real) — mantém a busca linear.
    for (let at = html.indexOf(needle), tries = 0; at > 0 && tries < 10; at = html.indexOf(needle, at + 1), tries += 1) {
      if (!/\s/.test(html[at - 1])) continue;
      const start = html.lastIndexOf("<", at);
      const end = html.indexOf(">", at);
      if (start < 0 || end < 0) break;
      const tag = html.slice(start, end + 1);
      const name = /^<([a-z][\w-]*)\s[^>]*>$/i.exec(tag)?.[1];
      if (name) return { tag, name: name.toLowerCase(), end: end + 1 };
    }
  }
  return undefined;
}

function textById(html: string, id: string) {
  const found = tagById(html, id);
  const close = found ? html.indexOf(`</${found.name}`, found.end) : -1;
  return found && close >= 0 ? normalizeText(stripTags(html.slice(found.end, close))) : undefined;
}

function largestDynamicImage(json?: string) {
  if (!json) return undefined;
  try {
    const sizes = Object.entries(JSON.parse(json) as Record<string, unknown>);
    const area = (value: unknown) => (Array.isArray(value) ? Number(value[0]) * Number(value[1]) || 0 : 0);
    return sizes.sort(([, a], [, b]) => area(b) - area(a))[0]?.[0];
  } catch {
    return undefined;
  }
}

const AMAZON_PRICE_SECTIONS = [
  "corePrice_feature_div",
  "corePriceDisplay_desktop_feature_div",
  "corePrice_desktop",
  "corePrice_mobile_feature_div"
];

function amazonPrice(html: string) {
  const sectionPrices = AMAZON_PRICE_SECTIONS.map((id) => {
    const start = html.indexOf(`id="${id}"`);
    if (start < 0) return undefined;
    // Só dentro do próprio widget: preço de patrocinado/parcela mais abaixo não conta.
    const next = html.indexOf("data-feature-name=", html.indexOf("data-feature-name=", start) + 1);
    const section = html.slice(start, next < 0 ? start + 5_000 : Math.min(next, start + 5_000));
    return Array.from(section.matchAll(/class=["']a-offscreen["']>([^<]*)</gi), (match) => match[1]).find((text) => /\d/.test(text));
  });
  const priceToPay = /^\b[^"'>]*["'][^>]*>\s*<span class=["']a-offscreen["']>([^<]*)</;

  return [
    matchAfter(html, "apex-pricetopay-accessibility-label", /^["'][^>]*>([^<]*)</)?.[1],
    matchAfter(html, "priceToPay", priceToPay)?.[1],
    matchAfter(html, "apex-pricetopay-value", priceToPay)?.[1],
    ...sectionPrices,
    // JSON do twister sem escape; o escapado (&quot;priceAmount&quot;) é de patrocinado.
    html.match(/"priceAmount":\s*([\d.]+)/)?.[1]
  ]
    .map((value) => normalizeText(value))
    .find((value) => value && /\d/.test(value));
}

/** Markup da página de produto da Amazon (desktop e mobile), que não tem og:* nem JSON-LD. */
function extractAmazonCandidate(html: string): ProductCandidate {
  const landing = tagById(html, "landingImage")?.tag;
  const wrapperEnd = tagById(html, "imgTagWrapperId")?.end;
  const wrapper = wrapperEnd === undefined ? undefined : /^\s*<img\b[^>]*>/i.exec(html.slice(wrapperEnd, wrapperEnd + 5_000))?.[0];
  const mobile = tagById(html, "main-image")?.tag;
  const image = [
    getTagAttribute(landing, "data-old-hires"),
    largestDynamicImage(getTagAttribute(landing, "data-a-dynamic-image")),
    getTagAttribute(landing, "src"),
    getTagAttribute(wrapper, "src"),
    html.match(/"hiRes":"(https:[^"]+)"/)?.[1],
    getTagAttribute(mobile, "data-a-hires"),
    getTagAttribute(mobile, "src")
  ].find((value) => value && /^(?:https?:)?\/\//i.test(value));

  return { title: textById(html, "productTitle") ?? textById(html, "title"), image, price: amazonPrice(html) };
}

export function cleanTitle(raw?: string) {
  return normalizeText(
    normalizeText(raw)
      ?.replace(/^Amazon\.[a-z.]+\s*:\s*/i, "")
      .replace(/\s*:\s*Amazon\.[a-z.]+(?::.*)?$/i, "")
      .replace(/\s*\|\s*Amazon\.[a-z.]+$/i, "")
      .replace(/\s*[|\-–]\s*Mercado\s*Li(?:vre|bre)(?:\.com(?:\.[a-z]{2})?)?$/i, "")
      .replace(/\s+-\s+R\$\s*[\d.,]+$/, "")
  );
}

/** Absoluta, https e na maior variante conhecida (Amazon: original sem modificadores; ML: 2X "-O"). */
export function normalizeImageUrl(raw: string | undefined, base: URL): string | null {
  if (!raw || raw.length > 2_000) return null;
  let url: URL;
  try {
    url = new URL(raw.trim(), base);
  } catch {
    return null;
  }
  if (url.protocol === "http:") url.protocol = "https:";
  if (url.protocol !== "https:") return null;

  return url
    .toString()
    .replace(/^(https:\/\/[\w.-]*media-amazon\.com\/images\/I\/[^/.]+)\.[^/?#]*\.(jpe?g|png|gif|webp)$/i, "$1.$2")
    .replace(
      /^https:\/\/http2\.mlstatic\.com\/D_(?:[A-Z0-9]+_)*?(\d+-ML[A-Z]\d+_\d+)-[A-Z](?:-[^/?#]*)?\.(jpe?g|png|webp)$/,
      "https://http2.mlstatic.com/D_NQ_NP_2X_$1-O.$2"
    );
}

/** "R$ 1.299,90", "1299.9", "377" → número; separador decimal = último com 1–2 dígitos depois. */
export function parsePriceNumber(text: string) {
  const digits = text.match(/\d[\d.,]*/)?.[0].replace(/[.,]$/, "");
  if (!digits) return undefined;
  const separator = Math.max(digits.lastIndexOf(","), digits.lastIndexOf("."));
  const hasDecimals = separator >= 0 && digits.length - separator - 1 <= 2;
  const integer = (hasDecimals ? digits.slice(0, separator) : digits).replace(/[.,]/g, "");
  const value = Number(hasDecimals ? `${integer}.${digits.slice(separator + 1)}` : integer);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatPrice(raw?: string, currency?: string): string | null {
  const text = normalizeText(raw);
  if (!text) return null;
  const code = currency?.toUpperCase();
  if (!/R\$/i.test(text) && ((code && code !== "BRL") || /[$€£]/.test(text))) {
    return code && !text.includes(code) ? `${code} ${text}` : text;
  }
  const value = parsePriceNumber(text);
  // Espaço comum (o Intl usa NBSP), igual ao que o casal digitaria.
  return value === undefined ? null : BRL.format(value).replace(/\u00a0/g, " ");
}

function extractVisiblePrice(html: string) {
  const text = decodeHtmlEntities(stripTags(html)).replace(/\s+/g, " ");
  return text.match(/R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}|R\$\s*\d+(?:,\d{2})?/)?.[0];
}

export function parseProductPage(html: string, pageUrl: URL, store: Store): ParsedProduct {
  const amazon = store === "amazon" ? extractAmazonCandidate(html) : {};
  const jsonLd = extractJsonLdCandidate(html) ?? {};
  const meta = extractMetaCandidate(html);
  // Texto solto da página só em loja genérica: na Amazon pegaria preço de patrocinado.
  const visiblePrice = store === "generic" ? extractVisiblePrice(html) : undefined;

  return {
    title: cleanTitle(amazon.title ?? jsonLd.title ?? meta.title),
    image: normalizeImageUrl(amazon.image ?? jsonLd.image ?? meta.image, pageUrl),
    price: formatPrice(amazon.price ?? jsonLd.price ?? meta.price ?? visiblePrice, jsonLd.currency ?? meta.currency),
    description: normalizeText(jsonLd.description ?? meta.description) ?? null
  };
}

function fallbackTitleFromUrl(url: URL) {
  const segment = url.pathname.split("/").filter(Boolean).pop();
  let decoded = url.hostname.replace(/^www\./, "");
  try {
    if (segment) decoded = decodeURIComponent(segment);
  } catch {
    // segmento com % inválido: fica o host
  }
  const cleaned = decoded
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 4) return `Presente de ${url.hostname.replace(/^www\./, "")}`;

  return cleaned.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

/* ------------------------------------------------------------------------- API */

function failureReason(error: unknown) {
  if (error instanceof Error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (error.name === "TimeoutError" || error.name === "AbortError") return "timeout";
    return code ?? error.message.slice(0, 40);
  }
  return "unknown";
}

export async function extractGiftFromUrl(rawUrl: string, fetchPage: PageFetcher = fetchHtml): Promise<GiftExtractionResponse> {
  let store: Store = "generic";
  const attempts: string[] = [];

  try {
    const url = await expandShortLink(assertPublicUrl(rawUrl.trim()));
    store = storeForHost(url.hostname);
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    let best: (ParsedProduct & { url: URL; source: string; score: number }) | undefined;
    let retriedForPrice = false;

    for (const strategy of STRATEGIES[store]) {
      const timeLeft = deadline - Date.now();
      if (timeLeft < 1_500) break;

      try {
        const page = await fetchPage(url, strategy.headers, Math.min(ATTEMPT_TIMEOUT_MS, timeLeft));
        const blocked = detectBlock(store, page);
        if (blocked) {
          attempts.push(`${strategy.name}:${blocked}`);
          continue;
        }

        const product = parseProductPage(page.html, page.url, store);
        const score = (product.title ? 1 : 0) + (product.image ? 1 : 0);
        attempts.push(`${strategy.name}:${page.status}:${score}`);
        if (score > (best?.score ?? 0) || (best && score === best.score && product.price && !best.price)) {
          best = { ...product, url: page.url, source: `${store}:${strategy.name}`, score };
        }
        // A Amazon às vezes serve uma variante em cache com o preço escondido ("adicione ao
        // carrinho"): aí faz UMA tentativa a mais só pelo preço. Produto sem preço mesmo não paga isso.
        const priceHidden = store === "amazon" && !product.price && page.html.includes('id="priceNotAvailable_feature_div"');
        if (score === 2) {
          if (!priceHidden || retriedForPrice) break;
          retriedForPrice = true;
        }
      } catch (error) {
        if (error instanceof GiftImportError) throw error;
        if ((error as NodeJS.ErrnoException).code === "ENOTFOUND") {
          throw new GiftImportError(GIFT_IMPORT_MESSAGES.hostNotFound, "dns");
        }
        attempts.push(`${strategy.name}:${failureReason(error)}`);
      }
    }

    if (best) {
      return {
        title: best.title ?? fallbackTitleFromUrl(best.url),
        price: best.price,
        image: best.image,
        url: best.url.toString(),
        source: best.source,
        description: best.description
      };
    }

    const notFound = attempts.length > 0 && attempts.every((attempt) => /:http-(404|410)$/.test(attempt));
    throw new GiftImportError(notFound ? GIFT_IMPORT_MESSAGES.productNotFound : GIFT_IMPORT_MESSAGES.manual, "no-data");
  } catch (error) {
    const base = error instanceof GiftImportError ? error : new GiftImportError(GIFT_IMPORT_MESSAGES.manual, failureReason(error));
    throw new GiftImportError(base.message, `store=${store} reason=${base.detail} attempts=${attempts.join(",") || "none"}`);
  }
}

/**
 * Tipo pela assinatura dos bytes, não pelo Content-Type do servidor: só os formatos que o
 * bucket aceita (jpeg/png/webp/avif). Qualquer outra coisa rotulada "image/png" vira null.
 */
export function sniffImageType(bytes: Uint8Array): { contentType: string; ext: string } | null {
  const head = Buffer.from(bytes.subarray(0, 32)).toString("latin1");
  if (head.startsWith("\xff\xd8\xff")) return { contentType: "image/jpeg", ext: "jpg" };
  if (head.startsWith("\x89PNG\r\n\x1a\n")) return { contentType: "image/png", ext: "png" };
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return { contentType: "image/webp", ext: "webp" };
  if (head.slice(4, 8) === "ftyp" && /avi[fs]/.test(head.slice(8))) return { contentType: "image/avif", ext: "avif" };
  return null;
}

/**
 * Baixa a imagem do produto com a MESMA proteção SSRF do scraper (redirects e IPs
 * validados), tipo conferido pelos bytes e teto de 8 MB. Retorna null e nunca lança —
 * o caller degrada sem imagem. Os bytes vão pro nosso storage (sem hotlink).
 */
export async function fetchExternalImage(
  rawUrl: string
): Promise<{ bytes: Uint8Array; contentType: string; ext: string } | null> {
  try {
    const page = await safeFetch(
      assertPublicUrl(rawUrl),
      { "User-Agent": BROWSER_UA, Accept: "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8" },
      IMAGE_MAX_BYTES,
      IMAGE_TIMEOUT_MS
    );
    const type = sniffImageType(page.body);
    if (page.status !== 200 || !type || page.truncated) return null;

    return { bytes: new Uint8Array(page.body), ...type };
  } catch {
    return null;
  }
}

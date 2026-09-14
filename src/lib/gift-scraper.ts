import type { GiftExtractionResponse } from "@/types/gift-extraction";

type ProductCandidate = {
  title?: string;
  price?: string;
  currency?: string;
  image?: string;
  description?: string;
  source?: string;
};

const MAX_HTML_CHARS = 1_200_000;
const REQUEST_TIMEOUT_MS = 12_000;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./
];

function assertPublicProductUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Informe uma URL válida de produto.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Use uma URL pública começando com http ou https.");
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname.endsWith(".local") || hostname.includes(":") || PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname))) {
    throw new Error("Por segurança, não é possível extrair dados de endereços locais ou privados.");
  }

  return url;
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

    if (normalized.startsWith("#x")) {
      const parsed = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }

    if (normalized.startsWith("#")) {
      const parsed = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
    }

    return namedEntities[normalized] ?? entity;
  });
}

function normalizeText(value?: string | null) {
  if (!value) return undefined;

  return decodeHtmlEntities(value)
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();
}

function getTagAttribute(tag: string, attribute: string) {
  const pattern = new RegExp(`(?:^|\\s)${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = tag.match(pattern);

  return normalizeText(match?.[2] ?? match?.[3] ?? match?.[4]);
}

function getMetaContent(html: string, keys: string[]) {
  const metaTags = html.match(/<meta\s+[^>]*>/gi) ?? [];

  for (const key of keys) {
    const normalizedKey = key.toLowerCase();
    const tag = metaTags.find((candidate) => {
      const property = getTagAttribute(candidate, "property")?.toLowerCase();
      const name = getTagAttribute(candidate, "name")?.toLowerCase();
      const itemProp = getTagAttribute(candidate, "itemprop")?.toLowerCase();

      return property === normalizedKey || name === normalizedKey || itemProp === normalizedKey;
    });

    const content = tag ? getTagAttribute(tag, "content") : undefined;
    if (content) return content;
  }

  return undefined;
}

function stripHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return normalizeText(value);

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

  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function extractOffer(product: Record<string, unknown>) {
  const offer = firstObject(product.offers);
  if (!offer) return {};

  const priceSpecification = firstObject(offer.priceSpecification) ?? {};

  return {
    price: readObjectString(offer, ["price", "lowPrice", "highPrice", "minPrice", "maxPrice"]) ?? readObjectString(priceSpecification, ["price"]),
    currency: readObjectString(offer, ["priceCurrency"]) ?? readObjectString(priceSpecification, ["priceCurrency"])
  };
}

function extractJsonLdCandidate(html: string): ProductCandidate | undefined {
  const scriptMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of scriptMatches) {
    const rawJson = decodeHtmlEntities(match[1] ?? "").trim();
    if (!rawJson) continue;

    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const product = findJsonLdProducts(parsed)[0];
      if (!product) continue;

      const offer = extractOffer(product);

      return {
        title: readObjectString(product, ["name", "headline"]),
        description: readObjectString(product, ["description"]),
        image: firstString(product.image),
        price: offer.price,
        currency: offer.currency,
        source: "JSON-LD do produto"
      };
    } catch {
      continue;
    }
  }

  return undefined;
}

function extractMetaCandidate(html: string): ProductCandidate | undefined {
  const title =
    getMetaContent(html, ["og:title", "twitter:title", "product:title", "name"]) ??
    normalizeText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const image = getMetaContent(html, ["og:image:secure_url", "og:image", "twitter:image", "image"]);
  const price = getMetaContent(html, [
    "product:price:amount",
    "og:price:amount",
    "twitter:data1",
    "price",
    "sale_price",
    "amount"
  ]);
  const currency = getMetaContent(html, ["product:price:currency", "og:price:currency", "priceCurrency"]);
  const description = getMetaContent(html, ["og:description", "twitter:description", "description"]);

  if (!title && !image && !price) return undefined;

  return {
    title,
    image,
    price,
    currency,
    description,
    source: "metadados da página"
  };
}

function extractBrazilianPrice(html: string) {
  const text = stripHtml(html);
  const match = text.match(/R\$\s*[0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|R\$\s*[0-9]+(?:,[0-9]{2})?/);

  return normalizeText(match?.[0]);
}

function fallbackTitleFromUrl(url: URL) {
  const segment = url.pathname.split("/").filter(Boolean).pop();
  const decoded = segment ? decodeURIComponent(segment) : url.hostname.replace(/^www\./, "");
  const cleaned = decoded
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < 4) return `Presente de ${url.hostname.replace(/^www\./, "")}`;

  return cleaned.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

function formatPrice(price?: string, currency?: string) {
  const normalizedPrice = normalizeText(price);
  if (!normalizedPrice) return null;

  if (/R\$/i.test(normalizedPrice)) return normalizedPrice;

  const numericMatch = normalizedPrice.match(/[0-9]+(?:[.,][0-9]{1,2})?/);
  if (!numericMatch) return normalizedPrice;

  const value = Number(numericMatch[0].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(value)) return normalizedPrice;

  if (!currency || currency.toUpperCase() === "BRL") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  return `${currency.toUpperCase()} ${normalizedPrice}`;
}

function resolveImageUrl(image: string | undefined, productUrl: URL) {
  if (!image) return null;

  try {
    return new URL(image, productUrl).toString();
  } catch {
    return null;
  }
}

async function readLimitedText(response: Response) {
  if (!response.body) {
    return (await response.text()).slice(0, MAX_HTML_CHARS);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let html = "";

  while (html.length < MAX_HTML_CHARS) {
    const { done, value } = await reader.read();
    if (done) break;
    html += decoder.decode(value, { stream: true });
  }

  html += decoder.decode();
  await reader.cancel().catch(() => undefined);

  return html.slice(0, MAX_HTML_CHARS);
}

export async function extractGiftFromUrl(rawUrl: string): Promise<GiftExtractionResponse> {
  const productUrl = assertPublicProductUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(productUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.7,en;q=0.5",
        "Cache-Control": "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
      },
      redirect: "follow",
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`A loja respondeu com status ${response.status}. Tente outro link ou preencha os campos manualmente.`);
    }

    const html = await readLimitedText(response);
    const jsonLdCandidate = extractJsonLdCandidate(html);
    const metaCandidate = extractMetaCandidate(html);
    const fallbackPrice = extractBrazilianPrice(html);
    const candidate: ProductCandidate = {
      title: jsonLdCandidate?.title ?? metaCandidate?.title,
      price: jsonLdCandidate?.price ?? metaCandidate?.price,
      currency: jsonLdCandidate?.currency ?? metaCandidate?.currency,
      image: jsonLdCandidate?.image ?? metaCandidate?.image,
      description: jsonLdCandidate?.description ?? metaCandidate?.description,
      source: jsonLdCandidate?.source ?? metaCandidate?.source
    };

    const title = normalizeText(candidate.title) ?? fallbackTitleFromUrl(productUrl);
    const price = formatPrice(candidate.price ?? fallbackPrice, candidate.currency);
    const image = resolveImageUrl(candidate.image, productUrl);

    return {
      title,
      price,
      image,
      url: response.url || productUrl.toString(),
      source: candidate.source ?? (fallbackPrice ? "texto visível da página" : "URL do produto"),
      description: normalizeText(candidate.description) ?? null
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A loja demorou demais para responder. Tente novamente ou preencha os dados manualmente.");
    }

    if (error instanceof Error) throw error;

    throw new Error("Não foi possível extrair os dados desse produto.");
  } finally {
    clearTimeout(timeout);
  }
}

const IMAGE_TIMEOUT_MS = 8_000;
const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif"
};

async function readLimitedBytes(response: Response, max: number): Promise<Uint8Array | null> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) return null;

  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    return buffer.byteLength > max ? null : buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Baixa a imagem do produto (og:image) com a MESMA proteção SSRF do scraper, só
 * content-type de imagem e teto de tamanho (streamado). Retorna null e nunca
 * lança — o caller degrada sem imagem. Os bytes vão pro nosso storage, então não
 * dependemos de hotlink nem furamos o remotePatterns do next/image.
 */
export async function fetchExternalImage(
  rawUrl: string
): Promise<{ bytes: Uint8Array; contentType: string; ext: string } | null> {
  let imageUrl: URL;
  try {
    imageUrl = assertPublicProductUrl(rawUrl);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const response = await fetch(imageUrl, { redirect: "follow", signal: controller.signal });
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
    const ext = IMAGE_EXT[contentType];
    if (!ext) return null;

    const bytes = await readLimitedBytes(response, IMAGE_MAX_BYTES);
    if (!bytes || bytes.byteLength === 0) return null;

    return { bytes, contentType, ext };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

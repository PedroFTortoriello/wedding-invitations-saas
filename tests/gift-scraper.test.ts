import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertPublicUrl,
  cleanTitle,
  detectBlock,
  extractGiftFromUrl,
  fetchExternalImage,
  formatPrice,
  GIFT_IMPORT_MESSAGES,
  GiftImportError,
  isBlockedIp,
  isShortLink,
  normalizeImageUrl,
  parseProductPage,
  sniffImageType,
  STRATEGIES,
  storeForHost,
  type FetchedPage,
  type PageFetcher
} from "@/lib/gift-scraper";

const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock("node:dns/promises", () => ({ lookup: dns.lookup }));

const fixture = (name: string) => readFileSync(new URL(`./fixtures/gift-scraper/${name}`, import.meta.url), "utf8");
const ML_URL = new URL("https://produto.mercadolivre.com.br/MLB-3557591741-fritadeira-air-fryer-42l-bfr37-127v-britnia-cor-preto-_JM");
const AMZ_URL = new URL("https://www.amazon.com.br/Jogo-Panelas-Antiaderente-Ceramic-Brinox/dp/B0D3WQRS8F");

describe("classificador de IP (SSRF)", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "255.255.255.255",
    "198.18.0.1",
    "::",
    "::1",
    "fd00::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:a00:1",
    "64:ff9b::a00:1",
    "2002:a00:1::",
    "::ffff:0:127.0.0.1",
    "2001:2::1",
    "2001:10::1",
    "2001:20::1",
    "3fff::1",
    "5f00::1",
    "não é ip"
  ])("bloqueia %s", (ip) => {
    expect(isBlockedIp(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "172.32.0.1", "100.128.0.1", "23.52.0.1", "2606:4700::1111", "2800:3f0:4001::200e", "::ffff:8.8.8.8"])(
    "libera %s",
    (ip) => {
      expect(isBlockedIp(ip)).toBe(false);
    }
  );
});

describe("validação de URL", () => {
  it("aceita link público de loja", () => {
    expect(assertPublicUrl("https://www.amazon.com.br/dp/B076JJMP9S").hostname).toBe("www.amazon.com.br");
  });

  it.each([
    ["file:///etc/passwd", "protocol"],
    ["ftp://loja.com.br/x", "protocol"],
    ["não é url", "invalid-url"],
    ["http://127.0.0.1/", "non-public-url"],
    ["http://2130706433/", "non-public-url"],
    ["http://[::1]/", "non-public-url"],
    ["http://localhost/", "non-public-url"],
    ["https://loja.com.br:8443/", "non-public-url"],
    ["https://user:senha@loja.com.br/", "non-public-url"]
  ])("recusa %s", (raw, detail) => {
    expect(() => assertPublicUrl(raw)).toThrow(expect.objectContaining({ name: "GiftImportError", detail }));
  });

  it("resolve Location relativo contra o salto anterior", () => {
    expect(assertPublicUrl("/dp/B0?x=1", new URL("https://amzn.to/abc")).toString()).toBe("https://amzn.to/dp/B0?x=1");
  });
});

describe("DNS validado na conexão", () => {
  beforeEach(() => dns.lookup.mockReset());

  it("host público que resolve para IP privado é recusado sem conectar", async () => {
    dns.lookup.mockResolvedValue([{ address: "10.0.0.5", family: 4 }]);
    await expect(extractGiftFromUrl("https://loja-exemplo.com.br/produto")).rejects.toMatchObject({
      message: GIFT_IMPORT_MESSAGES.private,
      detail: expect.stringContaining("reason=private-ip")
    });
    expect(await fetchExternalImage("https://cdn-exemplo.com.br/foto.jpg")).toBeNull();
  });

  it("basta um IP privado entre vários (IPv6 mapeado)", async () => {
    dns.lookup.mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
      { address: "::ffff:169.254.169.254", family: 6 }
    ]);
    await expect(extractGiftFromUrl("https://loja-exemplo.com.br/produto")).rejects.toMatchObject({
      message: GIFT_IMPORT_MESSAGES.private
    });
  });
});

describe("tipo da imagem baixada", () => {
  const bytes = (...parts: (string | number[])[]) =>
    Uint8Array.from(parts.flatMap((part) => (typeof part === "string" ? [...Buffer.from(part, "latin1")] : part)));

  it.each([
    ["jpeg", bytes([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg"],
    ["png", bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]), "image/png"],
    ["webp", bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "), "image/webp"],
    ["avif", bytes([0, 0, 0, 0x1c], "ftypavif"), "image/avif"],
    ["gif (bucket não aceita)", bytes("GIF89a"), null],
    ["JSON rotulado image/png", bytes('{ "a": 1 }'), null],
    ["vazio", bytes(), null]
  ])("%s", (_name, data, contentType) => {
    expect(sniffImageType(data)?.contentType ?? null).toBe(contentType);
  });
});

describe("adaptador pela loja", () => {
  it.each([
    ["produto.mercadolivre.com.br", "mercadolivre"],
    ["www.mercadolivre.com.br", "mercadolivre"],
    ["articulo.mercadolibre.com.ar", "mercadolivre"],
    ["mercadolivre.com", "mercadolivre"],
    ["www.amazon.com.br", "amazon"],
    ["amazon.com", "amazon"],
    ["www.amazon.co.uk", "amazon"],
    ["m.media-amazon.com", "generic"],
    ["www.tramontina.com.br", "generic"],
    ["amazon.com.br.golpe.com", "generic"]
  ])("%s → %s", (host, store) => {
    expect(storeForHost(host)).toBe(store);
  });

  it("reconhece encurtadores", () => {
    expect(isShortLink(new URL("https://amzn.to/3abc"))).toBe(true);
    expect(isShortLink(new URL("https://a.co/d/abc"))).toBe(true);
    expect(isShortLink(new URL("https://meli.la/1abc"))).toBe(true);
    expect(isShortLink(new URL("https://mercadolivre.com/sec/1abc"))).toBe(true);
    expect(isShortLink(ML_URL)).toBe(false);
  });
});

describe("detecção de muro/captcha", () => {
  const page = (url: URL, html: string, status = 200): FetchedPage => ({ status, url, html });

  it("Mercado Livre: account-verification e página sem produto", () => {
    const wall = new URL("https://www.mercadolivre.com.br/gz/account-verification?go=https%3A%2F%2Fproduto.mercadolivre.com.br");
    expect(detectBlock("mercadolivre", page(wall, fixture("mercadolivre-wall.html")))).toBe("wall");
    expect(detectBlock("mercadolivre", page(ML_URL, fixture("mercadolivre-wall.html")))).toBe("no-product");
    expect(detectBlock("mercadolivre", page(ML_URL, fixture("mercadolivre-product.html")))).toBeNull();
  });

  it("Amazon: captcha", () => {
    expect(detectBlock("amazon", page(AMZ_URL, fixture("amazon-captcha.html")))).toBe("captcha");
    expect(detectBlock("amazon", page(AMZ_URL, fixture("amazon-desktop.html")))).toBeNull();
  });

  it("HTTP de erro", () => {
    expect(detectBlock("generic", page(AMZ_URL, "", 404))).toBe("http-404");
  });
});

describe("parsing das páginas", () => {
  it("Mercado Livre: JSON-LD com preço numérico e imagem 2X original", () => {
    expect(parseProductPage(fixture("mercadolivre-product.html"), ML_URL, "mercadolivre")).toEqual({
      title: "Fritadeira Air Fryer 4,2l Bfr37 127v Britânia Cor Preto Preto 127v",
      price: "R$ 377,00",
      image: "https://http2.mlstatic.com/D_NQ_NP_2X_981858-MLB75070958809_032024-O.webp",
      description: expect.stringContaining("Produto Novo")
    });
  });

  it("Mercado Livre: sem JSON-LD cai no og:* e limpa o sufixo de preço", () => {
    const html = fixture("mercadolivre-product.html").replace(/<script[\s\S]*?<\/script>/g, "");
    const parsed = parseProductPage(html, ML_URL, "mercadolivre");
    expect(parsed.title).toBe("Fritadeira Air Fryer 4,2l Bfr37 127v Britânia Cor Preto Preto 127v");
    expect(parsed.image).toBe("https://http2.mlstatic.com/D_NQ_NP_2X_981858-MLB75070958809_032024-O.jpg");
    expect(parsed.price).toBe("R$ 377,00");
  });

  it("Amazon desktop sem buybox: data-old-hires limpo e sem preço de patrocinado/parcela", () => {
    expect(parseProductPage(fixture("amazon-desktop-no-buybox.html"), AMZ_URL, "amazon")).toMatchObject({
      title: "Brinox - Jogo de Panelas Antiaderente Ceramic Life Brinox Easy 7 Peças - Verde Jade",
      image: "https://m.media-amazon.com/images/I/41jDoiN0zFL.jpg",
      price: null
    });
  });

  it("Amazon desktop: preço do corePrice e imagem pelo data-a-dynamic-image", () => {
    expect(parseProductPage(fixture("amazon-desktop.html"), AMZ_URL, "amazon")).toMatchObject({
      title: "Jogo de Panelas de Alumínio com Revestimento Interno de Antiaderente 5 Peças Tramontina Mônaco Preto",
      image: "https://m.media-amazon.com/images/I/71H-G2gbQNL.jpg",
      price: "R$ 729,90"
    });
  });

  it("Amazon mobile: #title, #main-image e preço acessível", () => {
    expect(parseProductPage(fixture("amazon-mobile.html"), AMZ_URL, "amazon")).toMatchObject({
      title: "Jogo de Panelas de Alumínio com Revestimento Interno de Antiaderente 5 Peças Tramontina Mônaco Preto",
      image: "https://m.media-amazon.com/images/I/71H-G2gbQNL.jpg",
      price: "R$ 729,90"
    });
  });

  it("Amazon só com og:* (crawler de prévia)", () => {
    expect(parseProductPage(fixture("amazon-og.html"), AMZ_URL, "amazon")).toMatchObject({
      title: "Brinox - Jogo de Panelas Antiaderente Ceramic Life Brinox Easy 7 Peças - Verde Jade",
      image: "https://m.media-amazon.com/images/I/41jDoiN0zFL.jpg",
      price: null
    });
  });

  it("loja genérica: JSON-LD em @graph, AggregateOffer e imagem http → https", () => {
    expect(parseProductPage(fixture("generic-store.html"), new URL("https://www.lojaexemplo.com.br/tacas"), "generic")).toEqual({
      title: "Jogo de Taças Cristal 6 Peças",
      image: "https://cdn.lojaexemplo.com.br/tacas-cristal-grande.jpg",
      price: "R$ 1.299,90",
      description: 'Taça 5" de altura'
    });
  });
});

describe("HTML hostil não trava o event loop", () => {
  const N = 3 * 1024 * 1024;
  const fill = (unit: string) => unit.repeat(Math.ceil(N / unit.length)).slice(0, N);

  it.each([
    ["<meta + espaços", "<meta" + " ".repeat(N)],
    ["<meta repetido", fill("<meta ")],
    ["<meta> curtas", fill('<meta property="og:x" content="y">')],
    ["<script sem fechar", fill('<script type="application/ld+json">')],
    ["<title repetido", fill("<title>")],
    ["<a repetido", fill("<a ")],
    ["< solto", fill("<")],
    ["id repetido", fill(' id="productTitle"')],
    ["classe priceToPay sem aspas", 'class="' + fill("priceToPay ")]
  ])("%s (3 MB) em tempo linear", (_name, html) => {
    const url = new URL("https://www.loja.com.br/p");
    const started = performance.now();
    for (const store of ["amazon", "generic", "mercadolivre"] as const) {
      detectBlock(store, { status: 200, url, html });
      parseProductPage(html, url, store);
    }
    // Quadrático levaria minutos; linear fica em dezenas de ms.
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});

describe("normalização", () => {
  it.each([
    ["Produto X | Amazon.com.br", "Produto X"],
    ["Produto X : Amazon.com.br: Cozinha", "Produto X"],
    ["Amazon.com.br: Produto X", "Produto X"],
    ["Produto X | Mercado Livre", "Produto X"],
    ["Produto X | MercadoLivre", "Produto X"],
    ["Produto X - Mercado Livre", "Produto X"],
    ["Produto X - R$ 1.299,90", "Produto X"],
    ["Panela 3-em-1 Tramontina", "Panela 3-em-1 Tramontina"]
  ])("título %s", (raw, clean) => {
    expect(cleanTitle(raw)).toBe(clean);
  });

  it("imagem: relativa, protocol-relative, data: e modificadores", () => {
    const base = new URL("https://loja.com.br/p/1");
    expect(normalizeImageUrl("/img/a.jpg", base)).toBe("https://loja.com.br/img/a.jpg");
    expect(normalizeImageUrl("//cdn.loja.com.br/a.png", base)).toBe("https://cdn.loja.com.br/a.png");
    expect(normalizeImageUrl("data:image/gif;base64,R0lGOD", base)).toBeNull();
    expect(normalizeImageUrl("https://m.media-amazon.com/images/I/31LcmObh+4L._AC_US100_.jpg", base)).toBe(
      "https://m.media-amazon.com/images/I/31LcmObh+4L.jpg"
    );
    expect(normalizeImageUrl("http://http2.mlstatic.com/D_Q_NP_841853-MLA74977559201_032024-F.jpg", base)).toBe(
      "https://http2.mlstatic.com/D_NQ_NP_2X_841853-MLA74977559201_032024-O.jpg"
    );
  });

  it.each([
    ["377", undefined, "R$ 377,00"],
    ["729.90", "BRL", "R$ 729,90"],
    ["1299.9", undefined, "R$ 1.299,90"],
    ["R$ 1.299,90", undefined, "R$ 1.299,90"],
    ["R$1.299", undefined, "R$ 1.299,00"],
    ["1,299.00", undefined, "R$ 1.299,00"],
    ["29.99", "USD", "USD 29.99"],
    ["US$ 29,99", undefined, "US$ 29,99"],
    ["0", undefined, null],
    ["sob consulta", undefined, null]
  ])("preço %s (%s)", (raw, currency, expected) => {
    expect(formatPrice(raw, currency)).toBe(expected);
  });
});

describe("estratégias em cascata", () => {
  const html: Record<string, string> = {};
  const fake =
    (responses: Record<string, (url: URL) => FetchedPage>): PageFetcher =>
    async (url, headers) => {
      const strategy = Object.values(STRATEGIES)
        .flat()
        .find((item) => item.headers === headers)?.name;
      const respond = strategy ? responses[`${storeForHost(url.hostname)}:${strategy}`] : undefined;
      if (!respond) throw Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
      return respond(url);
    };

  beforeEach(() => {
    html.mlProduct = fixture("mercadolivre-product.html");
    html.mlWall = fixture("mercadolivre-wall.html");
  });

  it("Mercado Livre: muro no facebook → WhatsApp lê o produto", async () => {
    const wall = new URL("https://www.mercadolivre.com.br/gz/account-verification?go=x");
    const gift = await extractGiftFromUrl(
      ML_URL.toString(),
      fake({
        "mercadolivre:facebook": () => ({ status: 200, url: wall, html: html.mlWall }),
        "mercadolivre:whatsapp": (url) => ({ status: 200, url, html: html.mlProduct })
      })
    );
    expect(gift).toMatchObject({ source: "mercadolivre:whatsapp", price: "R$ 377,00", url: ML_URL.toString() });
  });

  it("Amazon: captcha no desktop → iPhone", async () => {
    const gift = await extractGiftFromUrl(
      AMZ_URL.toString(),
      fake({
        "amazon:browser": (url) => ({ status: 200, url, html: fixture("amazon-captcha.html") }),
        "amazon:iphone": (url) => ({ status: 200, url, html: fixture("amazon-mobile.html") })
      })
    );
    expect(gift).toMatchObject({ source: "amazon:iphone", price: "R$ 729,90", image: expect.stringContaining("71H-G2gbQNL") });
  });

  it("Amazon com preço escondido (variante em cache): uma tentativa a mais só pelo preço", async () => {
    const called: string[] = [];
    const noBuybox = fixture("amazon-desktop-no-buybox.html");
    const hidden = noBuybox.replace("</body>", '<div id="priceNotAvailable_feature_div"></div></body>');
    const page = (name: string, html: string) => (url: URL) => {
      called.push(name);
      return { status: 200, url, html };
    };
    const run = async (browser: string, iphone: string) => {
      called.length = 0;
      return extractGiftFromUrl(
        AMZ_URL.toString(),
        fake({ "amazon:browser": page("browser", browser), "amazon:iphone": page("iphone", iphone), "amazon:facebook": page("facebook", hidden) })
      );
    };

    expect(await run(hidden, fixture("amazon-mobile.html"))).toMatchObject({ source: "amazon:iphone", price: "R$ 729,90" });
    expect(await run(hidden, hidden)).toMatchObject({ source: "amazon:browser", price: null });
    expect(called).toEqual(["browser", "iphone"]);
    // Sem preço de verdade (sem o widget escondido): não gasta tentativa extra.
    expect(await run(noBuybox, fixture("amazon-mobile.html"))).toMatchObject({ source: "amazon:browser", price: null });
    expect(called).toEqual(["browser"]);
  });

  it("guarda o melhor resultado parcial e segue tentando", async () => {
    const titleOnly = "<html><head><title>Cafeteira X | Loja</title></head></html>";
    const gift = await extractGiftFromUrl(
      "https://www.loja.com.br/cafeteira",
      fake({ "generic:browser": (url) => ({ status: 200, url, html: titleOnly }) })
    );
    expect(gift).toMatchObject({ title: "Cafeteira X | Loja", image: null, source: "generic:browser" });
  });

  it("tudo bloqueado → mensagem de preenchimento manual, detalhe técnico só no log", async () => {
    const error = await extractGiftFromUrl(
      AMZ_URL.toString(),
      fake({
        "amazon:browser": (url) => ({ status: 200, url, html: fixture("amazon-captcha.html") }),
        "amazon:iphone": (url) => ({ status: 503, url, html: "" })
      })
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(GiftImportError);
    expect((error as GiftImportError).message).toBe(GIFT_IMPORT_MESSAGES.manual);
    expect((error as GiftImportError).detail).toBe(
      "store=amazon reason=no-data attempts=browser:captcha,iphone:http-503,facebook:ECONNRESET"
    );
  });

  it("anúncio removido (404 em todas) → mensagem de produto não encontrado", async () => {
    const notFound = (url: URL) => ({ status: 404, url, html: "" });
    await expect(
      extractGiftFromUrl(ML_URL.toString(), fake({ "mercadolivre:facebook": notFound, "mercadolivre:whatsapp": notFound }))
    ).rejects.toMatchObject({ message: GIFT_IMPORT_MESSAGES.productNotFound });
  });
});

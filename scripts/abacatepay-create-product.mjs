// Cria (uma vez) o produto da taxa de publicação na AbacatePay v2 e imprime o id
// para colar em ABACATEPAY_PUBLISH_PRODUCT_ID no .env.
//
// Uso: node scripts/abacatepay-create-product.mjs
// (lê ABACATEPAY_API_KEY do .env ou do ambiente)

import { readFileSync } from "node:fs";

// Carrega o .env (parser simples) quando a var não está no ambiente.
try {
  const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // sem .env: usa o que já estiver no ambiente
}

const apiKey = process.env.ABACATEPAY_API_KEY;
if (!apiKey) {
  console.error("Defina ABACATEPAY_API_KEY (no .env ou no ambiente).");
  process.exit(1);
}

const base = process.env.ABACATEPAY_BASE_URL || "https://api.abacatepay.com/v2";
const priceCents = Number(process.env.ABACATEPAY_PUBLISH_PRICE_CENTS || 14990);

const response = await fetch(`${base}/products/create`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    externalId: "publish-fee",
    name: "Publicação do site de casamento",
    description: "Taxa única para publicar o site de casamento.",
    price: priceCents,
    currency: "BRL"
  })
});

const json = await response.json().catch(() => null);
const id = json?.data?.id;

if (!response.ok || !id) {
  console.error("Falha ao criar produto:", response.status, JSON.stringify(json, null, 2));
  process.exit(1);
}

console.log("Produto criado com sucesso. Adicione ao .env:\n");
console.log(`ABACATEPAY_PUBLISH_PRODUCT_ID=${id}`);

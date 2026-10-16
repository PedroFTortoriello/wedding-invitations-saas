// Cria (uma vez) um produto da taxa de publicação na AbacatePay v2 e imprime o id
// para colar no .env. Os preços têm que bater com src/lib/platform-data.ts.
//
// Uso: node scripts/abacatepay-create-product.mjs padrao   (R$89,90 → ABACATEPAY_PUBLISH_PRODUCT_ID)
//      node scripts/abacatepay-create-product.mjs ia       (R$149,90 → ABACATEPAY_AI_PRODUCT_ID)
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
const PRODUCTS = {
  padrao: {
    env: "ABACATEPAY_PUBLISH_PRODUCT_ID",
    externalId: "publish-fee",
    cents: 8990,
    name: "Publicação do site de casamento",
    description: "Taxa única para publicar o site de casamento."
  },
  ia: {
    env: "ABACATEPAY_AI_PRODUCT_ID",
    externalId: "ai-site-fee",
    cents: 14990,
    name: "Site de casamento feito pela IA",
    description: "Taxa única para publicar o site de casamento montado pela IA."
  }
};
const product = PRODUCTS[process.argv[2]];
if (!product) {
  console.error("Uso: node scripts/abacatepay-create-product.mjs padrao|ia");
  process.exit(1);
}

const response = await fetch(`${base}/products/create`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({
    // O preço vai no externalId (igual ao app): mudar o preço cria um produto novo.
    externalId: `${product.externalId}-${product.cents}`,
    name: product.name,
    description: product.description,
    price: product.cents,
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
console.log(`${product.env}=${id}`);

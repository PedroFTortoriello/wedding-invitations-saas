// Checagem AO VIVO do import de presentes (rede real, fora do npm test).
// Roda o src/lib/gift-scraper.ts direto no Node (>= 22.18, type stripping), sem Next.
// Uso: node scripts/check-gift-import.mjs [url ...]
process.removeAllListeners("warning"); // aviso de "module type" ao carregar .ts fora de package type=module
const { extractGiftFromUrl, fetchExternalImage } = await import("../src/lib/gift-scraper.ts");

const urls = process.argv.slice(2);
if (urls.length === 0) {
  urls.push(
    "https://produto.mercadolivre.com.br/MLB-3557591741-fritadeira-air-fryer-42l-bfr37-127v-britnia-cor-preto-_JM",
    "https://produto.mercadolivre.com.br/MLB-1358274712-fritadeira-eletrica-sem-oleo-air-fryer-1900w-mondial-220v-_JM",
    "https://www.amazon.com.br/Jogo-Panelas-Antiaderente-Ceramic-Brinox/dp/B0D3WQRS8F",
    "https://www.amazon.com.br/Alum%C3%ADnio-Revestimento-Antiaderente-Tramontina-20899050/dp/B076JJMP9S"
  );
}

let failures = 0;
for (const url of urls) {
  const started = Date.now();
  console.log(`\n${url}`);
  try {
    const gift = await extractGiftFromUrl(url);
    const image = gift.image ? await fetchExternalImage(gift.image) : null;
    console.log(`  source: ${gift.source} (${Date.now() - started} ms)`);
    console.log(`  title:  ${gift.title}`);
    console.log(`  price:  ${gift.price}`);
    console.log(`  image:  ${gift.image}`);
    console.log(`  download: ${image ? `${image.contentType} ${Math.round(image.bytes.byteLength / 1024)} KB` : "FALHOU"}`);
    if (!gift.image || !image) failures += 1;
  } catch (error) {
    failures += 1;
    console.log(`  ERRO (${Date.now() - started} ms): ${error.message}`);
    console.log(`  detail: ${error.detail ?? error.stack}`);
  }
}

console.log(`\n${urls.length - failures}/${urls.length} com título e imagem baixada.`);
process.exit(failures ? 1 : 0);

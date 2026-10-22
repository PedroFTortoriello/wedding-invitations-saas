/**
 * Catálogo central dos modelos de site/convite. Fonte única da verdade para:
 * ids (o tipo `TemplateId` sai daqui), nomes, famílias, descrições da vitrine,
 * amostras de cor, o que cada modelo renderiza (o editor esconde seções que o
 * modelo não mostra) e o ensaio de fotos da demo. Só dados: importável do
 * servidor, do cliente e dos testes. O componente de cada modelo fica em
 * components/templates/registry.tsx, no mesmo id.
 */

export const TEMPLATE_FAMILIES = [
  { id: "editorial", label: "Editorial", blurb: "Revistas de casamento e editoriais de moda." },
  { id: "botanico", label: "Romântico Botânico", blurb: "Jardins, flores e ilustração delicada." },
  { id: "minimal", label: "Minimalismo", blurb: "Arquitetura, tipografia e espaço." },
  { id: "classico", label: "Clássico Atemporal", blurb: "Monogramas, papelaria fina e tradição." },
  { id: "destination", label: "Destination", blurb: "Celebrações em destinos especiais." },
  { id: "romantico", label: "Romântico Contemporâneo", blurb: "Romantismo moderno, sem excesso." },
  { id: "arte", label: "Arte e Ilustração", blurb: "Aquarela, traço e pintura." },
  { id: "moderno", label: "Moderno e Ousado", blurb: "Tipografia expressiva e composições assimétricas." },
  { id: "campestre", label: "Campestre Refinado", blurb: "Fazendas, vinícolas e cerimônias de dia." },
  { id: "brasil", label: "Brasil Contemporâneo", blurb: "Natureza, luz e cor brasileiras." }
] as const;

export type TemplateFamilyId = (typeof TEMPLATE_FAMILIES)[number]["id"];

/** Filtros da vitrine. */
export const TEMPLATE_STYLES = {
  classico: "Clássico",
  minimalista: "Minimalista",
  romantico: "Romântico",
  moderno: "Moderno",
  botanico: "Botânico",
  destination: "Destination",
  editorial: "Editorial",
  artistico: "Artístico",
  campestre: "Campestre",
  brasileiro: "Brasileiro",
  escuro: "Fundo escuro",
  tipografico: "Tipográfico"
} as const;

export type TemplateStyle = keyof typeof TEMPLATE_STYLES;

/** Ensaios de fotos da demo (lib/demo-photos). Sem ensaio, a demo usa as fotos base. */
export type DemoShootId =
  | "jardim-romantico"
  | "editorial-luxury"
  | "garden-classico"
  | "cinema-noir"
  | "costa"
  | "vinha"
  | "tropical"
  | "luz"
  | "urbano"
  | "pintura";

export type TemplateDefinition = {
  /** Estável: vai no JSONB de cada casamento. Nunca renomear. */
  id: string;
  name: string;
  family: TemplateFamilyId;
  /** Uma linha de personalidade (seletor e landing). */
  tagline: string;
  /** Duas frases para a vitrine. */
  description: string;
  styles: readonly TemplateStyle[];
  /** Fundo, meio-tom e destaque. */
  swatch: readonly [string, string, string];
  /** Fontes do modelo (display, texto), só para exibição na vitrine. */
  fonts: readonly [string, string];
  tone: "light" | "dark";
  /** O que o modelo renderiza: o editor esconde o que não aparece. */
  shows: {
    schedule: boolean;
    footerPhoto: boolean;
  };
  /** Proporção do quadro da foto no cartão de presente (--g-aspect do GiftRegistry). */
  giftAspect: string;
  demoShoot?: DemoShootId;
  /** legacy: existe para sites antigos, mas não é oferecido no seletor nem na vitrine. */
  status: "active" | "legacy";
};

const t = <const T extends TemplateDefinition>(def: T) => def;

export const TEMPLATES = [
  /* ------------------------------------------------------------ Editorial */
  t({
    id: "editorial-ivory",
    name: "Editorial Ivory",
    family: "editorial",
    tagline: "Marfim, serifa de revista e grade assimétrica.",
    description:
      "Uma matéria de revista de casamento: colunas assimétricas, fólios, serifa de alto contraste e muito marfim. A foto entra como editorial de moda; o texto conduz.",
    styles: ["editorial"],
    swatch: ["#f5f1e8", "#d8cdb8", "#1c1a17"],
    fonts: ["Fraunces", "Figtree"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "luz",
    status: "active"
  }),
  t({
    id: "modern-heirloom",
    name: "Heirloom",
    family: "editorial",
    tagline: "Serifa clássica, detalhes gravados, acabamento atual.",
    description:
      "Pequenos gestos de papelaria antiga (fios, versaletes, um selo com as iniciais) sobre uma composição limpa e contemporânea. Tradição sem peso.",
    styles: ["editorial", "classico"],
    swatch: ["#f7f3ec", "#c9b7a2", "#5a2a2a"],
    fonts: ["Libre Caslon Text", "Karla"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "garden-classico",
    status: "active"
  }),
  t({
    id: "black-tie",
    name: "Black Tie",
    family: "editorial",
    tagline: "Preto, off-white e tipografia em escala.",
    description:
      "Capa preta com os nomes em caixa alta gigante, seções em off-white com texto preto e quase nenhum ornamento. Sofisticação pelo contraste e pelo espaço.",
    styles: ["editorial", "escuro", "tipografico"],
    swatch: ["#0f0f0f", "#e9e4da", "#f6f2ea"],
    fonts: ["Italiana", "Montserrat"],
    tone: "dark",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "editorial-luxury",
    status: "active"
  }),
  t({
    id: "editorial-luxury",
    name: "Editorial Luxury",
    family: "editorial",
    tagline: "Capa de revista em preto, branco e dourado.",
    description:
      "Capa de revista em preto e branco, serifa Didone e dourado nos detalhes. Vogue em forma de convite, com micro-animações discretas.",
    styles: ["editorial", "tipografico"],
    swatch: ["#f6f4ef", "#cda968", "#161616"],
    fonts: ["Bodoni Moda", "Jost"],
    tone: "light",
    shows: { schedule: true, footerPhoto: false },
    giftAspect: "3 / 4",
    demoShoot: "editorial-luxury",
    status: "active"
  }),
  t({
    id: "cinema-noir",
    name: "Cinema Noir",
    family: "editorial",
    tagline: "Cinematográfico, em espresso e champanhe.",
    description:
      "Convite cinematográfico em espresso e champanhe: capa fílmica com poeira dourada, Cormorant em escala editorial e entradas suaves. Luxo de boutique à noite.",
    styles: ["editorial", "escuro", "romantico"],
    swatch: ["#2a1f1a", "#c9a86a", "#f4ece0"],
    fonts: ["Cormorant Garamond", "Manrope"],
    tone: "dark",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "cinema-noir",
    status: "active"
  }),

  /* ------------------------------------------------------------- Botânico */
  t({
    id: "botanical-garden",
    name: "Jardim Botânico",
    family: "botanico",
    tagline: "Folhagens em traço fino sobre creme, composição orgânica.",
    description:
      "Samambaias, eucalipto e ramos desenhados a traço compõem margens e cantos, como um herbário. Verde profundo, creme e fotos com luz natural.",
    styles: ["botanico", "romantico"],
    swatch: ["#f4f0e6", "#b9c4ad", "#2f4a33"],
    fonts: ["Cormorant Garamond", "Nunito Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "jardim-romantico",
    status: "active"
  }),
  t({
    id: "wildflower",
    name: "Flores do Campo",
    family: "botanico",
    tagline: "Flores silvestres, lavanda e leveza de papel.",
    description:
      "Cosmos, margaridas e lavanda espalhadas como num campo, paleta clara de palha e sálvia e caligrafia só nos detalhes. Delicado sem ser infantil.",
    styles: ["botanico", "romantico", "campestre"],
    swatch: ["#faf6ee", "#d9cfe6", "#6e7d5a"],
    fonts: ["Lora", "Work Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "vinha",
    status: "active"
  }),
  t({
    id: "secret-garden",
    name: "Jardim Secreto",
    family: "botanico",
    tagline: "Verde escuro, camadas de folhas e profundidade.",
    description:
      "Folhas em silhueta se sobrepõem em camadas sobre um fundo verde-floresta, com creme nos textos e luz baixa nas fotos. Romântico com mistério.",
    styles: ["botanico", "escuro", "romantico"],
    swatch: ["#1c2b20", "#6b8a63", "#efe9da"],
    fonts: ["Prata", "Raleway"],
    tone: "dark",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "pintura",
    status: "active"
  }),
  t({
    id: "jardim-romantico",
    name: "Jardim Romântico",
    family: "botanico",
    tagline: "Verde jardim, creme e rosa-blush em arcos.",
    description:
      "Verde jardim, creme e rosa-blush com molduras em arco e folhagens que balançam ao scroll. Clima de vinícola na Toscana e na Provence.",
    styles: ["botanico", "romantico"],
    swatch: ["#f4eee1", "#e3c4bf", "#56663f"],
    fonts: ["Gilda Display", "Mulish"],
    tone: "light",
    shows: { schedule: true, footerPhoto: false },
    giftAspect: "0.85 / 1",
    demoShoot: "jardim-romantico",
    status: "active"
  }),

  /* -------------------------------------------------------------- Minimal */
  t({
    id: "pure-form",
    name: "Pure Form",
    family: "minimal",
    tagline: "Só tipografia e espaço em branco.",
    description:
      "Nomes enormes, data em numerais e linhas finas sobre branco. A foto é opcional e pequena: a forma vem do texto. Para quem acha que menos diz mais.",
    styles: ["minimalista", "tipografico"],
    swatch: ["#ffffff", "#e4e2dc", "#111111"],
    fonts: ["Inter Tight", "Instrument Serif"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "urbano",
    status: "active"
  }),
  t({
    id: "architectural",
    name: "Arquitetura",
    family: "minimal",
    tagline: "Grade visível, proporções e concreto.",
    description:
      "Colunas marcadas por fios, numerais técnicos, cinza-concreto e um só acento terracota. Composição de prancha de arquitetura, precisa e calma.",
    styles: ["minimalista", "moderno"],
    swatch: ["#ecebe7", "#b8b5ae", "#b5593a"],
    fonts: ["Archivo", "IBM Plex Mono"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "urbano",
    status: "active"
  }),
  t({
    id: "soft-minimal",
    name: "Soft Minimal",
    family: "minimal",
    tagline: "Greige, blush e serifa contemporânea.",
    description:
      "Tons suaves de areia e rosa-pó, serifa moderna e blocos de texto com o respiro certo. Minimalismo quente, sem frieza.",
    styles: ["minimalista", "romantico"],
    swatch: ["#f3eeea", "#dccfc5", "#3d3531"],
    fonts: ["Newsreader", "DM Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "luz",
    status: "active"
  }),
  t({
    id: "civil-minimalista",
    name: "Civil Minimalista",
    family: "minimal",
    tagline: "Enxuto e moderno, ótimo para o civil.",
    description: "Preto, branco e bege com fotos reais em destaque. Enxuto e moderno, ideal para a cerimônia civil.",
    styles: ["minimalista", "escuro"],
    swatch: ["#f7f5ee", "#d8d3c9", "#1d1d1b"],
    fonts: ["Instrument Serif", "Instrument Sans"],
    tone: "light",
    shows: { schedule: false, footerPhoto: false },
    giftAspect: "1.2 / 1",
    status: "active"
  }),

  /* ------------------------------------------------------------- Clássico */
  t({
    id: "royal-monogram",
    name: "Monograma",
    family: "classico",
    tagline: "As iniciais do casal como brasão.",
    description:
      "Um monograma em anel abre o convite e volta como selo em cada seção. Azul-marinho, dourado e marfim, com versaletes clássicos.",
    styles: ["classico", "tipografico"],
    swatch: ["#f4efe3", "#c7a86a", "#1e2a44"],
    fonts: ["Cinzel", "EB Garamond"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "garden-classico",
    status: "active"
  }),
  t({
    id: "classic-invitation",
    name: "Convite Clássico",
    family: "classico",
    tagline: "Centralizado, impresso, hierarquia impecável.",
    description:
      "A estrutura de um convite de gráfica: tudo centralizado, versaletes, fios finos e papel marfim. Cada seção é uma peça da papelaria do casamento.",
    styles: ["classico"],
    swatch: ["#f8f4ea", "#d6c9ad", "#2b2420"],
    fonts: ["Libre Baskerville", "Josefin Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "garden-classico",
    status: "active"
  }),
  t({
    id: "heritage",
    name: "Heritage",
    family: "classico",
    tagline: "Molduras duplas e papelaria histórica.",
    description:
      "Molduras finas em dupla linha, ornamentos de canto e tinta sépia sobre papel-osso, como um convite guardado em família. Discreto, com história.",
    styles: ["classico", "editorial"],
    swatch: ["#f1ebdd", "#b9a98b", "#5b2b22"],
    fonts: ["Cardo", "Commissioner"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "garden-classico",
    status: "active"
  }),
  t({
    id: "garden-classico",
    name: "Jardim Clássico",
    family: "classico",
    tagline: "Azul-empoeirado e greige, sóbrio e sereno.",
    description:
      "Azul-empoeirado e greige em tom sóbrio e atemporal, fotos em grade fria e programa do evento. Um jardim clássico e sereno.",
    styles: ["classico", "botanico"],
    swatch: ["#f7f2e8", "#c4c4ba", "#33495c"],
    fonts: ["Instrument Serif", "Instrument Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "0.82 / 1",
    demoShoot: "garden-classico",
    status: "active"
  }),
  t({
    id: "classico-romantico",
    name: "Clássico Romântico",
    family: "classico",
    tagline: "Fotos amplas e serifas clássicas, atemporal.",
    description: "Fotos amplas, serifas clássicas e ritmo cinematográfico. Romântico e atemporal, pensado primeiro para o celular.",
    styles: ["classico", "romantico"],
    swatch: ["#fcf7ed", "#e7d9b6", "#1f1712"],
    fonts: ["Instrument Serif", "Instrument Sans"],
    tone: "light",
    shows: { schedule: false, footerPhoto: true },
    giftAspect: "4 / 3",
    status: "active"
  }),

  /* ---------------------------------------------------------- Destination */
  t({
    id: "amalfi",
    name: "Amalfi",
    family: "destination",
    tagline: "Azul-majólica, limão e sol do Mediterrâneo.",
    description:
      "Azulejos de majólica, ramos de limão siciliano e branco de cal. Para o casamento à beira-mar com clima de costa italiana.",
    styles: ["destination", "botanico"],
    swatch: ["#fbf8f1", "#2d5fa8", "#f2d35b"],
    fonts: ["Playfair Display", "Outfit"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "costa",
    status: "active"
  }),
  t({
    id: "tuscan",
    name: "Toscana",
    family: "destination",
    tagline: "Terracota, oliva e colinas ao entardecer.",
    description:
      "Ciprestes em silhueta, tons de terra e trigo, fotos com luz quente. A elegância rústica de uma vinícola toscana.",
    styles: ["destination", "campestre"],
    swatch: ["#f5efe3", "#c67b4e", "#5d6b43"],
    fonts: ["Marcellus", "Source Sans 3"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "vinha",
    status: "active"
  }),
  t({
    id: "tropical-escape",
    name: "Trópicos",
    family: "destination",
    tagline: "Folhas tropicais, luz natural e brisa.",
    description:
      "Palmeiras e costelas-de-adão em silhueta, verde-mar e areia clara, muita luz. Um destination wedding com identidade brasileira.",
    styles: ["destination", "brasileiro", "botanico"],
    swatch: ["#f6f2e8", "#7fb3a3", "#1f3b36"],
    fonts: ["DM Serif Display", "Albert Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "tropical",
    status: "active"
  }),
  t({
    id: "pe-na-areia",
    name: "Pé na Areia",
    family: "destination",
    tagline: "Azuis oceânicos, areia e coral ao pôr do sol.",
    description:
      "Casamento pé na areia ao pôr do sol: azuis oceânicos, areia e coral no golden hour, com ondas e um sol que balança ao scroll.",
    styles: ["destination"],
    swatch: ["#ebe2d0", "#2e5a6b", "#f4ede0"],
    fonts: ["Instrument Serif", "Instrument Sans"],
    tone: "light",
    shows: { schedule: false, footerPhoto: false },
    giftAspect: "4 / 3",
    status: "legacy"
  }),

  /* ------------------------------------------------------------ Romântico */
  t({
    id: "blush",
    name: "Blush",
    family: "romantico",
    tagline: "Rosa-pó, serifa fina e delicadeza.",
    description:
      "Tons rosados sobre creme, serifa fina e fotos suaves em arcos. Romântico moderno, sem renda nem excesso.",
    styles: ["romantico"],
    swatch: ["#fbf3f0", "#e6c3bd", "#4a3b3a"],
    fonts: ["Ovo", "Red Hat Text"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "luz",
    status: "active"
  }),
  t({
    id: "poetry",
    name: "Poesia",
    family: "romantico",
    tagline: "Frases curtas, composição de livro.",
    description:
      "O convite vira texto: a frase-convite em versos, entrelinhas generosas e números de página. Para casais que vivem de palavras.",
    styles: ["romantico", "tipografico", "editorial"],
    swatch: ["#f7f4ed", "#d4cec1", "#2a2622"],
    fonts: ["Literata", "Inter"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "luz",
    status: "active"
  }),
  t({
    id: "silk-champagne",
    name: "Seda & Champanhe",
    family: "romantico",
    tagline: "Tons quentes, textura de seda e brilho sutil.",
    description:
      "Champanhe, caramelo e marfim com uma textura de seda leve ao fundo e detalhes em dourado fino. Calor e sofisticação para uma festa à noite.",
    styles: ["romantico", "editorial"],
    swatch: ["#f4ead9", "#d9b98a", "#4a3321"],
    fonts: ["Petrona", "Hanken Grotesk"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "cinema-noir",
    status: "active"
  }),

  /* ----------------------------------------------------------------- Arte */
  t({
    id: "watercolor",
    name: "Aquarela",
    family: "arte",
    tagline: "Manchas de aquarela leves e orgânicas.",
    description:
      "Lavagens de aquarela de verdade (não gradientes) em rosa, sálvia e ocre emolduram fotos e títulos. Artesanal, luminoso, feito à mão.",
    styles: ["artistico", "romantico"],
    swatch: ["#fcfaf5", "#e7c9c0", "#7a8f72"],
    fonts: ["Spectral", "Plus Jakarta Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "jardim-romantico",
    status: "active"
  }),
  t({
    id: "fine-line",
    name: "Traço Fino",
    family: "arte",
    tagline: "Ilustrações lineares, arcos e estrelas.",
    description:
      "Linhas finas desenham arcos, flores e um céu de estrelas em volta dos textos. Monocromático e delicado, com a foto em moldura de arco.",
    styles: ["artistico", "minimalista"],
    swatch: ["#faf7f2", "#cdbfae", "#2c2a26"],
    fonts: ["Tenor Sans", "Cormorant Garamond"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "luz",
    status: "active"
  }),
  t({
    id: "painted-memories",
    name: "Pintura",
    family: "arte",
    tagline: "Molduras de quadro e paleta de paisagem.",
    description:
      "Fotos em molduras de tela, textura de canvas e uma paleta de pintura a óleo: ocre, azul-ardósia, musgo. Cada seção é uma sala de galeria.",
    styles: ["artistico"],
    swatch: ["#efe8dc", "#8b9aa5", "#6f5a3a"],
    fonts: ["Rosarivo", "Public Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "pintura",
    status: "active"
  }),

  /* -------------------------------------------------------------- Moderno */
  t({
    id: "bold-type",
    name: "Tipografia",
    family: "moderno",
    tagline: "Nomes em escala expressiva, preto e um acento.",
    description:
      "Os nomes do casal ocupam a tela inteira numa sans pesada; o resto é preto, branco e um único acento elétrico. Direto, contemporâneo, memorável.",
    styles: ["moderno", "tipografico"],
    swatch: ["#f4f3ef", "#141414", "#e8552b"],
    fonts: ["Unbounded", "Schibsted Grotesk"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "urbano",
    status: "active"
  }),
  t({
    id: "contemporary-contrast",
    name: "Contraste",
    family: "moderno",
    tagline: "Blocos de cor, serifa e sans em oposição.",
    description:
      "Faixas de tinta e giz, serifa itálica contra sans geométrica, fotos em recortes retangulares. Editorial de design, com cores controladas.",
    styles: ["moderno", "editorial"],
    swatch: ["#eeeae2", "#1d1f1c", "#c8432f"],
    fonts: ["Epilogue", "Instrument Serif"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "urbano",
    status: "active"
  }),
  t({
    id: "avant-garde",
    name: "Avant-Garde",
    family: "moderno",
    tagline: "Recortes, sobreposições e hierarquia invertida.",
    description:
      "Textos que atravessam fotos, etiquetas giradas e grades quebradas de propósito, sem perder a leitura. Para quem quer o convite mais ousado da festa.",
    styles: ["moderno", "tipografico"],
    swatch: ["#f2efe9", "#2b2d42", "#d9d0c0"],
    fonts: ["Syne", "Space Grotesk"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "urbano",
    status: "active"
  }),

  /* ------------------------------------------------------------ Campestre */
  t({
    id: "countryside",
    name: "Campo",
    family: "campestre",
    tagline: "Tons naturais, colinas e luz de manhã.",
    description:
      "Colinas em camadas, trigo e uma paleta de terra, musgo e palha. Para fazendas, sítios e cerimônias de dia.",
    styles: ["campestre", "botanico"],
    swatch: ["#f6f1e4", "#c9b996", "#55603f"],
    fonts: ["Gelasio", "Open Sans"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "vinha",
    status: "active"
  }),
  t({
    id: "olive-branch",
    name: "Ramo de Oliveira",
    family: "campestre",
    tagline: "Verde profundo, marfim e ramos de oliveira.",
    description:
      "Ramos de oliveira em traço fino, verde-oliva escuro e marfim, serifa clássica. Mediterrâneo tranquilo para vinícolas e jardins.",
    styles: ["campestre", "botanico", "classico"],
    swatch: ["#f3efe4", "#9ba67c", "#3b4a2e"],
    fonts: ["Forum", "Lato"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "vinha",
    status: "active"
  }),
  t({
    id: "sunset-fields",
    name: "Entardecer",
    family: "campestre",
    tagline: "Terrosos, dourados suaves e fim de tarde.",
    description:
      "Sol baixo em raios finos, terracota, mel e areia, com fotos em tom quente. Acolhedor, para a cerimônia ao pôr do sol.",
    styles: ["campestre", "romantico"],
    swatch: ["#f7eedd", "#d9a66a", "#7a4a2a"],
    fonts: ["Castoro", "Mulish"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 3",
    demoShoot: "vinha",
    status: "active"
  }),
  t({
    id: "olive-burgundy",
    name: "Olive Burgundy — Save the Date",
    family: "campestre",
    tagline: "Save the date com envelope e selo de cera.",
    description: "Save the date digital com envelope, selo de cera e contagem regressiva, em oliva e vinho.",
    styles: ["campestre", "classico"],
    swatch: ["#efeade", "#7c6a3a", "#3d4a2a"],
    fonts: ["Instrument Serif", "Instrument Sans"],
    tone: "light",
    shows: { schedule: false, footerPhoto: false },
    giftAspect: "4 / 3",
    status: "legacy"
  }),

  /* --------------------------------------------------------------- Brasil */
  t({
    id: "tropical-editorial",
    name: "Tropical Editorial",
    family: "brasil",
    tagline: "Vegetação tropical com direção de arte de revista.",
    description:
      "Folhas grandes em silhueta verde-escura, serifa editorial e um toque de papaia. Trópico sofisticado, sem clichê de praia.",
    styles: ["brasileiro", "editorial", "botanico"],
    swatch: ["#f3efe6", "#1f4d3f", "#e6793f"],
    fonts: ["Libre Caslon Display", "Be Vietnam Pro"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "3 / 4",
    demoShoot: "tropical",
    status: "active"
  }),
  t({
    id: "jardim-brasileiro",
    name: "Jardim Brasileiro",
    family: "brasil",
    tagline: "Bromélias, costelas-de-adão e ipê-amarelo.",
    description:
      "Flora brasileira em traço e silhueta, paleta de ipê, verde-mata e rosa-manacá. Um jardim daqui, com a luz daqui.",
    styles: ["brasileiro", "botanico", "romantico"],
    swatch: ["#f8f3e6", "#f0c74d", "#2c5a3c"],
    fonts: ["Gloock", "Onest"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "4 / 5",
    demoShoot: "tropical",
    status: "active"
  }),
  t({
    id: "modern-celebration",
    name: "Celebração",
    family: "brasil",
    tagline: "Cores expressivas e azulejos geométricos.",
    description:
      "Padrão de azulejo geométrico, cobalto, coral e mostarda sobre areia, composição alegre e precisa. Brasil contemporâneo em festa.",
    styles: ["brasileiro", "moderno"],
    swatch: ["#f6f0e2", "#2457a6", "#f08a4b"],
    fonts: ["Bricolage Grotesque", "Rubik"],
    tone: "light",
    shows: { schedule: true, footerPhoto: true },
    giftAspect: "1 / 1",
    demoShoot: "tropical",
    status: "active"
  })
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const TEMPLATE_IDS = TEMPLATES.map((template) => template.id) as TemplateId[];

const BY_ID = new Map<string, TemplateDefinition>(TEMPLATES.map((template) => [template.id, template]));

export function isTemplateId(value: string): value is TemplateId {
  return BY_ID.has(value);
}

/** Definição do modelo; id desconhecido (JSONB antigo) cai no padrão de renderização. */
export function getTemplate(id: string): TemplateDefinition {
  return BY_ID.get(id) ?? BY_ID.get("classico-romantico")!;
}

export const TEMPLATE_NAMES = Object.fromEntries(TEMPLATES.map((template) => [template.id, template.name])) as Record<
  TemplateId,
  string
>;

/** Modelos oferecidos no seletor, na vitrine e para a IA (os legacy ficam de fora). */
export const ACTIVE_TEMPLATES = TEMPLATES.filter((template) => template.status === "active");

export function templatesOfFamily(family: TemplateFamilyId) {
  return ACTIVE_TEMPLATES.filter((template) => template.family === family);
}

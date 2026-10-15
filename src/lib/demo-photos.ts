import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";

/**
 * Ensaios das demos da vitrine (/modelo/<id>/helena-e-lucas): um casal e uma sessão por
 * modelo, no clima que ele promete. Fotos do Pexels (licença livre para uso comercial,
 * https://www.pexels.com/license/), por link como as do Unsplash; página de cada uma em
 * https://www.pexels.com/photo/<id>/.
 */
const pexels = (id: number, width = 1400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const photo = (id: number, alt: string): WeddingGalleryImage => ({
  id: `pexels-${id}`,
  src: pexels(id),
  alt,
  role: "story"
});

export type DemoShoot = {
  /** Rostos no centro e no terço de cima: o hero corta em paisagem no desktop e em retrato no celular. */
  hero: string;
  /** footerImage: retrato de "O começo" (garden-classico) e fundo da mensagem final (cinema-noir). */
  portrait: string;
  /** gallery[1..3] ilustram a História (jardim, editorial, cinema); o resto é a Galeria. */
  gallery: WeddingGalleryImage[];
};

export type DemoShootId = Extract<
  WeddingSite["templateId"],
  "jardim-romantico" | "editorial-luxury" | "garden-classico" | "cinema-noir"
>;

export const DEMO_SHOOTS: Record<DemoShootId, DemoShoot> = {
  // SERHAT TUĞ (@serhattugg): jardim no fim de tarde, contraluz dourada, buquê em tons de rosa.
  "jardim-romantico": {
    hero: pexels(30280039, 2400),
    portrait: pexels(30279931),
    gallery: [
      photo(30279928, "Noivo inclina a noiva num passo de dança no gramado, na luz dourada do fim de tarde"),
      photo(30279953, "Noivos de testas encostadas ao pôr do sol, com buquê de flores em tons de rosa"),
      photo(30279861, "Noiva abraça o noivo e olha para a câmera, com o sol se pondo entre as árvores"),
      photo(30279863, "Noiva apoia a cabeça no ombro do noivo num jardim iluminado pelo pôr do sol"),
      photo(30280034, "Noivos abraçados entre folhagens tropicais"),
      photo(30279866, "Noivos descem uma escada de madeira cercada de plantas"),
      photo(30280036, "Noiva de vestido de renda segura o buquê colorido"),
      photo(30279957, "Noivos abraçados na escada de madeira, vistos entre as folhas"),
      photo(30280041, "Noivos lado a lado num caminho de jardim, ela com o buquê"),
      photo(30279929, "Noiva encosta a cabeça no ombro do noivo na luz dourada do entardecer")
    ]
  },
  // UMUT (@umudicreative): editorial urbano em preto e branco, óculos escuros, arcos e colunas.
  "editorial-luxury": {
    hero: pexels(32070293, 2400),
    portrait: pexels(32070301),
    gallery: [
      photo(32070295, "Noivos diante de uma porta em arco entre colunas clássicas, em preto e branco"),
      photo(32070300, "Noiva toca o rosto do noivo, retrato em preto e branco"),
      photo(32070296, "Noivos de óculos escuros, ele sentado e ela com o buquê, em preto e branco"),
      photo(32070302, "Noivos de óculos escuros à mesa de um café ao ar livre"),
      photo(32070297, "Detalhe do vestido tomara que caia e do buquê embrulhado, em preto e branco"),
      photo(32057101, "Noivos numa escadaria de pedra diante de um casarão branco"),
      photo(32070299, "Noivos de óculos escuros diante de uma porta em arco, ela com o buquê, em preto e branco"),
      photo(32057102, "Noivos diante da fachada branca de um casarão com sacadas de ferro"),
      photo(32070294, "Noivos na calçada de uma rua de prédios clássicos, em preto e branco")
    ]
  },
  // Marius Pavel (@fotografbrasov): Castelo Cantacuzino, ciprestes, chafariz e jardim de pedra.
  "garden-classico": {
    hero: pexels(31429086, 2400),
    portrait: pexels(31429091),
    gallery: [
      photo(31429060, "Noivos diante do chafariz e dos ciprestes de um castelo"),
      photo(31429063, "Noiva sorri ao lado do noivo, envolta pelo véu"),
      photo(31429075, "Noivo beija a mão da noiva num jardim"),
      photo(31429078, "Noivos de rostos colados à beira de um lago, ela com o buquê"),
      photo(31429047, "Noivos num jardim de pedras com lago, ela com cauda longa"),
      photo(31429081, "Noivos num balanço no pátio do castelo"),
      photo(31429083, "Noivos se beijam no balanço diante do castelo, em preto e branco"),
      photo(31429069, "Noivos sorriem de rostos colados, com o buquê ao fundo"),
      photo(31429089, "Noivos sorriem entre ciprestes, ela com o buquê")
    ]
  },
  // Breno Cardoso (@breno-cardoso-149064345): festa à noite, faróis de carro antigo, luz baixa.
  "cinema-noir": {
    hero: pexels(14148104, 2400),
    portrait: pexels(14148087, 2000),
    gallery: [
      photo(14148091, "Noivos dançam diante dos faróis acesos de um carro antigo, à noite"),
      photo(14148082, "Noivo inclina a noiva para um beijo diante dos faróis do carro"),
      photo(14148080, "Primeira dança dos noivos cercados pelos convidados, em preto e branco"),
      photo(14148086, "Noivos se beijam enquanto os convidados aplaudem sob um varal de luzes"),
      photo(14148079, "Noivos bebem um gole na festa, em preto e branco"),
      photo(14148085, "Noiva sorri e mostra o buquê durante a festa"),
      photo(14148083, "Noivo beija a mão da noiva sob galhos e luzes, em preto e branco"),
      photo(14148088, "Noivos posam ao lado do bolo e dos arranjos de flores"),
      photo(14148081, "Noivos dançam na pista entre os convidados, em preto e branco"),
      photo(14148090, "Noiva sorri segurando o buquê, em preto e branco")
    ]
  }
};

/** Cenário de cerimônia num jardim (Qodak. stx): a "Fazenda Três Ipês" do local. */
export const DEMO_VENUE = pexels(35629351, 2000);

/** Fotos dos presentes: o objeto ou a experiência, nunca o casal (servem aos 4 modelos). */
export const DEMO_GIFT_PHOTOS: Record<string, string> = {
  "lua-de-mel-portugal": pexels(20157706, 900), // bonde diante da Basílica da Estrela, Lisboa (Efe Ersoy)
  "jantar-especial": pexels(5864598, 900), // mesa posta com velas ao ar livre (Rachel Claire)
  "aulas-de-danca": pexels(13517051, 900), // sapatos de dança no piso de madeira (Yusuf Çelik)
  "adega-da-casa": pexels(38808384, 900), // mão escolhe um vinho na adega (emmanuel Lozano)
  "fim-de-semana-campo": pexels(17454051, 900), // casa de campo à beira do rio (Pawel aparatem_go)
  "cota-aliancas": pexels(32527824, 900), // alianças sobre o convite (Alexander Mass)
  "cota-dos-padrinhos": pexels(6185377, 900), // taças num brinde (cottonbro studio)
  "valor-livre": pexels(34972176, 900) // caixa de presente com laço (Jess Bailey Designs)
};

/** Cartões de informação (traje, hospedagem, como chegar). */
export const DEMO_INFO_PHOTOS = {
  traje: pexels(4320483, 1200), // gravata-borboleta (Kauane Oliveira)
  hospedagem: pexels(6466281, 1200), // café da manhã no quarto de hotel (cottonbro studio)
  chegada: pexels(9918786, 1200) // estrada de terra entre árvores (Akash kaparaveni)
};

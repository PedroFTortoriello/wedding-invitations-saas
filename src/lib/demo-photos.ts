import type { DemoShootId } from "@/lib/templates/catalog";
import type { WeddingGalleryImage } from "@/types/wedding";

export type { DemoShootId };

const unsplashImage = (photoId: string, width = 2200) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=82`;

export const romanticImages = {
  hero: unsplashImage("photo-1636137674064-4db66407a54f", 2600),
  toast: unsplashImage("photo-1770582071129-df561abd78e8", 1800),
  hands: unsplashImage("photo-1694709283346-bbc66a18e731", 1800),
  blackWhitePortrait: unsplashImage("photo-1640654454819-34e53d3ef40a", 1800),
  blackWhiteWide: unsplashImage("photo-1641807672584-0c6e999276a6", 2200),
  reception: unsplashImage("photo-1769812343775-85a27e6a076c", 1800),
  ringEditorial: unsplashImage("photo-1708601421101-9ad139d83f4d", 1600),
  ringSoftGold: unsplashImage("photo-1648758566573-a820206cea29", 1600),
  ceremonyAisle: unsplashImage("photo-1764010521191-878abfde05c6", 1800),
  luxuryVenue: unsplashImage("photo-1773745060497-4cc1df774c72", 2200),
  gardenPortrait: "/assets/canva-intimate/hero-canva.jpg",
  botanicalDetail: "/assets/canva-garden/hero-garden.jpg"
};


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

const BASE_SHOOTS = {
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

export const DEMO_SHOOTS: Record<DemoShootId, DemoShoot> = {
  ...BASE_SHOOTS,
  // Studio Dreamview (@studio-dreamview-2155988023): costão de pedras, farol e píer sobre o mar azul, luz de dia.
  costa: {
    hero: pexels(34187178, 2400),
    portrait: pexels(34215852),
    gallery: [
      photo(34215861, "Noivos correm de mãos dadas por um píer branco sobre o mar azul"),
      photo(34215845, "Noivos erguem os braços num penhasco com buquê, mar azul e falésias ao fundo"),
      photo(34215842, "Noivos dançam sobre as pedras do penhasco, ela de saia rodada branca"),
      photo(34215847, "Noivos entre pedras e vegetação rasteira sobre o mar, ela com o buquê"),
      photo(34215848, "Noivos descem a trilha de pedras à beira-mar, de mãos dadas"),
      photo(34215854, "Noivos caminham pelo costão de pedras com o mar ao fundo"),
      photo(34215855, "Noiva ergue o buquê junto à cerca de corda, vista por cima do ombro do noivo"),
      photo(34215860, "Noiva sorri emoldurada por um coração feito com as mãos do noivo, mar ao fundo"),
      photo(34215862, "Noiva de pé numa pedra sobre a enseada de água azul-turquesa"),
      photo(34187157, "Noivos riem de rostos colados, ela com o véu ao vento junto ao mar")
    ]
  },
  // Photography Maghradze PH (@photography-maghradze-ph-1659410): vinícola em folhagem de outono, ciprestes, casarão e porta de adega, sol de fim de tarde.
  vinha: {
    hero: pexels(29205728, 2400),
    portrait: pexels(29237409),
    gallery: [
      photo(29205725, "Noivos entre fileiras de videiras em folhagem de outono, com ciprestes ao fundo"),
      photo(29205726, "Noiva gira de braços abertos na vinha diante de um casarão rural"),
      photo(29205727, "Noivo ergue a noiva no colo entre as videiras douradas, em contraluz"),
      photo(29205734, "Noivos se beijam sob as árvores do jardim, vistos entre folhas douradas"),
      photo(29205737, "Noivo beija a noiva diante de uma porta de madeira em arco de uma adega"),
      photo(29237406, "Noivo abraça a noiva por trás na vinha, ela com o buquê de rosas claras"),
      photo(29237393, "Noiva apoia a mão no peito do noivo de smoking azul, com o buquê"),
      photo(29237401, "Noivos sorriem lado a lado num jardim de cerca branca, ela com o buquê"),
      photo(29205731, "Noiva de costas segura o buquê sob uma árvore de folhas alaranjadas"),
      photo(29205723, "Noivos se beijam entre as videiras, vistos através da folhagem de outono")
    ]
  },
  // Jonathan Borba (@jonathanborba): vila de praia com parede azul, buganvílias, palmeiras e ponte de madeira na mata, luz quente.
  tropical: {
    hero: pexels(11643555, 2400),
    portrait: pexels(11643557),
    gallery: [
      photo(11643556, "Noivos de branco diante de uma casa de pau a pique entre palmeiras e folhagens"),
      photo(11643558, "Noivos abraçados num caminho de terra, ela com buquê de flores secas"),
      photo(11643559, "Noiva sorri de rosto colado ao noivo diante de uma parede de tijolos amarela"),
      photo(11643560, "Noivos com o buquê de flores secas alaranjadas, close na roupa branca"),
      photo(11643562, "Noivo abraça a noiva de cabelos cacheados sob flores vermelhas"),
      photo(11643565, "Noiva ri de olhos fechados encostada no noivo, com colar de pérolas"),
      photo(11643568, "Noiva abraça o noivo por trás, ele sorrindo com o buquê na mão"),
      photo(11643589, "Noivos de mãos dadas atravessam uma ponte de madeira entre a mata"),
      photo(11643593, "Noiva de vestido branco sentada na ponte de madeira, entre folhagens"),
      photo(11643595, "Noivos de testas encostadas, close em contraluz")
    ]
  },
  // Jin Wedding (@jin-wedding-3859587): estúdio todo branco com janelas, capim-dos-pampas, lustre e arcos; luz difusa.
  luz: {
    hero: pexels(5729044, 2400),
    portrait: pexels(5729047),
    gallery: [
      photo(5729029, "Noivos de testas encostadas entre capins-dos-pampas num estúdio branco"),
      photo(5729042, "Noivos abraçados diante da janela de um estúdio todo branco"),
      photo(5729051, "Noiva abre o vestido rodado ao lado do noivo de terno branco, entre colunas"),
      photo(5729052, "Noivo de terno branco segura a mão da noiva de véu e tiara, close"),
      photo(5729056, "Noivos abraçados sob um arco branco, com luz suave da janela"),
      photo(5729060, "Noiva gira o vestido enquanto o noivo observa junto às flores claras"),
      photo(5729127, "Noivos de mãos dadas sob uma guirlanda de folhagens, salão branco"),
      photo(5729133, "Noivos lado a lado sob um lustre de cristal, ela com buquê branco"),
      photo(5729135, "Noiva de tiara segura o buquê branco diante da janela clara"),
      photo(5729138, "Noivo beija a mão da noiva sob a guirlanda de folhagens")
    ]
  },
  // RebornFilmes (@rebornfilmes): avenida de São Paulo com arranha-céus, faixa amarela e árvores de outono; editorial contemporâneo.
  urbano: {
    hero: pexels(32607481, 2400),
    portrait: pexels(32607524),
    gallery: [
      photo(32607572, "Noivos distantes um do outro numa passarela, com arranha-céus e árvores ao fundo"),
      photo(32607503, "Noivos desfocados em primeiro plano enquanto um ônibus vermelho passa"),
      photo(32607497, "Detalhe dos pés dos noivos andando sobre a faixa amarela do asfalto"),
      photo(32607515, "Mãos dadas dos noivos sobre a faixa amarela da avenida"),
      photo(32607505, "Noivos dançam no meio da avenida vazia ladeada de árvores"),
      photo(32607511, "Noivos de costas um para o outro olham para a câmera no meio da rua"),
      photo(32607566, "Noiva de jaqueta de couro gira segurando a mão do noivo na avenida"),
      photo(32607580, "Noivo ergue a noiva num beijo sobre a faixa amarela, prédios ao fundo"),
      photo(32607582, "Noivos deitados no asfalto sobre a faixa amarela, braços erguidos"),
      photo(32607574, "Noivos vistos de cima, minúsculos, no meio da avenida com sombras de árvores")
    ]
  },
  // Luke Miller (@bylukemiller): lago espelhado com montanhas na névoa e floresta de coníferas, tons azul-ardósia e terrosos (ensaio pré-wedding).
  pintura: {
    hero: pexels(17292701, 2400),
    portrait: pexels(17292684),
    gallery: [
      photo(17292678, "Casal abraçado sobre pedras à beira do lago, refletido na água e com montanhas na névoa"),
      photo(17292679, "Casal abraçado na margem do lago cercado de montanhas cobertas de névoa"),
      photo(17292680, "Casal caminha de mãos dadas pela praia de cascalho do lago, sorrindo um para o outro"),
      photo(17292683, "Casal de costas caminha pela margem do lago em direção às montanhas na névoa"),
      photo(17292687, "Casal sentado num tronco olha o lago, ele com o braço sobre o ombro dela"),
      photo(17292689, "Casal sentado no tronco à beira do lago, de testas encostadas"),
      photo(17292691, "Casal caminha de mãos dadas por uma floresta de coníferas com luz difusa"),
      photo(17292692, "Casal abraçado na água rasa do lago, montanhas espelhadas ao fundo"),
      photo(17292703, "Casal se beija na margem de cascalho do lago em dia de névoa"),
      photo(17292704, "Casal caminha de mãos dadas pela praia de cascalho com o lago espelhado atrás")
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

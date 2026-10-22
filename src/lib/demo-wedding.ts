import type { WeddingLocation, WeddingSite } from "@/types/wedding";
import { DEMO_WEDDING_ID } from "@/lib/demo-id";
import { DEMO_GIFT_PHOTOS, DEMO_INFO_PHOTOS, DEMO_SHOOTS, DEMO_VENUE, romanticImages } from "@/lib/demo-photos";

export { romanticImages };
import { getTemplate, type TemplateId } from "@/lib/templates/catalog";
import { defaultWeddingContent } from "@/lib/wedding";

export const demoWedding: WeddingSite = {
  id: DEMO_WEDDING_ID,
  slug: "helena-e-lucas",
  status: "published",
  templateId: "classico-romantico",
  templateName: "Clássico Romântico",
  coupleNames: "Helena Ribeiro & Lucas Moreira",
  monogram: "H&L",
  pixKey: "helena.lucas@email.com",
  pixKeyType: "email",
  pixHolderName: "Helena Ribeiro",
  weddingDate: "2026-12-05T16:30:00-03:00",
  weddingDateLabel: "5 de dezembro de 2026",
  weddingTime: "16:30",
  heroImage: romanticImages.hero,
  floatingImages: [
    {
      id: "champagne-cellar",
      src: romanticImages.toast,
      alt: "Casal brindando em adega intimista",
      role: "floating"
    },
    {
      id: "golden-hands",
      src: romanticImages.hands,
      alt: "Casal de mãos dadas ao pôr do sol",
      role: "floating"
    },
    {
      id: "editorial-portrait",
      src: romanticImages.blackWhitePortrait,
      alt: "Retrato editorial em preto e branco",
      role: "floating"
    },
    {
      id: "floral-reception",
      src: romanticImages.reception,
      alt: "Mesa elegante com flores brancas",
      role: "floating"
    }
  ],
  invitationWords: ["uma", "noite", "para", "sentir", "o", "amor", "de", "perto"],
  welcomeText:
    "Estamos preparando uma celebração íntima, elegante e cheia de significado, pensada para receber as pessoas que fizeram parte da nossa história com leveza, beleza e presença.",
  storyEyebrow: "nossa história",
  storyTitle: "um amor que virou casa",
  storyMoments: [
    {
      id: "encontro",
      number: "I",
      title: "O encontro",
      headline: "quando o simples\npassou a ser raro.",
      description:
        "Entre conversas longas, viagens curtas e uma vontade tranquila de permanecer, descobrimos que amor também é reconhecimento."
    },
    {
      id: "promessa",
      number: "II",
      title: "A promessa",
      headline: "escolher o outro,\ncom calma e intenção.",
      description:
        "O nosso sim nasce dos dias comuns: do cuidado, da parceria e da alegria de construir uma vida que tenha a nossa assinatura."
    },
    {
      id: "celebracao",
      number: "III",
      title: "A celebração",
      headline: "reunir quem torna\ntudo mais bonito.",
      description:
        "Queremos que esta noite seja memória viva: abraços demorados, mesa farta, música boa e a sensação de estar exatamente onde deveríamos."
    }
  ],
  detailsTitle: "um fim de tarde para guardar",
  detailsSubtitle:
    "Cerimônia, jantar e celebração acontecem no mesmo endereço, com uma curadoria pensada para uma experiência fluida do primeiro brinde à última música.",
  schedule: [
    { id: "recepcao", time: "16:30", title: "Recepção", note: "Drinks de boas-vindas e retratos ao entardecer." },
    { id: "cerimonia", time: "17:30", title: "Cerimônia", note: "O sim, diante de quem importa." },
    { id: "jantar", time: "19:00", title: "Jantar", note: "Menu assinado em três tempos." },
    { id: "festa", time: "21:00", title: "Festa", note: "Brindes, dança e a noite toda." }
  ],
  locations: [
    {
      id: "principal",
      title: "Local",
      // Local fictício (sem endereço): o mapa aponta só para a cidade.
      venue: "Fazenda Três Ipês",
      city: "Itu, SP",
      note:
        "A cerimônia será no jardim ao entardecer, seguida por jantar em salão reservado e festa com bar de espumantes.",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Itu%2C%20SP",
      image: romanticImages.ceremonyAisle
    }
  ],
  detailCards: [
    {
      id: "local",
      type: "location",
      title: "Local",
      subtitle: "Itu, SP",
      image: romanticImages.ceremonyAisle,
      body:
        "Receberemos todos na Fazenda Três Ipês para uma cerimônia ao ar livre, jantar em ambiente reservado e celebração sem deslocamentos.",
      active: true
    },
    {
      id: "presentes",
      type: "gifts",
      title: "Presentes",
      subtitle: "Experiências para o começo da nossa vida a dois.",
      image: romanticImages.ringEditorial,
      body:
        "Selecionamos cotas simbólicas e experiências especiais para quem quiser participar dos nossos primeiros capítulos depois do casamento.",
      active: true
    },
    {
      id: "menu",
      type: "menu",
      title: "Menu assinado",
      subtitle: "Coquetel, jantar empratado e bar de espumantes.",
      image: romanticImages.reception,
      body:
        "A noite terá coquetel de boas-vindas, jantar em três tempos, sobremesas delicadas e um bar pensado para brindar sem pressa.",
      active: true
    }
  ],
  // Só fotos com licença (Unsplash, as mesmas de romanticImages): public/assets/images não
  // tem licença para LP/anúncio. Títulos escolhidos para bater com a foto; "cover" porque
  // são fotos de ambiente, não de produto (o padrão "Foto inteira" deixaria borda em volta).
  gifts: [
    {
      id: "lua-de-mel-portugal",
      title: "Lua de Mel em Portugal",
      price: "Valor livre",
      link: "#presentes",
      image: romanticImages.hands,
      imageFit: "cover",
      description: "Uma contribuição para os dias de descanso, vinho e praia depois da festa.",
      active: true
    },
    {
      id: "jantar-especial",
      title: "Jantar Especial",
      price: "R$ 280,00",
      link: "#presentes",
      image: romanticImages.reception,
      imageFit: "cover",
      description: "Uma mesa bonita e uma noite sem pressa para comemorar a vida a dois.",
      active: true
    },
    {
      id: "aulas-de-danca",
      title: "Aulas de Dança",
      price: "R$ 150,00",
      link: "#presentes",
      image: romanticImages.blackWhitePortrait,
      imageFit: "cover",
      description: "Para abrir a pista com confiança e rodar a noite inteira.",
      active: true
    },
    {
      id: "adega-da-casa",
      title: "Adega para a Casa Nova",
      price: "R$ 600,00",
      link: "#presentes",
      image: romanticImages.toast,
      imageFit: "cover",
      description: "Boas garrafas para brindar cada conquista da vida a dois.",
      active: true
    },
    {
      id: "fim-de-semana-campo",
      title: "Fim de Semana no Campo",
      price: "Valor livre",
      link: "#presentes",
      image: romanticImages.blackWhiteWide,
      imageFit: "cover",
      description: "Uma casa no meio do verde e silêncio — uma escapada a dois sem combinar nada.",
      active: true
    },
    {
      id: "cota-aliancas",
      title: "Cota das Alianças",
      price: "R$ 500,00",
      link: "#presentes",
      image: romanticImages.ringSoftGold,
      imageFit: "cover",
      description: "Para as alianças que vão acompanhar a gente pela vida inteira.",
      active: true
    },
    {
      id: "cota-dos-padrinhos",
      title: "Cota dos Padrinhos",
      price: "Valor livre",
      link: "#presentes",
      image: romanticImages.ceremonyAisle,
      imageFit: "cover",
      description: "Um gesto de quem caminha junto desde o começo dessa história.",
      active: true
    },
    {
      id: "valor-livre",
      title: "Presente Livre",
      price: "Valor livre",
      link: "#presentes",
      image: romanticImages.hero,
      imageFit: "cover",
      description: "Escolha o valor e deixe um carinho do seu jeito para o casal.",
      active: true
    }
  ],
  gallery: [
    { id: "gallery-hero", src: romanticImages.hero, alt: "Beijo sob guarda-chuva transparente", role: "story" },
    { id: "gallery-toast", src: romanticImages.toast, alt: "Brinde em adega de pedra", role: "story" },
    { id: "gallery-hands", src: romanticImages.hands, alt: "Mãos entrelaçadas ao pôr do sol", role: "story" },
    { id: "gallery-bw", src: romanticImages.blackWhitePortrait, alt: "Retrato em preto e branco", role: "story" },
    { id: "gallery-wide", src: romanticImages.blackWhiteWide, alt: "Casal em jardim editorial", role: "story" },
    { id: "gallery-reception", src: romanticImages.reception, alt: "Mesa posta com flores brancas", role: "story" },
    { id: "gallery-rings", src: romanticImages.ringEditorial, alt: "Alianças em composição editorial", role: "story" },
    { id: "gallery-ceremony", src: romanticImages.ceremonyAisle, alt: "Corredor de cerimônia com flores brancas", role: "story" }
  ],
  finalText:
    "Queremos celebrar sem pressa: olhar nos olhos, abraçar forte, dançar perto e sair dessa noite com a memória bonita de que estivemos todos juntos.",
  footerImage: romanticImages.blackWhitePortrait,
  footerText: "o nosso começo fica mais bonito com vocês ao nosso lado.",
  rsvp: {
    enabled: true,
    title: "Confirme sua presença",
    subtitle: "Responda até 5 de novembro",
    allowCompanions: true,
    successMessage: "Presença confirmada. Vai ser uma alegria viver essa noite com você."
  },
  theme: {
    background: "#f8f3ea",
    surface: "#fffaf4",
    text: "#2e2722",
    muted: "#73685f",
    primary: "#a05639",
    primaryDark: "#733722",
    primarySoft: "#edd7c8"
  },
  seo: {
    title: "Helena Ribeiro & Lucas Moreira",
    description: "Site de casamento de Helena Ribeiro e Lucas Moreira."
  }
};

/**
 * Slugs de QA das demos (/modelo/<id>/<slug>), além do casal de exemplo:
 *   site-novo     o site como nasce no cadastro: textos iniciais, sem foto nenhuma,
 *                 sem presentes, sem programação, sem cartões (nada pode ficar vazio ou feio)
 *   nomes-longos  nomes compostos, textos de 600 caracteres, endereço longo, 7 horários,
 *                 5 cartões, 12 presentes (nada pode cortar ou vazar)
 */
export const DEMO_SLUGS = [demoWedding.slug, "site-novo", "nomes-longos"] as const;

export function getDemoWeddingBySlug(slug: string) {
  return slug === demoWedding.slug ? demoWedding : null;
}

const LONG_TEXT =
  "Estamos preparando uma celebração íntima, elegante e cheia de significado, pensada para receber as pessoas que fizeram parte da nossa história com leveza, beleza e presença. Queremos que cada detalhe conte um pouco de quem somos: a música que escolhemos juntos, a mesa farta que lembra os almoços de domingo, o jardim onde demos o primeiro passo dessa caminhada. Venham com o coração aberto e os sapatos confortáveis, porque a ideia é ficar até a última música. Este convite é o nosso abraço antecipado em cada um de vocês.";

function newSiteDemo(templateId: TemplateId): WeddingSite {
  const template = getTemplate(templateId);
  return {
    ...demoWedding,
    ...defaultWeddingContent({ coupleNames: "Ana & Pedro", templateId }),
    slug: "site-novo",
    coupleNames: "Ana & Pedro",
    templateId,
    templateName: template.name,
    heroImage: "",
    footerImage: "",
    gallery: [],
    floatingImages: [],
    gifts: [],
    detailCards: [],
    locations: [{ id: "principal", title: "Local", venue: "", city: "", note: "", mapUrl: "", image: "" }]
  };
}

function longNamesDemo(templateId: TemplateId): WeddingSite {
  const base = demoWeddingFor(templateId, demoWedding.slug)!;
  const primary = base.locations[0];
  return {
    ...base,
    slug: "nomes-longos",
    coupleNames: "Maria Fernanda Albuquerque Sampaio & João Pedro Cavalcanti de Souza Ramos",
    monogram: "MF&JP",
    invitationWords: "com imensa alegria e gratidão convidamos vocês para celebrar conosco o dia do nosso casamento".split(" "),
    welcomeText: LONG_TEXT,
    storyTitle: "uma história que começou numa tarde de chuva e virou a nossa casa",
    storyMoments: base.storyMoments.map((moment) => ({
      ...moment,
      headline: "quando o simples passou a ser raro\ne o raro virou todo dia",
      description: LONG_TEXT.slice(0, 420)
    })),
    detailsTitle: "um fim de tarde inteiro para guardar na memória com quem a gente mais ama",
    detailsSubtitle: LONG_TEXT.slice(0, 300),
    schedule: [
      { id: "1", time: "15:00", title: "Chegada dos convidados e recepção com drinks de boas-vindas", note: "Estacionamento com manobrista na entrada principal da fazenda." },
      { id: "2", time: "16:00", title: "Retratos ao entardecer", note: "Quem quiser tirar foto com os noivos, é a hora." },
      { id: "3", time: "17:30", title: "Cerimônia", note: "O sim, diante de quem importa, no jardim ao lado do lago." },
      { id: "4", time: "18:30", title: "Coquetel", note: "Canapés e espumante no deck." },
      { id: "5", time: "19:30", title: "Jantar", note: "Menu assinado em três tempos, com opção vegetariana." },
      { id: "6", time: "21:00", title: "Primeira dança e brindes", note: "" },
      { id: "7", time: "22:00", title: "Festa até a última música", note: "Van de volta para os hotéis a partir da meia-noite." }
    ],
    locations: [
      {
        ...primary,
        venue: "Fazenda Três Ipês Eventos e Hospedaria Rural de Alto Padrão",
        city: "Itu, São Paulo",
        address: "Estrada Municipal do Pirapitingui, km 14,5, Bairro Pirapitingui, Itu, SP, CEP 13300-970",
        note: LONG_TEXT.slice(0, 260)
      },
      ...base.locations.slice(1)
    ],
    detailCards: [
      ...base.detailCards,
      { id: "criancas", type: "custom", title: "Crianças", subtitle: "Espaço kids com monitoras", image: base.detailCards[0]?.image ?? "", body: LONG_TEXT.slice(0, 200), active: true },
      { id: "presentes-info", type: "gifts", title: "Lista de presentes e contribuições para a lua de mel", subtitle: "Pix direto para o casal", image: base.detailCards[1]?.image ?? "", body: LONG_TEXT.slice(0, 180), active: true }
    ],
    gifts: [...base.gifts, ...base.gifts.map((gift) => ({ ...gift, id: `${gift.id}-2`, title: `${gift.title} para a casa nova dos dois` }))],
    finalText: LONG_TEXT.slice(0, 330),
    footerText: "com todo o amor do mundo, maria fernanda e joão pedro, que mal podem esperar por esse dia.",
    rsvp: { ...base.rsvp, subtitle: "Responda até 5 de novembro de 2026, por favor, para fecharmos a lista com o buffet" }
  };
}

/** Casamento de uma demo por slug (ver DEMO_SLUGS) ou null. */
export function demoBySlug(templateId: TemplateId, slug: string): WeddingSite | null {
  if (slug === "site-novo") return newSiteDemo(templateId);
  if (slug === "nomes-longos") return longNamesDemo(templateId);
  return demoWeddingFor(templateId, slug);
}

// Olive Burgundy: save the date fiel ao vídeo de referência (casal e local próprios).
const OLIVE_LOCATION: WeddingLocation = {
  id: "occitanie",
  title: "Meet us in",
  venue: "Occitanie",
  city: "Occitanie, France",
  note: "Formal invitation to follow",
  mapUrl: "https://maps.google.com/?q=Occitanie+France",
  image: ""
};

function oliveDemo(wedding: WeddingSite): WeddingSite {
  return {
    ...wedding,
    coupleNames: "Clara Ashford & Elliot Reed",
    monogram: "C&E",
    weddingDate: "2027-06-21T12:30:00",
    weddingDateLabel: "21.06.2027",
    weddingTime: "Twelve thirty in the afternoon",
    locations: [OLIVE_LOCATION, ...wedding.locations.slice(1)]
  };
}

/**
 * Demo de um modelo (/modelo/<id>/<slug>): o casamento base com o ensaio do modelo
 * (lib/demo-photos, via catálogo) e cartões de informação úteis no lugar dos que
 * repetiam local e presentes. Modelo sem ensaio usa as fotos base.
 */
export function demoWeddingFor(templateId: TemplateId, slug: string): WeddingSite | null {
  const base = getDemoWeddingBySlug(slug);
  if (!base) return null;
  const template = getTemplate(templateId);
  const withTemplate = { ...base, templateId, templateName: template.name };
  if (templateId === "olive-burgundy") return oliveDemo(withTemplate);
  if (!template.demoShoot) return withTemplate;
  const shoot = DEMO_SHOOTS[template.demoShoot];

  return {
    ...withTemplate,
    heroImage: shoot.hero,
    floatingImages: [],
    gallery: shoot.gallery,
    footerImage: shoot.portrait,
    locations: base.locations.map((location, i) => (i === 0 ? { ...location, image: DEMO_VENUE } : location)),
    gifts: base.gifts.map((gift) => ({ ...gift, image: DEMO_GIFT_PHOTOS[gift.id] ?? gift.image })),
    detailCards: [
      {
        id: "traje",
        type: "custom",
        title: "Traje",
        subtitle: "Passeio completo",
        image: DEMO_INFO_PHOTOS.traje,
        body:
          "Terno e gravata; vestido longo ou midi. A cerimônia é no gramado, então salto bloco ou sapato baixo deixam a caminhada mais tranquila.",
        active: true
      },
      {
        id: "hospedagem",
        type: "custom",
        title: "Hospedagem",
        subtitle: "Para quem vem de longe",
        image: DEMO_INFO_PHOTOS.hospedagem,
        body:
          "Itu tem hotéis e pousadas a poucos minutos da fazenda. Vem de outra cidade? Fale com a gente que mandamos as nossas indicações.",
        active: true
      },
      {
        id: "como-chegar",
        type: "custom",
        title: "Como chegar",
        subtitle: "Estacionamento no local",
        image: DEMO_INFO_PHOTOS.chegada,
        body:
          "Itu fica a cerca de 1h30 de São Paulo. A fazenda tem estacionamento gratuito, e o último trecho é de estrada de terra, tranquilo para qualquer carro.",
        active: true
      }
    ]
  };
}

export function getDemoWeddingById(id: string) {
  return id === demoWedding.id ? demoWedding : null;
}

import type { WeddingSite } from "@/types/wedding";

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

export const demoWedding: WeddingSite = {
  id: "wedding_pedro_rafaela",
  slug: "pedro-e-rafaela",
  status: "published",
  templateId: "classico-romantico",
  templateName: "Clássico Romântico",
  coupleNames: "Pedro Tortoriello & Rafaela da Cunha",
  monogram: "P&R",
  pixKey: "pedro.rafaela@email.com",
  pixKeyType: "email",
  pixHolderName: "Pedro Tortoriello",
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
  locations: [
    {
      id: "principal",
      title: "Local",
      venue: "Casa Fasano Boa Vista",
      city: "Porto Feliz, SP",
      address: "Rodovia Presidente Castello Branco, km 102",
      note:
        "A cerimônia será no jardim ao entardecer, seguida por jantar em salão reservado e festa com bar de espumantes.",
      mapUrl:
        "https://www.google.com/maps/search/?api=1&query=Casa%20Fasano%20Boa%20Vista%20Porto%20Feliz%20SP",
      image: romanticImages.ceremonyAisle
    }
  ],
  detailCards: [
    {
      id: "local",
      type: "location",
      title: "Local",
      subtitle: "Porto Feliz, SP",
      image: romanticImages.ceremonyAisle,
      body:
        "Receberemos todos na Casa Fasano Boa Vista para uma cerimônia ao ar livre, jantar em ambiente reservado e celebração sem deslocamentos.",
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
  gifts: [
    {
      id: "lua-de-mel-portugal",
      title: "Lua de Mel em Portugal",
      price: "Valor livre",
      link: "https://www.google.com/search?q=lua+de+mel+portugal",
      image: romanticImages.toast,
      description: "Uma contribuição para os dias de descanso, vinho e paisagens depois da festa.",
      active: true
    },
    {
      id: "primeiro-jantar",
      title: "Primeiro Jantar em Casa",
      price: "R$ 280,00",
      link: "https://www.google.com/search?q=jantar+especial+casal",
      image: romanticImages.reception,
      description: "Para inaugurar a casa nova com uma mesa bonita e uma noite sem pressa.",
      active: true
    },
    {
      id: "memorias-da-viagem",
      title: "Memórias da Viagem",
      price: "R$ 420,00",
      link: "https://www.google.com/search?q=experiencias+lua+de+mel",
      image: romanticImages.blackWhiteWide,
      description: "Um passeio, uma foto impressa e uma lembrança para levar para a vida.",
      active: true
    },
    {
      id: "bar-de-espumantes",
      title: "Brinde Especial",
      price: "R$ 190,00",
      link: "https://www.google.com/search?q=espumante+presente+casamento",
      image: romanticImages.ringSoftGold,
      description: "Uma cota simbólica para brindar os próximos capítulos com quem a gente ama.",
      active: true
    },
    {
      id: "valor-livre",
      title: "Presente Livre",
      price: "Valor livre",
      link: "https://www.google.com/search?q=presente+de+casamento",
      image: romanticImages.botanicalDetail,
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
  footerText: "o nosso para sempre começa com vocês ao nosso lado.",
  rsvp: {
    enabled: true,
    title: "Confirme sua presença",
    subtitle: "RSVP",
    allowCompanions: true,
    successMessage: "Presença confirmada. Vai ser uma alegria viver essa noite com você."
  },
  theme: {
    background: "#f8f3ea",
    surface: "#fffaf4",
    text: "#2e2722",
    muted: "#73685f",
    primary: "#7b8063",
    primaryDark: "#3e4230",
    primarySoft: "#e6e2d5"
  },
  seo: {
    title: "Pedro Tortoriello & Rafaela da Cunha",
    description: "Site de casamento de Pedro Tortoriello e Rafaela da Cunha."
  }
};

export function getDemoWeddingBySlug(slug: string) {
  return slug === demoWedding.slug ? demoWedding : null;
}

export function getDemoWeddingById(id: string) {
  return id === demoWedding.id ? demoWedding : null;
}

import { demoWedding } from "@/lib/demo-wedding";
import type {
  CashGiftRevenueModel,
  CashGiftTransaction,
  PlatformMetrics,
  PlatformTemplate,
  PlatformUser,
  WeddingGuest,
  WeddingMessage,
  WeddingSite
} from "@/types/wedding";

export { demoWedding };

export const platformName = "Vows";

/** Taxa única de publicação paga pelo casal. Única fonte de receita da plataforma. */
export const PUBLISH_FEE_BRL = 89.9;

export const demoUser: PlatformUser = {
  id: "user_pedro_rafaela",
  name: "Pedro e Rafaela",
  email: "casal@demo.com",
  role: "client",
  createdAt: "2026-05-01T12:00:00-03:00"
};

export const adminUser: PlatformUser = {
  id: "user_admin",
  name: "Admin Plataforma",
  email: "admin@vows.local",
  role: "admin",
  createdAt: "2026-05-01T12:00:00-03:00"
};

export const cashGiftRevenueModel: CashGiftRevenueModel = {
  id: "cash-gifts-pix",
  title: "Presentes em dinheiro",
  subtitle: "Receba presentes via Pix direto na sua chave. A plataforma não toca no dinheiro.",
  highlight: "0% de taxa · 100% para o casal",
  currency: "BRL",
  features: [
    "Pix direto na chave do casal",
    "0% de taxa sobre presentes",
    "A plataforma não intermedia o dinheiro",
    "Acompanhe os recebimentos no painel"
  ]
};

export const platformTemplates: PlatformTemplate[] = [
  {
    id: "classico-romantico",
    name: "Clássico Romântico",
    description: "Editorial, romântico, cinematográfico e mobile-first.",
    previewImage: demoWedding.heroImage,
    status: "active"
  },
  {
    id: "civil-minimalista",
    name: "Civil Minimalista",
    description: "Inspirado em site de casamento editorial preto, branco e bege, com fotos reais em destaque.",
    previewImage: "/assets/canva-intimate/hero-canva.jpg",
    status: "active"
  },
  {
    id: "garden-classico",
    name: "Jardim Clássico",
    description: "Marrom, bege e botânico, com capa floral, tipografia caligráfica e programa do evento.",
    previewImage: "/assets/canva-garden/hero-garden.jpg",
    status: "active"
  },
  {
    id: "olive-burgundy",
    name: "Olive Burgundy — Save the Date",
    description:
      "Save the date digital com abertura de envelope verde-oliva, selo de cera, cartão floral em bordô e contagem regressiva ao vivo.",
    previewImage: demoWedding.heroImage,
    status: "active"
  }
];

export const cashGiftTransactions: CashGiftTransaction[] = [
  {
    id: "cash_gift_001",
    weddingSiteId: demoWedding.id,
    guestName: "Mariana Souza",
    message: "Para a lua de mel ficar ainda mais especial.",
    grossAmount: 350,
    currency: "BRL",
    status: "paid",
    paymentMethod: "pix",
    paidAt: "2026-05-18T10:32:00-03:00",
    createdAt: "2026-05-18T10:30:00-03:00"
  },
  {
    id: "cash_gift_002",
    weddingSiteId: demoWedding.id,
    guestName: "Tia Ana",
    message: "Um carinho para a casa nova.",
    grossAmount: 500,
    currency: "BRL",
    status: "paid",
    paymentMethod: "pix",
    paidAt: "2026-05-20T19:16:00-03:00",
    createdAt: "2026-05-20T19:12:00-03:00"
  },
  {
    id: "cash_gift_003",
    weddingSiteId: demoWedding.id,
    guestName: "Lucas Ferreira",
    grossAmount: 220,
    currency: "BRL",
    status: "pending",
    paymentMethod: "pix",
    createdAt: "2026-05-21T12:00:00-03:00"
  }
];

export const demoGuests: WeddingGuest[] = [
  {
    id: "guest_001",
    weddingSiteId: demoWedding.id,
    name: "Mariana Souza",
    contact: "mariana@email.com",
    status: "confirmed",
    companionsAllowed: 1,
    companionsConfirmed: 1,
    dietaryRestriction: "Vegetariana"
  },
  {
    id: "guest_002",
    weddingSiteId: demoWedding.id,
    name: "Lucas Ferreira",
    contact: "(11) 99999-0000",
    status: "pending",
    companionsAllowed: 0,
    companionsConfirmed: 0
  },
  {
    id: "guest_003",
    weddingSiteId: demoWedding.id,
    name: "Camila e Andre",
    contact: "camila@email.com",
    status: "declined",
    companionsAllowed: 2,
    companionsConfirmed: 0,
    note: "Enviaram carinho mesmo não podendo ir."
  }
];

export const demoMessages: WeddingMessage[] = [
  {
    id: "message_001",
    weddingSiteId: demoWedding.id,
    guestName: "Mariana Souza",
    message: "Que alegria participar desse dia. O site ficou lindo e tem a cara de vocês.",
    createdAt: "2026-05-18T10:30:00-03:00"
  },
  {
    id: "message_002",
    weddingSiteId: demoWedding.id,
    guestName: "Tia Ana",
    message: "Contando os dias para celebrar esse amor de perto.",
    createdAt: "2026-05-20T19:12:00-03:00"
  }
];

export const demoWeddings: WeddingSite[] = [
  {
    ...demoWedding,
    ownerId: demoUser.id
  },
  {
    ...demoWedding,
    id: "wedding_maria_joao",
    ownerId: "user_maria",
    slug: "maria-e-joao",
    status: "draft",
    coupleNames: "Maria Clara & Joao Miguel",
    monogram: "M&J",
    pixKey: "maria.joao@email.com",
    pixHolderName: "Maria Clara",
    seo: {
      title: "Maria Clara & Joao Miguel",
      description: "Site de casamento de Maria Clara e Joao Miguel."
    }
  }
];

export const demoUsers: PlatformUser[] = [
  demoUser,
  adminUser,
  {
    id: "user_maria",
    name: "Maria Clara",
    email: "maria@demo.com",
    role: "client",
    createdAt: "2026-05-15T09:00:00-03:00"
  }
];

export const platformMetrics: PlatformMetrics = {
  totalUsers: demoUsers.length,
  totalWeddings: demoWeddings.length,
  publishedWeddings: demoWeddings.filter((wedding) => wedding.status === "published").length,
  draftWeddings: demoWeddings.filter((wedding) => wedding.status === "draft").length,
  revenue: demoWeddings.filter((wedding) => wedding.status === "published").length * PUBLISH_FEE_BRL,
  grossCashGifts: cashGiftTransactions.reduce((total, gift) => total + gift.grossAmount, 0),
  conversionRate: 18.4
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

import { demoWedding } from "@/lib/demo-wedding";
import type {
  CashGiftRevenueModel,
  CashGiftTransaction,
  PlatformMetrics,
  PlatformUser,
  WeddingGuest,
  WeddingMessage,
  WeddingSite
} from "@/types/wedding";

export { demoWedding };

export const platformName = "Noivar";

/** WhatsApp de suporte, formato E.164 sem "+" (para links wa.me). */
export const supportWhatsApp = "5511942716215";

/** Taxa única de publicação paga pelo casal (site montado por eles no editor). */
export const PUBLISH_FEE_BRL = 89.9;
export const PUBLISH_FEE_LABEL = "R$ 89,90";

/** Taxa única de publicação do "Site feito pela IA" (cobrada se o casal gerou o site com a IA). */
export const AI_SITE_FEE_BRL = 149.9;
export const AI_SITE_FEE_LABEL = "R$ 149,90";

/** Gerações por casamento (cada uma custa tokens; o resto o casal ajusta no editor) e fotos por geração. */
export const MAX_AI_GENERATIONS = 3;
export const MAX_AI_PHOTOS = 12;

/**
 * Teto de tentativas de geração pela IA em 24 h (migration 0017): por rede (IP) e na
 * plataforma toda. Seguram quem cria várias contas grátis para gerar sites; a casa de um
 * casal usa no máximo MAX_AI_GENERATIONS. O teto diário protege o custo se o abuso vier de
 * muitos IPs. ponytail: valores fixos; se o volume legítimo crescer, subam aqui.
 */
export const AI_ATTEMPTS_PER_IP_PER_DAY = 5;
export const AI_ATTEMPTS_PER_DAY = 300;

/** Taxa que este casamento paga para publicar. */
export function publishFee(aiMade: boolean) {
  return aiMade ? { brl: AI_SITE_FEE_BRL, label: AI_SITE_FEE_LABEL } : { brl: PUBLISH_FEE_BRL, label: PUBLISH_FEE_LABEL };
}

export const demoUser: PlatformUser = {
  id: "user_helena_lucas",
  name: "Helena e Lucas",
  email: "casal@demo.com",
  role: "client",
  createdAt: "2026-05-01T12:00:00-03:00"
};

export const adminUser: PlatformUser = {
  id: "user_admin",
  name: "Admin Plataforma",
  email: "admin@noivar.local",
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

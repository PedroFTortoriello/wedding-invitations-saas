export type WeddingSiteStatus = "draft" | "published" | "suspended" | "expired";
export type UserRole = "admin" | "client";
export type CashGiftStatus = "pending" | "paid" | "refunded" | "failed";
export type GuestStatus = "pending" | "confirmed" | "declined";
export type PixKeyType = "cpf" | "cnpj" | "email" | "phone" | "random";

export type WeddingLocation = {
  id: string;
  title: string;
  venue: string;
  city: string;
  address?: string;
  note: string;
  mapUrl: string;
  image: string;
};

export type WeddingGift = {
  id: string;
  title: string;
  description: string;
  price: string;
  link: string;
  image?: string;
  active: boolean;
};

export type WeddingGalleryImage = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  role?: "hero" | "floating" | "story" | "footer" | "detail";
};

export type RSVPConfiguration = {
  enabled: boolean;
  title: string;
  subtitle: string;
  allowCompanions: boolean;
  successMessage: string;
};

export type WeddingDetailCard = {
  id: string;
  type: "location" | "gifts" | "menu" | "custom";
  title: string;
  subtitle: string;
  image: string;
  body: string;
  active: boolean;
};

export type WeddingStoryMoment = {
  id: string;
  number: string;
  title: string;
  headline: string;
  description: string;
};

export type WeddingScheduleItem = {
  id: string;
  time: string;
  title: string;
  note?: string;
};

export type WeddingTheme = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
};

export type WeddingSite = {
  id: string;
  ownerId?: string;
  slug: string;
  status: WeddingSiteStatus;
  templateId:
    | "classico-romantico"
    | "civil-minimalista"
    | "garden-classico"
    | "olive-burgundy"
    | "editorial-luxury"
    | "jardim-romantico"
    | "pe-na-areia"
    | "cinema-noir";
  templateName: string;
  coupleNames: string;
  monogram: string;
  /** Chave Pix do próprio casal — presentes em dinheiro caem 100% aqui, sem intermediação da plataforma. */
  pixKey: string;
  /** Tipo da chave Pix do casal (exibição/validação). */
  pixKeyType: PixKeyType;
  /** Nome do titular da conta que recebe os presentes — vai no campo 59 do EMV. */
  pixHolderName: string;
  weddingDate: string;
  weddingDateLabel: string;
  weddingTime: string;
  heroImage: string;
  floatingImages: WeddingGalleryImage[];
  invitationWords: string[];
  welcomeText: string;
  storyEyebrow: string;
  storyTitle: string;
  storyMoments: WeddingStoryMoment[];
  detailsTitle: string;
  detailsSubtitle: string;
  schedule: WeddingScheduleItem[];
  locations: WeddingLocation[];
  detailCards: WeddingDetailCard[];
  gifts: WeddingGift[];
  gallery: WeddingGalleryImage[];
  finalText: string;
  footerImage: string;
  footerText: string;
  rsvp: RSVPConfiguration;
  theme: WeddingTheme;
  seo: {
    title: string;
    description: string;
  };
};

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type CashGiftRevenueModel = {
  id: string;
  title: string;
  subtitle: string;
  highlight: string;
  currency: "BRL";
  features: string[];
};

export type CashGiftTransaction = {
  id: string;
  weddingSiteId: string;
  guestName: string;
  message?: string;
  grossAmount: number;
  currency: "BRL";
  status: CashGiftStatus;
  paymentMethod: "pix" | "card";
  paidAt?: string;
  createdAt: string;
};

export type WeddingGuest = {
  id: string;
  weddingSiteId: string;
  name: string;
  contact: string;
  status: GuestStatus;
  companionsAllowed: number;
  companionsConfirmed: number;
  dietaryRestriction?: string;
  note?: string;
};

export type WeddingMessage = {
  id: string;
  weddingSiteId: string;
  guestName: string;
  message: string;
  createdAt: string;
};

export type PlatformTemplate = {
  id: WeddingSite["templateId"];
  name: string;
  description: string;
  previewImage: string;
  status: "active" | "draft";
};

export type PlatformMetrics = {
  totalUsers: number;
  totalWeddings: number;
  publishedWeddings: number;
  draftWeddings: number;
  revenue: number;
  grossCashGifts: number;
  conversionRate: number;
};

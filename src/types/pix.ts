export type PixChargeRequest = {
  weddingSiteId: string;
  guestName: string;
  amount: number;
  message?: string;
  giftId?: string;
};

export type PixChargeResponse = {
  id: string;
  txid: string;
  status: "pending" | "paid";
  grossAmount: number;
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  payload: string;
  qrCodeSvg: string;
  expiresAt: string;
  paidAt?: string;
};

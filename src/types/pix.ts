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
  feeAmount: number;
  netAmount: number;
  feePercent: number;
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  payload: string;
  qrCodeSvg: string;
  expiresAt: string;
  paidAt?: string;
};

export type PixSimulationRequest = {
  charge: PixChargeResponse;
};

export type PixSimulationResponse = PixChargeResponse & {
  status: "paid";
  paidAt: string;
  simulator: true;
};

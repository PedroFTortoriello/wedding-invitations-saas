import type { PixChargeRequest, PixChargeResponse } from "@/types/pix";

const PIX_GUI = "br.gov.bcb.pix";
const DEFAULT_PIX_KEY = "presentes@vows.demo";
const DEFAULT_MERCHANT_NAME = "VOWS PRESENTES";
const DEFAULT_MERCHANT_CITY = "SAO PAULO";

function normalizeText(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createPixTxid(weddingSiteId: string) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  const prefix = weddingSiteId.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
  return `${prefix}${random}`.slice(0, 25);
}

export function calculatePixFee(amount: number, feePercent: number) {
  return Number(((amount * feePercent) / 100).toFixed(2));
}

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
  description
}: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid: string;
  description?: string;
}) {
  const merchantAccountInfo = field("00", PIX_GUI) + field("01", pixKey);
  const additionalData = field("05", txid);
  const normalizedDescription = description ? normalizeText(description, 60) : "";
  const basePayload =
    field("00", "01") +
    field("26", merchantAccountInfo) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount.toFixed(2)) +
    field("58", "BR") +
    field("59", normalizeText(merchantName, 25)) +
    field("60", normalizeText(merchantCity, 15)) +
    (normalizedDescription ? field("62", additionalData + field("08", normalizedDescription)) : field("62", additionalData));

  const payloadForCrc = `${basePayload}6304`;
  return `${payloadForCrc}${crc16(payloadForCrc)}`;
}

export function getPixSettings() {
  return {
    pixKey: process.env.PIX_KEY?.trim() || DEFAULT_PIX_KEY,
    merchantName: process.env.PIX_MERCHANT_NAME?.trim() || DEFAULT_MERCHANT_NAME,
    merchantCity: process.env.PIX_MERCHANT_CITY?.trim() || DEFAULT_MERCHANT_CITY,
    feePercent: Number(process.env.PIX_FEE_PERCENT || "1.5")
  };
}

export async function createPixCharge(request: PixChargeRequest): Promise<Omit<PixChargeResponse, "qrCodeSvg">> {
  const amount = Number(request.amount);

  if (!Number.isFinite(amount) || amount < 1) {
    throw new Error("O valor minimo para presente em dinheiro e R$ 1,00.");
  }

  if (!request.guestName.trim()) {
    throw new Error("Informe o nome de quem está presenteando.");
  }

  const settings = getPixSettings();
  const txid = createPixTxid(request.weddingSiteId);
  const feeAmount = calculatePixFee(amount, settings.feePercent);
  const netAmount = Number((amount - feeAmount).toFixed(2));
  const payload = buildPixPayload({
    pixKey: settings.pixKey,
    merchantName: settings.merchantName,
    merchantCity: settings.merchantCity,
    amount,
    txid,
    description: request.message || `Presente ${request.guestName}`
  });

  return {
    id: `pix_${txid.toLowerCase()}`,
    txid,
    status: "pending",
    grossAmount: amount,
    feeAmount,
    netAmount,
    feePercent: settings.feePercent,
    pixKey: settings.pixKey,
    merchantName: settings.merchantName,
    merchantCity: settings.merchantCity,
    payload,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
}

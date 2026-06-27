import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { createPixCharge } from "@/lib/pix";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToWeddingSite, WEDDING_RENDER_COLUMNS } from "@/lib/wedding";
import type { PixChargeRequest, PixChargeResponse } from "@/types/pix";

export const runtime = "nodejs";

/**
 * Gera o Pix copia-e-cola/QR de um presente em dinheiro a partir da chave do
 * casal (EMV, sem PSP — 100% para o casal). Registra a intenção como `pending`
 * em cash_gifts para o casal reconciliar e marcar recebido manualmente.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PixChargeRequest>;
    const weddingSiteId = String(body.weddingSiteId || "");
    if (!weddingSiteId) {
      return NextResponse.json({ error: "Site inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("weddings")
      .select(WEDDING_RENDER_COLUMNS)
      .eq("id", weddingSiteId)
      .maybeSingle();

    if (!row || row.status !== "published") {
      return NextResponse.json({ error: "Site não disponível para presentes." }, { status: 404 });
    }

    const wedding = rowToWeddingSite(row);
    const guestName = String(body.guestName || "").trim();
    const message = body.message ? String(body.message).trim() : undefined;

    const charge = await createPixCharge(
      {
        weddingSiteId,
        guestName,
        amount: Number(body.amount),
        message,
        giftId: body.giftId ? String(body.giftId) : undefined
      },
      {
        pixKey: wedding.pixKey,
        merchantName: wedding.pixHolderName || wedding.coupleNames,
        merchantCity: wedding.locations[0]?.city ?? ""
      }
    );

    await admin.from("cash_gifts").insert({
      wedding_id: weddingSiteId,
      guest_name: guestName || "Convidado",
      message: message || null,
      gross_amount: charge.grossAmount,
      currency: "BRL",
      status: "pending",
      payment_method: "pix"
    });

    const qrCodeSvg = await QRCode.toString(charge.payload, {
      type: "svg",
      margin: 1,
      width: 280,
      color: { dark: "#354022", light: "#fffaf1" }
    });

    return NextResponse.json({ ...charge, qrCodeSvg } satisfies PixChargeResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a cobrança Pix." },
      { status: 400 }
    );
  }
}

import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { createPixCharge } from "@/lib/pix";
import type { PixChargeRequest, PixChargeResponse } from "@/types/pix";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PixChargeRequest>;
    const charge = await createPixCharge({
      weddingSiteId: String(body.weddingSiteId || ""),
      guestName: String(body.guestName || ""),
      amount: Number(body.amount),
      message: body.message ? String(body.message) : undefined,
      giftId: body.giftId ? String(body.giftId) : undefined
    });
    const qrCodeSvg = await QRCode.toString(charge.payload, {
      type: "svg",
      margin: 1,
      width: 280,
      color: {
        dark: "#354022",
        light: "#fffaf1"
      }
    });

    return NextResponse.json({
      ...charge,
      qrCodeSvg
    } satisfies PixChargeResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Nao foi possivel gerar a cobranca Pix."
      },
      { status: 400 }
    );
  }
}

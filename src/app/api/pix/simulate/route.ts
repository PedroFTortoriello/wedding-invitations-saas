import { NextResponse } from "next/server";
import type { PixSimulationRequest, PixSimulationResponse } from "@/types/pix";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PixSimulationRequest>;
    const charge = body.charge;

    if (!charge?.id || !charge.txid || !charge.payload) {
      return NextResponse.json({ error: "Informe uma cobranca Pix valida para simular." }, { status: 400 });
    }

    return NextResponse.json({
      ...charge,
      status: "paid",
      paidAt: new Date().toISOString(),
      simulator: true
    } satisfies PixSimulationResponse);
  } catch {
    return NextResponse.json({ error: "Nao foi possivel simular o pagamento Pix." }, { status: 400 });
  }
}

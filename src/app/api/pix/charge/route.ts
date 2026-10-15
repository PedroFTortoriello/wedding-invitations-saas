import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/funnel";
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
  const path = "/api/pix/charge";
  let weddingId: string | undefined;
  try {
    const body = (await request.json()) as Partial<PixChargeRequest>;
    const weddingSiteId = String(body.weddingSiteId || "");
    if (!weddingSiteId) {
      return NextResponse.json({ error: "Site inválido." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: row, error: rowError } = await admin
      .from("weddings")
      .select(WEDDING_RENDER_COLUMNS)
      .eq("id", weddingSiteId)
      .maybeSingle();

    if (!row || row.status !== "published") {
      // 22P02 = id que não é uuid (requisição forjada), não falha nossa.
      if (rowError && rowError.code !== "22P02") await logServerError("pix.charge.wedding", rowError, { path });
      return NextResponse.json({ error: "Site não disponível para presentes." }, { status: 404 });
    }
    weddingId = row.id;

    const wedding = rowToWeddingSite(row);
    const guestName = String(body.guestName || "").trim();
    const message = body.message ? String(body.message).trim() : undefined;

    let charge: Awaited<ReturnType<typeof createPixCharge>>;
    try {
      charge = await createPixCharge(
        {
          weddingSiteId,
          guestName,
          amount: Number(body.amount),
          message,
          giftId: body.giftId ? String(body.giftId) : undefined
        },
        {
          pixKey: wedding.pixKey,
          pixKeyType: wedding.pixKeyType,
          merchantName: wedding.pixHolderName || wedding.coupleNames,
          merchantCity: wedding.locations[0]?.city ?? ""
        }
      );
    } catch (error) {
      // Só validação (valor, nome, chave Pix do casal): vai para a tela, não é falha nossa.
      // Não registra: endpoint público, qualquer um encheria "Erros nas últimas 24h".
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Não foi possível gerar a cobrança Pix." },
        { status: 400 }
      );
    }

    // O dinheiro vai direto pra chave do casal (EMV); esta linha é só para o casal
    // reconciliar. Se falhar, não bloqueia o QR do convidado — mas registramos.
    const { error: giftError } = await admin.from("cash_gifts").insert({
      wedding_id: weddingSiteId,
      guest_name: guestName || "Convidado",
      message: message || null,
      gross_amount: charge.grossAmount,
      currency: "BRL",
      status: "pending",
      payment_method: "pix"
    });
    if (giftError) {
      // Público: só o casamento e o erro — nunca nome, valor ou recado do convidado.
      await logServerError("pix.charge.cash_gift", giftError, { weddingId, path });
    }

    const qrCodeSvg = await QRCode.toString(charge.payload, {
      type: "svg",
      margin: 1,
      width: 280,
      color: { dark: "#354022", light: "#fffaf1" }
    });

    return NextResponse.json({ ...charge, qrCodeSvg } satisfies PixChargeResponse);
  } catch (error) {
    // JSON malformado é do cliente — e a mensagem do parser ecoa trechos do corpo.
    if (!(error instanceof SyntaxError)) await logServerError("pix.charge", error, { weddingId, path });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível gerar a cobrança Pix." },
      { status: 400 }
    );
  }
}

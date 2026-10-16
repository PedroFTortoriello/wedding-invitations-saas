import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SupportBar } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { recordFunnelEventAfter } from "@/lib/funnel";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { LiveEditor } from "./LiveEditor";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  searchParams
}: {
  searchParams: Promise<{ secao?: string; bemvindo?: string }>;
}) {
  const { secao, bemvindo } = await searchParams;
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  // ?bemvindo=1: acabou de criar o site (cadastro, onboarding automático ou formulário).
  // ?bemvindo=ia: a IA acabou de montar o site (/ia).
  const welcome = bemvindo === "ia" ? "ia" : bemvindo === "1" ? "new" : null;
  // O autosave (revalidatePath) re-renderiza esta página na resposta da server action:
  // isso não é abrir o editor. Redirect de action chega sem o header, e conta.
  const hdrs = await headers();
  // A visita do suporte não é do casal: fica fora do funil.
  if (!ctx.support && !hdrs.has("next-action")) {
    recordFunnelEventAfter({
      event: "editor_opened",
      userId: row.owner_id,
      weddingId: row.id,
      path: "/editor",
      detail: { welcome: welcome !== null, ai: welcome === "ia", section: secao ?? null }
    });
  }

  // Origem absoluta do link para os convidados (APP_URL em prod, host da requisição em dev).
  const appOrigin = (
    process.env.APP_URL || `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host") ?? "localhost:3000"}`
  ).replace(/\/+$/, "");

  // Antes da migration 0012 a coluna não existe e o select falha: conta como "sem número".
  // Modo suporte: o convite de WhatsApp nem aparece (o LiveEditor esconde), então nem consulta.
  const profile = ctx.support
    ? null
    : (await ctx.db.from("profiles").select("whatsapp").eq("id", row.owner_id).maybeSingle()).data;

  return (
    <LiveEditor
      initial={rowToWeddingSite(row)}
      appOrigin={appOrigin}
      hasWhatsapp={Boolean(profile?.whatsapp)}
      initialSection={secao}
      welcome={welcome}
      supportBar={ctx.support ? <SupportBar support={ctx.support} /> : null}
    />
  );
}

import Link from "next/link";
import { Icon, type IconName } from "@/components/app/icons";
import { SignOutButton } from "@/components/app/SignOutButton";
import { SupportBar } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import type { AiBriefing } from "@/lib/ai-site";
import { whatsappLink } from "@/lib/company";
import {
  AI_SITE_FEE_LABEL,
  MAX_AI_GENERATIONS,
  MAX_AI_PHOTOS,
  platformName,
  PUBLISH_FEE_LABEL
} from "@/lib/platform-data";
import { isOwnerPhotoUrl, rowToWeddingSite } from "@/lib/wedding";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { AiBriefingForm } from "./AiBriefingForm";

export const dynamic = "force-dynamic";
// A geração (server action desta página) leva ~1 min com fotos.
export const maxDuration = 300;
export const metadata = { title: "Site feito pela IA" };

const STEPS: { icon: IconName; text: string }[] = [
  { icon: "edit", text: "Vocês contam a história e mandam as fotos, do jeito que der." },
  { icon: "sparkle", text: "A IA escolhe o modelo, escreve os textos e organiza as fotos." },
  { icon: "eye", text: "Vocês revisam no editor e só pagam se decidirem publicar." }
];

export default async function AiSitePage() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  const site = row ? rowToWeddingSite(row) : null;

  const { data: generations } = row
    ? await ctx.db
        .from("ai_generations")
        .select("briefing")
        .eq("wedding_id", row.id)
        .order("created_at", { ascending: false })
    : { data: [] };
  const used = generations?.length ?? 0;
  const last = (generations?.[0]?.briefing ?? {}) as Partial<AiBriefing>;

  let names = site?.coupleNames ?? "";
  if (!names) {
    const { data: profile } = await ctx.db.from("profiles").select("name").eq("id", ctx.ownerId).maybeSingle();
    names = profile?.name?.trim() || String(ctx.sessionUser.user_metadata?.name ?? "").trim();
  }
  const primary = site?.locations[0];
  const defaults: AiBriefing = {
    coupleNames: names,
    weddingDate: site?.weddingDate
      ? new Date(site.weddingDate).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
      : (last.weddingDate ?? ""),
    weddingTime: site?.weddingTime || last.weddingTime || "",
    venue: primary?.venue || last.venue || "",
    city: primary?.city || last.city || "",
    address: primary?.address || last.address || "",
    story: last.story ?? "",
    style: last.style ?? "",
    schedule: last.schedule ?? "",
    extras: last.extras ?? "",
    // Regerar parte das fotos que já estão no site (só as do casal, não as do modelo).
    photos: (site?.gallery ?? [])
      .map((g) => g.src)
      .filter((src) => isOwnerPhotoUrl(src, ctx.ownerId))
      .slice(0, MAX_AI_PHOTOS)
  };

  const blocked = row?.publish_paid_at
    ? "Este site já foi publicado pela taxa padrão. Para a IA montar o site, fale com o suporte."
    : used >= MAX_AI_GENERATIONS
      ? `Vocês já usaram as ${MAX_AI_GENERATIONS} gerações. Daqui em diante, ajustem o site no editor.`
      : null;

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {ctx.support ? <SupportBar support={ctx.support} /> : null}
      <header className="flex h-16 items-center justify-between border-b border-line px-4 md:px-8">
        <Link href={row ? "/dashboard" : "/"} className="font-serif text-[1.75rem] italic leading-none">
          {platformName}
        </Link>
        <SignOutButton compact />
      </header>

      <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-16">
        <div className="lg:sticky lg:top-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-text">Site feito pela IA</p>
          <h1 className="mt-3 font-serif text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-balance md:text-[3.25rem]">
            A IA monta o site de <em>vocês</em>
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-ink">
            Mandem os dados e as fotos. Em cerca de um minuto o site fica pronto para revisar. Publicar custa{" "}
            <strong className="font-semibold whitespace-nowrap">{AI_SITE_FEE_LABEL}</strong>, uma única vez.
          </p>
          <ul className="mt-8 grid gap-4">
            {STEPS.map((step) => (
              <li key={step.text} className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest/8 text-forest">
                  <Icon name={step.icon} size={16} />
                </span>
                {step.text}
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-md text-sm leading-6 text-ink-soft">
            Prefere montar sozinho?{" "}
            <Link href={row ? "/editor" : "/onboarding"} className="font-semibold text-ink underline underline-offset-4">
              Use o editor
            </Link>{" "}
            e publique por {PUBLISH_FEE_LABEL}.
          </p>
        </div>

        {blocked ? (
          <section className="panel grid gap-5 p-6 sm:p-8">
            <p className="text-base leading-7 text-ink">{blocked}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/editor" className="btn btn-sm btn-primary">
                Abrir o editor
              </Link>
              {row?.publish_paid_at ? (
                <a href={whatsappLink("Olá! Quero que a IA monte o site do nosso casamento.")} className="btn btn-sm btn-secondary">
                  <Icon name="whatsapp" size={16} />
                  Falar com o suporte
                </a>
              ) : null}
            </div>
          </section>
        ) : (
          <AiBriefingForm defaults={defaults} remaining={MAX_AI_GENERATIONS - used} />
        )}
      </main>
    </div>
  );
}

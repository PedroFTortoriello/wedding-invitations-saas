import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/app/icons";
import { SignOutButton } from "@/components/app/SignOutButton";
import { SupportBar } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { ensureProfile } from "@/lib/auth";
import { platformName } from "@/lib/platform-data";
import { OnboardingForm } from "./OnboardingForm";
import { StarterWedding } from "./StarterWedding";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ cadastro?: string }> }) {
  const { cadastro } = await searchParams;
  const ctx = await getActingContext();
  const { sessionUser: user, support } = ctx;
  const supabase = ctx.db;
  if (!support) await ensureProfile();

  // Um usuário tem um casamento por vez (MVP): se já existe, vai direto ao editor.
  const { data: existing } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_id", ctx.ownerId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect("/editor");
  }

  // Modo suporte: o casamento é do casal criar; nada de criação automática pelo admin.
  if (support) {
    return (
      <div className="min-h-dvh bg-bg text-ink">
        <SupportBar support={support} />
        <header className="flex h-16 items-center border-b border-line px-4 md:px-8">
          <Link href="/" className="font-serif text-[1.75rem] italic leading-none">
            {platformName}
          </Link>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-12 md:px-8 lg:py-20">
          <section className="panel flex items-start gap-4 p-6 sm:p-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest/8 text-forest">
              <Icon name="heart" size={20} />
            </span>
            <div>
              <h1 className="font-serif text-[1.875rem] leading-[1.1] tracking-[-0.01em] text-balance md:text-[2.25rem]">
                Esta conta ainda não tem casamento
              </h1>
              <p className="mt-3 max-w-md text-base leading-7 text-ink">
                No modo suporte não criamos o casamento pelo casal. Quando o casal criar o site pela própria conta, o
                painel dele aparece aqui.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .maybeSingle();
  const names = profile?.name?.trim() || String(user.user_metadata?.name ?? "").trim();

  const form = (
    <main className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-16">
      <div className="lg:sticky lg:top-16">
        <h1 className="font-serif text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-balance md:text-[3.25rem]">
          Vamos criar o site de <em>vocês</em>
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-ink-soft">
          Só o essencial agora. Fotos, história, locais e presentes vocês ajustam no editor, vendo o site mudar ao vivo.
        </p>
        <ul className="mt-8 grid gap-4">
          {(
            [
            { icon: "edit", text: "Tudo pode ser mudado depois, inclusive o modelo." },
            { icon: "eye", text: "Só vocês veem o site até decidirem publicar." },
            { icon: "pix", text: "Presentes via Pix caem direto na sua conta, com 0% de taxa." }
            ] satisfies { icon: IconName; text: string }[]
          ).map((item) => (
            <li key={item.text} className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest/8 text-forest">
                <Icon name={item.icon} size={16} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <OnboardingForm defaultCoupleNames={names} />
    </main>
  );

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="flex h-16 items-center justify-between border-b border-line px-4 md:px-8">
        <Link href="/" className="font-serif text-[1.75rem] italic leading-none">
          {platformName}
        </Link>
        <SignOutButton compact />
      </header>

      {/* Com o nome do casal, cria o site sozinho e abre o editor; o formulário é o plano B.
          Admin (vem do login ou do "Painel do casal") só cria casamento se quiser, pelo formulário. */}
      {names.length >= 3 && profile?.role !== "admin" ? <StarterWedding signupEventId={cadastro} form={form} /> : form}
    </div>
  );
}

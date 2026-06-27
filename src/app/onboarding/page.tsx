import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ensureProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  await ensureProfile();

  const supabase = await createClient();

  // Um usuário tem um casamento por vez (MVP): se já existe, vai direto ao editor.
  const { data: existing } = await supabase
    .from("weddings")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    redirect("/editor");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      title="Criar casamento"
      subtitle="Comece pelos dados essenciais. Você ajusta tudo no editor antes de publicar."
      active="onboarding"
    >
      <div className="mx-auto max-w-2xl">
        <OnboardingForm defaultCoupleNames={profile?.name ?? ""} />
      </div>
    </AppShell>
  );
}

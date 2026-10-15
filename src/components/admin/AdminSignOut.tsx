"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSupportOnSignOutAction } from "@/app/admin/suporte-actions";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/app/icons";

/** Sair, com cores para a superfície verde do admin (o SignOutButton do painel é para fundo claro). */
export function AdminSignOut({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    // Encerra um modo suporte aberto neste navegador; falhar aqui não impede sair.
    await endSupportOnSignOutAction().catch(() => undefined);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-label={compact ? "Sair da conta" : undefined}
      className={`flex items-center rounded-lg text-on-forest/80 transition-colors duration-150 hover:bg-on-forest/10 hover:text-on-forest focus-visible:outline-2 focus-visible:outline-on-forest disabled:opacity-60 motion-reduce:transition-none ${
        compact ? "size-10 justify-center" : "min-h-10 w-full gap-3 px-3 text-left text-[0.9375rem]"
      }`}
    >
      <Icon name="logout" />
      {compact ? null : loading ? "Saindo…" : "Sair"}
    </button>
  );
}

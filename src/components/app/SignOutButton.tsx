"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { endSupportOnSignOutAction } from "@/app/admin/suporte-actions";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/app/icons";

const DEFAULT_CLASS =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-[0.9375rem] text-ink-soft transition-colors duration-150 hover:bg-forest/6 hover:text-ink";

export function SignOutButton({ compact = false, className = DEFAULT_CLASS }: { compact?: boolean; className?: string }) {
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

  if (compact) {
    return (
      <button type="button" onClick={handleSignOut} disabled={loading} className="icon-btn" aria-label="Sair da conta">
        <Icon name="logout" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={`${className} disabled:opacity-60`}
    >
      <Icon name="logout" />
      {loading ? "Saindo…" : "Sair"}
    </button>
  );
}

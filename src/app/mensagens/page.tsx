import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { createClient } from "@/lib/supabase/server";
import { getOwnedWeddingRow } from "@/lib/wedding-server";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const row = await getOwnedWeddingRow();
  if (!row) {
    redirect("/onboarding");
  }

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const messageList = messages ?? [];

  return (
    <AppShell
      title="Mensagens"
      subtitle="Recados enviados pelos convidados a partir do site."
      active="messages"
    >
      {messageList.length === 0 ? (
        <p className="card p-6 text-sm leading-6 text-ink-soft">
          Nenhum recado ainda. As mensagens deixadas pelos convidados no site aparecem aqui.
        </p>
      ) : (
        <div className="grid gap-4">
          {messageList.map((message) => (
            <article key={message.id} className="card p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="t-h2">{message.guest_name}</h2>
                <time className="t-eyebrow text-ink-soft">
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(message.created_at))}
                </time>
              </div>
              <p className="mt-4 text-lg leading-8 text-ink-soft">{message.message}</p>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

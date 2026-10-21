import { redirect } from "next/navigation";
import { AppShell, shellWedding } from "@/components/app/AppShell";
import { Avatar, EmptyState } from "@/components/app/Panel";
import { getActingContext } from "@/lib/acting";
import { getOwnedWeddingRow } from "@/lib/wedding-server";
import { rowToWeddingSite } from "@/lib/wedding";

export const dynamic = "force-dynamic";

const formatDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });

export default async function MessagesPage() {
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const { data: messages } = await ctx.db
    .from("messages")
    .select("*")
    .eq("wedding_id", row.id)
    .order("created_at", { ascending: false });

  const messageList = messages ?? [];

  return (
    <AppShell
      title="Recados"
      subtitle={
        messageList.length
          ? `${messageList.length} ${messageList.length === 1 ? "recado" : "recados"} deixados pelos convidados no site.`
          : "O que os convidados escreveram para vocês no site."
      }
      active="messages"
      wedding={shellWedding(rowToWeddingSite(row))}
      support={ctx.support}
    >
      {messageList.length === 0 ? (
        <section className="panel">
          <EmptyState icon="message" title="Nenhum recado ainda">
            Seu site tem um espaço para os convidados deixarem mensagens. Assim que alguém escrever, o recado aparece
            aqui.
          </EmptyState>
        </section>
      ) : (
        <ul className="columns-1 gap-5 md:columns-2 xl:columns-3">
          {messageList.map((message) => (
            <li key={message.id} className="panel mb-5 break-inside-avoid p-5">
              <p className="whitespace-pre-line text-base leading-7 text-ink">{message.message}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                <Avatar name={message.guest_name} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{message.guest_name}</p>
                  <p className="text-[0.8125rem] text-ink-soft">
                    <time dateTime={message.created_at}>{formatDate.format(new Date(message.created_at))}</time>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}

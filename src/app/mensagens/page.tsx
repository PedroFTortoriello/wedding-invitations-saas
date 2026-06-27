import { AppShell } from "@/components/app/AppShell";
import { demoMessages } from "@/lib/platform-data";

export default function MessagesPage() {
  return (
    <AppShell
      title="Mensagens"
      subtitle="Recados enviados pelos convidados, com preparacao para moderacao e exportacao."
      active="messages"
    >
      <div className="grid gap-4">
        {demoMessages.map((message) => (
          <article key={message.id} className="card p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="t-h2">{message.guestName}</h2>
              <time className="t-eyebrow text-ink-soft">
                {new Intl.DateTimeFormat("pt-BR").format(new Date(message.createdAt))}
              </time>
            </div>
            <p className="mt-4 text-lg leading-8 text-ink-soft">{message.message}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}

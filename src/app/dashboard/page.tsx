import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell, daysUntil, shellWedding } from "@/components/app/AppShell";
import { CopyLink } from "@/components/app/CopyLink";
import { Icon, type IconName } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { PublishButton } from "@/components/app/PublishButton";
import { Avatar, EmptyState, PanelHeader } from "@/components/app/Panel";
import { StatusBadge } from "@/components/app/StatusBadge";
import { SupportBlockedButton, SupportBlockedNote } from "@/components/app/SupportBar";
import { getActingContext } from "@/lib/acting";
import { getOwnedWeddingRow, isAiMade } from "@/lib/wedding-server";
import { getMercadoPagoConnectionSummary } from "@/lib/mercadopago-server";
import { rowToWeddingSite } from "@/lib/wedding";
import { formatCurrency, publishFee } from "@/lib/platform-data";
import { hasRecentPurchase } from "../publicar/recent-purchase";
import { CardGiftsPanel } from "./CardGiftsPanel";
import { generateCoordinatorLinkAction, revokeCoordinatorLinkAction } from "./coordinator-actions";
import { PurchaseTracker } from "./PurchaseTracker";

export const dynamic = "force-dynamic";

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Avisos da volta do OAuth do Mercado Pago. Só códigos conhecidos — nunca ecoa a query. */
const MP_FLASH: Record<string, { ok: boolean; text: string } | undefined> = {
  conectado: { ok: true, text: "Mercado Pago conectado. Seus convidados já podem presentear no cartão." },
  desconectado: { ok: true, text: "Mercado Pago desconectado. O Pix continua ativo, com 0% de taxa." },
  negado: { ok: false, text: "Conexão cancelada no Mercado Pago. Nada mudou no seu site." },
  erro: { ok: false, text: "Não foi possível conectar o Mercado Pago. Tente de novo." }
};

/** "Terça-feira, 21 de outubro" — hoje, em São Paulo. */
function todayLabel(): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo"
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ publicacao?: string; mp?: string }>;
}) {
  const { publicacao, mp } = await searchParams;
  // Checkouts criados antes de /publicar voltam para cá: a confirmação agora mora lá.
  if (publicacao === "paga") {
    redirect("/publicar?pagamento=concluido");
  }
  const ctx = await getActingContext();
  const row = await getOwnedWeddingRow(ctx);
  if (!row) {
    redirect("/onboarding");
  }

  const site = rowToWeddingSite(row);
  const supabase = ctx.db;
  const support = ctx.support;

  // Origem absoluta para os links (APP_URL em prod, host da requisição em dev).
  const hdrs = await headers();
  const appOrigin =
    process.env.APP_URL || `${hdrs.get("x-forwarded-proto") ?? "http"}://${hdrs.get("host") ?? "localhost:3000"}`;
  const siteUrl = `${appOrigin}/casamento/${site.slug}`;

  // Conexão do cartão. Sem credenciais da plataforma no ambiente, o bloco nem aparece.
  const mercadoPagoConfigured = Boolean(process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET);

  // Tudo em paralelo: cada consulta é uma ida ao Supabase — em série, somariam.
  const [{ data: guests }, { data: messages }, { data: gifts }, mpConnection, recentPurchase, aiMade] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false }),
    supabase.from("messages").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false }),
    supabase.from("cash_gifts").select("*").eq("wedding_id", row.id).order("created_at", { ascending: false }),
    mercadoPagoConfigured ? getMercadoPagoConnectionSummary(row.id) : Promise.resolve(null),
    // Modo suporte: nunca dispara o Purchase da campanha no navegador do admin.
    support ? false : hasRecentPurchase(row.id, row.publish_paid_at),
    isAiMade(supabase, row.id).catch(() => false)
  ]);
  const fee = publishFee(aiMade);
  const cardConnected = mpConnection?.status === "active";
  const mpFlash = mp ? MP_FLASH[mp] : undefined;

  const guestList = guests ?? [];
  const messageList = messages ?? [];
  // Tentativa de cartão abandonada (sem pagamento no MP) não é recebimento: fica fora da lista.
  const giftList = (gifts ?? []).filter((gift) => gift.payment_method !== "card" || Boolean(gift.provider_payment_id));

  const confirmed = guestList.filter((guest) => guest.status === "confirmed").length;
  const pending = guestList.filter((guest) => guest.status === "pending").length;
  const grossCashGifts = giftList
    .filter((gift) => gift.status === "paid")
    .reduce((total, gift) => total + Number(gift.gross_amount), 0);
  const pixToConfirm = giftList.filter((gift) => gift.status === "pending" && gift.payment_method === "pix").length;

  const daysLeft = daysUntil(site.weddingDate);
  const isPublished = site.status === "published";
  const paid = Boolean(row.publish_paid_at);

  const steps: { done: boolean; label: string; hint: string; href: string; icon: IconName }[] = [
    {
      done: site.gallery.length > 0,
      label: "Adicionar suas fotos",
      hint: "Capa, galeria e rodapé do site",
      href: "/editor?secao=fotos",
      icon: "image"
    },
    {
      done: Boolean(site.pixKey),
      label: "Cadastrar a chave Pix",
      hint: "Os presentes caem direto nela, 0% de taxa",
      href: "/editor?secao=pix",
      icon: "pix"
    },
    {
      done: site.gifts.length > 0,
      label: "Criar as cotas de presente",
      hint: "Lua de mel, jantar, valor livre…",
      href: "/presentes",
      icon: "gift"
    },
    {
      done: guestList.length > 0,
      label: "Montar a lista de convidados",
      hint: "Só quem está na lista confirma presença",
      href: "/convidados",
      icon: "users"
    },
    {
      done: isPublished,
      label: "Publicar o site",
      hint: `Taxa única de ${fee.label}`,
      href: "/publicar",
      icon: "flag"
    },
    ...(mercadoPagoConfigured
      ? [
          {
            done: cardConnected,
            label: "Aceitar presentes no cartão",
            hint: "Opcional, via Mercado Pago",
            href: "#cartao",
            icon: "card" as const
          }
        ]
      : [])
  ];
  const doneCount = steps.filter((step) => step.done).length;
  const allDone = doneCount === steps.length;

  const shareText = encodeURIComponent(`Nosso site de casamento está no ar: ${siteUrl}`);

  return (
    <AppShell
      title="Visão geral"
      subtitle={
        daysLeft > 0
          ? `${todayLabel()} · faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} para o casamento`
          : todayLabel()
      }
      active="dashboard"
      wedding={shellWedding(site)}
      support={support}
    >
      <>
        {recentPurchase ? <PurchaseTracker weddingId={row.id} value={fee.brl} /> : null}
        {mpFlash ? <Notice tone={mpFlash.ok ? "success" : "error"}>{mpFlash.text}</Notice> : null}

        {/* Site: a foto de capa carrega o cartão (faixa no celular, coluna no desktop). */}
        <section className="panel grid overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" aria-labelledby="site-title">
          <div className="relative aspect-[2/1] bg-forest md:order-last md:aspect-auto md:min-h-72">
            {site.heroImage ? (
              <Image src={site.heroImage} alt="Foto de capa do site" fill sizes="(min-width: 768px) 352px, 100vw" className="object-cover" priority />
            ) : (
              <span className="grid h-full place-items-center font-serif text-[3.5rem] italic text-on-forest">{site.monogram}</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" aria-hidden />
            {daysLeft > 0 ? (
              <p className="absolute bottom-4 left-4 rounded-xl bg-bg/92 px-3.5 py-2.5 text-ink shadow-[0_10px_30px_-12px_rgb(26_30_21/0.5)] backdrop-blur-sm">
                <span className="block font-serif text-[2rem] leading-none tabular-nums">{daysLeft}</span>
                <span className="mt-1 block text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                  {daysLeft === 1 ? "dia" : "dias"} para o sim
                </span>
              </p>
            ) : null}
          </div>
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusBadge status={site.status} />
              <span className="text-[0.8125rem] text-ink-soft">Modelo {site.templateName}</span>
            </div>
            <h2
              id="site-title"
              className="mt-4 font-serif text-[2.5rem] italic leading-[1.02] tracking-[-0.015em] text-balance sm:text-[3.25rem]"
            >
              {site.coupleNames}
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.9375rem] text-ink">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={17} className="text-ink-soft" />
                {site.weddingDateLabel || "Data a definir"}
                {site.weddingTime ? ` · ${site.weddingTime}` : ""}
              </span>
              {daysLeft > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={17} className="text-ink-soft" />
                  Faltam {daysLeft} {daysLeft === 1 ? "dia" : "dias"}
                </span>
              ) : null}
            </p>

            <div className="mt-6">
              <CopyLink url={siteUrl} label="Link do site" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/editor" className="btn btn-sm btn-primary">
                <Icon name="edit" size={16} />
                Editar site
              </Link>
              <Link href={`/casamento/${site.slug}`} target="_blank" className="btn btn-sm btn-secondary">
                {isPublished ? "Ver site" : "Ver prévia"}
                <Icon name="external" size={15} />
              </Link>
              {isPublished ? (
                <a
                  href={`https://wa.me/?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-secondary"
                >
                  <Icon name="share" size={16} />
                  Enviar no WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* Publicação — a ação mais importante enquanto o site é rascunho */}
        {!isPublished ? (
          <section
            id="publicar"
            className={`grid ${support ? "scroll-mt-28" : "scroll-mt-20"} gap-5 rounded-[0.875rem] bg-forest p-5 text-on-forest sm:p-7 md:grid-cols-[1fr_auto] md:items-center`}
          >
            <div>
              <h2 className="font-serif text-[1.625rem] leading-tight sm:text-[1.875rem]">
                {paid ? "Pagamento confirmado. Falta só colocar no ar." : "Seu site ainda é um rascunho"}
              </h2>
              <p className="mt-2 max-w-xl text-[0.9375rem] leading-6 text-on-forest/90">
                {paid
                  ? "Publique quando quiser: o link passa a funcionar para os convidados na hora."
                  : `Só vocês veem a prévia. Publique com uma taxa única de ${fee.label}, sem mensalidade, e os presentes via Pix vão 100% para vocês.`}
              </p>
              {!paid && !aiMade ? (
                <p className="mt-3 text-[0.9375rem] leading-6">
                  Sem tempo para montar?{" "}
                  <Link href="/ia" className="font-semibold text-on-forest underline underline-offset-4">
                    A IA monta o site por vocês
                  </Link>
                </p>
              ) : null}
            </div>
            {/* Pagar acontece em /publicar; taxa já paga (cortesia/legado) publica daqui mesmo. */}
            {paid ? (
              <PublishButton weddingId={row.id} paid onDark blocked={Boolean(support)} />
            ) : (
              <Link href="/publicar" className="btn btn-sm btn-inverse justify-self-start">
                Ver o que falta e publicar
                <Icon name="chevronRight" size={16} />
              </Link>
            )}
          </section>
        ) : null}

        {/* Números */}
        <section aria-label="Resumo" className="panel grid grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Confirmados"
            value={`${confirmed}`}
            suffix={guestList.length ? `de ${guestList.length}` : undefined}
            href="/convidados"
            progress={guestList.length ? confirmed / guestList.length : undefined}
            className="border-b border-r border-line lg:border-b-0"
          />
          <Stat
            label="Sem resposta"
            value={`${pending}`}
            href="/convidados?status=pending"
            className="border-b border-line lg:border-b-0 lg:border-r"
          />
          <Stat label="Recados" value={`${messageList.length}`} href="/mensagens" className="border-r border-line" />
          <Stat
            label="Presentes recebidos"
            value={formatCurrency(grossCashGifts)}
            note={pixToConfirm ? `${pixToConfirm} Pix a confirmar` : undefined}
            href="/checkout"
          />
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          {!allDone ? (
            <section className="panel" aria-labelledby="steps-title">
              <div className="flex items-center justify-between gap-3 px-5 pt-5">
                <h2 id="steps-title" className="text-base font-semibold">
                  Primeiros passos
                </h2>
                <span className="text-sm text-ink-soft">
                  {doneCount} de {steps.length}
                </span>
              </div>
              <div className="mx-5 mt-3 h-1.5 overflow-hidden rounded-full bg-forest/10" aria-hidden>
                <div className="h-full rounded-full bg-forest" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
              </div>
              <ul className="mt-3 px-2 pb-2">
                {steps.map((step) => (
                  <li key={step.label}>
                    <Link
                      href={step.href}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 hover:bg-forest/5"
                    >
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-full ${
                          step.done ? "bg-forest text-on-forest" : "border border-line-strong text-ink-soft"
                        }`}
                      >
                        <Icon name={step.done ? "check" : step.icon} size={15} strokeWidth={step.done ? 2.6 : 1.7} />
                      </span>
                      <span className="grid min-w-0 flex-1">
                        <span className={`text-[0.9375rem] ${step.done ? "text-ink-soft" : "font-semibold text-ink"}`}>
                          {step.label}
                          {step.done ? <span className="sr-only"> (feito)</span> : null}
                        </span>
                        {step.done ? null : <span className="text-[0.8125rem] text-ink-soft">{step.hint}</span>}
                      </span>
                      {step.done ? null : (
                        <Icon
                          name="chevronRight"
                          size={16}
                          className="text-ink-soft transition-transform duration-150 group-hover:translate-x-0.5"
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={`panel ${allDone ? "lg:col-span-2" : ""}`}>
            <PanelHeader title="Confirmações recentes" href="/convidados" linkLabel="Ver lista" />
            {guestList.length === 0 ? (
              <EmptyState
                icon="users"
                title="Nenhum convidado na lista"
                action={
                  <Link href="/convidados" className="btn btn-sm btn-secondary">
                    Montar a lista
                  </Link>
                }
              >
                No site, só quem está na lista consegue confirmar presença.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {guestList.slice(0, 6).map((guest) => (
                  <li key={guest.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={guest.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">{guest.name}</p>
                      <p className="truncate text-[0.8125rem] text-ink-soft">
                        {guest.companions_confirmed > 0
                          ? `+${guest.companions_confirmed} acompanhante${guest.companions_confirmed > 1 ? "s" : ""}`
                          : "Sem acompanhantes"}
                      </p>
                    </div>
                    <StatusBadge status={guest.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="panel">
            <PanelHeader title="Recados" href="/mensagens" linkLabel="Ver todos" />
            {messageList.length === 0 ? (
              <EmptyState icon="message" title="Nenhum recado ainda">
                As mensagens que os convidados deixam no site aparecem aqui.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {messageList.slice(0, 3).map((message) => (
                  <li key={message.id} className="py-3.5">
                    <p className="line-clamp-3 text-[0.9375rem] leading-6 text-ink">{message.message}</p>
                    <p className="mt-1.5 text-[0.8125rem] text-ink-soft">
                      {message.guest_name} · {formatDay(message.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <PanelHeader title="Presentes em dinheiro" href="/checkout" linkLabel="Recebimentos" />
            {giftList.length === 0 ? (
              <EmptyState icon="wallet" title="Nenhum presente ainda">
                Quando um convidado presentear pelo site, o valor aparece aqui. No Pix, 100% vai para vocês.
              </EmptyState>
            ) : (
              <ul className="mt-2 divide-y divide-line px-5 pb-2">
                {giftList.slice(0, 5).map((gift) => (
                  <li key={gift.id} className="flex items-center gap-3 py-2.5">
                    <Avatar name={gift.guest_name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9375rem] font-medium text-ink">{gift.guest_name}</p>
                      <p className="text-[0.8125rem] text-ink-soft">
                        {formatDay(gift.paid_at ?? gift.created_at)} · {gift.payment_method === "card" ? "Cartão" : "Pix"}
                      </p>
                    </div>
                    <div className="grid justify-items-end gap-1">
                      <span className="text-[0.9375rem] font-semibold tabular-nums text-ink">
                        {formatCurrency(Number(gift.gross_amount))}
                      </span>
                      <StatusBadge status={gift.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Integrações e acessos */}
        <div className="mt-4">
          <h2 className="font-serif text-[1.625rem] leading-tight">Integrações e acessos</h2>
          <p className="mt-1 text-[0.9375rem] text-ink-soft">Formas extras de receber presentes e de dividir a organização.</p>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <CardGiftsPanel configured={mercadoPagoConfigured} connection={mpConnection} blocked={Boolean(support)} />

          <section className="panel p-5">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-forest/8 text-forest">
                <Icon name="users" size={19} />
              </span>
              <div>
                <h3 className="text-base font-semibold">Acesso da cerimonialista</h3>
                <p className="mt-1 text-sm leading-5 text-ink-soft">
                  Um link só de leitura com convidados, confirmações, programação, locais e recados. Sem login e sem
                  acesso ao seu Pix.
                </p>
              </div>
            </div>

            {row.coordinator_token ? (
              <div className="mt-5 grid gap-3">
                <CopyLink url={`${appOrigin}/coordenacao/${row.coordinator_token}`} label="Link da cerimonialista" openable />
                {support ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <SupportBlockedButton className="btn btn-sm btn-secondary">Gerar novo link</SupportBlockedButton>
                    <SupportBlockedButton className="btn btn-sm btn-ghost text-danger">Desativar acesso</SupportBlockedButton>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={generateCoordinatorLinkAction}>
                      <button type="submit" className="btn btn-sm btn-secondary">
                        Gerar novo link
                      </button>
                    </form>
                    <form action={revokeCoordinatorLinkAction}>
                      <button type="submit" className="btn btn-sm btn-ghost text-danger">
                        Desativar acesso
                      </button>
                    </form>
                  </div>
                )}
                {support ? (
                  <SupportBlockedNote />
                ) : (
                  <p className="text-[0.8125rem] text-ink-soft">Gerar um novo link desativa o anterior.</p>
                )}
              </div>
            ) : support ? (
              <div className="mt-5 grid gap-3">
                <SupportBlockedButton className="btn btn-sm btn-primary justify-self-start">
                  Gerar link da cerimonialista
                </SupportBlockedButton>
                <SupportBlockedNote />
              </div>
            ) : (
              <form action={generateCoordinatorLinkAction} className="mt-5">
                <button type="submit" className="btn btn-sm btn-primary">
                  Gerar link da cerimonialista
                </button>
              </form>
            )}
          </section>
        </div>
      </>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  suffix,
  note,
  href,
  progress,
  className = ""
}: {
  label: string;
  value: string;
  suffix?: string;
  note?: string;
  href: string;
  progress?: number;
  className?: string;
}) {
  return (
    <Link href={href} className={`group grid content-start gap-1.5 p-4 transition-colors duration-150 hover:bg-forest/4 sm:p-5 ${className}`}>
      <span className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
        {label}
        <Icon name="chevronRight" size={14} className="opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-serif text-[2rem] leading-none tabular-nums text-ink sm:text-[2.5rem]">{value}</span>
        {suffix ? <span className="text-sm text-ink-soft">{suffix}</span> : null}
      </span>
      {progress !== undefined ? (
        <span className="mt-2 h-1 overflow-hidden rounded-full bg-forest/10" aria-hidden>
          <span className="block h-full rounded-full bg-forest" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      ) : null}
      {note ? <span className="mt-1 text-[0.8125rem] font-medium text-warn">{note}</span> : null}
    </Link>
  );
}

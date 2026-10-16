"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";
import { WeddingTemplatePreview } from "@/components/templates/WeddingTemplatePreview";
import { CopyLink } from "@/components/app/CopyLink";
import { Icon, type IconName } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { SupportBlockedButton, SupportBlockedNote } from "@/components/app/SupportBar";
import { TemplatePicker } from "@/components/app/TemplatePicker";
import { romanticImages } from "@/lib/demo-wedding";
import { getPublishReadiness } from "@/lib/publish-readiness";
import { isValidSlug, slugify } from "@/lib/slug";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { PhotoManager } from "./PhotoManager";
import { autosaveWeddingAction } from "./autosave-action";
import { saveWhatsappAction } from "./profile-action";
import { updateSlugAction } from "./slug-action";

const PIX_KEY_TYPES: { id: WeddingSite["pixKeyType"]; label: string; placeholder: string }[] = [
  { id: "cpf", label: "CPF", placeholder: "000.000.000-00" },
  { id: "email", label: "E-mail", placeholder: "voces@email.com" },
  { id: "phone", label: "Telefone", placeholder: "+55 11 90000-0000" },
  { id: "cnpj", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  { id: "random", label: "Aleatória", placeholder: "Cole a chave aleatória" }
];

const DETAIL_CARD_TYPES: { id: WeddingSite["detailCards"][number]["type"]; label: string }[] = [
  { id: "location", label: "Local" },
  { id: "gifts", label: "Presentes" },
  { id: "menu", label: "Menu" },
  { id: "custom", label: "Personalizado" }
];

/** Modelos que renderizam a programação do dia (nos demais a seção não aparece). */
const TEMPLATES_WITH_SCHEDULE = new Set<WeddingSite["templateId"]>([
  "cinema-noir",
  "editorial-luxury",
  "jardim-romantico",
  "garden-classico"
]);

const SECTIONS = {
  modelo: { title: "Modelo", icon: "palette", description: "Troca na hora: textos e fotos continuam iguais." },
  casal: {
    title: "Casal e boas-vindas",
    icon: "heart",
    description: "Os nomes e a primeira mensagem que os convidados leem."
  },
  data: { title: "Data e horário", icon: "calendar", description: "A data também alimenta a contagem regressiva do site." },
  fotos: {
    title: "Fotos",
    icon: "image",
    description: "Suba suas fotos e escolha a capa. Arraste para mudar a ordem da galeria."
  },
  endereco: { title: "Endereço do site", icon: "link", description: "O link que vocês vão mandar para os convidados." },
  historia: { title: "Nossa história", icon: "book", description: "Os momentos que contam como vocês chegaram até aqui." },
  locais: {
    title: "Detalhes e locais",
    icon: "pin",
    description: "Cerimônia, recepção e todo lugar para onde os convidados precisam ir."
  },
  programacao: { title: "Programação do dia", icon: "clock", description: "O roteiro do grande dia, hora a hora." },
  cartoes: {
    title: "Cartões de informação",
    icon: "cards",
    description: "Traje, menu, hospedagem e outras informações úteis."
  },
  rsvp: {
    title: "Confirmação de presença",
    icon: "mail",
    description: "O formulário em que os convidados da sua lista confirmam presença."
  },
  encerramento: { title: "Encerramento", icon: "flag", description: "A última mensagem do site e o texto do rodapé." },
  pix: {
    title: "Pix para presentes",
    icon: "pix",
    description: "Os presentes em dinheiro caem 100% nesta chave, sem passar pela Noivar."
  },
  compartilhar: {
    title: "Prévia do link",
    icon: "share",
    description: "Título e descrição que aparecem quando o link é enviado no WhatsApp ou nas redes."
  }
} satisfies Record<string, { title: string; icon: IconName; description: string }>;

type SectionId = keyof typeof SECTIONS;

const SECTION_GROUPS: { label: string; ids: SectionId[] }[] = [
  { label: "O essencial", ids: ["modelo", "casal", "data", "fotos", "endereco"] },
  { label: "Conteúdo do site", ids: ["historia", "locais", "programacao", "cartoes", "rsvp", "encerramento"] },
  { label: "Presentes e compartilhamento", ids: ["pix", "compartilhar"] }
];

const SHARE_POPOVER_ID = "enviar-convidados";
const WHATSAPP_OPTIN_DISMISSED_KEY = "noivar:whatsapp-optin-dispensado";

function isSectionId(value: string | undefined): value is SectionId {
  return Boolean(value && value in SECTIONS);
}

/** Valor "YYYY-MM-DD" para o <input type="date"> a partir do ISO guardado. */
function dateInputValue(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : "";
}

/** Rótulo em pt-BR ("5 de dezembro de 2026") a partir de "YYYY-MM-DD". */
function labelFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return Number.isFinite(d.getTime())
    ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(d)
    : "";
}

/** ISO local (sem offset) a partir da data + horário — base da contagem regressiva. */
function composeISO(dateStr: string, time: string): string {
  if (!dateStr) return "";
  const t = /^\d{1,2}:\d{2}/.test(time) ? time.slice(0, 5).padStart(5, "0") : "00:00";
  return `${dateStr}T${t}:00`;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Resumo de cada seção na lista (e se ela pede atenção). */
function summarize(id: SectionId, site: WeddingSite): { text: string; attention?: boolean } {
  switch (id) {
    case "modelo":
      return { text: TEMPLATE_CHOICES.find((t) => t.id === site.templateId)?.label ?? site.templateName };
    case "casal":
      return { text: site.coupleNames || "Sem nomes", attention: !site.coupleNames.trim() };
    case "data":
      return {
        text: [site.weddingDateLabel, site.weddingTime].filter(Boolean).join(" · ") || "Data a definir",
        attention: !dateInputValue(site.weddingDate)
      };
    case "fotos":
      return site.gallery.length
        ? { text: plural(site.gallery.length, "foto sua", "fotos suas") }
        : { text: "Ainda com fotos de exemplo", attention: true };
    case "endereco":
      return { text: `/casamento/${site.slug}` };
    case "historia":
      return { text: site.storyMoments.length ? plural(site.storyMoments.length, "momento", "momentos") : "Nenhum momento" };
    case "locais": {
      const first = site.locations[0]?.venue || site.locations[0]?.title || "Local";
      return { text: site.locations.length > 1 ? `${first} e mais ${site.locations.length - 1}` : first };
    }
    case "programacao":
      return { text: site.schedule.length ? plural(site.schedule.length, "item", "itens") : "Vazia" };
    case "cartoes": {
      const visible = site.detailCards.filter((c) => c.active).length;
      return { text: site.detailCards.length ? `${visible} de ${site.detailCards.length} visíveis` : "Nenhum cartão" };
    }
    case "rsvp":
      return { text: site.rsvp.enabled ? "Ativada" : "Desativada" };
    case "encerramento":
      return { text: site.footerText || site.finalText || "—" };
    case "pix":
      return site.pixKey
        ? { text: `${PIX_KEY_TYPES.find((t) => t.id === site.pixKeyType)?.label ?? "Chave"} · ${site.pixKey}` }
        : { text: "Chave não cadastrada", attention: true };
    case "compartilhar":
      return { text: site.seo.title || "Sem título" };
  }
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

type LiveEditorProps = {
  initial: WeddingSite;
  /** Origem absoluta (https://…) para o link que vai para os convidados. */
  appOrigin: string;
  /** A conta já tem WhatsApp salvo: não oferece o opt-in. */
  hasWhatsapp: boolean;
  /** ?secao= — abre direto numa seção (links do painel, ex.: "Cadastrar a chave Pix"). */
  initialSection?: string;
  /** ?bemvindo=1 (site recém-criado) ou ?bemvindo=ia (montado pela IA): aviso de boas-vindas na lista de seções. */
  welcome?: "new" | "ia" | null;
  /**
   * Barra do modo suporte, renderizada no servidor (<SupportBar>). Presente = modo suporte:
   * publicar, trocar o endereço e o WhatsApp da conta ficam bloqueados (o servidor também recusa).
   */
  supportBar?: ReactNode;
};

export function LiveEditor({
  initial,
  appOrigin,
  hasWhatsapp,
  initialSection,
  welcome = null,
  supportBar
}: LiveEditorProps) {
  const inSupport = Boolean(supportBar);
  const [site, setSite] = useState<WeddingSite>(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId | null>(isSectionId(initialSection) ? initialSection : null);
  const [direction, setDirection] = useState<"in" | "back">("in");
  const [panelOpen, setPanelOpen] = useState(true);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(Boolean(welcome));
  // Congelado no mount: o autosave re-renderiza a página e o "salvo" não pode sumir com o cartão.
  const [askWhatsapp] = useState(!hasWhatsapp && !inSupport);

  const previewRef = useRef<HTMLDivElement>(null);
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastSectionRef = useRef<SectionId | null>(null);
  const navigatedRef = useRef(false);
  const siteRef = useRef(site);
  const savingRef = useRef(false);
  const savedRef = useRef<WeddingSite>(initial);

  const hasSchedule = TEMPLATES_WITH_SCHEDULE.has(site.templateId);
  const orderedSections = SECTION_GROUPS.flatMap((g) => g.ids).filter((id) => id !== "programacao" || hasSchedule);

  // Mantém a referência da versão mais nova para o auto-save (sem mutar ref no render).
  useEffect(() => {
    siteRef.current = site;
  });

  // No editor, mostra os blocos de scroll-reveal na hora (sem depender do scroll).
  useEffect(() => {
    previewRef.current?.querySelectorAll("[data-reveal]").forEach((n) => n.setAttribute("data-shown", "true"));
  }, [site.templateId, site.gallery.length, panelOpen, view]);

  // Auto-save com debounce + single-flight: um save por vez; edições feitas durante
  // um save em voo são persistidas em seguida, em ordem — um save antigo nunca
  // sobrescreve um estado mais novo, e nada é salvo no mount inicial. Só marca
  // como salvo o que o servidor aceitou (erro mantém a mudança pendente).
  useEffect(() => {
    if (siteRef.current === savedRef.current) return;
    const timer = setTimeout(save, 800);
    return () => clearTimeout(timer);

    async function save() {
      if (savingRef.current) return;
      savingRef.current = true;
      setStatus("saving");
      try {
        let res: { ok?: boolean; error?: string } = { ok: true };
        while (siteRef.current !== savedRef.current) {
          const toSave = siteRef.current;
          res = await autosaveWeddingAction(toSave);
          if (!res.ok) break;
          savedRef.current = toSave;
        }
        setStatus(res.ok ? "saved" : "error");
        setSaveError(res.ok ? null : res.error ?? "Não foi possível salvar.");
      } catch {
        setStatus("error");
        setSaveError("Falha de conexão.");
      } finally {
        savingRef.current = false;
      }
    }
  }, [site]);

  // Tira o ?bemvindo da URL (mantendo o resto): um refresh não mostra o aviso de novo.
  useEffect(() => {
    if (!welcome) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("bemvindo");
    window.history.replaceState(null, "", url);
  }, [welcome]);

  // Avisa antes de sair com alteração ainda não salva.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (siteRef.current !== savedRef.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  // Navegação da lista <-> seção: volta o scroll ao topo e leva o foco junto
  // (título da seção ao abrir, a linha da seção ao voltar). Não rouba o foco no load.
  useEffect(() => {
    panelScrollRef.current?.scrollTo({ top: 0 });
    if (!navigatedRef.current) return;
    if (section) headingRef.current?.focus({ preventScroll: true });
    else if (lastSectionRef.current) document.getElementById(`secao-${lastSectionRef.current}`)?.focus({ preventScroll: true });
  }, [section]);

  function openSection(id: SectionId, dir: "in" | "back" = "in") {
    navigatedRef.current = true;
    lastSectionRef.current = id;
    setDirection(dir);
    setJustAdded(null);
    setSection(id);
  }
  function closeSection() {
    navigatedRef.current = true;
    setDirection("back");
    setSection(null);
  }

  function patch(p: Partial<WeddingSite>) {
    setSite((s) => ({ ...s, ...p }));
  }
  const retrySave = () => setSite((s) => ({ ...s }));

  // Data real (dirige a contagem regressiva) + rótulo auto-preenchido.
  const setWeddingDate = (dateStr: string) =>
    setSite((s) => ({
      ...s,
      weddingDate: composeISO(dateStr, s.weddingTime),
      weddingDateLabel: labelFromDate(dateStr) || s.weddingDateLabel
    }));
  const setWeddingTime = (time: string) =>
    setSite((s) => {
      const dateStr = dateInputValue(s.weddingDate);
      return { ...s, weddingTime: time, weddingDate: dateStr ? composeISO(dateStr, time) : s.weddingDate };
    });

  // --- fotos (via PhotoManager controlado) ---
  const addPhotos = (photos: WeddingGalleryImage[]) => setSite((s) => ({ ...s, gallery: [...s.gallery, ...photos] }));
  const removePhoto = (id: string) =>
    setSite((s) => {
      const target = s.gallery.find((g) => g.id === id);
      const gallery = s.gallery.filter((g) => g.id !== id);
      // Se removeu a foto que era capa/rodapé, cai para a próxima do acervo; se a
      // galeria ficou vazia, volta ao placeholder (nunca aponta pro arquivo apagado).
      const heroImage =
        target && s.heroImage === target.src ? gallery[0]?.src ?? romanticImages.luxuryVenue : s.heroImage;
      const footerImage =
        target && s.footerImage === target.src ? gallery[0]?.src ?? romanticImages.ceremonyAisle : s.footerImage;
      return { ...s, gallery, heroImage, footerImage };
    });

  // --- listas (momentos, locais, cartões, programação) ---
  function addItem<K extends "storyMoments" | "locations" | "detailCards" | "schedule">(
    key: K,
    item: WeddingSite[K][number]
  ) {
    setJustAdded(item.id);
    setSite((s) => ({ ...s, [key]: [...s[key], item] }));
  }
  function updateItem<K extends "storyMoments" | "locations" | "detailCards" | "schedule">(
    key: K,
    id: string,
    p: Partial<WeddingSite[K][number]>
  ) {
    setSite((s) => ({ ...s, [key]: (s[key] as WeddingSite[K][number][]).map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  }
  function removeItem(key: "storyMoments" | "locations" | "detailCards" | "schedule", id: string) {
    setSite((s) => {
      // Mantém ao menos 1 local: os modelos leem locations[0] para a seção de local.
      if (key === "locations" && s.locations.length <= 1) return s;
      return { ...s, [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) };
    });
  }

  const current = section ? SECTIONS[section] : null;
  const nextSection = section ? orderedSections[orderedSections.indexOf(section) + 1] : undefined;
  const isPublished = site.status === "published";
  const siteUrl = `${appOrigin}/casamento/${site.slug}`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg text-ink">
      {supportBar}
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-surface px-2 sm:gap-2 sm:px-3">
        <Link href="/dashboard" className="btn btn-sm btn-ghost px-2.5" aria-label="Voltar ao painel">
          <Icon name="chevronLeft" size={18} />
          <span className="hidden sm:inline">Painel</span>
        </Link>
        <span className="hidden h-6 w-px bg-line sm:block" aria-hidden />
        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-pressed={!panelOpen}
          aria-label={panelOpen ? "Esconder o painel de edição" : "Mostrar o painel de edição"}
          title={panelOpen ? "Esconder painel" : "Mostrar painel"}
          className="icon-btn hidden lg:inline-grid"
        >
          <Icon name="sidebar" />
        </button>
        <p className="hidden min-w-0 truncate font-serif text-[1.25rem] italic leading-none md:block">{site.coupleNames}</p>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SaveIndicator status={status} onRetry={retrySave} />
          <Link
            href={`/casamento/${site.slug}`}
            target="_blank"
            className="btn btn-sm btn-secondary hidden sm:inline-flex"
          >
            {isPublished ? "Ver site" : "Abrir prévia"}
            <Icon name="external" size={15} />
          </Link>
          {isPublished ? (
            <>
              <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-forest/10 px-2.5 text-sm font-semibold text-forest sm:px-3.5">
                <Icon name="check" size={15} strokeWidth={2.4} />
                Publicado
              </span>
              <button type="button" popoverTarget={SHARE_POPOVER_ID} className="btn btn-sm btn-primary px-3 sm:px-4">
                <Icon name="share" size={15} />
                <span className="lg:hidden">Enviar</span>
                <span className="max-lg:hidden">Enviar para os convidados</span>
              </button>
            </>
          ) : inSupport ? (
            <SupportBlockedButton className="btn btn-sm btn-primary px-3.5 sm:px-4">Publicar</SupportBlockedButton>
          ) : (
            <Link href="/publicar" className="btn btn-sm btn-primary px-3.5 sm:px-4">
              Publicar
            </Link>
          )}
        </div>
      </header>

      {/* Popover nativo (top layer): não é cortado pelo overflow do editor, fecha com Esc
          ou clique fora. Ancorado à direita, logo abaixo da barra. */}
      {isPublished ? (
        <div
          id={SHARE_POPOVER_ID}
          popover="auto"
          role="dialog"
          aria-labelledby={`${SHARE_POPOVER_ID}-titulo`}
          className={`bottom-auto left-auto right-2 ${inSupport ? "top-27" : "top-15"} m-0 w-[min(23rem,calc(100vw-1rem))] rounded-xl border border-line bg-surface p-4 text-ink shadow-[0_12px_40px_rgb(26_30_21/0.18)] transition-[opacity,translate] duration-150 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none sm:right-3`}
        >
          <div className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 gap-0.5">
              <p id={`${SHARE_POPOVER_ID}-titulo`} className="text-[0.9375rem] font-semibold">
                Enviar para os convidados
              </p>
              <p className="text-[0.8125rem] leading-5 text-ink-soft">Mande no WhatsApp ou copie o link para o convite.</p>
            </div>
            <button
              type="button"
              popoverTarget={SHARE_POPOVER_ID}
              popoverTargetAction="hide"
              className="icon-btn -mr-2 -mt-2 size-9"
              aria-label="Fechar"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            <CopyLink url={siteUrl} label="Link do site" />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Nosso site de casamento está no ar: ${siteUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary w-full"
            >
              <Icon name="whatsapp" size={16} />
              Enviar no WhatsApp
            </a>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {/* Painel de edição */}
        <aside
          aria-label="Edição do site"
          className={`${view === "edit" ? "flex" : "hidden"} w-full flex-col border-r border-line bg-surface lg:w-100 lg:shrink-0 ${
            panelOpen ? "lg:flex" : "lg:hidden"
          }`}
        >
          <div ref={panelScrollRef} className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-6">
            {status === "error" ? (
              <Notice tone="error" className="mx-3 mt-3">
                {saveError} Suas últimas alterações ainda não foram salvas.
              </Notice>
            ) : null}
            {showWelcome && !section ? (
              <div className="relative mx-3 mt-3">
                <Notice tone="success" className="pr-11">
                  {welcome === "ia" ? (
                    "A IA montou o site de vocês. Revisem os textos e as fotos: tudo salva sozinho e só vocês veem até publicar."
                  ) : (
                    <>
                      O site de vocês já está criado. Tudo salva sozinho e só vocês veem até publicar. Comece pela data e
                      pelas fotos, ou{" "}
                      <Link href="/ia" className="font-semibold underline underline-offset-2">
                        deixe a IA montar tudo
                      </Link>
                      .
                    </>
                  )}
                </Notice>
                <button
                  type="button"
                  onClick={() => setShowWelcome(false)}
                  className="icon-btn absolute right-1 top-1 size-9"
                  aria-label="Fechar aviso"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>
            ) : null}
            {section && current ? (
              <div key={section} className={direction === "in" ? "slide-in" : "slide-back"}>
                <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-line bg-surface/95 px-2 py-2 backdrop-blur-sm">
                  <button type="button" onClick={closeSection} className="icon-btn" aria-label="Voltar para todas as seções">
                    <Icon name="chevronLeft" size={20} />
                  </button>
                  <h2 ref={headingRef} tabIndex={-1} className="text-base font-semibold outline-none">
                    {current.title}
                  </h2>
                </div>

                <div className="px-5 pt-4">
                  <p className="text-sm leading-5 text-ink-soft">{current.description}</p>
                  <div className="mt-5 grid gap-5">{renderSection(section)}</div>

                  {nextSection ? (
                    <button
                      type="button"
                      onClick={() => openSection(nextSection)}
                      className="group mt-8 flex w-full items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-left transition-colors duration-150 hover:border-line-strong hover:bg-bg/60"
                    >
                      <span className="grid">
                        <span className="text-[0.8125rem] text-ink-soft">Próxima seção</span>
                        <span className="text-[0.9375rem] font-semibold text-ink">{SECTIONS[nextSection].title}</span>
                      </span>
                      <Icon
                        name="chevronRight"
                        className="text-ink-soft transition-transform duration-150 group-hover:translate-x-0.5"
                      />
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className={direction === "back" ? "slide-back" : undefined}>
                {isPublished ? null : <ReadinessMeter site={site} onOpen={openSection} blocked={inSupport} />}
                <nav aria-label="Seções do site" className="grid gap-6 px-3 py-5">
                  {SECTION_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
                        {group.label}
                      </p>
                      <ul className="grid gap-0.5">
                        {group.ids
                          .filter((id) => id !== "programacao" || hasSchedule)
                          .map((id) => {
                            const meta = SECTIONS[id];
                            const summary = summarize(id, site);
                            return (
                              <li key={id}>
                                <button
                                  id={`secao-${id}`}
                                  type="button"
                                  onClick={() => openSection(id)}
                                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-forest/5 focus-visible:outline-2 focus-visible:outline-forest"
                                >
                                  <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-forest/8 text-forest">
                                    <Icon name={meta.icon} size={18} />
                                    {summary.attention ? (
                                      <span
                                        className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-[#b8892f]"
                                        aria-hidden
                                      />
                                    ) : null}
                                  </span>
                                  <span className="grid min-w-0 flex-1">
                                    <span className="text-[0.9375rem] font-semibold text-ink">{meta.title}</span>
                                    <span
                                      className={`truncate text-[0.8125rem] ${summary.attention ? "font-medium text-warn" : "text-ink-soft"}`}
                                    >
                                      {summary.text}
                                    </span>
                                  </span>
                                  <Icon
                                    name="chevronRight"
                                    size={16}
                                    className="shrink-0 text-ink-soft transition-transform duration-150 group-hover:translate-x-0.5"
                                  />
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  ))}
                </nav>
                {askWhatsapp ? <WhatsappOptin /> : null}
              </div>
            )}
          </div>
        </aside>

        {/* Prévia ao vivo */}
        <div className={`${view === "preview" ? "flex" : "hidden"} min-w-0 flex-1 flex-col bg-bg-2 lg:flex lg:p-4`}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:rounded-xl lg:border lg:border-line lg:shadow-[0_1px_3px_rgb(26_30_21/0.08)]">
            <div className="hidden h-9 shrink-0 items-center justify-center gap-1.5 border-b border-line bg-surface text-[0.8125rem] text-ink-soft lg:flex">
              <Icon name="eye" size={14} />
              Prévia ao vivo
              <span aria-hidden>·</span>
              <span className="truncate">/casamento/{site.slug}</span>
            </div>
            {/* contain:paint faz esta coluna virar containing block: os elementos
                position:fixed dos modelos (navs z-index alto) ficam presos aqui e não
                invadem o painel — sem forçar uma camada de GPU do modelo inteiro. */}
            <div ref={previewRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden contain-[paint]">
              <WeddingTemplatePreview wedding={site} />
            </div>
          </div>
        </div>
      </div>

      {/* Alternância Editar / Prévia (celular e tablet) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+0.875rem)] lg:hidden">
        <div className="pointer-events-auto inline-flex rounded-full border border-white/10 bg-ink p-1 shadow-[0_8px_24px_rgb(26_30_21/0.3)]">
          {(
            [
              { id: "edit", label: "Editar", icon: "edit" },
              { id: "preview", label: "Prévia", icon: "eye" }
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={view === option.id}
              onClick={() => setView(option.id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-forest ${
                view === option.id ? "bg-on-forest text-ink" : "text-on-forest"
              }`}
            >
              <Icon name={option.icon} size={16} />
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  function renderSection(id: SectionId): ReactNode {
    switch (id) {
      case "modelo":
        return (
          <TemplatePicker
            name="editor-template"
            value={site.templateId}
            onChange={(templateId) => patch({ templateId })}
          />
        );

      case "casal":
        return (
          <>
            <TextField label="Nomes do casal" value={site.coupleNames} onChange={(v) => patch({ coupleNames: v })} placeholder="Helena & Lucas" />
            <AreaField
              label="Mensagem de boas-vindas"
              value={site.welcomeText}
              onChange={(v) => patch({ welcomeText: v })}
              rows={5}
            />
            <TextField
              label="Frase do convite"
              hint="Aparece em destaque no topo de alguns modelos."
              value={site.invitationWords.join(" ")}
              onChange={(v) => patch({ invitationWords: v.split(/\s+/).filter(Boolean) })}
            />
          </>
        );

      case "data":
        return (
          <>
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
              <TextField label="Data" type="date" value={dateInputValue(site.weddingDate)} onChange={setWeddingDate} />
              <TextField label="Horário" type="time" value={site.weddingTime} onChange={setWeddingTime} />
            </div>
            <TextField
              label="Como a data aparece no site"
              hint="Preenchido a partir da data. Ajuste se preferir outro formato."
              value={site.weddingDateLabel}
              onChange={(v) => patch({ weddingDateLabel: v })}
              placeholder="5 de dezembro de 2026"
            />
          </>
        );

      case "fotos":
        return (
          <PhotoManager
            templateId={site.templateId}
            heroImage={site.heroImage}
            footerImage={site.footerImage}
            gallery={site.gallery}
            onAddPhotos={addPhotos}
            onRemovePhoto={removePhoto}
            onSetCover={(src) => patch({ heroImage: src })}
            onSetFooter={(src) => patch({ footerImage: src })}
            onReorder={(next) => patch({ gallery: next })}
          />
        );

      case "endereco":
        return <SlugField initialSlug={site.slug} onSaved={(slug) => patch({ slug })} blocked={inSupport} />;

      case "historia":
        return (
          <>
            <TextField label="Chamada da seção" value={site.storyEyebrow} onChange={(v) => patch({ storyEyebrow: v })} placeholder="Nossa história" />
            <TextField label="Título da seção" value={site.storyTitle} onChange={(v) => patch({ storyTitle: v })} />
            <ItemList label="Momentos">
              {site.storyMoments.map((m, i) => (
                <ItemBlock
                  key={m.id}
                  title={m.title || `Momento ${i + 1}`}
                  subtitle={m.headline}
                  defaultOpen={m.id === justAdded}
                  removeLabel="Remover momento"
                  onRemove={() => removeItem("storyMoments", m.id)}
                >
                  <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
                    <TextField label="Número" value={m.number} onChange={(v) => updateItem("storyMoments", m.id, { number: v })} placeholder="01" />
                    <TextField label="Título" value={m.title} onChange={(v) => updateItem("storyMoments", m.id, { title: v })} placeholder="2019" />
                  </div>
                  <TextField label="Destaque" value={m.headline} onChange={(v) => updateItem("storyMoments", m.id, { headline: v })} placeholder="O primeiro encontro" />
                  <AreaField label="Descrição" value={m.description} onChange={(v) => updateItem("storyMoments", m.id, { description: v })} />
                </ItemBlock>
              ))}
            </ItemList>
            <AddButton
              label="Adicionar momento"
              onClick={() =>
                addItem("storyMoments", { id: crypto.randomUUID(), number: "", title: "", headline: "", description: "" })
              }
            />
          </>
        );

      case "locais":
        return (
          <>
            <TextField label="Título da seção" value={site.detailsTitle} onChange={(v) => patch({ detailsTitle: v })} />
            <TextField label="Subtítulo da seção" value={site.detailsSubtitle} onChange={(v) => patch({ detailsSubtitle: v })} />
            <ItemList label="Locais">
              {site.locations.map((l, i) => (
                <ItemBlock
                  key={l.id}
                  title={l.title || `Local ${i + 1}`}
                  subtitle={[l.venue, l.city].filter(Boolean).join(" · ")}
                  defaultOpen={l.id === justAdded || (i === 0 && site.locations.length === 1)}
                  removeLabel={site.locations.length > 1 ? "Remover local" : undefined}
                  onRemove={() => removeItem("locations", l.id)}
                >
                  <TextField label="Nome" hint="Ex.: Cerimônia, Recepção." value={l.title} onChange={(v) => updateItem("locations", l.id, { title: v })} />
                  <TextField label="Espaço" value={l.venue} onChange={(v) => updateItem("locations", l.id, { venue: v })} placeholder="Fazenda Santa Maria" />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField label="Cidade" value={l.city} onChange={(v) => updateItem("locations", l.id, { city: v })} />
                    <TextField label="Endereço" value={l.address ?? ""} onChange={(v) => updateItem("locations", l.id, { address: v })} />
                  </div>
                  <AreaField label="Observação" value={l.note} onChange={(v) => updateItem("locations", l.id, { note: v })} rows={2} />
                  <TextField
                    label="Link do mapa"
                    type="url"
                    hint="Cole o link de compartilhar do Google Maps ou Waze."
                    value={l.mapUrl}
                    onChange={(v) => updateItem("locations", l.id, { mapUrl: v })}
                  />
                </ItemBlock>
              ))}
            </ItemList>
            <AddButton
              label="Adicionar local"
              onClick={() =>
                addItem("locations", {
                  id: crypto.randomUUID(),
                  title: "Novo local",
                  venue: "",
                  city: "",
                  note: "",
                  mapUrl: "",
                  image: site.heroImage
                })
              }
            />
          </>
        );

      case "programacao":
        return (
          <>
            <ItemList label="Itens da programação">
              {site.schedule.map((item, i) => (
                <ItemBlock
                  key={item.id}
                  title={[item.time, item.title].filter(Boolean).join(" · ") || `Item ${i + 1}`}
                  subtitle={item.note}
                  defaultOpen={item.id === justAdded}
                  removeLabel="Remover item"
                  onRemove={() => removeItem("schedule", item.id)}
                >
                  <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
                    <TextField label="Horário" type="time" value={item.time} onChange={(v) => updateItem("schedule", item.id, { time: v })} />
                    <TextField label="O que acontece" value={item.title} onChange={(v) => updateItem("schedule", item.id, { title: v })} placeholder="Cerimônia" />
                  </div>
                  <TextField label="Detalhe (opcional)" value={item.note ?? ""} onChange={(v) => updateItem("schedule", item.id, { note: v })} />
                </ItemBlock>
              ))}
            </ItemList>
            <AddButton
              label="Adicionar item"
              onClick={() => addItem("schedule", { id: crypto.randomUUID(), time: "", title: "", note: "" })}
            />
          </>
        );

      case "cartoes":
        return (
          <>
            <ItemList label="Cartões">
              {site.detailCards.map((c, i) => (
                <ItemBlock
                  key={c.id}
                  title={c.title || `Cartão ${i + 1}`}
                  subtitle={c.active ? c.subtitle : "Oculto no site"}
                  defaultOpen={c.id === justAdded}
                  removeLabel="Remover cartão"
                  onRemove={() => removeItem("detailCards", c.id)}
                >
                  <SwitchField label="Mostrar no site" checked={c.active} onChange={(v) => updateItem("detailCards", c.id, { active: v })} />
                  <SelectField
                    label="Tipo"
                    value={c.type}
                    options={DETAIL_CARD_TYPES}
                    onChange={(v) => updateItem("detailCards", c.id, { type: v as typeof c.type })}
                  />
                  <TextField label="Título" value={c.title} onChange={(v) => updateItem("detailCards", c.id, { title: v })} placeholder="Traje" />
                  <TextField label="Subtítulo" value={c.subtitle} onChange={(v) => updateItem("detailCards", c.id, { subtitle: v })} placeholder="Esporte fino" />
                  <AreaField label="Texto" value={c.body} onChange={(v) => updateItem("detailCards", c.id, { body: v })} />
                </ItemBlock>
              ))}
            </ItemList>
            <AddButton
              label="Adicionar cartão"
              onClick={() =>
                addItem("detailCards", {
                  id: crypto.randomUUID(),
                  type: "custom",
                  title: "Novo cartão",
                  subtitle: "",
                  image: site.heroImage,
                  body: "",
                  active: true
                })
              }
            />
          </>
        );

      case "rsvp":
        return (
          <>
            <SwitchField
              label="Mostrar a confirmação no site"
              hint="Só quem está na sua lista de convidados consegue confirmar."
              checked={site.rsvp.enabled}
              onChange={(v) => patch({ rsvp: { ...site.rsvp, enabled: v } })}
            />
            <SwitchField
              label="Permitir acompanhantes"
              checked={site.rsvp.allowCompanions}
              onChange={(v) => patch({ rsvp: { ...site.rsvp, allowCompanions: v } })}
            />
            <TextField label="Título" value={site.rsvp.title} onChange={(v) => patch({ rsvp: { ...site.rsvp, title: v } })} />
            <TextField label="Subtítulo" value={site.rsvp.subtitle} onChange={(v) => patch({ rsvp: { ...site.rsvp, subtitle: v } })} />
            <AreaField
              label="Mensagem depois de confirmar"
              value={site.rsvp.successMessage}
              onChange={(v) => patch({ rsvp: { ...site.rsvp, successMessage: v } })}
              rows={2}
            />
            <Link href="/convidados" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
              Gerenciar a lista de convidados
              <Icon name="chevronRight" size={15} />
            </Link>
          </>
        );

      case "encerramento":
        return (
          <>
            <AreaField label="Mensagem final" value={site.finalText} onChange={(v) => patch({ finalText: v })} rows={4} />
            <TextField label="Texto do rodapé" value={site.footerText} onChange={(v) => patch({ footerText: v })} />
          </>
        );

      case "pix": {
        const keyType = PIX_KEY_TYPES.find((t) => t.id === site.pixKeyType) ?? PIX_KEY_TYPES[0];
        // Modo suporte: Pix é dinheiro — só leitura (o servidor recusa qualquer troca).
        if (inSupport) {
          return (
            <>
              <dl className="grid gap-3 text-[0.9375rem] text-ink">
                <div>
                  <dt className="text-sm text-ink-soft">Chave Pix{site.pixKey ? ` (${keyType.label})` : ""}</dt>
                  <dd className="font-medium break-all">{site.pixKey || "Não cadastrada"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink-soft">Nome do titular</dt>
                  <dd className="font-medium">{site.pixHolderName || "Não informado"}</dd>
                </div>
              </dl>
              <SupportBlockedNote />
            </>
          );
        }
        return (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink">Tipo da chave</legend>
              <div className="flex flex-wrap gap-1.5">
                {PIX_KEY_TYPES.map((t) => (
                  <label
                    key={t.id}
                    className="cursor-pointer rounded-full border border-line-strong bg-field px-3 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:border-forest/50 has-checked:border-forest has-checked:bg-forest has-checked:text-on-forest has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest"
                  >
                    <input
                      type="radio"
                      name="pix-key-type"
                      value={t.id}
                      checked={site.pixKeyType === t.id}
                      onChange={() => patch({ pixKeyType: t.id })}
                      className="sr-only"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextField
              label="Chave Pix"
              value={site.pixKey}
              onChange={(v) => patch({ pixKey: v })}
              placeholder={keyType.placeholder}
            />
            <TextField
              label="Nome do titular"
              hint="Aparece para o convidado conferir antes de pagar."
              value={site.pixHolderName}
              onChange={(v) => patch({ pixHolderName: v })}
            />
            <Link href="/presentes" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
              Criar as cotas de presente
              <Icon name="chevronRight" size={15} />
            </Link>
          </>
        );
      }

      case "compartilhar":
        return (
          <>
            <TextField
              label="Título"
              hint={`${site.seo.title.length} caracteres · o ideal é até 60`}
              value={site.seo.title}
              onChange={(v) => patch({ seo: { ...site.seo, title: v } })}
            />
            <AreaField
              label="Descrição"
              hint={`${site.seo.description.length} caracteres · o ideal é até 155`}
              value={site.seo.description}
              onChange={(v) => patch({ seo: { ...site.seo, description: v } })}
              rows={3}
            />
            <div className="overflow-hidden rounded-lg border border-line bg-field">
              <p className="border-b border-line px-3.5 py-2 text-[0.8125rem] text-ink-soft">Como aparece no WhatsApp</p>
              <div className="grid gap-0.5 px-3.5 py-3">
                <p className="line-clamp-2 text-sm font-semibold text-ink">{site.seo.title || site.coupleNames}</p>
                <p className="line-clamp-2 text-[0.8125rem] leading-5 text-ink-soft">{site.seo.description}</p>
              </div>
            </div>
          </>
        );
    }
  }
}

/* ---------- publicação e conta ---------- */

/**
 * "Pronto para publicar: 3 de 4" (só os obrigatórios contam; Pix aparece como
 * recomendado). Cada pendência abre a seção que resolve. Orienta, nunca bloqueia.
 */
function ReadinessMeter({
  site,
  onOpen,
  blocked
}: {
  site: WeddingSite;
  onOpen: (id: SectionId) => void;
  /** Modo suporte: "Publicar" desativado. */
  blocked: boolean;
}) {
  const { items, ready, doneCount: done, requiredCount } = getPublishReadiness(site);
  const pending = items.filter((item) => !item.done);

  return (
    <section aria-label="Pronto para publicar" className="mx-3 mt-3 rounded-lg border border-line bg-bg/60 px-3.5 py-3">
      <p className="text-sm font-semibold text-ink">
        Pronto para publicar: <span className="tabular-nums">{done} de {requiredCount}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-forest/12" aria-hidden>
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: `${(done / requiredCount) * 100}%` }}
        />
      </div>

      {ready ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-md bg-forest py-2 pl-3 pr-2 text-on-forest">
          <Icon name="check" size={16} strokeWidth={2.4} className="shrink-0" />
          <p className="min-w-0 flex-1 text-[0.8125rem] font-medium leading-5">
            Tudo pronto. Os convidados já podem receber o link.
          </p>
          {blocked ? (
            <SupportBlockedButton className="btn btn-sm btn-inverse shrink-0 px-3.5">Publicar</SupportBlockedButton>
          ) : (
            <Link href="/publicar" className="btn btn-sm btn-inverse shrink-0 px-3.5">
              Publicar
            </Link>
          )}
        </div>
      ) : null}

      {pending.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="O que falta">
          {pending.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item.section)}
                className="group inline-flex min-h-9 items-center gap-1 rounded-full border border-line-strong bg-field pl-3 pr-2 text-[0.8125rem] font-medium text-ink transition-colors duration-150 hover:border-forest/50 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
              >
                {item.label}
                {item.optional ? <span className="text-ink-soft">· recomendado</span> : null}
                <Icon
                  name="chevronRight"
                  size={14}
                  className="shrink-0 text-ink-soft transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const noSubscribe = () => () => {};
function readOptinDismissed(): boolean {
  try {
    return localStorage.getItem(WHATSAPP_OPTIN_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * WhatsApp opcional na conta, para o suporte. Dispensável (lembrado neste navegador).
 * ponytail: só contato de suporte; não existe aviso automático por WhatsApp — se um
 * dia existir, mude o texto antes de prometer.
 */
function WhatsappOptin() {
  // No servidor e na hidratação fica escondido; aparece depois, se não foi dispensado.
  const storedDismissed = useSyncExternalStore(noSubscribe, readOptinDismissed, () => true);
  const [closed, setClosed] = useState(false);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  if (closed || storedDismissed) return null;

  function dismiss() {
    setClosed(true);
    try {
      localStorage.setItem(WHATSAPP_OPTIN_DISMISSED_KEY, "1");
    } catch {
      // Sem storage (aba anônima, bloqueio): some só nesta visita.
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      const res = await saveWhatsappAction(value);
      setStatus(res.ok ? "saved" : "error");
      if (!res.ok) setError(res.error ?? "Não foi possível salvar o número.");
    } catch {
      setStatus("error");
      setError("Falha de conexão. Tente novamente.");
    }
  }

  return (
    <section
      aria-labelledby="whatsapp-optin-titulo"
      className="relative mx-3 rounded-lg border border-line bg-bg/60 px-3.5 pb-3.5 pt-3"
    >
      <button type="button" onClick={dismiss} className="icon-btn absolute right-1 top-1 size-9" aria-label="Dispensar">
        <Icon name="x" size={16} />
      </button>
      <h2 id="whatsapp-optin-titulo" className="flex items-center gap-2 pr-9 text-sm font-semibold text-ink">
        <Icon name="whatsapp" size={17} className="shrink-0 text-forest" />
        Ajuda pelo WhatsApp
      </h2>
      <p className="mt-1 pr-6 text-[0.8125rem] leading-5 text-ink-soft">
        Quer ajuda da nossa equipe pelo WhatsApp com o site? Deixe seu número. Opcional, sem spam.
      </p>

      {status === "saved" ? (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-forest">
          <Icon name="check" size={16} strokeWidth={2.2} />
          Número salvo. Obrigado!
        </p>
      ) : (
        <form onSubmit={save} className="mt-3 grid gap-1.5">
          <label htmlFor="whatsapp-optin" className="text-sm font-medium text-ink">
            WhatsApp com DDD
          </label>
          <div className="flex gap-2">
            <input
              id="whatsapp-optin"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 91234-5678"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "whatsapp-optin-erro" : undefined}
              className="field min-w-0 flex-1"
            />
            <button
              type="submit"
              disabled={status === "saving" || !value.trim()}
              className="btn btn-sm btn-primary min-h-11 shrink-0 disabled:opacity-50"
            >
              {status === "saving" ? "Salvando…" : "Salvar"}
            </button>
          </div>
          {error ? (
            <p id="whatsapp-optin-erro" role="alert" className="text-[0.8125rem] font-medium leading-5 text-danger">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}

/* ---------- campos ---------- */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: "text" | "date" | "time" | "url";
}) {
  const id = useId();
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] leading-5 text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="field"
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] leading-5 text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SwitchField({
  label,
  hint,
  checked,
  onChange
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-field px-3.5 py-3">
      <label htmlFor={id} className="grid cursor-pointer gap-0.5">
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="text-[0.8125rem] leading-5 text-ink-soft">{hint}</span> : null}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="switch"
      />
    </div>
  );
}

function ItemList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function ItemBlock({
  title,
  subtitle,
  defaultOpen,
  removeLabel,
  onRemove,
  children
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Sem rótulo, o item não pode ser removido. */
  removeLabel?: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-lg border border-line bg-field transition-colors duration-150 open:border-line-strong">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-3.5 py-3 focus-visible:outline-2 focus-visible:outline-forest [&::-webkit-details-marker]:hidden">
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold text-ink">{title}</span>
          {subtitle ? <span className="truncate text-[0.8125rem] text-ink-soft">{subtitle}</span> : null}
        </span>
        <Icon name="chevronDown" size={16} className="shrink-0 text-ink-soft transition-transform duration-150 group-open:rotate-180" />
      </summary>
      <div className="grid gap-4 border-t border-line px-3.5 pb-3 pt-4">
        {children}
        {removeLabel ? (
          <button type="button" onClick={onRemove} className="btn btn-sm btn-ghost -ml-2.5 justify-self-start px-2.5 text-danger">
            <Icon name="trash" size={16} />
            {removeLabel}
          </button>
        ) : null}
      </div>
    </details>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-sm font-semibold text-ink-soft transition-colors duration-150 hover:border-forest/50 hover:bg-field hover:text-ink focus-visible:outline-2 focus-visible:outline-forest"
    >
      <Icon name="plus" size={16} />
      {label}
    </button>
  );
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger">
        <Icon name="alert" size={16} className="shrink-0" />
        <span className="max-sm:sr-only">Não salvou</span>
        <button type="button" onClick={onRetry} className="rounded-full px-2 py-1.5 underline underline-offset-2 hover:bg-danger/8">
          Tentar de novo
        </button>
      </span>
    );
  }
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1.5 px-1 text-sm text-ink-soft">
      {status === "saving" ? (
        <>
          <span className="size-2 animate-pulse rounded-full bg-[#b8892f] motion-reduce:animate-none" aria-hidden />
          Salvando…
        </>
      ) : (
        <>
          <Icon name="check" size={15} className="text-forest" strokeWidth={2.2} />
          <span className="max-sm:sr-only">{status === "saved" ? "Alterações salvas" : "Tudo salvo"}</span>
        </>
      )}
    </span>
  );
}

/**
 * Editor do slug público. Fora do auto-save: mudar a URL é único, quebra links
 * antigos e precisa de validação/feedback próprios (updateSlugAction). Mostra em
 * tempo real o slug que o texto vai virar e só habilita "Salvar" quando muda e é
 * válido. No sucesso, sobe o novo slug pro pai (link de prévia + estado).
 */
function SlugField({
  initialSlug,
  onSaved,
  blocked
}: {
  initialSlug: string;
  onSaved: (slug: string) => void;
  /** Modo suporte: o endereço público é do casal; "Salvar endereço" desativado. */
  blocked: boolean;
}) {
  const [value, setValue] = useState(initialSlug);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const preview = slugify(value);
  const changed = preview !== initialSlug;
  const valid = isValidSlug(preview);

  async function save() {
    setStatus("saving");
    setMessage(null);
    try {
      const res = await updateSlugAction(value);
      if (res.ok && res.slug) {
        setValue(res.slug);
        onSaved(res.slug);
        setStatus("saved");
        setMessage("Endereço atualizado.");
      } else {
        setStatus("error");
        setMessage(res.error ?? "Não foi possível salvar o endereço.");
      }
    } catch {
      setStatus("error");
      setMessage("Falha de conexão. Tente novamente.");
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <label htmlFor="slug-input" className="text-sm font-medium text-ink">
          Endereço
        </label>
        <div className="flex items-center rounded-[0.625rem] border border-line-strong bg-field transition-colors duration-150 focus-within:border-forest focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-forest)_18%,transparent)]">
          <span className="whitespace-nowrap pl-3 text-[0.9375rem] text-ink-soft">/casamento/</span>
          <input
            id="slug-input"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setStatus("idle");
              setMessage(null);
            }}
            placeholder="helena-e-lucas"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-describedby="slug-hint"
            aria-invalid={changed && !valid ? true : undefined}
            className="min-h-11 min-w-0 flex-1 bg-transparent py-2 pl-0.5 pr-3 text-[0.9375rem] text-ink outline-none"
          />
        </div>
        {changed && preview !== value ? (
          <p className="text-[0.8125rem] text-ink-soft">
            Vai ficar: <span className="font-semibold text-ink">/casamento/{preview || "—"}</span>
          </p>
        ) : null}
        <p id="slug-hint" className="text-[0.8125rem] leading-5 text-ink-soft">
          Letras, números e hífens, sem acento.
        </p>
      </div>

      {changed ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-warn/20 bg-warn-soft/60 px-3.5 py-3 text-[0.8125rem] leading-5 text-warn">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          Links já enviados com o endereço antigo vão parar de funcionar.
        </div>
      ) : null}

      {blocked ? (
        <div className="grid justify-items-start gap-2">
          <SupportBlockedButton className="btn btn-sm btn-primary">Salvar endereço</SupportBlockedButton>
          <SupportBlockedNote />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={status === "saving" || !changed || !valid}
            className="btn btn-sm btn-primary disabled:opacity-50"
          >
            {status === "saving" ? "Salvando…" : "Salvar endereço"}
          </button>
          {message ? (
            <span role={status === "error" ? "alert" : "status"} className={`text-sm font-medium ${status === "error" ? "text-danger" : "text-forest"}`}>
              {message}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";
import { WeddingTemplatePreview } from "@/components/templates/WeddingTemplatePreview";
import { romanticImages } from "@/lib/demo-wedding";
import { isValidSlug, slugify } from "@/lib/slug";
import { PhotoManager } from "./PhotoManager";
import { autosaveWeddingAction } from "./autosave-action";
import { updateSlugAction } from "./slug-action";

const TEMPLATE_OPTIONS: { id: WeddingSite["templateId"]; label: string }[] = [
  { id: "cinema-noir", label: "Cinema Noir" },
  { id: "editorial-luxury", label: "Editorial Luxury" },
  { id: "jardim-romantico", label: "Jardim Romântico" },
  { id: "classico-romantico", label: "Clássico Romântico" },
  { id: "civil-minimalista", label: "Civil Minimalista" },
  { id: "garden-classico", label: "Jardim Clássico" }
];

const PIX_KEY_TYPES: { id: WeddingSite["pixKeyType"]; label: string }[] = [
  { id: "email", label: "E-mail" },
  { id: "cpf", label: "CPF" },
  { id: "cnpj", label: "CNPJ" },
  { id: "phone", label: "Telefone" },
  { id: "random", label: "Aleatória" }
];

const DETAIL_CARD_TYPES: { id: WeddingSite["detailCards"][number]["type"]; label: string }[] = [
  { id: "location", label: "Local" },
  { id: "gifts", label: "Presentes" },
  { id: "menu", label: "Menu" },
  { id: "custom", label: "Personalizado" }
];

/** Modelos que renderizam a programação do dia (nos demais o campo não aparece). */
const TEMPLATES_WITH_SCHEDULE = new Set<WeddingSite["templateId"]>([
  "cinema-noir",
  "editorial-luxury",
  "jardim-romantico",
  "garden-classico"
]);

const labelClass = "grid gap-1.5 text-sm font-bold text-ink-soft";
const fieldClass = "min-h-11 rounded-xl border border-[#5b6842]/14 bg-white px-3 text-ink";
const areaClass = "rounded-xl border border-[#5b6842]/14 bg-white p-3 text-ink";

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

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function LiveEditor({ initial }: { initial: WeddingSite }) {
  const [site, setSite] = useState<WeddingSite>(initial);
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const previewRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef(site);
  const savingRef = useRef(false);
  const savedRef = useRef<WeddingSite>(initial);

  // Mantém a referência da versão mais nova para o auto-save (sem mutar ref no render).
  useEffect(() => {
    siteRef.current = site;
  });

  // No editor, mostra os blocos de scroll-reveal na hora (sem depender do scroll).
  useEffect(() => {
    previewRef.current?.querySelectorAll("[data-reveal]").forEach((n) => n.setAttribute("data-shown", "true"));
  }, [site.templateId, site.gallery.length, open]);

  // Auto-save com debounce + single-flight: um save por vez; edições feitas durante
  // um save em voo são persistidas em seguida, em ordem — um save antigo nunca
  // sobrescreve um estado mais novo, e nada é salvo no mount inicial.
  useEffect(() => {
    if (siteRef.current === savedRef.current) return;
    const timer = setTimeout(save, 800);
    return () => clearTimeout(timer);

    async function save() {
      if (savingRef.current) return;
      savingRef.current = true;
      setStatus("saving");
      try {
        let toSave = siteRef.current;
        let res = await autosaveWeddingAction(toSave);
        savedRef.current = toSave;
        while (res.ok && siteRef.current !== savedRef.current) {
          toSave = siteRef.current;
          res = await autosaveWeddingAction(toSave);
          savedRef.current = toSave;
        }
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      } finally {
        savingRef.current = false;
      }
    }
  }, [site]);

  function patch(p: Partial<WeddingSite>) {
    setSite((s) => ({ ...s, ...p }));
  }

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

  // --- momentos da história ---
  const updateMoment = (id: string, p: Partial<WeddingSite["storyMoments"][number]>) =>
    setSite((s) => ({ ...s, storyMoments: s.storyMoments.map((m) => (m.id === id ? { ...m, ...p } : m)) }));
  const addMoment = () =>
    setSite((s) => ({
      ...s,
      storyMoments: [...s.storyMoments, { id: crypto.randomUUID(), number: "", title: "", headline: "", description: "" }]
    }));
  const removeMoment = (id: string) =>
    setSite((s) => ({ ...s, storyMoments: s.storyMoments.filter((m) => m.id !== id) }));

  // --- locais ---
  const updateLocation = (id: string, p: Partial<WeddingSite["locations"][number]>) =>
    setSite((s) => ({ ...s, locations: s.locations.map((l) => (l.id === id ? { ...l, ...p } : l)) }));
  const addLocation = () =>
    setSite((s) => ({
      ...s,
      locations: [
        ...s.locations,
        { id: crypto.randomUUID(), title: "Novo local", venue: "", city: "", note: "", mapUrl: "", image: s.heroImage }
      ]
    }));
  const removeLocation = (id: string) =>
    // Mantém ao menos 1 local: os modelos leem locations[0] para a seção de local.
    setSite((s) => (s.locations.length <= 1 ? s : { ...s, locations: s.locations.filter((l) => l.id !== id) }));

  // --- cards de detalhe ---
  const updateCard = (id: string, p: Partial<WeddingSite["detailCards"][number]>) =>
    setSite((s) => ({ ...s, detailCards: s.detailCards.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const addCard = () =>
    setSite((s) => ({
      ...s,
      detailCards: [
        ...s.detailCards,
        { id: crypto.randomUUID(), type: "custom", title: "Novo cartão", subtitle: "", image: s.heroImage, body: "", active: true }
      ]
    }));
  const removeCard = (id: string) =>
    setSite((s) => ({ ...s, detailCards: s.detailCards.filter((c) => c.id !== id) }));

  // --- programação do dia ---
  const updateScheduleItem = (id: string, p: Partial<WeddingSite["schedule"][number]>) =>
    setSite((s) => ({ ...s, schedule: s.schedule.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  const addScheduleItem = () =>
    setSite((s) => ({ ...s, schedule: [...s.schedule, { id: crypto.randomUUID(), time: "", title: "", note: "" }] }));
  const removeScheduleItem = (id: string) =>
    setSite((s) => ({ ...s, schedule: s.schedule.filter((x) => x.id !== id) }));

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg">
      {open ? (
        <aside className="relative z-[1000] flex w-[min(92vw,384px)] shrink-0 flex-col border-r border-[#5b6842]/14 bg-bg">
          <header className="grid gap-3 border-b border-[#5b6842]/14 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#5b6842]/25 bg-white px-3.5 py-2 text-sm font-bold text-forest transition hover:border-forest hover:shadow-sm"
              >
                ‹ Voltar ao painel
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[#5b6842]/20 px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:text-ink"
              >
                Ocultar
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="t-eyebrow text-ink-soft">Editor do site</p>
              <SaveBadge status={status} />
            </div>
          </header>

          <div className="grid content-start gap-4 overflow-y-auto px-5 py-6">
            {/* Modelo — sempre visível */}
            <label className={`${labelClass} rounded-2xl border border-[#5b6842]/14 bg-white/60 p-3`}>
              Modelo do site
              <select
                value={site.templateId}
                onChange={(e) => patch({ templateId: e.target.value as WeddingSite["templateId"] })}
                className={fieldClass}
              >
                {TEMPLATE_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-ink-soft">Troca na hora — seus textos e fotos são mantidos.</span>
            </label>

            <Group title="Endereço do site (URL)">
              <SlugField initialSlug={site.slug} onSaved={(slug) => patch({ slug })} />
            </Group>

            <Group title="Identidade" open>
              <TextField label="Nomes do casal" value={site.coupleNames} onChange={(v) => patch({ coupleNames: v })} />
              <AreaField label="Mensagem principal" value={site.welcomeText} onChange={(v) => patch({ welcomeText: v })} rows={4} />
              <TextField
                label="Palavras do convite (separadas por espaço)"
                value={site.invitationWords.join(" ")}
                onChange={(v) => patch({ invitationWords: v.split(/\s+/).filter(Boolean) })}
              />
            </Group>

            <Group title="Data e horário">
              <label className={labelClass}>
                Data do casamento
                <input
                  type="date"
                  value={dateInputValue(site.weddingDate)}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <TextField label="Horário" value={site.weddingTime} onChange={setWeddingTime} placeholder="16:30" />
              <TextField
                label="Data (como aparece no site)"
                value={site.weddingDateLabel}
                onChange={(v) => patch({ weddingDateLabel: v })}
                placeholder="5 de dezembro de 2026"
              />
            </Group>

            <Group title="Fotos">
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
            </Group>

            <Group title="Nossa história">
              <TextField label="Rótulo (eyebrow)" value={site.storyEyebrow} onChange={(v) => patch({ storyEyebrow: v })} />
              <TextField label="Título" value={site.storyTitle} onChange={(v) => patch({ storyTitle: v })} />
              {site.storyMoments.map((m, i) => (
                <ItemCard key={m.id} title={`Momento ${i + 1}`} onRemove={() => removeMoment(m.id)}>
                  <TextField label="Número" value={m.number} onChange={(v) => updateMoment(m.id, { number: v })} />
                  <TextField label="Título" value={m.title} onChange={(v) => updateMoment(m.id, { title: v })} />
                  <TextField label="Destaque" value={m.headline} onChange={(v) => updateMoment(m.id, { headline: v })} />
                  <AreaField label="Descrição" value={m.description} onChange={(v) => updateMoment(m.id, { description: v })} />
                </ItemCard>
              ))}
              <AddButton label="Adicionar momento" onClick={addMoment} />
            </Group>

            <Group title="Detalhes e locais">
              <TextField label="Título da seção" value={site.detailsTitle} onChange={(v) => patch({ detailsTitle: v })} />
              <TextField label="Subtítulo" value={site.detailsSubtitle} onChange={(v) => patch({ detailsSubtitle: v })} />
              {site.locations.map((l, i) => (
                <ItemCard key={l.id} title={`Local ${i + 1}`} onRemove={() => removeLocation(l.id)}>
                  <TextField label="Nome/rótulo" value={l.title} onChange={(v) => updateLocation(l.id, { title: v })} />
                  <TextField label="Espaço/venue" value={l.venue} onChange={(v) => updateLocation(l.id, { venue: v })} />
                  <TextField label="Cidade" value={l.city} onChange={(v) => updateLocation(l.id, { city: v })} />
                  <TextField label="Endereço" value={l.address ?? ""} onChange={(v) => updateLocation(l.id, { address: v })} />
                  <AreaField label="Observação" value={l.note} onChange={(v) => updateLocation(l.id, { note: v })} rows={2} />
                  <TextField label="Link do mapa" value={l.mapUrl} onChange={(v) => updateLocation(l.id, { mapUrl: v })} />
                </ItemCard>
              ))}
              <AddButton label="Adicionar local" onClick={addLocation} />
            </Group>

            {TEMPLATES_WITH_SCHEDULE.has(site.templateId) ? (
              <Group title="Programação do dia">
                {site.schedule.map((item, i) => (
                  <ItemCard key={item.id} title={`Item ${i + 1}`} onRemove={() => removeScheduleItem(item.id)}>
                    <TextField
                      label="Horário"
                      value={item.time}
                      onChange={(v) => updateScheduleItem(item.id, { time: v })}
                      placeholder="17:30"
                    />
                    <TextField
                      label="Título"
                      value={item.title}
                      onChange={(v) => updateScheduleItem(item.id, { title: v })}
                    />
                    <TextField
                      label="Detalhe (opcional)"
                      value={item.note ?? ""}
                      onChange={(v) => updateScheduleItem(item.id, { note: v })}
                    />
                  </ItemCard>
                ))}
                <AddButton label="Adicionar item" onClick={addScheduleItem} />
              </Group>
            ) : null}

            <Group title="Cartões de detalhe">
              {site.detailCards.map((c, i) => (
                  <ItemCard key={c.id} title={`Cartão ${i + 1}`} onRemove={() => removeCard(c.id)}>
                    <label className={labelClass}>
                      Tipo
                      <select
                        value={c.type}
                        onChange={(e) => updateCard(c.id, { type: e.target.value as typeof c.type })}
                        className={fieldClass}
                      >
                        {DETAIL_CARD_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TextField label="Título" value={c.title} onChange={(v) => updateCard(c.id, { title: v })} />
                    <TextField label="Subtítulo" value={c.subtitle} onChange={(v) => updateCard(c.id, { subtitle: v })} />
                    <AreaField label="Texto" value={c.body} onChange={(v) => updateCard(c.id, { body: v })} />
                    <Toggle label="Ativo" checked={c.active} onChange={(v) => updateCard(c.id, { active: v })} />
                  </ItemCard>
                ))}
              <AddButton label="Adicionar cartão" onClick={addCard} />
            </Group>

            <Group title="Confirmação de presença (RSVP)">
              <Toggle label="Mostrar seção de RSVP" checked={site.rsvp.enabled} onChange={(v) => patch({ rsvp: { ...site.rsvp, enabled: v } })} />
              <TextField label="Título" value={site.rsvp.title} onChange={(v) => patch({ rsvp: { ...site.rsvp, title: v } })} />
              <TextField label="Subtítulo" value={site.rsvp.subtitle} onChange={(v) => patch({ rsvp: { ...site.rsvp, subtitle: v } })} />
              <AreaField
                label="Mensagem de sucesso"
                value={site.rsvp.successMessage}
                onChange={(v) => patch({ rsvp: { ...site.rsvp, successMessage: v } })}
                rows={2}
              />
              <Toggle
                label="Permitir acompanhantes"
                checked={site.rsvp.allowCompanions}
                onChange={(v) => patch({ rsvp: { ...site.rsvp, allowCompanions: v } })}
              />
            </Group>

            <Group title="Encerramento">
              <AreaField label="Texto final" value={site.finalText} onChange={(v) => patch({ finalText: v })} rows={3} />
              <TextField label="Rodapé" value={site.footerText} onChange={(v) => patch({ footerText: v })} />
            </Group>

            <Group title="Presentes em dinheiro (Pix)">
              <p className="text-xs leading-5 text-ink-soft">
                Os presentes caem 100% na sua chave Pix, sem intermediação da plataforma.
              </p>
              <TextField label="Chave Pix" value={site.pixKey} onChange={(v) => patch({ pixKey: v })} />
              <label className={labelClass}>
                Tipo da chave
                <select
                  value={site.pixKeyType}
                  onChange={(e) => patch({ pixKeyType: e.target.value as WeddingSite["pixKeyType"] })}
                  className={fieldClass}
                >
                  {PIX_KEY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <TextField label="Nome do titular" value={site.pixHolderName} onChange={(v) => patch({ pixHolderName: v })} />
            </Group>

            <Group title="SEO e compartilhamento">
              <TextField label="Título" value={site.seo.title} onChange={(v) => patch({ seo: { ...site.seo, title: v } })} />
              <AreaField
                label="Descrição"
                value={site.seo.description}
                onChange={(v) => patch({ seo: { ...site.seo, description: v } })}
                rows={2}
              />
            </Group>

            <Link href={`/casamento/${site.slug}`} target="_blank" className="btn btn-secondary text-sm">
              Abrir prévia pública ↗
            </Link>
          </div>
        </aside>
      ) : null}

      {/* contain:paint faz esta coluna virar containing block: os elementos
          position:fixed dos modelos (navs z-index alto) ficam presos aqui e não
          invadem a sidebar — sem forçar uma camada de GPU do modelo inteiro. */}
      <div ref={previewRef} className="h-dvh flex-1 overflow-y-auto overflow-x-hidden [contain:paint]">
        <WeddingTemplatePreview wedding={site} />
      </div>

      {!open ? (
        <div className="fixed bottom-5 right-5 z-[1000] flex items-center gap-2">
          <Link href="/dashboard" className="btn btn-secondary bg-white text-sm shadow-lg">
            ‹ Painel
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-primary text-sm shadow-lg"
          >
            Editar site
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Group({ title, children, open }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-[#5b6842]/14 pb-4">
      <summary className="t-eyebrow flex cursor-pointer list-none items-center justify-between py-1 text-ink-soft">
        {title}
        <span className="text-ink-soft transition group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-4 grid gap-4">{children}</div>
    </details>
  );
}

/**
 * Editor do slug público. Fora do auto-save: mudar a URL é único, quebra links
 * antigos e precisa de validação/feedback próprios (updateSlugAction). Mostra em
 * tempo real o slug que o texto vai virar e só habilita "Salvar" quando muda e é
 * válido. No sucesso, sobe o novo slug pro pai (link de prévia + estado).
 */
function SlugField({ initialSlug, onSaved }: { initialSlug: string; onSaved: (slug: string) => void }) {
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
        setMessage("URL atualizada.");
      } else {
        setStatus("error");
        setMessage(res.error ?? "Não foi possível salvar a URL.");
      }
    } catch {
      setStatus("error");
      setMessage("Falha de conexão. Tente novamente.");
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center overflow-hidden rounded-xl border border-[#5b6842]/14 bg-white">
        <span className="whitespace-nowrap pl-3 text-sm text-ink-soft">/casamento/</span>
        <input
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
          aria-label="Endereço do site (URL)"
          className="min-h-11 flex-1 border-0 bg-transparent px-1 pr-3 text-ink outline-none"
        />
      </div>
      {changed && preview !== value ? (
        <p className="text-xs text-ink-soft">
          Vai virar: <span className="font-bold text-ink">/casamento/{preview || "—"}</span>
        </p>
      ) : null}
      <p className="text-xs leading-5 text-ink-soft">
        Letras, números e hífens, sem acento. Mudar a URL quebra links já compartilhados.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={status === "saving" || !changed || !valid}
          className="rounded-full bg-forest px-4 py-2 text-sm font-black text-on-forest transition enabled:hover:brightness-110 disabled:opacity-50"
        >
          {status === "saving" ? "Salvando…" : "Salvar URL"}
        </button>
        {message ? (
          <span className={`text-xs font-bold ${status === "error" ? "text-[#8d3d33]" : "text-forest"}`}>
            {message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={areaClass} />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-ink-soft">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-forest" />
      {label}
    </label>
  );
}

function ItemCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[#5b6842]/14 bg-white/50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink-soft">{title}</span>
        <button type="button" onClick={onRemove} className="text-xs font-bold text-[#8d3d33] hover:underline">
          Remover
        </button>
      </div>
      {children}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-dashed border-[#5b6842]/30 py-2.5 text-sm font-bold text-ink-soft transition hover:border-forest hover:text-ink"
    >
      + {label}
    </button>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { text: string; className: string }> = {
    idle: { text: "Tudo salvo", className: "text-ink-soft" },
    saving: { text: "Salvando…", className: "text-ink-soft" },
    saved: { text: "Salvo ✓", className: "text-forest" },
    error: { text: "Erro ao salvar", className: "text-[#8d3d33]" }
  };
  const s = map[status];
  return <span className={`text-xs font-bold ${s.className}`}>{s.text}</span>;
}

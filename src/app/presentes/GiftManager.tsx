"use client";

import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type DragEvent,
  type FormEvent
} from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/app/icons";
import { ImageAdjuster } from "@/components/app/ImageAdjuster";
import { Notice } from "@/components/app/Notice";
import { SubmitButton } from "@/components/app/SubmitButton";
import { SupportBlockedButton } from "@/components/app/SupportBar";
import {
  DEFAULT_GIFT_FRAMING,
  GIFT_ASPECT_BY_TEMPLATE,
  GIFT_BACKDROP_STYLE,
  giftImageStyle,
  normalizeGiftImage,
  type GiftImageFraming
} from "@/lib/gift-image";
import type { WeddingGift, WeddingSite } from "@/types/wedding";
import {
  addGiftAction,
  removeGiftAction,
  toggleGiftAction,
  updateGiftDetailsAction,
  updateGiftImageAction,
  type GiftActionState
} from "./actions";

const initial: GiftActionState = {};
const labelText = "text-sm font-medium text-ink";
const optional = <span className="font-normal text-ink-soft"> (opcional)</span>;

const BUCKET = "wedding-photos";
const MAX_BYTES = 8 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

type GiftExtraction = { title?: string; price?: string | null; image?: string | null; error?: string };
type ImportStatus = { kind: "busy" } | { kind: "ok"; text: string; photo: boolean } | { kind: "error"; text: string };
type TemplateId = WeddingSite["templateId"];

/** Envio de foto para o storage do casal (pasta do dono) — usado na nova cota e no "Ajustar foto". */
function useGiftUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function upload(file: File | undefined): Promise<string | null> {
    if (!file) return null;
    setUploadError("");
    if (!EXT[file.type]) {
      setUploadError("Use JPG, PNG, WEBP ou AVIF.");
      return null;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Imagem acima de 8 MB.");
      return null;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadError("Sessão expirada. Recarregue a página.");
        return null;
      }
      const path = `${user.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (error) {
        setUploadError("Falha ao enviar a imagem. Tente novamente.");
        return null;
      }
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, uploadError, setUploadError, upload };
}

/** <input type="file"> escondido dentro de um <label> estilizado como botão. */
function PhotoInput({ disabled, onFile }: { disabled: boolean; onFile: (file: File | undefined) => void }) {
  return (
    <input
      type="file"
      accept={ACCEPT}
      className="sr-only"
      disabled={disabled}
      onChange={(event) => {
        onFile(event.target.files?.[0]);
        event.target.value = "";
      }}
    />
  );
}

/**
 * Imagem vinda do Ctrl/Cmd+V (ex.: "Copiar imagem" na página da loja). Só age se o
 * clipboard tiver um arquivo de imagem — texto colado num campo segue o fluxo normal.
 */
function pastedImage(event: { clipboardData: DataTransfer | null; target: EventTarget | null }): File | undefined {
  const data = event.clipboardData;
  if (!data) return undefined;
  const inTextField =
    event.target instanceof Element && event.target.closest("input:not([type=file]), textarea, [contenteditable]");
  if (inTextField && data.types.includes("text/plain")) return undefined;
  return Array.from(data.files).find((file) => file.type.startsWith("image/"));
}

/** Arrastar e soltar um arquivo sobre a área da foto; a validação de tipo/tamanho fica no upload. */
function useFileDrop(onFile: (file: File | undefined) => void, disabled: boolean) {
  const [dragging, setDragging] = useState(false);
  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes("Files");

  return {
    dragging,
    dropProps: {
      onDragOver(event: DragEvent<HTMLElement>) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        setDragging(true);
      },
      onDragLeave(event: DragEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      },
      onDrop(event: DragEvent<HTMLElement>) {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDragging(false);
        if (!disabled) onFile(event.dataTransfer.files[0]);
      }
    }
  };
}

const noSubscribe = () => () => {};
/** Atalho de colar exibido nas dicas: ⌘V em Apple, Ctrl+V no resto (o servidor renderiza Ctrl+V). */
function usePasteKey() {
  return useSyncExternalStore(
    noSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘V" : "Ctrl+V"),
    () => "Ctrl+V"
  );
}

const fileButton =
  "btn btn-sm btn-ghost min-h-9 cursor-pointer px-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest";

function UploadIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="text-forest"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function GiftManager({
  templateId,
  weddingId,
  support = false
}: {
  templateId: TemplateId;
  /** Conferido no servidor: a aba não grava numa conta diferente da que foi aberta (modo suporte). */
  weddingId: string;
  /** Modo suporte: a barra do topo ocupa 48px, então o formulário gruda mais abaixo. */
  support?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addGiftAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [framing, setFraming] = useState<GiftImageFraming>(DEFAULT_GIFT_FRAMING);
  const { uploading, uploadError, setUploadError, upload } = useGiftUpload();

  const [link, setLink] = useState("");
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const importing = importStatus?.kind === "busy";
  const lastImport = useRef({ title: "", price: "", image: "" });
  const pasteKey = usePasteKey();

  // Foto nova (enviada ou importada) sempre começa em "Foto inteira", centralizada.
  function chooseImage(url: string) {
    setImageUrl(url);
    setFraming(DEFAULT_GIFT_FRAMING);
  }

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    lastImport.current = { title: "", price: "", image: "" };
    // Reset da UI depois que o servidor confirmou a cota.
    /* eslint-disable react-hooks/set-state-in-effect */
    setImageUrl("");
    setFraming(DEFAULT_GIFT_FRAMING);
    setLink("");
    setImportStatus(null);
    setUploadError("");
    /* eslint-enable react-hooks/set-state-in-effect */
    // Depende do objeto `state` (novo a cada envio), não de state.ok: na 2ª cota seguida
    // ok continua true e o formulário não era limpo.
  }, [state, setUploadError]);

  async function onFile(file: File | undefined) {
    const url = await upload(file);
    if (url) chooseImage(url);
  }
  const { dragging, dropProps } = useFileDrop((file) => void onFile(file), uploading);

  // Ctrl/Cmd+V com imagem em qualquer ponto da página vai para a nova cota. No window
  // (depois do React): o editor de foto de uma cota aberta consome o evento antes.
  const onWindowPaste = useEffectEvent((event: ClipboardEvent) => {
    if (event.defaultPrevented) return;
    const file = pastedImage(event);
    if (!file) return;
    event.preventDefault();
    if (!uploading) void onFile(file);
  });
  useEffect(() => {
    const handler = (event: ClipboardEvent) => onWindowPaste(event);
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  async function onImport() {
    const url = link.trim();
    if (!url) return;
    setImportStatus({ kind: "busy" });
    try {
      const res = await fetch("/api/gifts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = (await res.json().catch(() => ({}))) as GiftExtraction;
      // Nada do que o casal já digitou é apagado: só sobrescreve o que a loja devolveu.
      const filled = [data.title && "nome", data.price && "valor", data.image && "foto"].filter(
        (field): field is string => Boolean(field)
      );
      if (!res.ok || !filled.length) {
        setImportStatus({ kind: "error", text: data.error ?? "A loja não liberou os dados desse produto." });
        return;
      }
      // Campo que ainda guarda o valor do import anterior e não veio agora é limpo: senão o
      // preço/foto de outro produto fica junto do nome novo. O que o casal digitou fica.
      const last = lastImport.current;
      for (const field of ["title", "price"] as const) {
        const input = formRef.current?.elements.namedItem(field) as HTMLInputElement | null;
        const value = data[field];
        if (!input) continue;
        if (value) input.value = value;
        else if (input.value === last[field]) input.value = "";
      }
      if (data.image) chooseImage(data.image);
      else if (last.image) setImageUrl((current) => (current === last.image ? "" : current));
      lastImport.current = { title: data.title ?? "", price: data.price ?? "", image: data.image ?? "" };
      const list = new Intl.ListFormat("pt-BR").format(filled);
      const verb = filled.length > 1 ? "preenchidos" : filled[0] === "foto" ? "preenchida" : "preenchido";
      setImportStatus({ kind: "ok", text: `${list[0].toUpperCase()}${list.slice(1)} ${verb}`, photo: Boolean(data.image) });
    } catch {
      setImportStatus({ kind: "error", text: "Falha de conexão. Tente novamente." });
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`panel p-5 lg:sticky ${support ? "lg:top-18" : "lg:top-6"}`}
      aria-labelledby="new-gift-title"
    >
      <input type="hidden" name="weddingId" value={weddingId} />
      <input type="hidden" name="image" value={imageUrl} />
      <input type="hidden" name="imageFit" value={framing.imageFit} />
      <input type="hidden" name="imageFocusX" value={framing.imageFocus.x} />
      <input type="hidden" name="imageFocusY" value={framing.imageFocus.y} />
      <input type="hidden" name="imageZoom" value={framing.imageZoom} />

      <h2 id="new-gift-title" className="text-base font-semibold">
        Nova cota
      </h2>

      {/* Importar por link */}
      <div className="mt-4 grid gap-1.5">
        <label htmlFor="gift-link" className={labelText}>
          Puxar de um link{optional}
        </label>
        <div className="flex gap-2">
          <input
            id="gift-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Amazon, Mercado Livre, loja…"
            aria-describedby="gift-link-hint"
            className="field"
          />
          <button
            type="button"
            onClick={() => void onImport()}
            disabled={importing || !link.trim()}
            aria-busy={importing}
            className="btn btn-sm btn-secondary min-h-11 shrink-0 disabled:opacity-50"
          >
            {importing ? "Buscando…" : "Buscar"}
          </button>
        </div>
        <p
          id="gift-link-hint"
          aria-live="polite"
          className={`text-[0.8125rem] leading-5 ${importStatus ? "text-ink" : "text-ink-soft"}`}
        >
          {!importStatus ? "Preenche nome, valor e foto automaticamente." : null}
          {importStatus?.kind === "busy" ? "Buscando na loja…" : null}
          {importStatus?.kind === "ok" ? (
            <>
              <span className="font-medium text-forest">{importStatus.text}</span>
              {importStatus.photo ? (
                ". Revise antes de adicionar."
              ) : (
                <>
                  {" "}
                  — a loja não liberou a foto: <span className="sm:hidden">envie a foto abaixo.</span>
                  <span className="hidden sm:inline">cole ({pasteKey}) ou envie a imagem.</span>
                </>
              )}
            </>
          ) : null}
          {importStatus?.kind === "error" ? (
            <>
              <span className="block font-medium text-danger">{importStatus.text}</span>
              <span className="sm:hidden">Preencha abaixo e envie a foto.</span>
              <span className="hidden sm:inline">
                Para a foto: na loja, clique com o botão direito na imagem, “Copiar imagem”, e cole aqui ({pasteKey}).
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div className="my-5 flex items-center gap-3 text-[0.8125rem] text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        ou preencha à mão
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="grid gap-4">
        <label className="grid gap-1.5">
          <span className={labelText}>Nome da cota</span>
          <input name="title" type="text" required placeholder="Lua de mel, jantar especial…" className="field" />
        </label>

        <label className="grid gap-1.5">
          <span className={labelText}>Valor{optional}</span>
          <input name="price" type="text" placeholder="R$ 250,00 — vazio vira “Valor livre”" className="field" />
        </label>

        <div className="grid gap-1.5">
          <span className={labelText}>Foto{optional}</span>
          <span aria-live="polite" className="sr-only">
            {uploading ? "Enviando a foto…" : imageUrl ? "Foto escolhida. Ajuste o enquadramento abaixo." : ""}
          </span>
          {imageUrl ? (
            <div
              {...dropProps}
              className={`grid gap-3 rounded-lg border bg-field p-3 transition-colors duration-150 motion-reduce:transition-none ${dragging ? "border-forest" : "border-line-strong"}`}
            >
              <ImageAdjuster src={imageUrl} aspect={GIFT_ASPECT_BY_TEMPLATE[templateId]} value={framing} onChange={setFraming} />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                <span className="text-[0.8125rem] text-ink-soft">
                  {uploading ? "Enviando…" : dragging ? "Solte para trocar" : "Foto escolhida"}
                </span>
                <div className="flex items-center gap-1">
                  <label className={fileButton}>
                    Trocar
                    <PhotoInput disabled={uploading} onFile={(file) => void onFile(file)} />
                  </label>
                  <button type="button" onClick={() => setImageUrl("")} className="btn btn-sm btn-ghost min-h-9 px-3 text-danger">
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label
              {...dropProps}
              className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition-colors duration-150 hover:border-forest/50 hover:bg-surface has-focus-visible:outline-2 has-focus-visible:outline-forest motion-reduce:transition-none ${dragging ? "border-forest bg-surface" : "border-line-strong bg-field"}`}
            >
              <UploadIcon />
              <span className="mt-1 text-sm text-ink">
                {uploading ? (
                  <span className="font-semibold">Enviando…</span>
                ) : dragging ? (
                  <span className="font-semibold">Solte a imagem aqui</span>
                ) : (
                  <>
                    <span className="font-semibold">Escolher foto</span>
                    <span className="hidden text-ink-soft sm:inline"> · ou cole a imagem ({pasteKey})</span>
                  </>
                )}
              </span>
              <span className="text-[0.8125rem] text-ink-soft">JPG, PNG, WEBP ou AVIF · até 8 MB</span>
              <PhotoInput disabled={uploading} onFile={(file) => void onFile(file)} />
            </label>
          )}
          {uploadError ? <span role="alert" className="text-sm font-medium text-danger">{uploadError}</span> : null}
        </div>

        <label className="grid gap-1.5">
          <span className={labelText}>Descrição{optional}</span>
          <textarea name="description" rows={3} placeholder="Uma frase sobre o presente" className="field" />
        </label>
      </div>

      {state.error ? (
        <Notice tone="error" className="mt-4">
          {state.error}
        </Notice>
      ) : null}
      {state.ok ? (
        <Notice tone="success" className="mt-4">
          Cota adicionada ao site.
        </Notice>
      ) : null}

      <button type="submit" disabled={pending || uploading} className="btn btn-sm btn-primary mt-5 w-full disabled:opacity-60">
        {pending ? "Adicionando…" : "Adicionar cota"}
      </button>
    </form>
  );
}

/** Linha de uma cota em "No site agora", com o ajuste de foto abrindo logo abaixo (sem modal). */
export function GiftRow({
  gift,
  templateId,
  support = false
}: {
  gift: WeddingGift;
  templateId: TemplateId;
  /** Modo suporte: remover cota fica só com o casal (o servidor também recusa). */
  support?: boolean;
}) {
  // Um editor aberto por vez: dados (nome, valor, descrição) ou foto.
  const [panel, setPanel] = useState<"details" | "photo" | null>(null);
  const detailsRef = useRef<HTMLButtonElement>(null);
  const photoRef = useRef<HTMLButtonElement>(null);
  const detailsId = `gift-details-${gift.id}`;
  const editorId = `gift-photo-${gift.id}`;

  function close() {
    (panel === "details" ? detailsRef : photoRef).current?.focus();
    setPanel(null);
  }

  return (
    <li className={`px-5 py-4 ${gift.active ? "" : "bg-bg-2/40"}`}>
      <div className="flex gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-line bg-field">
          {gift.image ? (
            <>
              {normalizeGiftImage(gift).imageFit === "contain" ? (
                <Image
                  src={gift.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="64px"
                  className={gift.active ? "" : "opacity-60"}
                  style={GIFT_BACKDROP_STYLE}
                />
              ) : null}
              <Image
                src={gift.image}
                alt=""
                fill
                sizes="64px"
                className={gift.active ? "" : "opacity-60"}
                style={giftImageStyle(gift)}
              />
            </>
          ) : (
            <span className="grid h-full place-items-center text-ink-soft">
              <Icon name="gift" size={22} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[0.9375rem] font-semibold text-ink">{gift.title}</p>
            {gift.active ? null : (
              <span className="rounded-full bg-forest/8 px-2 py-0.5 text-xs font-semibold text-ink-soft">Oculta no site</span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-forest">{gift.price}</p>
          {gift.description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-soft">{gift.description}</p> : null}
          <div className="-ml-2 mt-1 flex flex-wrap gap-x-1">
            <button
              ref={detailsRef}
              type="button"
              onClick={() => (panel === "details" ? close() : setPanel("details"))}
              aria-expanded={panel === "details"}
              aria-controls={detailsId}
              className="btn btn-sm btn-ghost min-h-9 px-2 whitespace-nowrap text-forest"
            >
              <Icon name="edit" size={16} />
              Editar
            </button>
            {gift.image ? (
              <button
                ref={photoRef}
                type="button"
                onClick={() => (panel === "photo" ? close() : setPanel("photo"))}
                aria-expanded={panel === "photo"}
                aria-controls={editorId}
                className="btn btn-sm btn-ghost min-h-9 px-2 whitespace-nowrap text-forest"
              >
                <Icon name="image" size={16} />
                Ajustar foto
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <form action={toggleGiftAction}>
            <input type="hidden" name="giftId" value={gift.id} />
            <SubmitButton className="btn btn-sm btn-ghost px-3" pendingLabel="…">
              {gift.active ? "Ocultar" : "Mostrar"}
            </SubmitButton>
          </form>
          {support ? (
            <SupportBlockedButton className="icon-btn" aria-label={`Remover a cota ${gift.title}`}>
              <Icon name="trash" size={17} />
            </SupportBlockedButton>
          ) : (
            <form action={removeGiftAction}>
              <input type="hidden" name="giftId" value={gift.id} />
              <SubmitButton className="icon-btn hover:text-danger" aria-label={`Remover a cota ${gift.title}`}>
                <Icon name="trash" size={17} />
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {panel === "details" ? <GiftDetailsEditor id={detailsId} gift={gift} onClose={close} /> : null}
      {panel === "photo" && gift.image ? (
        <GiftPhotoEditor id={editorId} gift={gift} image={gift.image} templateId={templateId} onClose={close} />
      ) : null}
    </li>
  );
}

/** Nome, valor e descrição de uma cota existente (inclusive as que vieram do catálogo). */
function GiftDetailsEditor({ id, gift, onClose }: { id: string; gift: WeddingGift; onClose: () => void }) {
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();

  // onSubmit (não action): <form action> do React 19 limpa os campos depois do envio, e num
  // erro o casal perderia o que digitou.
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");
    startSaving(async () => {
      const result = await updateGiftDetailsAction(formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form
      id={id}
      onSubmit={save}
      aria-label={`Editar ${gift.title}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) onClose();
      }}
      className="mt-4 grid gap-4 rounded-lg border border-line-strong bg-field p-4 transition-[opacity,translate] duration-200 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none"
    >
      <input type="hidden" name="giftId" value={gift.id} />
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label className="grid gap-1.5">
          <span className={labelText}>Nome da cota</span>
          <input name="title" type="text" required minLength={2} defaultValue={gift.title} autoFocus className="field" />
        </label>
        <label className="grid gap-1.5">
          <span className={labelText}>Valor</span>
          <input
            name="price"
            type="text"
            inputMode="decimal"
            defaultValue={gift.price === "Valor livre" ? "" : gift.price}
            placeholder="Vazio = valor livre"
            className="field tabular-nums"
          />
        </label>
      </div>
      <label className="grid gap-1.5">
        <span className={labelText}>Descrição{optional}</span>
        <textarea name="description" rows={2} defaultValue={gift.description} className="field" />
      </label>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost px-3">
          Cancelar
        </button>
        <button type="submit" disabled={saving} aria-busy={saving} className="btn btn-sm btn-primary">
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

type GiftPhotoEditorProps = {
  id: string;
  gift: WeddingGift;
  image: string;
  templateId: TemplateId;
  onClose: () => void;
};

function GiftPhotoEditor({ id, gift, image: savedImage, templateId, onClose }: GiftPhotoEditorProps) {
  const [image, setImage] = useState(savedImage);
  const [framing, setFraming] = useState(() => normalizeGiftImage(gift));
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const { uploading, uploadError, upload } = useGiftUpload();

  async function onFile(file: File | undefined) {
    const url = await upload(file);
    if (!url) return;
    // Foto trocada: mantém o modo escolhido, mas recentraliza e zera o zoom.
    setImage(url);
    setFraming((current) => ({ ...current, imageFocus: DEFAULT_GIFT_FRAMING.imageFocus, imageZoom: 1 }));
  }
  const busy = uploading || saving;
  const { dragging, dropProps } = useFileDrop((file) => void onFile(file), busy);
  const pasteKey = usePasteKey();

  // O foco entra no editor ao abrir: assim o Ctrl/Cmd+V vai para esta cota, não para a "Nova cota".
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => rootRef.current?.focus({ preventScroll: true }), []);

  function save() {
    setError("");
    startSaving(async () => {
      const result = await updateGiftImageAction(gift.id, { ...framing, image: image === savedImage ? undefined : image });
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <div
      ref={rootRef}
      id={id}
      role="group"
      tabIndex={-1}
      aria-label={`Ajustar a foto de ${gift.title}`}
      {...dropProps}
      onPaste={(event) => {
        const file = pastedImage(event);
        if (!file) return;
        event.preventDefault();
        if (!busy) void onFile(file);
      }}
      className={`mt-4 grid gap-4 rounded-lg border bg-field p-4 outline-none transition-[opacity,translate,border-color] duration-200 starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none ${dragging ? "border-forest" : "border-line-strong"}`}
    >
      <ImageAdjuster src={image} aspect={GIFT_ASPECT_BY_TEMPLATE[templateId]} value={framing} onChange={setFraming} />

      {error || uploadError ? (
        <Notice tone="error">{error || uploadError}</Notice>
      ) : null}
      <span aria-live="polite" className="sr-only">
        {uploading ? "Enviando a foto…" : image !== savedImage ? "Foto trocada. Salve para aplicar." : ""}
      </span>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <label className={fileButton}>
          <Icon name="upload" size={16} />
          {uploading ? "Enviando…" : dragging ? "Solte para trocar" : "Trocar foto"}
          <PhotoInput disabled={busy} onFile={(file) => void onFile(file)} />
        </label>
        <span className="hidden text-[0.8125rem] text-ink-soft sm:inline">ou cole a imagem ({pasteKey})</span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost px-3">
            Cancelar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            aria-busy={saving}
            className="btn btn-sm btn-primary"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

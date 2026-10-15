"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/app/icons";
import type { WeddingGalleryImage, WeddingSite } from "@/types/wedding";

const BUCKET = "wedding-photos";
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_GALLERY = 40;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

/** Modelos cujo rodapé exibe uma foto (os demais têm rodapé só de texto/ornamento). */
const TEMPLATES_WITH_FOOTER_PHOTO = new Set<WeddingSite["templateId"]>([
  "classico-romantico",
  "garden-classico",
  "cinema-noir"
]);

function newId() {
  return crypto.randomUUID();
}

function reorder(list: WeddingGalleryImage[], fromId: string, toId: string) {
  const from = list.findIndex((i) => i.id === fromId);
  const to = list.findIndex((i) => i.id === toId);
  if (from < 0 || to < 0 || from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

type PhotoManagerProps = {
  templateId: WeddingSite["templateId"];
  heroImage: string;
  footerImage: string;
  gallery: WeddingGalleryImage[];
  onAddPhotos: (photos: WeddingGalleryImage[]) => void;
  onRemovePhoto: (id: string) => void;
  onSetCover: (src: string) => void;
  onSetFooter: (src: string) => void;
  onReorder: (next: WeddingGalleryImage[]) => void;
};

/**
 * Editor de fotos CONTROLADO: recebe o acervo por props e reporta mudanças por
 * callbacks (o estado vive no LiveEditor e é persistido pelo auto-save). Só o
 * upload e a exclusão de arquivo falam direto com o Storage (RLS por dono).
 */
export function PhotoManager({
  templateId,
  heroImage,
  footerImage,
  gallery,
  onAddPhotos,
  onRemovePhoto,
  onSetCover,
  onSetFooter,
  onReorder
}: PhotoManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const dragId = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const showFooter = TEMPLATES_WITH_FOOTER_PHOTO.has(templateId);
  const isCustomCover = gallery.some((p) => p.src === heroImage);
  const isCustomFooter = gallery.some((p) => p.src === footerImage);

  async function onFiles(files: File[]) {
    setError("");
    if (!files.length) return;
    if (gallery.length + files.length > MAX_GALLERY) {
      setError(`A galeria aceita no máximo ${MAX_GALLERY} fotos.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sessão expirada. Recarregue a página e entre novamente.");
        return;
      }

      const uploaded: WeddingGalleryImage[] = [];
      for (const file of files) {
        if (!EXT[file.type]) {
          setError("Formato não suportado. Use JPG, PNG, WEBP ou AVIF.");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`"${file.name}" passa de 8 MB.`);
          continue;
        }
        const path = `${user.id}/${newId()}.${EXT[file.type]}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          setError("Falha ao enviar uma imagem. Tente novamente.");
          continue;
        }
        const src = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        uploaded.push({ id: newId(), src, alt: "", role: "story" });
      }

      if (uploaded.length) onAddPhotos(uploaded);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    const target = gallery.find((g) => g.id === id);
    onRemovePhoto(id);
    const path = target ? storagePathFromUrl(target.src) : null;
    if (path) {
      try {
        await createClient().storage.from(BUCKET).remove([path]);
      } catch {
        // best-effort: se falhar, o arquivo fica órfão no storage.
      }
    }
  }

  function onDrop(event: DragEvent<HTMLLIElement>, toId: string) {
    event.preventDefault();
    setDragOver(null);
    const fromId = dragId.current;
    dragId.current = null;
    if (!fromId) return;
    const next = reorder(gallery, fromId, toId);
    if (next !== gallery) onReorder(next);
  }

  function moveBy(id: string, dir: -1 | 1) {
    const idx = gallery.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[idx], next[target]] = [next[target], next[idx]];
    onReorder(next);
  }

  const fileInput = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      multiple
      className="sr-only"
      disabled={uploading}
      onChange={(event) => {
        void onFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
      }}
    />
  );

  return (
    <div className="grid gap-6">
      <div className={`grid gap-3 ${showFooter ? "grid-cols-2" : ""}`}>
        <PreviewSlot label="Capa" src={heroImage} isCustom={isCustomCover} />
        {showFooter ? <PreviewSlot label="Rodapé" src={footerImage} isCustom={isCustomFooter} /> : null}
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">
            Suas fotos{" "}
            <span className="font-normal text-ink-soft">
              ({gallery.length} de {MAX_GALLERY})
            </span>
          </p>
          {gallery.length ? (
            <label
              className={`btn btn-sm btn-secondary cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-forest ${
                uploading ? "opacity-60" : ""
              }`}
            >
              <Icon name="upload" size={16} />
              {uploading ? "Enviando…" : "Enviar fotos"}
              {fileInput}
            </label>
          ) : null}
        </div>

        {gallery.length ? (
          <ul className="grid grid-cols-2 gap-2.5">
            {gallery.map((img, index) => {
              const isCover = img.src === heroImage;
              const isFooter = showFooter && img.src === footerImage;
              return (
                <li
                  key={img.id}
                  draggable
                  onDragStart={(event) => {
                    if ((event.target as HTMLElement).closest("button")) {
                      event.preventDefault();
                      return;
                    }
                    dragId.current = img.id;
                  }}
                  onDragEnd={() => {
                    dragId.current = null;
                    setDragOver(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (dragOver !== img.id) setDragOver(img.id);
                  }}
                  onDrop={(event) => onDrop(event, img.id)}
                  className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg bg-bg-2 ring-offset-2 ring-offset-surface transition-shadow duration-150 active:cursor-grabbing ${
                    dragOver === img.id ? "ring-2 ring-gold" : isCover ? "ring-2 ring-forest" : ""
                  }`}
                >
                  <Image src={img.src} alt={img.alt || ""} fill sizes="180px" className="object-cover" draggable={false} />

                  {isCover || isFooter ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-forest px-2 py-0.5 text-[0.6875rem] font-semibold text-on-forest">
                      {isCover && isFooter ? "Capa · Rodapé" : isCover ? "Capa" : "Rodapé"}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    aria-label={`Apagar foto ${index + 1}`}
                    onClick={() => void remove(img.id)}
                    className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/55 text-white transition-colors duration-150 hover:bg-danger focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <Icon name="trash" size={15} />
                  </button>

                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-black/70 to-transparent p-1.5 pt-6">
                    <button
                      type="button"
                      aria-label={`Mover foto ${index + 1} para antes`}
                      disabled={index === 0}
                      onClick={() => moveBy(img.id, -1)}
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-white/90 text-ink transition-colors duration-150 hover:bg-white disabled:opacity-30"
                    >
                      <Icon name="chevronLeft" size={15} />
                    </button>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
                      {isCover ? null : <RolePill label="Capa" onClick={() => onSetCover(img.src)} />}
                      {showFooter && !isFooter ? <RolePill label="Rodapé" onClick={() => onSetFooter(img.src)} /> : null}
                    </div>
                    <button
                      type="button"
                      aria-label={`Mover foto ${index + 1} para depois`}
                      disabled={index === gallery.length - 1}
                      onClick={() => moveBy(img.id, 1)}
                      className="grid size-7 shrink-0 place-items-center rounded-full bg-white/90 text-ink transition-colors duration-150 hover:bg-white disabled:opacity-30"
                    >
                      <Icon name="chevronRight" size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDropActive(true);
            }}
            onDragLeave={() => setDropActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDropActive(false);
              void onFiles(Array.from(event.dataTransfer.files));
            }}
            className={`grid cursor-pointer place-items-center gap-1 rounded-lg border border-dashed px-6 py-10 text-center transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-forest ${
              dropActive ? "border-forest bg-forest/5" : "border-line-strong bg-field hover:border-forest/50"
            } ${uploading ? "opacity-60" : ""}`}
          >
            <span className="mb-1 grid size-11 place-items-center rounded-full bg-forest/8 text-forest">
              <Icon name="upload" size={20} />
            </span>
            <span className="text-sm font-semibold text-ink">{uploading ? "Enviando…" : "Enviar suas fotos"}</span>
            <span className="text-[0.8125rem] text-ink-soft">Clique ou arraste aqui · JPG, PNG, WEBP ou AVIF até 8 MB</span>
            {fileInput}
          </label>
        )}

        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : gallery.length > 1 ? (
          <p className="text-[0.8125rem] text-ink-soft">Arraste as fotos (ou use as setas) para mudar a ordem.</p>
        ) : null}
      </div>
    </div>
  );
}

function PreviewSlot({ label, src, isCustom }: { label: string; src: string; isCustom: boolean }) {
  return (
    <figure className="grid gap-1.5">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg border border-line bg-bg-2">
        {src ? <Image src={src} alt={`${label} atual do site`} fill sizes="360px" className="object-cover" /> : null}
        {!isCustom ? (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-md bg-black/60 px-2 py-1 text-[0.6875rem] font-medium leading-4 text-white">
            Foto de exemplo
          </span>
        ) : null}
      </div>
      <figcaption className="text-[0.8125rem] font-medium text-ink">{label}</figcaption>
    </figure>
  );
}

function RolePill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Usar como ${label.toLowerCase()}`}
      className="rounded-full bg-white/90 px-2 py-1 text-[0.6875rem] font-semibold text-ink transition-colors duration-150 hover:bg-white"
    >
      {label}
    </button>
  );
}

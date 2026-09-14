"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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

  return (
    <div className="grid gap-4">
      <div className={`grid gap-4 ${showFooter ? "sm:grid-cols-2" : ""}`}>
        <PreviewSlot
          label="Capa do site"
          src={heroImage}
          isCustom={isCustomCover}
          hint="Foto de exemplo — use o botão “Capa” em uma foto sua abaixo."
        />
        {showFooter ? (
          <PreviewSlot
            label="Foto do rodapé"
            src={footerImage}
            isCustom={isCustomFooter}
            hint="Foto de exemplo — use o botão “Rodapé” em uma foto sua abaixo."
          />
        ) : null}
      </div>

      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink">Minhas fotos ({gallery.length})</h3>
          <label className={`btn btn-secondary cursor-pointer text-sm ${uploading ? "opacity-60" : ""}`}>
            {uploading ? "Enviando…" : "Adicionar fotos"}
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
          </label>
        </div>

        {gallery.length ? (
          <ul className="grid grid-cols-2 gap-3">
            {gallery.map((img, index) => {
              const isCover = img.src === heroImage;
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
                  className={`group relative aspect-square cursor-move overflow-hidden rounded-xl border bg-bg-2 transition ${
                    isCover ? "border-forest ring-2 ring-forest" : "border-[#5b6842]/14"
                  } ${dragOver === img.id ? "ring-2 ring-gold" : ""}`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt || ""}
                    fill
                    sizes="180px"
                    className="object-cover"
                    draggable={false}
                  />

                  <button
                    type="button"
                    aria-label="Remover foto"
                    onClick={() => void remove(img.id)}
                    className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-lg leading-none text-white transition hover:bg-black/80"
                  >
                    ×
                  </button>

                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-linear-to-t from-black/75 to-transparent p-1.5">
                    <button
                      type="button"
                      aria-label="Mover para a esquerda"
                      disabled={index === 0}
                      onClick={() => moveBy(img.id, -1)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/85 text-sm font-bold text-ink transition hover:bg-white disabled:opacity-30"
                    >
                      ‹
                    </button>
                    <div className="flex flex-1 items-center gap-1">
                      <RolePill active={isCover} label="Capa" onClick={() => onSetCover(img.src)} />
                      {showFooter ? (
                        <RolePill
                          active={img.src === footerImage}
                          label="Rodapé"
                          onClick={() => onSetFooter(img.src)}
                        />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Mover para a direita"
                      disabled={index === gallery.length - 1}
                      onClick={() => moveBy(img.id, 1)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/85 text-sm font-bold text-ink transition hover:bg-white disabled:opacity-30"
                    >
                      ›
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <label
            className={`grid cursor-pointer place-items-center gap-1 rounded-2xl border border-dashed border-[#5b6842]/30 bg-bg-2/40 px-6 py-12 text-center ${
              uploading ? "opacity-60" : ""
            }`}
          >
            <span className="text-sm font-bold text-ink">Adicione suas fotos</span>
            <span className="text-xs text-ink-soft">JPG, PNG, WEBP ou AVIF · até 8 MB cada</span>
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
          </label>
        )}

        <div className="flex min-h-5 items-center gap-2 text-sm">
          {error ? (
            <span className="font-bold text-[#8d3d33]">{error}</span>
          ) : gallery.length ? (
            <span className="text-ink-soft">Arraste as fotos (ou use ‹ ›) para reordenar a galeria.</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewSlot({ label, src, isCustom, hint }: { label: string; src: string; isCustom: boolean; hint: string }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-bold text-ink">{label}</h3>
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[#5b6842]/14 bg-bg-2">
        {src ? (
          <Image src={src} alt={`${label} atual`} fill sizes="360px" className="object-cover" />
        ) : null}
        {!isCustom ? (
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-3">
            <p className="text-xs font-bold text-white">{hint}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RolePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-full px-2 py-1 text-[11px] font-bold transition ${
        active ? "bg-forest text-[#f3efe4]" : "bg-white/85 text-ink hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}

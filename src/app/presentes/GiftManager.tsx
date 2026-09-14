"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { addGiftAction, type GiftActionState } from "./actions";

const initial: GiftActionState = {};
const fieldClass =
  "min-h-12 w-full rounded-2xl border border-[#5b6842]/16 bg-white px-4 text-ink placeholder:text-ink-soft/70";
const labelText = "text-sm font-semibold text-ink";
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

export function GiftManager() {
  const [state, formAction, pending] = useActionState(addGiftAction, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    // Reset da UI depois que o servidor confirmou a cota.
    /* eslint-disable react-hooks/set-state-in-effect */
    setImageUrl("");
    setLink("");
    setImportMsg(null);
    setUploadError("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [state.ok]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    if (!EXT[file.type]) {
      setUploadError("Use JPG, PNG, WEBP ou AVIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("Imagem acima de 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setUploadError("Sessão expirada. Recarregue a página.");
        return;
      }
      const path = `${user.id}/${crypto.randomUUID()}.${EXT[file.type]}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (error) {
        setUploadError("Falha ao enviar a imagem. Tente novamente.");
        return;
      }
      setImageUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  async function onImport() {
    const url = link.trim();
    if (!url) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch("/api/gifts/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = (await res.json()) as GiftExtraction;
      if (!res.ok) {
        setImportMsg({ ok: false, text: data.error ?? "Não foi possível importar esse link." });
        return;
      }
      const form = formRef.current;
      if (form) {
        const titleEl = form.elements.namedItem("title") as HTMLInputElement | null;
        const priceEl = form.elements.namedItem("price") as HTMLInputElement | null;
        if (titleEl && data.title) titleEl.value = data.title;
        if (priceEl && data.price) priceEl.value = data.price;
      }
      if (data.image) setImageUrl(data.image);
      setImportMsg({
        ok: true,
        text: data.image
          ? "Nome, valor e imagem preenchidos. Revise abaixo antes de adicionar."
          : "Nome e valor preenchidos (sem imagem). Revise abaixo antes de adicionar."
      });
    } catch {
      setImportMsg({ ok: false, text: "Falha de conexão. Tente novamente." });
    } finally {
      setImporting(false);
    }
  }

  return (
    <form ref={formRef} action={formAction} className="card p-6 sm:p-8">
      <input type="hidden" name="image" value={imageUrl} />

      <div>
        <h2 className="t-h3 text-ink">Nova cota de presente</h2>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">Adicione um item ou puxe os dados de um link.</p>
      </div>

      {/* Importar por link */}
      <div className="mt-6">
        <label htmlFor="gift-link" className={labelText}>
          Link do produto{optional}
        </label>
        <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
          <input
            id="gift-link"
            type="url"
            inputMode="url"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Cole o link (Amazon, Mercado Livre…)"
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => void onImport()}
            disabled={importing || !link.trim()}
            className="btn btn-secondary shrink-0 whitespace-nowrap text-sm"
          >
            {importing ? "Buscando…" : "Buscar dados"}
          </button>
        </div>
        <p className={`mt-2 text-sm leading-5 ${importMsg ? (importMsg.ok ? "font-semibold text-forest" : "font-semibold text-[#8d3d33]") : "text-ink-soft"}`}>
          {importMsg ? importMsg.text : "Puxa nome, valor e imagem automaticamente."}
        </p>
      </div>

      {/* Divisória */}
      <div className="my-6 flex items-center gap-3 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-[#5b6842]/14" />
        ou preencha manualmente
        <span className="h-px flex-1 bg-[#5b6842]/14" />
      </div>

      {/* Campos */}
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className={labelText}>Título</span>
          <input name="title" type="text" required placeholder="Lua de mel, jantar especial…" className={fieldClass} />
        </label>

        <label className="grid gap-2">
          <span className={labelText}>Valor{optional}</span>
          <input name="price" type="text" placeholder="R$ 250,00 ou Valor livre" className={fieldClass} />
        </label>

        <div className="grid gap-2">
          <span className={labelText}>Imagem{optional}</span>
          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-[#5b6842]/16">
              <div className="relative aspect-[3/2] bg-bg-2">
                <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 420px" className="object-cover" />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-xs text-ink-soft">{uploading ? "Enviando…" : "Imagem selecionada"}</span>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer text-sm font-semibold text-forest hover:underline">
                    Trocar
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => {
                        void onFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-sm font-semibold text-[#8d3d33] hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#5b6842]/35 bg-white/50 px-4 py-7 text-center transition-colors hover:border-[#5b6842]/55 hover:bg-white">
              <UploadIcon />
              <span className="text-sm font-semibold text-ink">{uploading ? "Enviando…" : "Enviar foto"}</span>
              <span className="text-xs text-ink-soft">JPG, PNG ou WEBP · até 8 MB</span>
              <input
                type="file"
                accept={ACCEPT}
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  void onFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          )}
          {uploadError ? <span className="text-sm font-semibold text-[#8d3d33]">{uploadError}</span> : null}
        </div>

        <label className="grid gap-2">
          <span className={labelText}>Descrição{optional}</span>
          <textarea name="description" rows={3} className="rounded-2xl border border-[#5b6842]/16 bg-white p-4 text-ink placeholder:text-ink-soft/70" />
        </label>
      </div>

      {state.error ? (
        <p role="alert" className="mt-5 rounded-2xl bg-[#8d3d33]/10 px-4 py-3 text-sm font-semibold text-[#8d3d33]">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p role="status" className="mt-5 rounded-2xl bg-forest/10 px-4 py-3 text-sm font-semibold text-forest">
          Cota adicionada.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || uploading}
        className="btn btn-primary mt-7 w-full text-sm sm:w-auto"
      >
        {pending ? "Adicionando…" : "Adicionar cota"}
      </button>
    </form>
  );
}

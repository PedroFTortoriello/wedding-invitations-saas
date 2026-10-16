"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import type { AiBriefing } from "@/lib/ai-site";
import { AI_SITE_FEE_LABEL, MAX_AI_GENERATIONS, MAX_AI_PHOTOS, PUBLISH_FEE_LABEL } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/client";
import { generateAiSiteAction, type AiGenerateState } from "./actions";

const BUCKET = "wedding-photos";
const MAX_BYTES = 8 * 1024 * 1024;
/** Lado maior da foto enviada: nítida no site e abaixo do limite de imagem da IA. */
const MAX_SIDE = 2400;

const labelClass = "grid content-start gap-1.5";
const labelText = "text-sm font-medium text-ink";
const hintText = "text-[0.8125rem] leading-5 text-ink-soft";
const legendClass = "text-base font-semibold text-ink";

/** Reduz a foto no navegador (JPEG, lado maior 2400px). Formato que o navegador não lê vai como está. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.86));
  } catch {
    return file;
  }
}

export function AiBriefingForm({ defaults, remaining }: { defaults: AiBriefing; remaining: number }) {
  const [state, formAction, pending] = useActionState<AiGenerateState, FormData>(generateAiSiteAction, {});
  const [photos, setPhotos] = useState<string[]>(defaults.photos);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function onFiles(files: File[]) {
    setPhotoError("");
    const room = MAX_AI_PHOTOS - photos.length;
    if (files.length > room) setPhotoError(`Até ${MAX_AI_PHOTOS} fotos. Enviamos as primeiras ${Math.max(room, 0)}.`);
    const batch = files.slice(0, Math.max(room, 0));
    if (!batch.length) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setPhotoError("Sessão expirada. Recarregue a página e entre novamente.");
        return;
      }
      for (const file of batch) {
        if (!file.type.startsWith("image/")) {
          setPhotoError("Envie só fotos (JPG, PNG, WEBP ou AVIF).");
          continue;
        }
        const blob = await shrink(file);
        if (blob.size > MAX_BYTES) {
          setPhotoError(`"${file.name}" passa de 8 MB.`);
          continue;
        }
        const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, upsert: false });
        if (error) {
          setPhotoError("Falha ao enviar uma foto. Tente novamente.");
          continue;
        }
        const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        setPhotos((current) => [...current, url]);
      }
    } finally {
      setUploading(false);
    }
  }

  if (pending) {
    return (
      <div role="status" aria-live="polite" className="panel grid min-h-[28rem] place-items-center p-8 text-center">
        <div className="grid max-w-sm justify-items-center">
          <span aria-hidden className="grid size-12 place-items-center rounded-full bg-forest/8 text-forest motion-safe:animate-pulse">
            <Icon name="sparkle" size={22} />
          </span>
          <p className="mt-5 font-serif text-[1.875rem] leading-[1.1] tracking-[-0.01em] text-balance">
            A IA está montando o site de <em>vocês</em>…
          </p>
          <p className="mt-3 text-base leading-6 text-ink-soft">
            Escolhendo o modelo, escrevendo os textos e organizando as fotos. Leva cerca de um minuto; não feche esta
            página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="panel grid gap-8 p-5 sm:p-7">
      {photos.map((url) => (
        <input key={url} type="hidden" name="photos" value={url} />
      ))}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`${legendClass} mb-4`}>O casamento</legend>
        <label className={`${labelClass} sm:col-span-2`}>
          <span className={labelText}>Nomes do casal</span>
          <input name="coupleNames" type="text" required minLength={3} defaultValue={defaults.coupleNames} placeholder="Helena & Lucas" autoComplete="off" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Data</span>
          <input name="weddingDate" type="date" defaultValue={defaults.weddingDate} className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Horário da cerimônia</span>
          <input name="weddingTime" type="time" defaultValue={defaults.weddingTime} className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Local</span>
          <input name="venue" type="text" defaultValue={defaults.venue} placeholder="Fazenda Santa Maria" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Cidade</span>
          <input name="city" type="text" defaultValue={defaults.city} placeholder="Porto Feliz, SP" className="field" />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          <span className={labelText}>Endereço</span>
          <input name="address" type="text" defaultValue={defaults.address} placeholder="Rua, número e bairro" className="field" />
        </label>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className={`${legendClass} mb-4`}>Sobre vocês</legend>
        <label className={labelClass}>
          <span className={labelText}>A história de vocês</span>
          <textarea name="story" rows={5} defaultValue={defaults.story} className="field" placeholder="Como se conheceram, o pedido, o que amam fazer juntos. Escrevam do jeito de vocês, a IA cuida do texto." />
          <span className={hintText}>A IA só usa o que vocês contarem: nada de história inventada.</span>
        </label>
        <label className={labelClass}>
          <span className={labelText}>Como vocês imaginam o site</span>
          <input name="style" type="text" defaultValue={defaults.style} placeholder="Elegante e noturno, praia ao pôr do sol, clássico com flores…" className="field" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Programação do dia</span>
          <textarea name="schedule" rows={3} defaultValue={defaults.schedule} className="field" placeholder="16h30 recepção, 17h cerimônia, 19h festa" />
        </label>
        <label className={labelClass}>
          <span className={labelText}>Outras informações para os convidados</span>
          <textarea name="extras" rows={3} defaultValue={defaults.extras} className="field" placeholder="Traje, hospedagem, crianças, prazo para confirmar presença" />
        </label>
      </fieldset>

      <div className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className={legendClass}>Fotos</p>
            <p className={`mt-1 ${hintText}`}>
              Até {MAX_AI_PHOTOS}. A IA escolhe a capa e a ordem da galeria. ({photos.length} de {MAX_AI_PHOTOS})
            </p>
          </div>
          <label
            className={`btn btn-sm btn-secondary shrink-0 cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-forest ${
              uploading || photos.length >= MAX_AI_PHOTOS ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Icon name="upload" size={16} />
            {uploading ? "Enviando…" : "Enviar fotos"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="sr-only"
              disabled={uploading || photos.length >= MAX_AI_PHOTOS}
              onChange={(event) => {
                void onFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
        </div>
        {photos.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((url, i) => (
              <li key={url} className="group relative aspect-square overflow-hidden rounded-lg bg-bg-2">
                <Image src={url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((current) => current.filter((u) => u !== url))}
                  className="icon-btn absolute right-1 top-1 size-8 bg-surface/90"
                  aria-label={`Remover foto ${i + 1}`}
                >
                  <Icon name="x" size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-sm text-ink-soft">
            Sem fotos, a IA monta o site com as imagens do modelo. Vocês trocam depois no editor.
          </p>
        )}
        {photoError ? <Notice tone="error">{photoError}</Notice> : null}
      </div>

      <div className="grid gap-3">
        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        <button type="submit" disabled={uploading} className="btn btn-sm btn-primary min-h-12 w-full text-[0.9375rem] disabled:opacity-60">
          <Icon name="sparkle" size={16} />
          Montar o site com a IA
        </button>
        <p className={`text-center ${hintText}`}>
          {remaining === 1 ? "Resta 1 geração." : `Restam ${remaining} gerações.`} Depois, vocês ajustam tudo no editor.
        </p>
        {/* Primeira geração: é ela que muda o preço da publicação, e não tem volta. */}
        {remaining === MAX_AI_GENERATIONS ? (
          <p className="rounded-lg bg-bg-2 px-3.5 py-3 text-[0.8125rem] leading-5 text-ink">
            Ao gerar, a publicação deste site passa a custar <strong className="font-semibold">{AI_SITE_FEE_LABEL}</strong>{" "}
            em vez de {PUBLISH_FEE_LABEL}, mesmo que vocês reescrevam tudo depois. Gerar e revisar continua grátis.
          </p>
        ) : null}
      </div>
    </form>
  );
}

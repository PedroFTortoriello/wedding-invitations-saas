"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  contentToJson,
  extractContent,
  isTemplateId,
  monogramFromNames,
  rowToWeddingSite,
  TEMPLATE_NAMES
} from "@/lib/wedding";
import type { PixKeyType } from "@/types/wedding";

const PIX_KEY_TYPES: PixKeyType[] = ["cpf", "cnpj", "email", "phone", "random"];

function isPixKeyType(value: string): value is PixKeyType {
  return (PIX_KEY_TYPES as string[]).includes(value);
}

export type SaveWeddingState = { error?: string; ok?: boolean };

export async function saveWeddingAction(
  _prev: SaveWeddingState,
  formData: FormData
): Promise<SaveWeddingState> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!row) return { error: "Casamento não encontrado. Crie no onboarding." };

  const coupleNames = String(formData.get("coupleNames") ?? "").trim();
  const welcomeText = String(formData.get("welcomeText") ?? "").trim();
  const weddingDateLabel = String(formData.get("weddingDateLabel") ?? "").trim();
  const weddingTime = String(formData.get("weddingTime") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "");
  const pixKey = String(formData.get("pixKey") ?? "").trim();
  const pixKeyTypeRaw = String(formData.get("pixKeyType") ?? "random");
  const pixHolderName = String(formData.get("pixHolderName") ?? "").trim();

  if (coupleNames.length < 3) return { error: "Informe o nome do casal." };
  if (!isTemplateId(templateId)) return { error: "Modelo inválido." };
  const pixKeyType = isPixKeyType(pixKeyTypeRaw) ? pixKeyTypeRaw : "random";

  const site = rowToWeddingSite(row);
  const content = extractContent({
    ...site,
    coupleNames,
    welcomeText: welcomeText || site.welcomeText,
    weddingDateLabel: weddingDateLabel || site.weddingDateLabel,
    weddingTime: weddingTime || site.weddingTime,
    monogram: monogramFromNames(coupleNames),
    templateId,
    templateName: TEMPLATE_NAMES[templateId],
    theme: { ...site.theme, primaryDark: primaryColor || site.theme.primaryDark },
    seo: { title: coupleNames, description: `Site de casamento de ${coupleNames}.` }
  });

  const { error } = await supabase
    .from("weddings")
    .update({
      couple_names: coupleNames,
      pix_key: pixKey || null,
      pix_key_type: pixKey ? pixKeyType : null,
      pix_holder_name: pixHolderName || null,
      content: contentToJson(content)
    })
    .eq("id", row.id);

  if (error) return { error: "Não foi possível salvar. Tente novamente." };

  revalidatePath("/editor");
  revalidatePath("/dashboard");
  revalidatePath(`/casamento/${row.slug}`);
  return { ok: true };
}

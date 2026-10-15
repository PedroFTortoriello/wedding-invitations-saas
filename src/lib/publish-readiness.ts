import type { WeddingSite } from "@/types/wedding";

export type ReadinessItem = {
  id: "nomes" | "data" | "capa" | "local" | "pix";
  label: string;
  /** Seção do editor que resolve o item (?secao=). */
  section: "casal" | "data" | "fotos" | "locais" | "pix";
  done: boolean;
  /** Recomendado, mas não impede de publicar. */
  optional?: boolean;
};

export type PublishReadiness = {
  items: ReadinessItem[];
  /** Obrigatórios feitos, de `requiredCount` (o Pix recomendado não entra na conta: "4 de 4"). */
  doneCount: number;
  requiredCount: number;
  /** Todos os itens obrigatórios feitos. Nunca bloqueia a publicação, só orienta. */
  ready: boolean;
};

const hasValidDate = (iso: string) => /^\d{4}-\d{2}-\d{2}/.test(iso) && !Number.isNaN(Date.parse(iso));

/**
 * O mínimo para o site fazer sentido para os convidados. Usado no editor (medidor
 * "pronto para publicar") e na tela /publicar — uma regra só para os dois.
 */
export function getPublishReadiness(site: WeddingSite): PublishReadiness {
  const firstLocation = site.locations[0];
  const items: ReadinessItem[] = [
    { id: "nomes", label: "Nomes do casal", section: "casal", done: site.coupleNames.trim().length >= 3 },
    { id: "data", label: "Data do casamento", section: "data", done: hasValidDate(site.weddingDate) },
    {
      id: "capa",
      label: "Uma foto de vocês na capa",
      section: "fotos",
      done: site.gallery.some((photo) => photo.src === site.heroImage)
    },
    {
      id: "local",
      label: "Onde vai ser",
      section: "locais",
      done: Boolean(firstLocation?.venue.trim() || firstLocation?.address?.trim())
    },
    { id: "pix", label: "Chave Pix para presentes", section: "pix", done: Boolean(site.pixKey.trim()), optional: true }
  ];
  const required = items.filter((item) => !item.optional);
  return {
    items,
    doneCount: required.filter((item) => item.done).length,
    requiredCount: required.length,
    ready: required.every((item) => item.done)
  };
}

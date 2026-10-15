// Slug do site público (/casamento/[slug]). Roteamento é só por slug (decisão de
// produto), então o slug precisa ser estável, sem acento e sem colidir com rotas.

const RESERVED = new Set([
  "",
  "admin",
  "api",
  "login",
  "cadastro",
  "dashboard",
  "editor",
  "onboarding",
  "checkout",
  "convidados",
  "mensagens",
  "presentes",
  "casamento",
  "modelo",
  "demo",
  "www",
  // Slug do casal de demonstração (/modelo/<id>/helena-e-lucas): os formulários dos
  // modelos mandam o slug para /api/rsvp; um casal real com ele receberia confirmações da demo.
  "helena-e-lucas"
]);

/** Normaliza um texto livre em um slug seguro: minúsculas, sem acento, hifenizado. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
}

/** Um slug é válido para publicação se tem 3–60 chars, formato kebab e não é reservado. */
export function isValidSlug(slug: string): boolean {
  if (slug.length < 3 || slug.length > 60) return false;
  if (RESERVED.has(slug)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

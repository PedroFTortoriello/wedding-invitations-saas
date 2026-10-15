import type { WeddingSite } from "@/types/wedding";

/** Foto do capítulo i da história: gallery[i + 1] em ciclo (a 0 costuma repetir o hero). */
export const storyImage = (gallery: WeddingSite["gallery"], i: number) =>
  gallery.length ? gallery[(i + 1) % gallery.length] : undefined;

/** Galeria sem o hero e as fotos da história, mas só se sobrarem 4+ (senão, todas). */
export function galleryRest(wedding: WeddingSite) {
  const shown = new Set([wedding.heroImage, ...wedding.storyMoments.map((_, i) => storyImage(wedding.gallery, i)?.src)]);
  const rest = wedding.gallery.filter((img) => !shown.has(img.src));
  return rest.length >= 4 ? rest : wedding.gallery;
}

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CinemaNoirTemplate } from "@/components/templates/cinema-noir/CinemaNoirTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(CinemaNoirTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TropicalEditorialTemplate } from "@/components/templates/tropical-editorial/TropicalEditorialTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(TropicalEditorialTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TropicalEscapeTemplate } from "@/components/templates/tropical-escape/TropicalEscapeTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(TropicalEscapeTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

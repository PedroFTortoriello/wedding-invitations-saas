// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { HeritageTemplate } from "@/components/templates/heritage/HeritageTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(HeritageTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

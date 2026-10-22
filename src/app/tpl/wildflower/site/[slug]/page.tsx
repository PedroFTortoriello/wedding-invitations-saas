// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { WildflowerTemplate } from "@/components/templates/wildflower/WildflowerTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(WildflowerTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

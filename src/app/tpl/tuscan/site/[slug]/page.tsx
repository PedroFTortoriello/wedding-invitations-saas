// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TuscanTemplate } from "@/components/templates/tuscan/TuscanTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(TuscanTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

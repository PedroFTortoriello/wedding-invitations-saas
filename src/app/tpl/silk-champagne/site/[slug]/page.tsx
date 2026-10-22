// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SilkChampagneTemplate } from "@/components/templates/silk-champagne/SilkChampagneTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(SilkChampagneTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

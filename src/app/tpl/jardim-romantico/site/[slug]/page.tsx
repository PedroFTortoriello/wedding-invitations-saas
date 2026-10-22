// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(JardimRomanticoTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

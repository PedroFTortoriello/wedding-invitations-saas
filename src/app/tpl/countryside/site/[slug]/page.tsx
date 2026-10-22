// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CountrysideTemplate } from "@/components/templates/countryside/CountrysideTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(CountrysideTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

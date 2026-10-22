// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { JardimBrasileiroTemplate } from "@/components/templates/jardim-brasileiro/JardimBrasileiroTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(JardimBrasileiroTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

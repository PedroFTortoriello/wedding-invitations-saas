// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ContemporaryContrastTemplate } from "@/components/templates/contemporary-contrast/ContemporaryContrastTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ContemporaryContrastTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

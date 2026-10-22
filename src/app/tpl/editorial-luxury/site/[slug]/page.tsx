// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { EditorialLuxuryTemplate } from "@/components/templates/editorial-luxury/EditorialLuxuryTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(EditorialLuxuryTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

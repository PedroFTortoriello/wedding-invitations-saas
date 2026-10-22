// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { EditorialIvoryTemplate } from "@/components/templates/editorial-ivory/EditorialIvoryTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(EditorialIvoryTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

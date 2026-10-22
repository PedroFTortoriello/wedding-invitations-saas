// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { FineLineTemplate } from "@/components/templates/fine-line/FineLineTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(FineLineTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BoldTypeTemplate } from "@/components/templates/bold-type/BoldTypeTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(BoldTypeTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { AmalfiTemplate } from "@/components/templates/amalfi/AmalfiTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(AmalfiTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

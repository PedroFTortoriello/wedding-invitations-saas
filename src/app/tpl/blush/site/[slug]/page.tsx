// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BlushTemplate } from "@/components/templates/blush/BlushTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(BlushTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

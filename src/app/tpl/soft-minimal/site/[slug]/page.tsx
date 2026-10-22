// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SoftMinimalTemplate } from "@/components/templates/soft-minimal/SoftMinimalTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(SoftMinimalTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

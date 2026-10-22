// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ArchitecturalTemplate } from "@/components/templates/architectural/ArchitecturalTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ArchitecturalTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

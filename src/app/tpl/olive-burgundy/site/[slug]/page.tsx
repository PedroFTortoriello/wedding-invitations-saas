// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(OliveBurgundyTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ModernHeirloomTemplate } from "@/components/templates/modern-heirloom/ModernHeirloomTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ModernHeirloomTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ModernCelebrationTemplate } from "@/components/templates/modern-celebration/ModernCelebrationTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ModernCelebrationTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

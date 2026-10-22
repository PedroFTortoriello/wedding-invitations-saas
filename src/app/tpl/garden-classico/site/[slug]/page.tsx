// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(GardenClassicTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

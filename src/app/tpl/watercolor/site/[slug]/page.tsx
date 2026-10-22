// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { WatercolorTemplate } from "@/components/templates/watercolor/WatercolorTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(WatercolorTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

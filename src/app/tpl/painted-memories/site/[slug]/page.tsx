// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PaintedMemoriesTemplate } from "@/components/templates/painted-memories/PaintedMemoriesTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(PaintedMemoriesTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

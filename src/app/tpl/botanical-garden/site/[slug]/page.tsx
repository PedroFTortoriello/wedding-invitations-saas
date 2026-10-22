// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BotanicalGardenTemplate } from "@/components/templates/botanical-garden/BotanicalGardenTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(BotanicalGardenTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

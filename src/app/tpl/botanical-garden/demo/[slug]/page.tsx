// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BotanicalGardenTemplate } from "@/components/templates/botanical-garden/BotanicalGardenTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("botanical-garden", BotanicalGardenTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

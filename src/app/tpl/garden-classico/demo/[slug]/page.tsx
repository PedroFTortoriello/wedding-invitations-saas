// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { GardenClassicTemplate } from "@/components/templates/garden-classico/GardenClassicTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("garden-classico", GardenClassicTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

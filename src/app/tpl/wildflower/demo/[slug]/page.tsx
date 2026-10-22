// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { WildflowerTemplate } from "@/components/templates/wildflower/WildflowerTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("wildflower", WildflowerTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

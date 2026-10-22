// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { HeritageTemplate } from "@/components/templates/heritage/HeritageTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("heritage", HeritageTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

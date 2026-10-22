// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TropicalEscapeTemplate } from "@/components/templates/tropical-escape/TropicalEscapeTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("tropical-escape", TropicalEscapeTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

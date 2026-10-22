// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TropicalEditorialTemplate } from "@/components/templates/tropical-editorial/TropicalEditorialTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("tropical-editorial", TropicalEditorialTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

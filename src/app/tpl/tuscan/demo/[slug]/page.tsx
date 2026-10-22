// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { TuscanTemplate } from "@/components/templates/tuscan/TuscanTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("tuscan", TuscanTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

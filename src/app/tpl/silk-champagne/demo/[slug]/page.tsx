// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SilkChampagneTemplate } from "@/components/templates/silk-champagne/SilkChampagneTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("silk-champagne", SilkChampagneTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

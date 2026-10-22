// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CountrysideTemplate } from "@/components/templates/countryside/CountrysideTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("countryside", CountrysideTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

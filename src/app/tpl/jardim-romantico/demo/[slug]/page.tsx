// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { JardimRomanticoTemplate } from "@/components/templates/jardim-romantico/JardimRomanticoTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("jardim-romantico", JardimRomanticoTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

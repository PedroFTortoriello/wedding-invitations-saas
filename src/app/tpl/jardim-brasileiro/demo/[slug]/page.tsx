// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { JardimBrasileiroTemplate } from "@/components/templates/jardim-brasileiro/JardimBrasileiroTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("jardim-brasileiro", JardimBrasileiroTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

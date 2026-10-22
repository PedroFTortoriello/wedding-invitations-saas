// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BoldTypeTemplate } from "@/components/templates/bold-type/BoldTypeTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("bold-type", BoldTypeTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

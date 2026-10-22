// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { FineLineTemplate } from "@/components/templates/fine-line/FineLineTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("fine-line", FineLineTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { EditorialIvoryTemplate } from "@/components/templates/editorial-ivory/EditorialIvoryTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("editorial-ivory", EditorialIvoryTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

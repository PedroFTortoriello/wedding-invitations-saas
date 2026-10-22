// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { EditorialLuxuryTemplate } from "@/components/templates/editorial-luxury/EditorialLuxuryTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("editorial-luxury", EditorialLuxuryTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

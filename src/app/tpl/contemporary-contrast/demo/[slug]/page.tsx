// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ContemporaryContrastTemplate } from "@/components/templates/contemporary-contrast/ContemporaryContrastTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("contemporary-contrast", ContemporaryContrastTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

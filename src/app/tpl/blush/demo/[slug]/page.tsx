// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BlushTemplate } from "@/components/templates/blush/BlushTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("blush", BlushTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

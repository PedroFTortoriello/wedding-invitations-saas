// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { AmalfiTemplate } from "@/components/templates/amalfi/AmalfiTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("amalfi", AmalfiTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

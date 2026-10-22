// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SoftMinimalTemplate } from "@/components/templates/soft-minimal/SoftMinimalTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("soft-minimal", SoftMinimalTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

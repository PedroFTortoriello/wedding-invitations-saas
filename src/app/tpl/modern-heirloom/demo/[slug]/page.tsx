// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ModernHeirloomTemplate } from "@/components/templates/modern-heirloom/ModernHeirloomTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("modern-heirloom", ModernHeirloomTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { OliveBurgundyTemplate } from "@/components/templates/olive-burgundy/OliveBurgundyTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("olive-burgundy", OliveBurgundyTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

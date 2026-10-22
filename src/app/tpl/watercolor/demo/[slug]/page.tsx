// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { WatercolorTemplate } from "@/components/templates/watercolor/WatercolorTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("watercolor", WatercolorTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

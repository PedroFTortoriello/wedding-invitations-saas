// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PaintedMemoriesTemplate } from "@/components/templates/painted-memories/PaintedMemoriesTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("painted-memories", PaintedMemoriesTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

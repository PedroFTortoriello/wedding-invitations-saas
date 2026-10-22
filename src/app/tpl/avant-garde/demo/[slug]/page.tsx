// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { AvantGardeTemplate } from "@/components/templates/avant-garde/AvantGardeTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("avant-garde", AvantGardeTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

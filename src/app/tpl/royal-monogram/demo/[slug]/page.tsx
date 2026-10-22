// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { RoyalMonogramTemplate } from "@/components/templates/royal-monogram/RoyalMonogramTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("royal-monogram", RoyalMonogramTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

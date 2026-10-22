// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BlackTieTemplate } from "@/components/templates/black-tie/BlackTieTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("black-tie", BlackTieTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

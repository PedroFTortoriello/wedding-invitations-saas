// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("civil-minimalista", CivilMinimalistTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

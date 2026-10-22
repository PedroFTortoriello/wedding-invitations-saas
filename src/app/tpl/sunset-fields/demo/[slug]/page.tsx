// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SunsetFieldsTemplate } from "@/components/templates/sunset-fields/SunsetFieldsTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("sunset-fields", SunsetFieldsTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

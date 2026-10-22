// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PureFormTemplate } from "@/components/templates/pure-form/PureFormTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("pure-form", PureFormTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

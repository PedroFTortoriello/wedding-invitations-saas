// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SecretGardenTemplate } from "@/components/templates/secret-garden/SecretGardenTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("secret-garden", SecretGardenTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

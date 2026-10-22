// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("classico-romantico", ClassicRomanticTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

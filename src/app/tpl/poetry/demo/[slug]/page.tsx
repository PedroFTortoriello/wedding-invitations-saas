// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PoetryTemplate } from "@/components/templates/poetry/PoetryTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("poetry", PoetryTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ArchitecturalTemplate } from "@/components/templates/architectural/ArchitecturalTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("architectural", ArchitecturalTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

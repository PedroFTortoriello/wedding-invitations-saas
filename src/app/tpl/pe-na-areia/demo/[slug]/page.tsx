// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PeNaAreiaTemplate } from "@/components/templates/pe-na-areia/PeNaAreiaTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("pe-na-areia", PeNaAreiaTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

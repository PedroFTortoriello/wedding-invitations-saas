// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { OliveBranchTemplate } from "@/components/templates/olive-branch/OliveBranchTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("olive-branch", OliveBranchTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

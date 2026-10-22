// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { OliveBranchTemplate } from "@/components/templates/olive-branch/OliveBranchTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(OliveBranchTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

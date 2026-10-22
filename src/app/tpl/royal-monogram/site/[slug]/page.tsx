// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { RoyalMonogramTemplate } from "@/components/templates/royal-monogram/RoyalMonogramTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(RoyalMonogramTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

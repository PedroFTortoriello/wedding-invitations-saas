// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { BlackTieTemplate } from "@/components/templates/black-tie/BlackTieTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(BlackTieTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PeNaAreiaTemplate } from "@/components/templates/pe-na-areia/PeNaAreiaTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(PeNaAreiaTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

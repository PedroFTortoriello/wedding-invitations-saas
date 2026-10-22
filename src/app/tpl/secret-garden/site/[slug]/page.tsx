// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SecretGardenTemplate } from "@/components/templates/secret-garden/SecretGardenTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(SecretGardenTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

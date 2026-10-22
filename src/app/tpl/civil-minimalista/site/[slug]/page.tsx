// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CivilMinimalistTemplate } from "@/components/templates/civil-minimalista/CivilMinimalistTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(CivilMinimalistTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

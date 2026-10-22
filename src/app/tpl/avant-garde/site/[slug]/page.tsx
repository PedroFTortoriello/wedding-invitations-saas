// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { AvantGardeTemplate } from "@/components/templates/avant-garde/AvantGardeTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(AvantGardeTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PoetryTemplate } from "@/components/templates/poetry/PoetryTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(PoetryTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

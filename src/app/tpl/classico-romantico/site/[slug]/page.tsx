// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ClassicRomanticTemplate } from "@/components/templates/classico-romantico/ClassicRomanticTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ClassicRomanticTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

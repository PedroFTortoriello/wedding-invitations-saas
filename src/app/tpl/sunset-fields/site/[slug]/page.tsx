// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { SunsetFieldsTemplate } from "@/components/templates/sunset-fields/SunsetFieldsTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(SunsetFieldsTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

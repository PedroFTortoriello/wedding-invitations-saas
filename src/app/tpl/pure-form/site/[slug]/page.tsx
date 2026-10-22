// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { PureFormTemplate } from "@/components/templates/pure-form/PureFormTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(PureFormTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

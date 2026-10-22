// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ClassicInvitationTemplate } from "@/components/templates/classic-invitation/ClassicInvitationTemplate";
import { makeSitePage } from "@/components/templates/site-page";

export const dynamic = "force-dynamic";

const page = makeSitePage(ClassicInvitationTemplate);
export const generateMetadata = page.generateMetadata;
export default page.Page;

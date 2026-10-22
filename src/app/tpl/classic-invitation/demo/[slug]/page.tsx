// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ClassicInvitationTemplate } from "@/components/templates/classic-invitation/ClassicInvitationTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("classic-invitation", ClassicInvitationTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

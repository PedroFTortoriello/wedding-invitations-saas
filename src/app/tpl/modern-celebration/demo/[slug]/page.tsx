// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { ModernCelebrationTemplate } from "@/components/templates/modern-celebration/ModernCelebrationTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("modern-celebration", ModernCelebrationTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

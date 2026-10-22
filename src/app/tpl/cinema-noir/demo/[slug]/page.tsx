// Gerado por scripts/gen-template-routes.mjs — não edite à mão.
import { CinemaNoirTemplate } from "@/components/templates/cinema-noir/CinemaNoirTemplate";
import { makeDemoPage } from "@/components/templates/site-page";

export const dynamicParams = false;

const page = makeDemoPage("cinema-noir", CinemaNoirTemplate);
export const generateStaticParams = page.generateStaticParams;
export const generateMetadata = page.generateMetadata;
export default page.Page;

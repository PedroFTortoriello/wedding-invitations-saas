import type { Metadata } from "next";
import "./globals.css";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { Analytics } from "@/components/analytics/Analytics";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

const DESCRIPTION = "Sites de casamento editoriais com confirmação de presença, recados e presentes via Pix.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Noivar — sites de casamento premium",
    template: "%s | Noivar"
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Noivar",
    title: "Noivar — sites de casamento premium",
    description: DESCRIPTION
  },
  twitter: {
    card: "summary_large_image"
  }
};

/*
 * Pre-paint: .js libera o estado oculto do scroll-reveal. Rede de segurança: se o
 * RevealObserver não montar em 2,5s (webview lento, JS quebrado), tira o .js e o
 * conteúdo aparece sem animação — nunca uma seção em branco.
 */
const PRE_PAINT = `document.documentElement.classList.add('js');setTimeout(function(){if(!document.documentElement.dataset.revealReady)document.documentElement.classList.remove('js')},2500)`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-scroll-behavior: o Next desliga o smooth scroll durante a troca de rota.
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
        {children}
        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}

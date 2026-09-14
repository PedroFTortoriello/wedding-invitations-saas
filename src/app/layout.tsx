import type { Metadata } from "next";
import "./globals.css";
import { RevealObserver } from "@/components/motion/RevealObserver";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Noivar — sites de casamento premium",
    template: "%s | Noivar"
  },
  description: "Crie sites de casamento premium, editoriais e personalizados em poucos minutos.",
  openGraph: {
    type: "website",
    siteName: "Noivar",
    title: "Noivar — sites de casamento premium",
    description: "Crie sites de casamento premium, editoriais e personalizados em poucos minutos."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {/* Pre-paint flag so scroll-reveal only hides content when JS is live (no blank ship). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}

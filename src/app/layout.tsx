import type { Metadata } from "next";
import "./globals.css";
import { RevealObserver } from "@/components/motion/RevealObserver";

export const metadata: Metadata = {
  title: {
    default: "SaaS Wedding",
    template: "%s | SaaS Wedding"
  },
  description: "Crie sites de casamento premium, editoriais e personalizados em poucos minutos."
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

import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Demos dos modelos: cada modelo tem um segmento de rota próprio (src/app/tpl/<id>/demo),
  // para o HTML sair só com o CSS daquele modelo (ver components/templates/site-page.tsx).
  // O site do casal (/casamento/<slug>) é reescrito no middleware, que consulta o modelo no banco.
  async rewrites() {
    return [{ source: "/modelo/:template/:slug", destination: "/tpl/:template/demo/:slug" }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        // Ensaios das demos da vitrine (lib/demo-photos).
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**"
      },
      {
        // Fotos que o casal sobe para o Supabase Storage (bucket wedding-photos).
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  }
};

export default nextConfig;

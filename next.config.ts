import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

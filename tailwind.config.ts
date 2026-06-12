import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Instrument Sans", "Segoe UI", "Arial", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"]
      }
    }
  }
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1A2332",
          light: "#243042",
          dark: "#111826",
        },
        brand: {
          DEFAULT: "#F4821F",
          light: "#F9A54A",
          dark: "#D4690A",
        },
        gold: {
          DEFAULT: "#E8A020",
          light: "#F2BE55",
          dark: "#C4830A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
        glow: "0 0 20px rgba(244,130,31,0.25)",
        card: "0 2px 12px rgba(26,35,50,0.08)",
      },
      backgroundImage: {
        "navy-gradient": "linear-gradient(135deg, #1A2332 0%, #243042 100%)",
        "brand-gradient": "linear-gradient(135deg, #F4821F 0%, #E8A020 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

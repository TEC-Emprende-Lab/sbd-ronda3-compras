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
        cream:   { DEFAULT: "#FAF5EC", 2: "#F2E8D0", 3: "#E8D8B4" },
        orange:  { DEFAULT: "#E8521A", l: "#F07040", d: "#A84020" },
        ink:     { DEFAULT: "#1A1612", 2: "#2E2820" },
        border:  "#CEBF98",
        muted:   "#6E6553",
        olive:   { DEFAULT: "#6E7530", light: "#EAF0D0" },
        lavender:{ DEFAULT: "#8098C8", light: "#EEF3FF" },
      },
      fontFamily: {
        sans:    ["Poppins", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
        mono:    ["Courier New", "monospace"],
      },
      borderRadius: {
        sm: "6px", DEFAULT: "8px", lg: "12px", xl: "16px",
      },
      boxShadow: {
        card:   "0 1px 2px rgba(26,22,18,.04)",
        orange: "0 4px 16px rgba(232,82,26,.2)",
        modal:  "0 8px 32px rgba(26,22,18,.14)",
      },
    },
  },
  plugins: [],
};

export default config;

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
        cream: {
          DEFAULT: "#FAF6EE",
          2: "#F2EBD9",
          3: "#E8DCC8",
        },
        orange: {
          DEFAULT: "#E8651A",
          l: "#F4894A",
          d: "#C04E0E",
        },
        ink: {
          DEFAULT: "#1A1612",
          2: "#2E2820",
        },
        border: "#D4C8B0",
        muted: "#8A8070",
        success: {
          DEFAULT: "#3D7A5A",
          light: "#E4F0E8",
        },
      },
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(26,22,18,0.08), 0 0 0 1px rgba(212,200,176,0.4)",
        modal: "0 8px 32px rgba(26,22,18,0.16)",
        orange: "0 4px 16px rgba(232,101,26,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

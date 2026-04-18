import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#0F766E",
          hover: "#115E59",
          soft: "#CCFBF1",
        },
        accent: {
          DEFAULT: "#B45309",
          hover: "#92400E",
          soft: "#FEF3C7",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#FAF6EE",
          subtle: "#F3EEE3",
          dark: "#0F1012",
          "dark-muted": "#17181C",
          "dark-subtle": "#212328",
        },
        ink: {
          DEFAULT: "#1C1917",
          soft: "#57534E",
          faint: "#A8A29E",
          inverse: "#FAFAF9",
        },
        line: {
          DEFAULT: "#E7E5E4",
          strong: "#D6D3D1",
          dark: "#2B2B30",
        },
        proc: {
          1: "#0F766E",
          2: "#B45309",
          3: "#65A30D",
          4: "#BE185D",
          5: "#0369A1",
          6: "#7C3AED",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,25,23,0.04), 0 8px 32px -12px rgba(28,25,23,0.08)",
        soft: "0 4px 24px -8px rgba(28,25,23,0.1)",
        glass:
          "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 4px rgba(28,25,23,0.04), 0 12px 40px -12px rgba(28,25,23,0.12)",
        "glass-dark":
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.2), 0 12px 40px -12px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      backdropBlur: {
        xs: "4px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(180,83,9,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(180,83,9,0)" },
        },
        drift: {
          "0%,100%": { transform: "translate(0,0)" },
          "50%": { transform: "translate(12px,-18px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        drift: "drift 18s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

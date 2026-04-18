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
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF2FF",
        },
        accent: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
          subtle: "#F1F5F9",
          dark: "#0B1220",
          "dark-muted": "#111827",
          "dark-subtle": "#1F2937",
        },
        ink: {
          DEFAULT: "#0F172A",
          soft: "#475569",
          faint: "#94A3B8",
          inverse: "#F8FAFC",
        },
        line: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          dark: "#1F2937",
        },
        proc: {
          1: "#6366F1",
          2: "#10B981",
          3: "#F59E0B",
          4: "#EF4444",
          5: "#06B6D4",
          6: "#A855F7",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.06)",
        soft: "0 4px 16px -4px rgba(15,23,42,0.08)",
        ring: "0 0 0 3px rgba(79,70,229,0.25)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse_ring: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(249,115,22,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(249,115,22,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "pulse-ring": "pulse_ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

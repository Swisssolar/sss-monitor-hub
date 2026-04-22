import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Swiss Solar System brand
        swiss: {
          red: "#E30613",        // Swiss red, sharp accent
          redDark: "#B4050F",
          ink: "#0A0A0B",        // near-black
          paper: "#FAFAF7",      // warm off-white
          line: "#E6E4DE",
          mute: "#6B6963",
          success: "#0F766E",
          warning: "#B45309",
          error: "#B91C1C",
        },
      },
      fontFamily: {
        display: ["'Instrument Serif'", "Georgia", "serif"],
        sans: ["'Geist'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Geist Mono'", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.04", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.08", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,10,11,0.04), 0 4px 12px rgba(10,10,11,0.03)",
        pop: "0 8px 24px rgba(10,10,11,0.08)",
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.2, 0.6, 0.2, 1) both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF0EE",
        card: "#FFFFFF",
        ink: {
          DEFAULT: "#17191B",
          muted: "#5B6360",
          faint: "#8B928F",
        },
        line: "#DCDFDA",
        plum: {
          DEFAULT: "#3F1832",
          soft: "#6C2F58",
          deep: "#280F20",
        },
        guava: {
          DEFAULT: "#E2551F",
          dark: "#B8410F",
          light: "#FBE4D8",
        },
        mint: {
          DEFAULT: "#1F8F5F",
          light: "#DDF0E5",
        },
        amber: {
          DEFAULT: "#C77D0E",
          light: "#F6E7CC",
        },
        clay: {
          DEFAULT: "#A6392B",
          light: "#F3DCD8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(23, 25, 27, 0.04), 0 8px 24px -12px rgba(23, 25, 27, 0.12)",
        stamp: "0 1px 0 rgba(23, 25, 27, 0.05)",
      },
      keyframes: {
        stamp: {
          "0%": { transform: "scale(1.6) rotate(-14deg)", opacity: "0" },
          "60%": { transform: "scale(0.94) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-4deg)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        stamp: "stamp 320ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-up": "fade-up 260ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

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
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

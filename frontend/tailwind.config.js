/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "400px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        primary: {
          50: "#EEF0FD",
          100: "#DFE2FB",
          200: "#B9BFF7",
          300: "#8E97F1",
          400: "#6A6EEA",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "#372FA6",
          800: "#282180",
          900: "#1A1554",
        },
        secondary: {
          50: "#F5F1FE",
          100: "#EBE2FD",
          200: "#D3C2FB",
          300: "#B69DF8",
          400: "#9E7CF4",
          500: "rgb(var(--color-secondary-500) / <alpha-value>)",
          600: "rgb(var(--color-secondary-600) / <alpha-value>)",
        },
        success: { 500: "#22C55E", 600: "#16A34A" },
        danger: { 500: "#EF4444", 600: "#DC2626" },
        warning: { 500: "#F59E0B", 600: "#D97706" },
        info: { 500: "#0EA5E9", 600: "#0284C7" },
        surface: {
          light: "rgba(255, 255, 253, 0.72)",
          dark: "rgba(35, 39, 58, 0.78)",
        },
        canvas: {
          light: "#FAFAF8",
          dark: "#10121C",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(31, 27, 90, 0.08)",
        "glass-dark": "0 12px 36px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)",
        glow: "0 0 0 3px rgb(var(--color-primary-500) / 0.18)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

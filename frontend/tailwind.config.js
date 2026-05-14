import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "-apple-system", "sans-serif"],
        mono: ["Geist Mono", "monospace"],
      },
      fontSize: {
        xs:   ["11px", { lineHeight: "1.4" }],
        sm:   ["13px", { lineHeight: "1.4" }],
        base: ["14px", { lineHeight: "1.5" }],
        md:   ["16px", { lineHeight: "1.4" }],
        lg:   ["20px", { lineHeight: "1.3" }],
        xl:   ["24px", { lineHeight: "1.2" }],
        "2xl":["32px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "8px",
        md: "6px",
        sm: "4px",
        xs: "3px",
        full: "9999px",
      },
      colors: {
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:              "hsl(var(--sidebar))",
          foreground:           "hsl(var(--sidebar-foreground))",
          border:               "hsl(var(--sidebar-border))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        error:   "#ef4444",
        info:    "#3b82f6",
      },
      boxShadow: {
        card:  "0 1px 3px rgba(0,0,0,0.3)",
        "card-md": "0 2px 8px rgba(0,0,0,0.4)",
        modal: "0 4px 24px rgba(0,0,0,0.5)",
        sm:    "0 1px 2px rgba(0,0,0,0.2)",
      },
      transitionDuration: {
        fast: "100ms",
        base: "150ms",
        slow: "250ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        countUp: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        shimmer:          "shimmer 1.5s ease-in-out infinite",
        "fade-in-up":     "fadeInUp 250ms ease forwards",
        "count-up":       "countUp 400ms ease forwards",
      },
    },
  },
  plugins: [animate],
}


import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1200px' }
    },
    extend: {
      colors: {
        // Dark mysterious palette (replaces stardew colors)
        "mystic-bg": "#16161D",           // main background - darker, mysterious
        "mystic-panel": "#22212DCC",      // slightly transparent dark panel
        "mystic-card": "#232337C0",       // softer transparent
        "mystic-accent": "#E5E6EF",       // near-white accent text
        "mystic-purple": "#8A45FF",       // purple accent
        "mystic-pink": "#E183FC",         // bright highlight
        "mystic-blue": "#36AFE9",         // secondary blue
        "mystic-subtle": "#2B2C39",       // very subtle card
        "mystic-yellow": "#FFD464",       // for buttons, highlights
        "mystic-danger": "#EE4B6A",
        "mystic-border": "#38374A",
        "mystic-card-bg": "#221F2BCC",
        "mystic-muted": "#787794",
        "mystic-glass": "rgba(42, 42, 55, 0.95)",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        display: ['"Playfair Display"', 'serif'],
        game: ['"Press Start 2P"', 'monospace'],
      },
      borderRadius: {
        pixel: "0.25rem",
        md: "0.75rem",
        xl: "2rem"
      },
      boxShadow: {
        pixel: "0 2px 0 #16161D, 2px 0 0 #16161D",
        game: "0 2px 6px 0 rgba(29,27,44,0.18)"
      },
      backgroundImage: {
        "mystic-noise": 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAgMAAABieywaAAAACVBMVEUAAAD///9fX1+XHadJAAAAAXRSTlMAQObYZgAAAAFiS0dEPA+BkwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAAd0SU1FB+UBDQojCeN/UMgAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAAElFTkSuQmCC")',
      },
      spacing: {
        section: '2.5rem', // Extra for more vertical space
        panel: '2rem',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;


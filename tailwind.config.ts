
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
      padding: '1.5rem',
      screens: { '2xl': '1120px' }
    },
    extend: {
      colors: {
        // Stardew-pixel dark palette
        "stardew-bg": "#221F26",
        "stardew-panel": "#333336",
        "stardew-card": "#302c38",
        "stardew-accent": "#F2FCE2",
        "stardew-yellow": "#FEF7CD",
        "stardew-peach": "#FDE1D3",
        "stardew-purple": "#8B5CF6",
        "stardew-orange": "#F97316",
        "stardew-green": "#46b871",
        "stardew-border-lite": "#aaadb0",
        "stardew-border-dark": "#222",
        "stardew-primary": "#C8C8C9",
        "stardew-muted": "#8A898C",
        // Text colors
        "stardew-white": "#fff",
        "stardew-gray": "#888",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      borderRadius: {
        pixel: "0.25rem",
        // slightly chunky corners for pixel look
      },
      boxShadow: {
        pixel: "0 2px 0 #111, 2px 0 0 #111",
      },
      backgroundImage: {
        "stardew-pixels": 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAgMAAABieywaAAAACVBMVEUAAAD///9fX1+XHadJAAAAAXRSTlMAQObYZgAAAAFiS0dEPA+BkwAAAAlwSFlzAAALEgAACxIB0t1+/AAAAAd0SU1FB+UBDQojCeN/UMgAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAAElFTkSuQmCC")'
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;


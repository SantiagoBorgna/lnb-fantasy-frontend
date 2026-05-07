import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal de LNB Fantasy
        primary: "#1A3A6B",   // Azul LNB
        accent: "#E8001C",   // Rojo acento
        surface: "#0F1923",   // Fondo oscuro (mobile-first)
        card: "#1C2B3A",   // Fondo de tarjetas
        border: "#2A3F55",   // Bordes sutiles
        textMain: "#F0F4F8",   // Texto principal
        textMuted: "#7A93AC",   // Texto secundario
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      screens: {
        // Mobile-first — el breakpoint base es 390px (iPhone 14)
        xs: "390px",
      }
    },
  },
  plugins: [
    forms,
  ],
}
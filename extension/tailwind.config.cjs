/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFCFB",
          100: "#FAF8F5",
          200: "#F3EEE8",
          300: "#E8E2DB",
          400: "#D4CBC0",
        },
        warm: {
          500: "#9B9590",
          600: "#6B6560",
          700: "#4A4540",
          800: "#2D2A26",
          900: "#1A1915",
        },
        primary: {
          light: "#E8A88A",
          DEFAULT: "#C96442",
          dark: "#B5573A",
          deep: "#9A4830",
        },
        accent: {
          green: "#5BA07A",
          red: "#C4554D",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.875rem',
      }
    }
  },
  plugins: []
};

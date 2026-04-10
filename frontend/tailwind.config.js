/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8EBF0',
          100: '#C5CBD6',
          200: '#8B97AD',
          300: '#516384',
          400: '#2D4168',
          500: '#0A1F44',
          600: '#081A3A',
          700: '#061430',
          800: '#040E24',
          900: '#020818',
        },
        accent: {
          50: '#FBF6EB',
          100: '#F5EACC',
          200: '#EBD599',
          300: '#DFC066',
          400: '#C5A55A',
          500: '#B08D3E',
          600: '#8C7032',
          700: '#685325',
          800: '#443619',
          900: '#221B0C',
        },
      },
    },
  },
  plugins: [],
}

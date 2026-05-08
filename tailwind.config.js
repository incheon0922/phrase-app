/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app.css'
  ],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        mint: {
          bg: '#FBFFFD',
          surface: '#EAF3EE',
          accent: '#39B98A',
          text: '#151816',
          muted: '#98AAA2'
        }
      }
    }
  }
}

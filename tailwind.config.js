/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-purple-50', 'text-purple-700',
    'bg-blue-50', 'text-blue-700',
    'bg-emerald-50', 'text-emerald-700',
    'bg-amber-50', 'text-amber-700',
    'bg-red-50', 'text-red-700',
    'bg-gray-100', 'text-gray-700',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff', 100: '#dce6ff', 200: '#b9cdff', 300: '#85a8ff',
          400: '#4d7bff', 500: '#1a4fff', 600: '#0033e6', 700: '#0028b8',
          800: '#002196', 900: '#001a7a',
        }
      },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] }
    },
  },
  plugins: [],
}

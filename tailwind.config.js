/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'bg-purple-50','text-purple-700','bg-blue-50','text-blue-700',
    'bg-emerald-50','text-emerald-700','bg-amber-50','text-amber-700',
    'bg-red-50','text-red-700','bg-gray-100','text-gray-700',
    'dark:bg-purple-900/30','dark:text-purple-300','dark:bg-blue-900/30','dark:text-blue-300',
    'dark:bg-emerald-900/30','dark:text-emerald-300','dark:bg-amber-900/30','dark:text-amber-300',
    'dark:bg-red-900/30','dark:text-red-300','dark:bg-gray-800','dark:text-gray-300',
  ],
  theme: {
    extend: {
      colors: {
        // Palette taken from visualbrotz.com (--blue: #1B5FFF, --blue-deep: #0B3FBF, --blue-bright: #4D87FF)
        brand: {
          50:'#F0F5FF',100:'#EAF1FF',200:'#DCE8FF',300:'#B3CCFF',400:'#4D87FF',
          500:'#3D74FF',600:'#1B5FFF',700:'#0B3FBF',800:'#08308F',900:'#062566',
        },
        ink: { DEFAULT:'#0C1B33', soft:'#2D3F5C', muted:'#5F7290', faint:'#94A3B8' },
        paper: { DEFAULT:'#F7F9FC', 2:'#EEF3FA' },
        line: { DEFAULT:'#E2E9F3', soft:'#EDF2F8' },
      },
      fontFamily: {
        sans: ['var(--font-sora)','system-ui','sans-serif'],
        display: ['var(--font-display)','Georgia','serif'],
      },
      boxShadow: {
        'vb-sm': '0 1px 2px rgba(12,27,51,0.05), 0 2px 8px rgba(12,27,51,0.06)',
        'vb-md': '0 1px 2px rgba(12,27,51,0.04), 0 4px 12px rgba(12,27,51,0.08), 0 16px 32px rgba(12,27,51,0.10)',
        'vb-blue': '0 1px 2px rgba(11,63,191,0.3), 0 4px 12px rgba(27,95,255,0.22), 0 8px 20px rgba(27,95,255,0.18), inset 0 1px 0 rgba(255,255,255,0.2)',
        'vb-blue-hover': '0 2px 4px rgba(11,63,191,0.35), 0 8px 20px rgba(27,95,255,0.28), 0 16px 32px rgba(27,95,255,0.28), inset 0 1px 0 rgba(255,255,255,0.25)',
      },
    },
  },
  plugins: [],
}

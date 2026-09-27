/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface': '#ffffff',
        'surface-dim': '#f8fafc',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f8fafc',
        'surface-container': '#f1f5f9',
        'surface-container-high': '#e2e8f0',
        'surface-container-highest': '#cbd5e1',
        'on-surface': '#0f172a',
        'on-surface-variant': '#475569',
        'outline': '#94a3b8',
        'outline-variant': '#e2e8f0',
        'surface-tint': '#0284c7',
        'primary': '#0284c7',
        'on-primary': '#ffffff',
        'primary-container': '#e0f2fe',
        'on-primary-container': '#0369a1',
        'secondary': '#0369a1',
        'on-secondary': '#ffffff',
        'secondary-container': '#bae6fd',
        'tertiary': '#38bdf8',
        'error': '#dc2626',
        'error-container': '#fee2e2',
        'on-error': '#ffffff',
        'on-error-container': '#991b1b',
        'background': '#f8fafc',
        'on-background': '#0f172a',
        'surface-variant': '#f1f5f9'
      },
      boxShadow: {
        'tactile': '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'tactile-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.02)',
        'tactile-xl': '0 20px 35px -5px rgba(0, 0, 0, 0.08), 0 10px 15px -5px rgba(0, 0, 0, 0.04)',
        'tactile-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'tactile-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        'tactile-inset-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        'tactile-primary': '0 4px 14px rgba(2, 132, 199, 0.3)',
        'tactile-primary-inset': 'inset 0 1px 3px rgba(0, 0, 0, 0.15)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'body-md': ['Plus Jakarta Sans', 'sans-serif'],
        'headline-md': ['Plus Jakarta Sans', 'sans-serif']
      },
      borderRadius: {
        'DEFAULT': '0.5rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        'full': '9999px'
      }
    },
  },
  plugins: [],
};

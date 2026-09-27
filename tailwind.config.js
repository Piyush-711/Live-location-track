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
        'surface': '#fbf9f5',
        'surface-dim': '#dbdad6',
        'surface-bright': '#fbf9f5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f5f3ef',
        'surface-container': '#efeeea',
        'surface-container-high': '#eae8e4',
        'surface-container-highest': '#e4e2de',
        'on-surface': '#1b1c1a',
        'on-surface-variant': '#58423c',
        'outline': '#707881',
        'outline-variant': '#bfc7d2',
        'surface-tint': '#0284c7',
        'primary': '#0284c7',
        'on-primary': '#ffffff',
        'primary-container': '#e0f2fe',
        'on-primary-container': '#001d31',
        'secondary': '#0369a1',
        'on-secondary': '#ffffff',
        'secondary-container': '#7bc2ff',
        'tertiary': '#38bdf8',
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        'background': '#fbf9f5',
        'on-background': '#1b1c1a',
        'surface-variant': '#e4e2de'
      },
      boxShadow: {
        'tactile': '-4px -4px 10px rgba(255, 255, 255, 0.95), 4px 6px 14px rgba(180, 172, 158, 0.45)',
        'tactile-lg': '-6px -6px 14px rgba(255, 255, 255, 0.95), 6px 8px 18px rgba(180, 172, 158, 0.45)',
        'tactile-xl': '-10px -10px 24px rgba(255, 255, 255, 1), 12px 12px 28px rgba(200, 190, 172, 0.55)',
        'tactile-sm': '-2px -2px 6px rgba(255, 255, 255, 0.95), 2px 3px 6px rgba(180, 172, 158, 0.35)',
        'tactile-inset': 'inset 3px 4px 8px rgba(180, 172, 158, 0.40), inset -3px -3px 6px rgba(255, 255, 255, 0.85)',
        'tactile-inset-sm': 'inset 2px 2px 4px rgba(180, 172, 158, 0.35), inset -2px -2px 4px rgba(255, 255, 255, 0.90)',
        'tactile-primary': '-3px -3px 8px rgba(255, 255, 255, 0.70), 3px 5px 12px rgba(2, 132, 199, 0.38)',
        'tactile-primary-inset': 'inset 2px 2px 5px rgba(3, 105, 161, 0.50)'
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

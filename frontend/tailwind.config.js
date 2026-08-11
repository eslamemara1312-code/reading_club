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
        // Official Apple HIG Dynamic Palette via CSS Variables
        apple: {
          bg: 'var(--apple-bg)',
          surface: 'var(--apple-surface)',
          card: 'var(--apple-card)',
          elevated: 'var(--apple-card-elevated)',
          border: 'var(--apple-border)',
          text: 'var(--apple-text)',
          secondary: 'var(--apple-text-secondary)',
          muted: 'var(--apple-muted)',
          blue: 'var(--apple-blue)',
          gold: 'var(--apple-gold)',
          amber: 'var(--apple-amber)',
          green: 'var(--apple-green)',
          red: 'var(--apple-red)',
          header: 'var(--apple-header-bg)',
        },
        paper: {
          dark: 'var(--apple-bg)',
          surface: 'var(--apple-surface)',
          card: 'var(--apple-card)',
          elevated: 'var(--apple-card-elevated)',
          border: 'var(--apple-border)',
        },
        editorial: {
          main: 'var(--apple-text)',
          secondary: 'var(--apple-text-secondary)',
          muted: 'var(--apple-muted)',
        },
        amberGold: {
          400: '#FFE14D',
          500: 'var(--apple-gold)',
          600: '#E5C000',
        },
        terracotta: {
          400: '#FFB347',
          500: 'var(--apple-amber)',
          600: '#E08500',
        },
        sage: {
          400: '#5CE17E',
          500: 'var(--apple-green)',
          600: '#25A843',
        },
        brick: {
          400: '#FF6B63',
          500: 'var(--apple-red)',
          600: '#D93228',
        },
        bg: {
          dark: 'var(--apple-bg)',
          surface: 'var(--apple-surface)',
          card: 'var(--apple-card)',
          elevated: 'var(--apple-card-elevated)',
        },
        flame: {
          400: '#FFE14D',
          500: 'var(--apple-gold)',
          600: 'var(--apple-amber)',
        },
        gold: {
          400: '#FFE14D',
          500: 'var(--apple-gold)',
          600: '#E5C000',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"SF Pro"',
          'Cairo',
          'IBM Plex Sans Arabic',
          'system-ui',
          'sans-serif',
        ],
        editorial: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          'Cairo',
          'sans-serif',
        ],
      },
      boxShadow: {
        'apple-card': '0 8px 32px 0 rgba(0, 0, 0, 0.12)',
        'apple-glow': '0 0 30px 0 rgba(255, 214, 10, 0.2)',
        'apple-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

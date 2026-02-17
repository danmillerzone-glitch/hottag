import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Letterboxd-inspired dark theme
        background: {
          DEFAULT: '#14181c',
          secondary: '#1c2228',
          tertiary: '#242c34',
        },
        foreground: {
          DEFAULT: '#ffffff',
          muted: '#99aabb',
          subtle: '#678',
        },
        // Hot Tag accent colors - wrestling gold & fire
        accent: {
          DEFAULT: '#ff6b35',
          hover: '#ff8c5a',
          gold: '#ffd700',
          muted: '#ff6b3540',
        },
        border: {
          DEFAULT: '#2c3440',
          hover: '#456',
        },
        // Status colors
        attending: '#00c853',
        interested: '#ffd700',
        saved: '#99aabb',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config

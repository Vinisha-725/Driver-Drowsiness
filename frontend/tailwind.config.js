/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'display': ['Orbitron', 'system-ui', 'sans-serif'],
      },
      colors: {
        'neon-purple': '#a855f7',
        'neon-purple-light': '#c084fc',
        'neon-purple-dark': '#7c3aed',
        'neon-green': '#00ff88',
        'neon-yellow': '#ffcc00',
        'neon-red': '#ff0044',
        'dark-bg': '#0a0a0f',
        'dark-card': '#1a1a2e',
        'dark-border': '#16213e',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        'purple-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.9)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

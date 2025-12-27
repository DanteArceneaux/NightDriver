/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk Neon Palette
        'neon-pink': '#ff0055',
        'neon-orange': '#ffaa00',
        'neon-cyan': '#00ffee',
        'neon-green': '#00ff66',
        'neon-purple': '#aa00ff',
        
        // Dynamic Theme Colors (CSS Variables)
        'theme-primary': 'var(--color-primary, #00ffee)',
        'theme-secondary': 'var(--color-secondary, #a855f7)',
        'theme-accent': 'var(--color-accent, #ff006e)',
        
        // Demand Colors (Enhanced)
        'demand-cold': '#1e40af',
        'demand-cool': '#00ffee',
        'demand-warm': '#ffaa00',
        'demand-hot': '#ff0055',
        
        // Background Gradients
        'bg-dark-start': '#0a0e27',
        'bg-dark-mid': '#1a1f3a',
        'bg-dark-end': '#0f1419',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1419 100%)',
        'hero-surge': 'linear-gradient(135deg, rgba(255, 0, 85, 0.2) 0%, rgba(170, 0, 255, 0.2) 100%)',
        'hero-hot': 'linear-gradient(135deg, rgba(255, 170, 0, 0.2) 0%, rgba(255, 0, 85, 0.15) 100%)',
        'hero-cool': 'linear-gradient(135deg, rgba(0, 255, 238, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'count-up': 'count-up 1s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 85, 0.5)',
        'neon-cyan': '0 0 20px rgba(0, 255, 238, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 102, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}


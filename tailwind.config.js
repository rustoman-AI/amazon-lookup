/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          dark: '#0c0f17',
          obsidian: '#131921',
          surface: '#1c2430',
          orange: '#FF9900',
          amber: '#FFA41C',
          blue: '#00A8E1',
          cyan: '#00CAFF',
          accent: '#232F3E',
          card: '#161d27',
          border: 'rgba(255, 255, 255, 0.12)',
        }
      },
      fontFamily: {
        tv: ['"Amazon Ember"', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan-laser': 'laser 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-pulse': 'subtlePulse 1.8s ease-in-out infinite',
        'wave-bar': 'waveBar 1.2s ease-in-out infinite alternate',
        'float-pill': 'floatPill 3s ease-in-out infinite',
      },
      keyframes: {
        laser: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.9' },
          '50%': { transform: 'translateY(100%)', opacity: '0.4' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(255, 153, 0, 0.6), inset 0 0 15px rgba(255, 153, 0, 0.3)' },
          '50%': { boxShadow: '0 0 35px 8px rgba(0, 202, 255, 0.8), inset 0 0 25px rgba(0, 202, 255, 0.4)' },
        },
        subtlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.99)' },
        },
        waveBar: {
          '0%': { height: '15%' },
          '100%': { height: '100%' },
        },
        floatPill: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        }
      }
    },
  },
  plugins: [],
}

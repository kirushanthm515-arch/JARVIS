/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'] },
      colors: {
        cyber: {
          dark: '#050811',
          bg: '#080d19',
          card: '#0d1527',
          panel: '#121d36',
          border: 'rgba(0, 240, 255, 0.15)',
          cyan: '#00f0ff',
          violet: '#7000ff',
          blue: '#3b82f6',
          alert: '#ef4444',
          warn: '#f97316',
        },
        navy: { 950: '#03060d', 900: '#050914', 800: '#090e1a', 700: '#0f172a', 600: '#15213b' },
        accent: { DEFAULT: '#00f0ff', soft: '#38bdf8' }
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(0, 240, 255, 0.12)',
        glow: '0 0 25px -5px rgba(0, 240, 255, 0.4)',
        glowViolet: '0 0 25px -5px rgba(112, 0, 255, 0.4)',
        glowRed: '0 0 25px -5px rgba(239, 68, 68, 0.4)',
      },
      keyframes: {
        pulseRing: { '0%': { opacity: .7, transform: 'scale(.8)' }, '100%': { opacity: 0, transform: 'scale(2.0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'none' } },
        scanner: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(1000%)' } },
        glowPulse: { '0%, 100%': { opacity: .4 }, '50%': { opacity: 1 } },
        floatSlow: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      animation: {
        pulseRing: 'pulseRing 2s ease-out infinite',
        slideIn: 'slideIn .35s ease-out',
        scanner: 'scanner 3s linear infinite',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
        floatSlow: 'floatSlow 4s ease-in-out infinite',
      }
    }
  },
  plugins: []
}


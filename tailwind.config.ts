import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0e0d1a',
          secondary: '#151424',
          card: '#1c1b30',
          hover: '#242340',
          input: 'rgba(18, 16, 32, 0.9)',
        },
        brand: {
          pink: '#ffbade',
          purple: '#a855f7',
          purpleLight: '#c084fc',
          gold: '#ffd700',
          blue: '#38bdf8',
          green: '#4ade80',
        },
        text: {
          main: '#eeeef5',
          muted: '#9090aa',
          dim: '#5a5a72',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'Poppins', 'sans-serif'],
        heading: ['var(--font-poppins)', 'Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.35)',
        'glow-pink': '0 0 25px rgba(255, 186, 222, 0.35)',
      },
      borderRadius: {
        card: '12px',
        modal: '18px',
      },
    },
  },
  plugins: [],
};

export default config;

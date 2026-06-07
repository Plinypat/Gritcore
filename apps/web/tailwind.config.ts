import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#07080a',
        bg2: '#0c0f13',
        surface: '#101318',
        surface2: '#161b22',
        surface3: '#1c2230',
        border: '#1e2535',
        border2: '#263044',
        accent: '#ff6b2b',
        accent2: '#ffb347',
        accent3: '#3de8a0',
        accent4: '#5ba3ff',
        danger: '#ff4040',
        'text-primary': '#dce4f0',
        'text-secondary': '#7b8fa8',
        'text-muted': '#3d4f65',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: '#1e2535',
      },
    },
  },
  plugins: [],
};

export default config;

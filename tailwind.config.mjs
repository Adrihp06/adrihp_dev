/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: '#F3F1E7',
        ink: '#1F1F1F',
        'ink-muted': '#5c5c5c',
        accent: '#D97757',
        olive: '#4A5D4E',
        border: '#E5E5E5',
      },
      fontFamily: {
        serif: ['Fraunces', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
      },
      lineHeight: {
        relaxed: '1.7',
      },
      maxWidth: {
        content: '760px',
      },
      letterSpacing: {
        heading: '-0.02em',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

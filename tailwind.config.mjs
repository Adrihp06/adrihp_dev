/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        bg: '#f3f1ec',
        'bg-surface': '#fbfaf7',
        'bg-elevated': '#ece8e1',
        ink: '#2f3437',
        'ink-muted': '#6f7681',
        'ink-faint': '#9aa1aa',
        accent: '#8fa7a1',
        'accent-light': '#b7c8c3',
        cyan: '#bfd0dd',
        border: '#d8d3cb',
        'border-light': '#e8e4de',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      lineHeight: {
        relaxed: '1.7',
      },
      maxWidth: {
        content: '760px',
      },
      letterSpacing: {
        heading: '-0.03em',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #8fa7a1, #c5b7cf, #bfd0dd)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(143,167,161,0.14) 0%, transparent 70%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

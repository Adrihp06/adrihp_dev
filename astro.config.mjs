import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://adrihp.pages.dev',
  output: 'static',
  integrations: [tailwind()],
  build: {
    inlineStylesheets: 'auto',
  },
});

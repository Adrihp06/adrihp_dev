# adrihp_dev

A high-performance, minimalist personal website built with [Astro](https://astro.build).

## Design Philosophy

This website follows an **Anthropic-esque** (Editorial Tech) design approach:

- 📄 **Warm, paper-like backgrounds** - Comfortable reading experience
- ✍️ **Space Grotesk and Inter** - Clear headings and readable text
- 🎨 **Clean lines and minimal design** - Content takes center stage
- ⚡ **Performance-first** - Fast loading, minimal JavaScript

## Features

- 🚀 Built with Astro for optimal performance
- 📱 Fully responsive design (mobile, tablet, desktop)
- ♿ Accessible and semantic HTML
- 🔒 Type-safe with TypeScript (strictest mode)
- ✅ Comprehensive test coverage with Vitest
- 🎯 Content-first approach

## Getting Started

### Prerequisites

- Node.js 24.15.0
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Project Structure

```
/
├── public/
│   └── favicon.svg          # Site favicon
├── src/
│   ├── __tests__/           # Test files
│   │   └── index.test.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro # Main layout with design system
│   │   └── BaseLayout.test.ts
│   └── pages/
│       └── index.astro      # Homepage
├── astro.config.mjs         # Astro configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest configuration
└── package.json
```

## Development Methodology

This project follows **strict Test-Driven Development (TDD)**:

1. Write failing tests first
2. Implement minimal code to pass tests
3. Refactor while keeping tests green
4. All features are tested before implementation

## Design System

### Colors

- Background: `#faf8f5` (warm, paper-like)
- Text: `#1a1a1a` (dark, readable)
- Text Muted: `#5c5c5c` (subtle)
- Accent: `#d4a574` (warm, editorial)
- Border: `#e5e1da` (soft dividers)

### Typography

- **Headings**: Georgia, Garamond (serif)
- **Body**: System fonts (sans-serif)
- **Hierarchy**: Clear sizing and spacing

### Spacing

- Base unit: `1rem`
- Scale: xs (0.5×), sm (1×), md (2×), lg (3×), xl (4×)

## Build & Deploy

```bash
# Type check
npm run build

# Output in dist/
```

The site is optimized for static hosting on platforms like:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## License

ISC

---

Built with ❤️ using Astro
## Cloudflare Pages

Connect `Adrihp06/adrihp_dev` through the Pages Git integration:

- Production branch: `main`
- Project name: `adrihp` (subject to availability)
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repository root

The site is static and needs no Cloudflare adapter or server secrets. `.node-version` pins the build runtime. Each push to `main` triggers a deployment after the Git integration is connected.

The production design is in `src/layouts/PortfolioLayout.astro`, `src/components/portfolio/`, and `src/styles/portfolio.css`. Local Lavish review files are excluded from Git and are not build dependencies. Blog sources are maintained under `posts/`; only the two entries in `posts/published.json` are published. Unpublished Spanish and LinkedIn drafts remain local.

`npm test` includes a production build and checks local navigation, asset URLs, article publication scope and the home-page section order, alongside the orbital-controller and existing unit tests.

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

## Article AI prompt

Every published article includes an inline **Copy prompt** action below its
header. It copies a summary and explanation prompt together with the complete
article Markdown and its URL, so the reader's AI does not need to browse the
site. The prompt asks for a concise summary, step-by-step explanations, two
examples and a glossary while preserving the source's evidence and limitations.
Images are not copied; their captions
and Markdown references remain in the text.

Readers can preview and manually copy the same text. If clipboard access is
unavailable or denied, the preview opens with its text selected. Without
JavaScript, the preview remains available and the automatic-copy button stays
hidden. No AI service is called by the site.

## Post view counter

Articles and the blog index load counts from `/api/views`. Only an article kept
visible for three continuous seconds sends a visit. A random `sessionStorage`
UUID is reused in that tab; the database deduplicates each article/session pair,
including simultaneous requests and reloads. These are approximate visits, not
unique people or proof that an article was read. A new tab/session may count
again. Browsers with blocked storage only display counts.

The static site does not wait for this API. If it is disabled, unavailable, or
JavaScript is blocked, the metric stays hidden. Counts start at activation and
do not import Medium traffic. The listing reads all counts in one request.

### Cloudflare configuration

`wrangler.jsonc` preserves the existing Pages settings for `adrihp` and binds
`VIEWS_DB` to `adrihp-views` in **production only**. The production origin is
`https://adrihp.pages.dev`. Local development and preview deployments are disabled
by default and have no production database binding.

The database and initial migration were provisioned on 2026-09-29, and
`VIEWS_HASH_SECRET` is stored as a Production secret in Pages. Secret values never
belong in Git. Keep this value stable between deployments.

Deploy the feature through the existing Git integration by pushing the code and
configuration to `main`. Cloudflare then builds the static HTML and the
`/api/views` Pages Function. The configuration and secret take effect on that
new deployment; provisioning alone does not update the live website.

For future schema changes, authenticate with `npx wrangler login`, then run
`npx wrangler d1 migrations apply adrihp-views --remote --env production` before
deploying compatible code. If moving to a custom domain, update `VIEWS_ORIGIN`
to its exact HTTPS origin with no trailing slash.

After deployment, check `/api/views`, open an article for three seconds, and
reload it: the count should increase once, then stay unchanged in the same tab.

The API additionally requires requests to arrive on `VIEWS_ORIGIN`; deployment
aliases cannot increment counts. The write endpoint checks Origin, validates
published slugs and UUIDs, caps request bodies, and limits new views to 100 per
IP per UTC day across articles. This is a basic abuse bound, not bot detection;
shared networks may undercount. Cloudflare supplies the trusted connecting IP.
Only a daily HMAC bucket is stored temporarily, never the raw IP. Expired buckets
are removed on the next write. Permanent data consists of totals and random
session hashes per article; the transient bucket fields are cleared by the SQL
trigger. No analytics cookies or third-party tracking scripts are added.

### Local validation

`npm test` exercises the API against a real local D1 runtime (Miniflare), including
concurrent deduplication, rate limits and rejected requests, plus client behavior.
`npm run build` checks types and the static output.

For an interactive local test, use a separate disposable checkout configured from
`wrangler.example.jsonc`, with a local database ID, origin `http://localhost:8788`,
and a **test-only** hash secret in `.dev.vars`. Apply the migration with `--local`
and run `npx wrangler pages dev dist --ip localhost --port 8788`. Never replace the
tracked production configuration with local test settings or use `--remote` for
local validation.

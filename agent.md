# Project Blueprint: Personal Portfolio & Blog (TDD Driven)

## 1. Project Overview
Build a high-performance, minimalist personal website using **Astro**.
- **Design Style:** **Anthropic-esque** (Editorial Tech). Warm, paper-like backgrounds, strong serif typography, clean lines.
- **Core Philosophy:** Content-first, type-safe, and robust.
- **Development Methodology:** **Strict TDD**. No feature is built without a failing test first.

## 2. Tech Stack
- **Framework:** Astro (Latest).
- **Styling:** Tailwind CSS + Tailwind Typography.
- **Testing (Mandatory):**
  - **Unit:** Vitest (for logic, helpers, and data schemas).
  - **E2E:** Playwright (for route rendering, navigation, and UI interaction).
- **Content:** Astro Content Collections.
- **Fonts:**
  - *Serif:* 'Fraunces' or 'Playfair Display' (Headings).
  - *Sans:* 'Inter' or 'Geist' (Body).

## 3. Design System Specs (Anthropic Vibe)
- **Palette:**
  - `bg-paper`: `#F3F1E7` (Warm cream/bone) - *Primary Background*.
  - `text-ink`: `#1F1F1F` (Soft black) - *Primary Text*.
  - `accent`: `#D97757` (Burnt Orange) or `#4A5D4E` (Olive) - *Subtle highlights*.
  - `border-thin`: `1px solid #E5E5E5`.
- **Typography:**
  - H1-H3: Serif, tight tracking, high contrast.
  - Body: Sans-serif, relaxed line-height (1.7).

## 4. Sitemap & Requirements

### A. Home (`/`)
- **Hero:** Intro text (Serif).
- **"The Now":** Brief section on current focus.
- **Trajectory:** Chronological CV list (Role, Company, Date).

### B. Projects (`/projects`)
- Grid layout of project cards.
- Each card displays: Title, Description, Tags, Links (Repo/Live).

### C. Blog (`/blog`)
- List of posts (sorted by date).
- **Tagging System:**
  - Posts have tags (e.g., `#book`, `#project`).
  - Clicking a tag filters the list.

### D. Contact (`/contact`)
- Simple text layout with email and social links.

## 5. Data Schema (Content Collections)

**Location:** `src/content/config.ts`

**Schema: `blog`**
```typescript
z.object({
  title: z.string(),
  pubDate: z.date(),
  description: z.string(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
})
```

**Schema: `projects`**
```typescript
z.object({
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  link: z.string().url().optional(),
  repo: z.string().url().optional(),
  featured: z.boolean().default(false),
})
```

## 6. TDD Implementation Plan (The "Red-Green-Refactor" Cycle)
The Agent/Developer must follow this sequence strictly.

### Cycle 1: Environment & Setup
- **Task:** Initialize Astro + Tailwind.
- **Test (System):** Verify `npm run dev` starts.
- **Test (Config):** Verify Tailwind is loading correctly.

### Cycle 2: Data Schemas (Unit Tests)
- **Goal:** Ensure content structure is valid before building UI.
- **RED (Write Test):** Create `tests/unit/schemas.test.ts`.
  - Test that a blog post without tags throws an error.
  - Test that a project without a title throws an error.
- **GREEN (Implement):** Define `src/content/config.ts` with Zod schemas to satisfy tests.
- **Refactor:** Optimize schema types.

### Cycle 3: The "Now" & CV Data (Unit/Component Tests)
- **RED:** Create `tests/unit/cvLoader.test.ts`.
  - Mock a JSON file for CV data.
  - Assert the loader function returns data sorted by date.
- **GREEN:** Create the JSON data file and the loader helper function.

### Cycle 4: Routing & Basic Pages (E2E Tests)
- **Goal:** Ensure pages exist.
- **RED (Playwright):** Create `tests/e2e/navigation.spec.ts`.
  - `test('Home page has correct title')`: Visit `/`.
  - `test('Navigate to Blog')`: Click "Blog", expect URL `/blog`.
  - `test('Navigate to Projects')`: Click "Projects", expect URL `/projects`.
  - `test('Navigate to Contact')`: Click "Contact", expect URL `/contact`.
- **GREEN:** Create `pages/index.astro`, `pages/blog/index.astro`, etc., with minimal HTML to pass the route check.

### Cycle 5: UI Components (Visual/Integration)
- **RED:** Create `tests/e2e/home.spec.ts`.
  - Expect to find an H1 with specific class (Serif font).
  - Expect to find the "Trajectory" section.
- **GREEN:** Implement the Hero and Timeline components using Tailwind and the Anthropic design tokens.

### Cycle 6: Blog Logic & Tagging (The Complex Part)
- **RED (Unit):** `tests/unit/tags.test.ts`.
  - Input: Array of posts with tags `['book', 'tech']` and `['tech']`.
  - Output: Function `getUniqueTags()` should return `['book', 'tech']`.
- **GREEN:** Implement `getUniqueTags` utility.
- **RED (E2E):** `tests/e2e/blog.spec.ts`.
  - Visit `/blog`.
  - Click on a tag pill "book".
  - Expect URL to be `/tags/book` OR URL query `?tag=book`.
  - Expect the list to only show posts with "book" tag.
- **GREEN:** Implement the filtering logic in `pages/blog/[...page].astro` or `pages/tags/[tag].astro`.

## 7. Rules for the Agent
- **Never write a component without defining what it should do in a test first.**
- **Keep it Simple:** Do not over-engineer the TDD. For static content, E2E (Playwright) is often more valuable than Unit tests.
- **Style Strictness:** Always check against the "Anthropic" design guidelines (Serif headers, Warm background) when writing CSS.

# Knowledge base

Source of truth for the agent-facing knowledge served at `https://adrihp.dev/mcp`
and in `/llms.txt`. Content is public: never include private contact details
(phone), salaries, client-confidential data, internal system names or anything
not already safe to say publicly.

## Layout

One Markdown file per entry, grouped by category folder:

| Folder | `category` | One entry per |
| --- | --- | --- |
| `work/` | `work` | Employer / position. Deep explanation of the processes carried out there. |
| `education/` | `education` | Degree. What was studied, final project, how it relates to the work. |
| `projects/` | `projects` | Personal project (currently Travel Ruter). |
| `interests/` | `interests` | Personal interests (a single file is fine). |

The file name (without `.md`) is the entry `id`. Use lowercase kebab-case,
for example `work/disa.md` → `disa`. Ids are unique across all categories.

## Frontmatter (YAML)

```yaml
---
title: "Data Scientist — DISA Holding Energético"   # required
category: work                 # required: work | education | projects | interests
summary: "One or two sentences an agent can quote."   # required
organization: "DISA Holding Energético"   # optional (work, education)
role: "Data Scientist"         # optional (work), degree name for education
location: "Tenerife, Spain"    # optional
start: "2023-09"               # optional, YYYY-MM
end: "2025-12"                 # optional, YYYY-MM; omit or null when ongoing
tags: ["mlops", "optimization"]   # optional
links:                         # optional, public URLs only
  - { label: "Article", url: "https://adrihp.dev/blog/..." }
order: 1                       # optional, lower first within a category
draft: true                    # optional, default false; drafts are NOT published
updated: "2026-11-15"          # required, YYYY-MM-DD
---
```

## Body

Plain Markdown. Every `## Heading` starts a **section**; agents can request a
single section by its slug (`## Route optimization` → `route-optimization`).
Text before the first `##` is the entry introduction. Use `###` inside a section
freely.

Recommended sections:

- **work**: `Context`, `Responsibilities`, one `##` per process or project
  (problem → approach → stack → outcome → my role), `Stack`, `Scope and limits`.
- **education**: `Overview`, `Curriculum`, `Final project`, `Relation to my work`.
- **projects**: `What it is`, `My role`, `Architecture`, `Key decisions`,
  `Status and limits`.
- **interests**: free.

`Scope and limits` (or `Status and limits`) states what was *not* done or what
was shared work, so agents do not overstate.

Unknowns stay as HTML comments addressed to Adrián, for example
`<!-- TODO(Adrián): which solver library was used? -->`. Comments are stripped
from the published output.

## Drafts and review

This repository is public, so unreviewed entries must not be committed.

- Entries pending review live in `knowledge/_drafts/<category>/<id>.md`, which is
  gitignored. They never reach GitHub or the Cloudflare build.
- Preview them locally with `KNOWLEDGE_INCLUDE_DRAFTS=1 npm run dev` (or
  `npm run build` followed by `npx wrangler pages dev dist` to test `/mcp`).
- To publish: resolve every `TODO(Adrián)`, set `draft: false` and move the file
  to `knowledge/<category>/`. The build fails if a published entry still contains
  a `TODO(` comment.

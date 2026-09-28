# Posts

Editorial sources live here, one folder per article. The public website publishes **English only**. `published.json` is the explicit publication list; currently it contains JEV and Mnemosyne. Spanish and LinkedIn editions remain local editorial sources and are excluded from this public repository.

- [JEV and Travel Ruter](jev-travel-ruter-context-cache-agent-efficiency/README.md): English article, five figures, three data tables, with unpublished editions retained locally.
- [Mnemosyne](mnemosyne-bug-bounty-duplicate-detection/README.md): the author's December 2025 Medium article, with three redrawn SVG diagrams.
- `_archive/`: the three superseded example blog posts; not published.

```text
posts/
├── published.json
├── <article-slug>/
│   ├── README.md
│   ├── source/                  # Original text/provenance, when available
│   └── web/
│       ├── article-en.md        # Canonical editable English source
│       ├── metadata.json
│       ├── images/
│       └── data/                # Optional source data
└── _archive/
```

Run `npm run sync:posts` after editing. Development and production builds run it automatically. It generates `src/content/blog/*.md` and `public/posts/<slug>/` from the publication list; do not edit those generated files directly. Removed entries lose their generated route and assets at the next build. Edit the publication date and tags in `published.json`, and title/description in the article's metadata. Publishing to a hosting service remains a separate deployment operation.

# JEV: context selection and agent efficiency

The public English article is maintained in `web/article-en.md`. Publication metadata is in `web/metadata.json`; figures and tables are in `web/images/` and `web/data/`.

The article reports a small paired evaluation and its limitations. Unpublished editorial drafts remain outside the public repository. Run `npm run sync:posts` to regenerate the website content after editing.

The reported cohort contains 30 distinct four-turn scenarios, evaluated once per architecture: 120 turns per arm. Detailed instrumentation and scenario examples cover 10 of those scenarios, or 40 turns per arm. Latency distributions, cache share and trace diagnostics refer to that subset. Full-cohort cost, request and token totals are calculated proportionally at the same rates and marked in Table 2. Keep these scopes explicit in prose, CSV exports, figure labels and captions.

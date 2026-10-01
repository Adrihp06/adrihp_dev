# Figure placement and accessibility

The article already places the figures and their captions in order. Use the following text in the website image alt attribute. Keep each caption once.

## Figure 1: images/figure-01-architecture.png

Alt: Application-owned preparation, JEV decisions and Luna execution within Travel Ruter

Caption: Figure 1. Legacy and JEV-enabled workflows, both using the same Luna model. The preparation stage moves bounded evidence and capability decisions ahead of Luna; the shared execution boundary retains validation, confirmation and persistence. Both paths can request additional reads. This is a conceptual architecture comparison, not a measured sequence of calls. The separate memory-update agent is outside the experiment.

## Figure 2: images/figure-02-evidence.png

Alt: An illustrated note carries identity, scope and source text into evidence selection

Caption: Figure 2. Anatomy of the semantic evidence path. The note, identifier and quoted text are illustrative, not a captured benchmark response. Source relationships prevent a relevant excerpt from being applied to the wrong POI; coverage metadata tells Luna what the selection does not establish. Small, complete scoped collections can bypass the semantic judgment, as described below.

## Figure 3: images/figure-03-cache.png

Alt: Additive tool definitions preserve earlier history while extending capabilities

Caption: Figure 3. Illustrative loading of three initial tools followed by four additional tools, alongside measured request transitions in the ten-scenario instrumented subset. In that subset's JEV arm, 67 Luna requests comprised ten initial catalogues, 54 stable transitions and three additive expansions. No catalogue replacement, input-history prefix change or instruction change was observed. This is structural evidence; the provider's cached-token receipts separately establish actual reuse.

## Figure 4: images/figure-04-results.png

Alt: Latest holdout: latency, total cost and response acceptance by architecture

Caption: Figure 4. Reported cohort outcomes, measured subset rates and proportional full-cohort totals. A: mean, median and p95 completion latency over the forty instrumented turns per arm. B: proportionally calculated cost waterfall for 120 turns per arm, including JEV and cache-write charges. C: measured reductions in Luna work, with proportional request and token totals for 120 turns. D: reported response acceptance for the thirty-scenario cohort; relaxed-source acceptance is a proportional expression of the subset sensitivity rates. The cost decomposition is accounting, not a component ablation. GPT-6 Astra grading was nonblind; the alias-prompt ambiguity is addressed in the text. No population-level superiority is claimed.

## Figure 5: images/figure-05-scenarios.png

Alt: Per-scenario latency and total cost changes, with response acceptance counts

Caption: Figure 5. Relative changes for the ten instrumented scenario examples, computed as (JEV / reference − 1) × 100. Each point is a whole-scenario change, not a confidence interval; lines connect that estimate to zero. Latency uses the four-turn mean and cost includes all inference in the scenario. Changes are calculated before rounding the displayed latency values. Acceptance counts run from reference to JEV. The missing-train case is the single efficiency regression in this subset. The asterisk marks the alias prompt with the disclosed approval ambiguity.

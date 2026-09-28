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

Caption: Figure 3. Illustrative three-tool then four-tool expansion, alongside measured request transitions. In the JEV arm, 67 Luna requests comprised ten initial catalogues, 54 stable transitions and three additive expansions. No catalogue replacement, input-history prefix change or instruction change was observed. This is structural evidence; the provider's cached-token receipts separately establish actual reuse.

## Figure 4: images/figure-04-results.png

Alt: Latest holdout: latency, total cost and response acceptance by architecture

Caption: Figure 4. Four views of the same paired holdout. A: mean, median and p95 completion latency. B: accounting waterfall from reference cost, subtracting the Luna cost difference and adding JEV inference; cache-write charges are included. C: Luna requests and token volumes relative to the reference. D: response acceptance under the frozen rubric and after relaxing only the source restriction. The cost decomposition is accounting, not a component ablation. Grading was nonblind; the alias-prompt ambiguity is addressed in the text. No population-level superiority is claimed.

## Figure 5: images/figure-05-scenarios.png

Alt: Per-scenario latency and total cost changes, with response acceptance counts

Caption: Figure 5. Relative changes for all ten paired scenarios, computed as (JEV / reference − 1) × 100. Each point is a whole-scenario change, not a confidence interval; lines connect that estimate to zero. Latency uses the four-turn mean and cost includes all inference in the scenario. Acceptance counts run from reference to JEV. The missing-train case is the single efficiency regression. The asterisk marks the alias prompt with the disclosed approval ambiguity.

# Benchmark table scopes

`table-01.csv` describes the integration choices, rather than benchmark results.

`table-02.csv` combines author-confirmed outcomes for 30 distinct four-turn scenarios (120 turns per architecture) with efficiency measurements from the 10-scenario instrumented subset (40 turns per architecture). Metric labels identify each scope. Full-cohort cost, request and token totals are calculated by multiplying the subset totals by three. Latency mean, median and p95, cache share and relative reductions retain their measured subset values; they are not multiplied by three.

`table-03.csv` contains the 10 instrumented scenario examples. Acceptance counts are out of four turns per example and architecture. Latency and cost changes use the underlying values before display rounding. These rows are examples from the cohort, rather than a listing of all 30 scenarios.

---
title: "Mnemosyne — ReAct GenAI Agent"
description: "An autonomous ReAct Agent (Claude Sonnet 4.5) that iteratively plans, executes, and refines search strategies to detect duplicate vulnerability reports with explainable reasoning."
tags: ["genai", "agents", "llm", "qdrant", "python"]
repo: "https://github.com/Adrihp06"
featured: true
---

Mnemosyne is an autonomous ReAct Agent powered by Claude Sonnet 4.5 that iteratively plans, executes, and refines search strategies to detect duplicate vulnerability reports with explainable reasoning.

## Architecture

The system implements a **Hybrid Search architecture** using Qdrant, fusing semantic (BGE) and keyword (BM25) retrieval via Reciprocal Rank Fusion (RRF). Results are optimized with Cross-Encoder re-ranking using FlashRank for high precision.

## Key Features

- **ReAct Pattern**: Plan → Execute → Observe → Refine loop for iterative search refinement
- **Hybrid Retrieval**: Combining dense (BGE embeddings) and sparse (BM25) search
- **Reciprocal Rank Fusion**: Merging results from multiple retrieval strategies
- **Cross-Encoder Re-ranking**: FlashRank for final precision optimization
- **Explainable Reasoning**: Full chain-of-thought for every deduplication decision

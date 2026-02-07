---
title: "Building ReAct Agents for Production"
pubDate: 2025-01-15
description: "Lessons learned from building Mnemosyne — a ReAct agent for duplicate vulnerability detection using Claude and hybrid search."
tags: ["genai", "agents", "llm"]
draft: false
---

Building autonomous agents that actually work in production is harder than the demos suggest. Here's what I learned building Mnemosyne, a ReAct agent for duplicate vulnerability report detection.

## The ReAct Pattern

The ReAct (Reasoning + Acting) pattern gives LLMs a structured loop: **Think** about what to do, **Act** by calling a tool, **Observe** the result, and repeat. This turns a single-shot prompt into an iterative problem-solver.

The key insight is that the agent doesn't need to get it right on the first try. It can refine its approach based on intermediate results.

## Hybrid Search Matters

Pure semantic search misses lexical matches. Pure keyword search misses semantic similarity. For vulnerability deduplication, we needed both — BGE embeddings for semantic understanding and BM25 for exact term matching, fused via Reciprocal Rank Fusion.

## Cross-Encoder Re-ranking

The retrieval stage is fast but imprecise. Adding a Cross-Encoder (FlashRank) as a re-ranker on the top candidates dramatically improved precision without sacrificing latency, since it only processes a small subset of results.

## What I'd Do Differently

- Start with evaluation metrics before building the agent
- Invest more in structured logging for debugging agent traces
- Use smaller, faster models for the retrieval decision step

---
title: "AI for Marine Conservation: Bioacoustic Monitoring"
pubDate: 2023-07-10
description: "How we built an AI-driven sound classification system to monitor marine ecosystems and quantify human noise impact."
tags: ["data-science", "deep-learning", "research"]
draft: false
---

During my time at Loro Parque Fundación, I worked on one of the most rewarding projects of my career: using AI to listen to the ocean.

## The Problem

Marine ecosystems are increasingly affected by anthropogenic noise — shipping, construction, sonar. But measuring this impact requires processing massive volumes of underwater audio recordings. Manual analysis doesn't scale.

## The Pipeline

We engineered a high-throughput data pipeline to ingest and process terabytes of marine bioacoustic data. The pipeline calculated key acoustic indexes (ACI, ADI, NDSI) to quantify the soundscape and detect changes over time.

## Sound Event Detection

The core AI component was a Sound Event Detection (SED) system that could classify audio segments into categories: biological sounds, anthropogenic noise, and environmental noise. This allowed automated, continuous monitoring of marine environments.

## What I Learned

Working with audio data is fundamentally different from tabular or image data. Spectrograms bridge the gap to computer vision techniques, but the temporal dimension adds complexity. Domain expertise from marine biologists was essential — the model needed to distinguish whale calls from boat engines, not just "sound A" from "sound B."

---
title: "MLOps in Practice: What They Don't Teach You"
pubDate: 2024-11-20
description: "Real-world lessons from deploying ML pipelines at scale with Docker, Kubernetes, and ArgoCD."
tags: ["mlops", "docker", "kubernetes"]
draft: false
---

After over a year of building and maintaining ML production pipelines, here are the things I wish I'd known from the start.

## The Gap Between Training and Serving

Most ML courses end at `model.fit()`. In production, that's where the work begins. You need reproducible environments, versioned models, automated retraining, monitoring, and rollback strategies.

## Docker Is Non-Negotiable

Every ML pipeline should be containerized from day one. Not "we'll dockerize it later" — start with Docker. The reproducibility payoff is immediate and compounds over time.

## GitOps with ArgoCD

Using ArgoCD for continuous deployment of ML services means your model deployments are versioned, auditable, and reversible. Define your desired state in Git and let the system converge.

## MLflow for Governance

MLflow in Databricks gave us model registry, experiment tracking, and data lineage in one place. The model registry alone justified the investment — knowing exactly which model is in production and how it was trained is critical.

## Key Takeaways

1. Automate everything: if you do it twice, script it
2. Monitor model performance, not just system health
3. Version your data, not just your code
4. Keep your training and serving environments identical

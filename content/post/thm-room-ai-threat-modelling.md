---
title: TryHackMe AI Threat Modelling, STRIDE, ATLAS and OWASP
date: 2026-07-31T21:15:00+05:30
lastmod: 2026-07-31T21:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-ai-threat-modelling/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - AI
  - LLM Security
  - Threat Modelling
  - MITRE ATLAS
  - OWASP

draft: false
description: "Walkthrough of the TryHackMe AI Threat Modelling room, adapting STRIDE for AI, enriching with MITRE ATLAS, and mapping OWASP LLM Top 10 risks to components."
---

## AI Threat Modelling

This is a **defender-focused** room, and a welcome change of pace. There's no box to pop and no flag hidden in a header, you're a threat analyst at MegaCorp, your CISO wants an AI risk assessment before the board meeting, and you have a week.

MegaCorp has deployed three AI systems:

- A **customer chatbot** on an LLM, wired to internal knowledge bases through a RAG pipeline
- An **internal recommendation engine** processing sensitive customer data
- An **automated fraud detection system** making real-time authorisation calls on transactions

Medium difficulty, 60 minutes, 8 tasks. The room's real argument is a good one: **STRIDE isn't obsolete, it's just under-specified for AI.** Let's work through it task by task.

## Task 1: Introduction

The framing is that AI is already in production everywhere, and most security teams were never trained to assess it. Traditional threat modelling still gives you a foundation, STRIDE has done that job for over two decades, but AI adds assets and failure modes those frameworks never anticipated. Training data can be poisoned, weights stolen, prompts injected. And outputs are **non-deterministic**, so the same system can behave differently on identical input.

**I understand the learning objectives and am ready to learn about AI threat modelling!**

> `No answer needed`

## Task 2: AI-Specific Assets and Attack Surfaces

If you've threat modelled web apps, you know the asset list: databases, source, config, keys, credentials. AI adds a category most teams have never inventoried.

| Asset | Why it matters |
|---|---|
| **Training data** | Poisoning corrupts outputs *at the source*. The damage is baked into the model, not sitting in a row you can revert. |
| **Model weights** | These *are* the model. Stolen weights mean a functional copy of your AI, months of compute, gone. |
| **Embedding vectors** | Numerical representations used for retrieval in RAG, recommendations and fraud features. Poison them and you change what the model *sees*. |
| **System prompts** | Leak these and you hand over your guardrails, business logic and security controls, a roadmap for bypassing them. |
| **Feature stores** | Tamper with features and you change the model's input at inference time without touching the model at all. |
| **Model registry** | Compromise it and an attacker swaps a clean model for a backdoored one. Nobody may notice for a long time. |

The point that lands hardest: **you can't rotate a stolen model.** A leaked credential is a bad day; leaked weights are a permanent transfer of capability.

The task also names two properties that shape everything downstream, **non-determinism** (same input, different output, so incident reproduction is genuinely hard) and the **black box problem** (you can't step through a neural network the way you trace a code path).

### Task 2, Questions and Answers

**In a RAG-based system, which AI asset type is used to retrieve relevant context at query time?**

> `Embedding Vectors`

**An attacker gains access to MegaCorp's model registry and swaps the production model for a modified version. Which AI-specific asset has been compromised?**

> `Model Registry`

## Task 3: Data Supply Chain and STRIDE's Gaps

Traditional apps have a *software* supply chain. AI inherits all of that and adds a second one built around **data**, in five stages:

1. **Data collection**, scraping, purchased datasets, internal DBs, user content. Anyone who can influence a source has a foothold.
2. **Cleaning and labelling**, corrupted labels teach the model wrong associations. A mislabelled dataset doesn't *look* corrupted.
3. **Model training**, any poison that survived is now in the weights. You may need a full retrain, not a patch.
4. **Validation and packaging**, a backdoored model passes validation, because the trigger inputs aren't in the validation set.
5. **Inference**, for LLMs this includes retrieval at query time, which is an injection point traditional apps simply don't have.

The critical difference from software supply chains is **time**. A malicious npm package gets caught and reverted in hours. A poisoned dataset may not surface for months.

The task then makes its central argument, four specific places STRIDE comes up short:

- **Training-data integrity isn't first-class.** Tampering covers data in transit and at rest, but poisoning is diffuse and delayed. It doesn't throw an error.
- **Adversarial examples don't fit one category.** They're part Tampering, part Spoofing, part Elevation of Privilege depending on context.
- **"Privilege" has expanded.** When a model can browse, execute code and query databases, a jailbreak hands over the model's entire toolset.
- **Model theft is a different kind of disclosure.** Extracting weights via API queries isn't exfiltrating a dataset, it's exfiltrating a trained intelligence.

### Task 3, Questions and Answers

**An attacker injects crafted data points into a training pipeline over several months, gradually shifting the model's decision boundaries. At which supply chain stage does the attacker inject the malicious data?**

> `Data Collection`

**Which STRIDE category is insufficient for capturing the delayed, diffuse effects of training data poisoning?**

> `Tampering`

{{< ad >}}

## Task 4: Adapting STRIDE for AI Systems

This is the core of the room. Rather than discard STRIDE, you retune each category for AI.

| STRIDE | Primary AI manifestation | MegaCorp example |
|---|---|---|
| **S**, Spoofing | **Data source impersonation** (RAG injection) | Fake policy docs injected into the chatbot's knowledge base |
| **T**, Tampering | **Data poisoning** | Crafted transactions shift the fraud model's decision boundaries |
| **R**, Repudiation | **No decision audit trail** | Can't explain why the fraud model approved a transaction three weeks ago |
| **I**, Info Disclosure | **Model extraction** | Competitor reconstructs the recommendation engine from API queries |
| **D**, Denial of Service | **Inference cost exploitation** | Chatbot bill goes from \$15k to \$180k; status page stays green |
| **E**, Elevation of Privilege | **Jailbreaking / guardrail bypass** | Jailbroken chatbot queries the customer PII table via its DB tools |

Two details worth pulling out.

**Prompt injection is context-dependent.** It maps to **Tampering** when the attacker is altering the model's input, but to **Elevation of Privilege** when the goal is bypassing guardrails. Same technique, different category depending on intent, which is exactly the kind of blurring STRIDE wasn't built for.

**Denial of Wallet is the sharpest idea here.** Traditional DoS takes you offline. This doesn't. The service stays up, the status page stays green, and the attack lands entirely on your cloud bill. Availability monitoring will never catch it; only cost anomaly detection will.

The task closes by admitting what STRIDE *still* misses even after adaptation: adversarial examples (spanning three categories), **model bias and fairness** (a real compliance risk, but the model isn't being "attacked"), and **emergent behaviours**, you can't threat model a capability nobody predicted would exist.

### Task 4, Questions and Answers

**What is the primary AI-specific manifestation of Information Disclosure in the STRIDE-AI mapping?**

> `Model Extraction`

**An attacker crafts prompts that cause an LLM to bypass its safety guidelines and content restrictions. Which STRIDE category does this map to?**

> `Elevation of Privilege`

**Which OWASP LLM Top 10 (2025) entry addresses the risks of AI systems being granted too many permissions or too much autonomy?**

> `LLM06: 2025, Excessive Agency`

**An attacker drives your monthly inference bill from \$15,000 to \$180,000 without taking your service offline. What is this type of attack commonly called?**

> `Denial of Wallet`

## Task 5: MITRE ATLAS

**ATLAS**, *Adversarial Threat Landscape for Artificial-Intelligence Systems*, is ATT&CK's AI counterpart. Same hierarchy you already know: **Tactic** (why) → **Technique** (how) → **Sub-technique** (specifically how) → **Mitigation** (what stops it). At the time the room was written it held 16 tactics, 155 techniques, 35 mitigations and 52 case studies.

Five techniques the room says you should know:

| Technique | ID | Maps to STRIDE |
|---|---|---|
| Data Poisoning | `AML.T0020` | Tampering |
| Model Extraction | `AML.T0024` | Information Disclosure |
| Evade ML Model | `AML.T0015` | Tampering / Spoofing / EoP |
| LLM Prompt Injection | `AML.T0051` | Tampering |
| Backdoor ML Model | `AML.T0018` |, (a logic bomb inside a neural network) |

The two case studies are worth your time beyond the room:

- **ShadowRay** (`AML.CS0023`), attackers exploited the Ray distributed-compute framework to compromise AI training infrastructure *in the wild*. AI supply chain attacks aren't theoretical.
- **Morris II** (`AML.CS0024`), a self-replicating prompt injection worm that spread between AI agents through RAG-based email systems, extracting PII and propagating with no user interaction.

Morris II is the one I'd put in front of anyone who thinks prompt injection is a chatbot party trick. It's a worm whose payload is *text*, and whose transport is a feature you deliberately built.

### Task 5, Questions and Answers

**What does the acronym ATLAS stand for?**

> `Adversarial Threat Landscape for Artificial-Intelligence Systems`

**Which ATLAS case study described a self-replicating prompt injection worm that spread between AI agents via RAG email systems?**

> `Morris II`

**What is the ATLAS technique ID for Model Extraction?**

> `AML.T0024`

## Task 6: OWASP LLM Top 10, mapping risks to components

The third layer is the one that makes an assessment *actionable*. The OWASP LLM Top 10 (2025) is useful here not as a checklist but as a lookup table that works **in both directions**:

- **Risk → Component:** "Prompt injection, where does it live?" The inference endpoint and the RAG pipeline.
- **Component → Risk:** "We're adding a vector database, what does it inherit?" LLM01, LLM08 and LLM09.

That second direction is the powerful one. Every time your org bolts on a new component, you can immediately enumerate the risks it drags in.

![Diagram of MegaCorp's AI chatbot architecture showing three trust boundaries and which OWASP LLM Top 10 risks map to each component](/img/thm-ai-threat-modelling/01-architecture.png)

The headline finding: the **LLM inference endpoint appears in seven of the ten entries**, LLM01, LLM02, LLM05, LLM06, LLM07, LLM09 and LLM10. It is by a wide margin the component that needs the most hardening. The **vector database / RAG pipeline** appears in three (LLM01, LLM08, LLM09), and the **training pipeline** is the primary home for supply chain risk (LLM02, LLM03, LLM04).

And the framing that ties the whole room together:

![Diagram showing STRIDE-AI, MITRE ATLAS and OWASP LLM Top 10 as three zoom levels of a single assessment](/img/thm-ai-threat-modelling/02-three-layers.png)

> STRIDE gives you the wide-angle view. ATLAS gives you the technical detail. **OWASP tells you where to point the camera.**

### Task 6, Questions and Answers

**How many of the OWASP LLM Top 10 entries affect the LLM Inference Endpoint?**

> `7`

**An organisation notices their chatbot is rendering LLM output directly in the browser without sanitisation. Which OWASP entry does this fall under?**

> `Improper Output Handling`

**Which component in a typical LLM architecture is the primary one that needs hardening against data and model supply chain risks (LLM03)?**

> `Training Pipeline`

## Task 7: Practical, threat modelling MegaCorp's AI assistant

Click **View Site** and you get an interactive three-phase exercise against the architecture above:

1. **Selection**, pick 5 of the 10 OWASP risks to work with (all ten would be a slog).
2. **Assignment**, drag each risk onto the architecture component where it actually lives.
3. **Assessment**, click each risk to choose a *justification* and a *severity*.

You need **70%** to pass, and the score bar updates as you go. The assignment phase is the real test: it's easy to know that LLM08 is "vector and embedding weaknesses" and still hesitate over whether it belongs on the Vector Database or the Knowledge Base. Lean on the Task 6 table, it's the answer key.

Clear the threshold and the assessment completes:

> `THM{AI_THREAT_MODEL_COMPLETE}`

## Task 8: Conclusion

**I have successfully completed the room!**

> `No answer needed`

## What I'd actually keep from this room

**The three-layer workflow is the takeaway, not the individual frameworks.** STRIDE to identify, ATLAS to enrich, OWASP to locate and prioritise. Any one of them alone gives you a partial assessment: STRIDE without ATLAS produces findings too vague to action ("tampering risk exists"), and ATLAS without OWASP tells you *how* an attack works but not *which of your boxes* to fix first.

**Denial of Wallet deserves a monitoring rule today.** Most teams alert on availability and error rates. If your inference is billed per token, an attacker can do six figures of damage while every dashboard stays green. Cost anomaly alerting is a security control now.

**Repudiation is the one people skip, and it's the one regulators ask about.** "Why did the model approve this?" is a question you will eventually be asked. If you aren't logging model version, input features, retrieval context, system prompt and temperature *at decision time*, you cannot reconstruct it later. That's not a nice-to-have, it's the difference between an incident report and a shrug.

**"The model can't be attacked, it's just wrong" is still your problem.** Bias, hallucination and emergent behaviour don't fit STRIDE, but they carry real regulatory weight. The room is honest that these are gaps rather than pretending the framework covers everything, which I appreciated.

## Room summary

| | |
|---|---|
| Room | AI Threat Modelling |
| Path | AI Security → Secure AI Systems |
| Difficulty | Medium · 60 min · 8 tasks |
| Frameworks | STRIDE-AI, MITRE ATLAS, OWASP LLM Top 10 (2025) |
| Key IDs | `AML.T0020`, `AML.T0024`, `AML.T0015`, `AML.T0051`, `AML.T0018` |
| Case studies | ShadowRay (`AML.CS0023`), Morris II (`AML.CS0024`) |
| Flag | `THM{AI_THREAT_MODEL_COMPLETE}` |

## Wrap-up

This room won't teach you to exploit anything, and that's the point, it's explicitly defender-focused. What it gives you is a **repeatable process** you can run every time your organisation ships a model, adds a RAG pipeline, or grants an agent a new tool.

The reframing I found most useful: AI systems aren't traditional applications with a model bolted on. They have their own assets you've never inventoried, their own supply chain that fails on a months-long delay, and their own failure modes that no amount of input validation will catch.

If you want to go further, the room points at [MITRE ATLAS](https://atlas.mitre.org) for the full technique catalogue and the [OWASP AI Exchange](https://owaspai.org) for guidance beyond LLMs, including agentic systems. Both are worth a bookmark. 🛡️

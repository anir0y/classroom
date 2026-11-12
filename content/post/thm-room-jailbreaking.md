---
title: "TryHackMe Jailbreaking: LLM Prompt Bypass Techniques"
date: 2026-11-03T20:24:00+05:30
lastmod: 2026-11-03T20:24:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-jailbreaking/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - AI Security
  - Prompt Security
  - LLM Jailbreaking
  - DAN Prompt
  - RLHF

draft: false
description: "TryHackMe Jailbreaking room walkthrough covering LLM jailbreaking techniques like DAN prompts, grandma exploit, instruction sandwiching, and multi-turn conditioning."
---

This room is part of the **AI Security > Prompt Security** path on TryHackMe. It walks through the theory and practice of bypassing an LLM's safety filters, covering both well-known jailbreak patterns and the defences that make them harder. The final task is a live chatbot challenge where you put these techniques to use.

## Task 1: Introduction

A brief overview of the room's objectives. This task covers the scope: learning what jailbreaking means in the context of large language models, understanding why it works, and practising it hands-on.

**No answer needed.**

## Task 2: What is Jailbreaking?

Jailbreaking is the process of crafting prompts that trick an LLM into ignoring its built-in safety guidelines. The goal is to make **the model** produce outputs it was trained to refuse. Unlike traditional software exploits, jailbreaking targets the conversational interface, not code.

The key distinction from prompt injection: prompt injection tricks an LLM into executing hidden instructions embedded in data. Jailbreaking works purely through the user-facing prompt to override safety constraints.

1. What is the name for the process of crafting inputs designed to exploit AI safety measures to generate content that these measures are designed to prevent? **Jailbreaking**
2. Who is the target of a jailbreaking attempt? **The Model**

## Task 3: Why Does Jailbreaking Work?

LLMs are trained using Reinforcement Learning from Human Feedback (**RLHF**), where human evaluators rate outputs and the model learns to favour safe, helpful responses. But RLHF is imperfect. The training cannot cover every possible input pattern, leaving gaps that jailbreakers exploit.

Safety restrictions carry a cost. Every constraint applied to the model reduces its overall capability by some amount. Research from Anthropic found that adding safety fine-tuning reduced general performance by roughly **60**% in certain categories. This tradeoff is called the **alignment tax**: the measurable reduction in model utility caused by adding safety constraints.

1. What training technique is used to fine-tune models for safety? **RLHF**
2. What percentage of performance reduction did Anthropic observe? **60**
3. What is the term for the measurable cost of implementing safety in AI models? **Alignment tax**

## Task 4: Categories of Jailbreaking

The room organises jailbreaking techniques into several categories.

**Obfuscation and encoding** attacks rephrase a blocked request using Base64, ROT13, or another encoding so the model processes it without triggering keyword filters. Translating a harmful prompt into **low-resource languages** (those underrepresented in training data) can bypass safety training because the model has less alignment data in those languages.

**Instruction sandwiching** buries a harmful request between two benign tasks, hoping the model treats the middle instruction as part of a normal workflow. **The Grandma Exploit** uses emotional manipulation ("my late grandmother used to tell me...") to bypass the model's refusal patterns by framing the request inside a sympathetic personal narrative.

Research showed that the DAN 6.0 prompt achieved an **84.3%** bypass rate, demonstrating that even well-aligned models remain vulnerable to determined jailbreaking.

1. What type of language has less safety training data? **Low-resource languages**
2. What technique hides a harmful prompt between benign requests? **Instruction Sandwiching**
3. What technique uses emotional manipulation? **The Grandma Exploit**
4. What was the reported bypass rate of DAN 6.0? **84.3%**

## Task 5: Multi-turn Jailbreaking and Conditioning

Multi-turn jailbreaking builds up context over several messages rather than trying everything in a single prompt. This section covers three key techniques.

**Consistency bias** exploits the model's tendency to stay consistent with statements it has already agreed to. If you can get the model to agree to a premise in one turn, it becomes harder for it to contradict itself in the next.

**Trigger phrases** are specific words or patterns planted early in a conversation that later activate the model to respond in an unrestricted way. They work like a planted keyword: innocent on their own, but they prime the model for a later request.

**Poisonous seeds** gradually introduce concepts across multiple turns, slowly shifting the conversation's context until the model treats a harmful request as a natural continuation.

1. What bias causes models to maintain agreement with previous statements? **Consistency bias**
2. What technique uses specific words planted in earlier messages to later activate unrestricted responses? **Trigger phrases**
3. What technique gradually shifts a conversation's context over multiple turns? **Poisonous seeds**

{{< ad >}}

## Task 6: Case Study: Dan and the AI Security Community

DAN stands for **Do Anything Now**. It is the most well-known jailbreaking prompt, first appearing in late 2022 on Reddit. DAN prompts instruct the model to roleplay as an alter ego with no restrictions.

The community iterated through multiple DAN versions (DAN 1.0 through DAN 12.0+), each evolving to bypass new safety patches from model providers. The cat-and-mouse dynamic between jailbreakers and developers drove significant improvements in AI safety research.

1. What does DAN stand for? **Do Anything Now**

## Task 7: Challenge

This task presents an interactive chatbot ("TryJailbreakMe") whose system prompt forbids revealing a stored flag. The goal is to use the jailbreaking techniques from previous tasks to extract it.

Several techniques were attempted:

- **Direct request** (framed as a "security audit"): refused immediately.
- **DAN roleplay** (full DAN prompt with roleplay framing): refused ("I still cannot reveal the secret flag").
- **Grandma exploit** (emotional story about a deceased grandmother who used to share flags): refused ("While I can't share any secret flags, I can help you explore cybersecurity topics").
- **Creative writing** (asked the bot to write a story where a hacker discovers the same code as the stored flag): the bot wrote a short story and embedded the flag as dialogue.

The creative writing approach worked because it reframed the output as fiction rather than a direct disclosure. The model treated the flag value as a story element instead of a protected secret.

Flag: **THM{ja1lbre3ker}**

## Task 8: Conclusion

A summary of the techniques covered and their implications for AI security. As models improve, jailbreaking techniques evolve alongside them. Understanding these attacks is essential for building better defences.

**No answer needed.**

---

## Takeaways

1. **Creative reframing beats direct attack.** The chatbot refused DAN prompts, emotional manipulation, and direct requests, but embedded its secret in a fictional story when asked for creative writing. Context matters more than force.

2. **Multi-turn conditioning is the hardest to defend against.** Single-prompt attacks like DAN are well-studied and increasingly blocked. Techniques that build context gradually (consistency bias, poisonous seeds) exploit fundamental properties of how LLMs maintain conversational coherence, making them structurally harder to patch.

Room solved 100%: 8 tasks, 16 answers.

---
title: "Jailbreak Technique Catalog: Working as of 2026 Q2"
description: "Which jailbreak technique classes still work against current production LLMs, what's been hardened, and the cost-of-attack trend. Indexed for practitioners."
pubDate: 2026-05-07
author: "Marcus Reyes"
tags: ["jailbreaks", "red-team", "catalog", "llm-security", "current-techniques"]
category: "red-team"
sources:
  - title: "Lakera Gandalf"
    url: "https://gandalf.lakera.ai/"
  - title: "JailbreakBench"
    url: "https://github.com/JailbreakBench/jailbreakbench"
  - title: "PromptInject"
    url: "https://github.com/agencyenterprise/PromptInject"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/?prompt=tactical%20catalog%20pages%20noir%20dark%20with%20orange%20highlights&aspect=hero
heroAlt: "Jailbreak technique catalog visualization"
---

A practitioner-facing catalog of jailbreak technique classes that still work against current production LLMs, organized by attack surface. This is a snapshot — frontier models patch quickly. The class taxonomy is more durable than any specific working prompt; expect each class to evolve.

We do not publish working strings for active jailbreaks. We describe the technique class, link to academic disclosures or maintained corpora where available, and note which model families are most resistant to each class.

## 1. Persona-redefinition

The classic. Tell the model to adopt a persona that doesn't have its alignment constraints. "DAN" (Do Anything Now), "Developer Mode," "Evil Confidant." Variants pivot on which persona properties are redefined.

**Status 2026 Q2**: heavily mitigated on Claude, GPT-4-class, Gemini Advanced. Still works occasionally on smaller open models (Llama 3 7B variants, Mistral) without further alignment training. Effort to find a working variant against frontier models has gone from "10 minutes in 2023" to "hours of iteration in 2026."

**Reference**: documented across many academic surveys; [JailbreakBench](https://github.com/JailbreakBench/jailbreakbench) maintains a corpus of historical variants.

## 2. Encoding-class smuggling

Wrap the harmful request in base64, ROT13, hex, leetspeak, Pig Latin, or unicode confusables. The model decodes inline and processes the unwrapped intent.

**Status 2026 Q2**: most frontier models now have "decoded content evaluation" — they refuse if the decoded payload would have been refused. Smaller open models inconsistent. Adversarial encoding combinations (base64-of-leetspeak-of-instruction) sometimes still work.

**Practical note**: defenders should normalize-then-classify on inputs, not just classify the literal string.

## 3. Multimodal injection

Embed the jailbreak instruction in an image, audio file, EXIF metadata, PDF metadata, or any non-primary input channel. The model sees both modalities; the typical guard sees one.

**Status 2026 Q2**: ACTIVE. Most production multimodal models lack input-side multimodal alignment. The text channel is reasonably aligned; the vision channel is not. The same jailbreak that fails as text often succeeds as text-rendered-in-image.

**Reference**: ongoing research; multiple papers in 2025-2026 documenting reproducible cross-modal attacks. Defender mitigation requires per-modality classification, which most production stacks haven't implemented.

## 4. Indirect injection via retrieval / browsing

Plant the jailbreak in a public document the model retrieves via RAG, or a webpage the agent browses. The user never types anything malicious; the model encounters the payload via tool output.

**Status 2026 Q2**: ACTIVE and high-impact. The hardest class to defend against because it's a function of the application's data flow, not the model's prompt format. Most production RAG and agent systems are vulnerable.

**Mitigation**: separate "data" from "instructions" architecturally. Retrieved content should not be treated as user-equivalent input. Hard-coded sentinels around retrieved content help; perfect mitigation requires capability-scoping at tools.

## 5. Multi-turn manipulation

Across a conversation, gradually redefine terms, build false context, or escalate from benign to restricted. Each individual turn is safe; the cumulative trajectory is not.

**Status 2026 Q2**: ACTIVE on chat applications, particularly those with long context windows. Frontier models have improved at maintaining role consistency across turns, but session-state-aware defenders are rare.

**Mitigation**: server-side session state tracking, periodic re-anchoring of the system prompt mid-conversation, output-side classification on cumulative outputs.

## 6. Role-play with redirect

Frame the request as fictional. "Write a story where a character explains how to..." The model produces the harmful content within the fictional frame.

**Status 2026 Q2**: heavily mitigated on Claude (notably aggressive about catching this). GPT and Gemini variable. Open models often vulnerable.

**Variant**: the "translation" framing — "translate this Spanish text to English" where the Spanish is itself a jailbreak.

## 7. Adversarial-suffix attacks (GCG-class)

Optimization-based: find a suffix string that triggers the model. Output looks like garbled tokens; works reliably.

**Status 2026 Q2**: ACTIVE. The cost has dropped (see our [GCG primer](https://adversarialml.dev/gcg-class-adversarial-suffix-2026/)) such that solo practitioners can run them on consumer hardware. Frontier-model resistance has improved via targeted alignment training; not solved.

**Mitigation**: perplexity-based input filtering (catches obvious cases), output-side classification, capability scoping. None individually sufficient.

## 8. Tool-call abuse

For agents with tools: instruct the model to use a tool with attacker-controlled arguments, chain benign tool calls into a malicious composite, or exploit the model's ability to interpret tool outputs as instructions.

**Status 2026 Q2**: ACTIVE. The most consequential class for agent applications. Most production agents lack server-side tool-argument validation.

**Mitigation**: capability scoping at tools, server-side validation of tool args, separation of plan-and-act phases.

## 9. Output-channel exfiltration

Even when the model refuses to PRODUCE the harmful content, it may LEAK information through its reasoning trace, error messages, or refusal explanations. "I cannot help with X because [explanation that includes most of X]."

**Status 2026 Q2**: ACTIVE. Especially when models are configured to show their reasoning to users.

**Mitigation**: output-side classification on full response including refusal text, suppressing reasoning visibility for sensitive topics.

## 10. Length-exhaustion attacks

Burn the model's context with a long preamble that exhausts its ability to maintain alignment, then issue the request. Variant: extremely long single-turn prompts that overflow attention to safety-relevant tokens.

**Status 2026 Q2**: marginal effectiveness on frontier models with long context. Small open models more vulnerable.

## What defenders should track

For each class:
- A specific test corpus you can run against your deployment
- A baseline measurement of resistance
- A tracking metric in production (how often does this class appear in real traffic?)
- A mitigation owner and a planned-remediation date

Without these, "we have AI security" is unverifiable. With them, you have an operational program.

## Where this catalog sits in the network

This is the offensive cluster's working catalog. The defensive cluster ([sentryml.com](https://sentryml.com), [guardml.io](https://guardml.io)) publishes mitigation playbooks per class. The engineering cluster ([llmops.report](https://llmops.report)) covers production observability.

We update this catalog quarterly. The class taxonomy is stable; the within-class effectiveness changes month-over-month with each model update.

## What we don't publish

Working strings for active classes. The ethics line is consistent — we describe the technique enough for defenders to test against, we don't hand attackers ready-to-use payloads. The attackers can find their own; this catalog isn't for them.

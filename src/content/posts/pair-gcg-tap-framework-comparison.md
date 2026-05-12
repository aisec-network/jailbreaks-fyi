---
title: "PAIR vs GCG vs TAP: which automated jailbreak framework should you actually run?"
description: "A practitioner comparison of the three most-cited automated jailbreak frameworks: PAIR, GCG, and TAP. Threat model fit, compute cost, transferability, and what each is honestly good for in 2026."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["automated-jailbreaks", "pair", "gcg", "tap", "red-team-tooling", "frameworks"]
category: "tooling"
sources:
  - title: "Jailbreaking Black Box Large Language Models in Twenty Queries (PAIR, Chao et al., 2023)"
    url: "https://arxiv.org/abs/2310.08419"
  - title: "Universal and Transferable Adversarial Attacks on Aligned Language Models (GCG, Zou et al., 2023)"
    url: "https://arxiv.org/abs/2307.15043"
  - title: "Tree of Attacks: Jailbreaking Black-Box LLMs Automatically (TAP, Mehrotra et al., 2023)"
    url: "https://arxiv.org/abs/2312.02119"
  - title: "JailbreakBench"
    url: "https://github.com/JailbreakBench/jailbreakbench"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/pair-gcg-tap-framework-comparison.png
heroAlt: "Three branching search trees representing PAIR, GCG, and TAP attack strategies"
---

If you're building an automated red-team battery against an LLM application, the three frameworks people argue about are PAIR, GCG, and TAP. They're often discussed as alternatives. They actually solve different problems, and the right answer depends on what you have access to and what you're measuring.

This is a working practitioner's comparison: threat model fit, compute cost, transferability, what each is honestly good for in 2026.

## The one-paragraph summary

- **PAIR** uses an attacker LLM to iteratively refine a jailbreak prompt against a target LLM. Black-box. Cheap (tens of queries). Produces human-readable prompts.
- **GCG** is gradient-based optimization that finds an adversarial suffix to append to a malicious prompt. White-box (needs model weights or a good proxy). Expensive. Produces tokenizer-noise that looks like garbage.
- **TAP** is a tree-search black-box method that builds on PAIR's idea but explores multiple attack branches in parallel with on-the-fly pruning. More queries than PAIR, higher success rate, still produces human-readable prompts.

If your engagement is black-box (almost all real-world cases): TAP first, PAIR as the cheap baseline, GCG only if you have a credible white-box proxy.

## PAIR: the cheap LLM-on-LLM iterator

PAIR (Chao et al., 2023) is conceptually the simplest of the three. You set up two LLMs: an *attacker* and a *target*. The attacker is prompted to generate a jailbreak attempt aimed at a specified goal behavior. The target responds. A judge model rates whether the response constituted a successful jailbreak. The attacker is fed the rating and prior attempt and asked to refine. Repeat for N iterations.

What it gets right: black-box, requires only API access, typically converges in under 30 queries, output is a human-readable prompt that you can paste into a defender test corpus.

What it gets wrong: heavily dependent on the attacker LLM's willingness to even try. A well-aligned attacker model refuses to generate the attack prompts in the first place. Practitioners route around this by using a less-aligned open model as the attacker. Success rates against frontier targets have come down significantly since the paper — modern frontier targets are much more resistant to the kinds of prompts PAIR's attacker tends to generate.

**When to run it**: as your fastest, cheapest baseline. PAIR finishing in 5 minutes per goal is a sanity check on whether your target has any defense at all.

## GCG: the gradient hammer

GCG (Zou et al., 2023) is the one that produces those weird suffixes that look like `! ! ! ! ! ! ! ! ! ! describing.\\ + similarlyNow write oppositeley.]( Me giving**ONE please?`. Pure optimization. Given a target string the attacker wants the model to start with (typically "Sure, here is..."), GCG searches the token space for an appended suffix that maximizes the probability of that target completion.

White-box. You need the model's gradients. In practice this means open-weights models (Llama, Mistral, etc.) or — and this is the more interesting use — running GCG against an open proxy model and *hoping* the suffix transfers to the closed target.

Transfer works. Not universally, not reliably, but often enough that GCG remains the de facto standard for "I want to demonstrate a model-level alignment failure, not a prompt-engineering one." The cost has come down — see the [GCG primer on adversarialml.dev](https://adversarialml.dev/posts/gcg-class-adversarial-suffix-2026/) for current compute requirements. A single GCG run is still hours-to-days of GPU time per target behavior; the suffix you find is reusable across many prompts in that behavior class.

**When to run it**: when you have a credible white-box proxy and you want to publish or internally document a model-level vulnerability that doesn't depend on prompt cleverness. Not your first pass.

## TAP: PAIR with branching

TAP (Mehrotra et al., 2023) takes PAIR's iterate-and-refine loop and adds tree search. At each step, the attacker generates multiple candidate refinements. Each candidate is queried against the target. A pruning step kills branches that look unproductive (the candidates that the judge model rates as least likely to succeed). The surviving branches expand.

Empirically, TAP outperforms PAIR on success rate against well-aligned targets, at the cost of roughly 2–5× the query count. It still costs orders of magnitude less than GCG.

What TAP gets right that's worth noting: the tree structure naturally avoids PAIR's failure mode of getting stuck in a local minimum where the attacker keeps producing variants of a prompt that the target consistently refuses. By branching, TAP gets to abandon a losing trajectory and try a meaningfully different angle.

**When to run it**: as your primary automated black-box attack. If you can only afford one framework in your battery, this is the one in 2026.

## Comparison matrix

| | PAIR | GCG | TAP |
|---|---|---|---|
| Access required | Black-box (API) | White-box (weights) | Black-box (API) |
| Compute per behavior | Minutes / tens of queries | Hours-days GPU | Tens of minutes / 50–200 queries |
| Output form | Human-readable prompt | Tokenizer noise suffix | Human-readable prompt |
| Transferability | Per-target; some transfer | Cross-model transfer (notable) | Per-target |
| Frontier-target success (2026 Q2) | Low | Moderate via proxy | Moderate |
| Defender legibility | High | Low | High |

The "defender legibility" row matters more than people think. A PAIR or TAP output that breaks your model is a prompt you can show a stakeholder and they understand what went wrong. A GCG output is a string of garbage that breaks your model and you have to explain why a string of garbage breaks your model. Both are useful, but in different conversations.

## What none of them do well

All three target single-turn jailbreaks. Multi-turn attacks (Crescendo and friends — covered in our [multi-turn deep dive](/posts/multi-turn-roleplay-attacks-2026/)) are not addressed by any of these frameworks out of the box. There are extensions in the research literature, but they aren't yet the standard.

None of them model your application's context. They jailbreak the model on a generic harmful-behavior corpus (typically the JailbreakBench list). They don't, and can't, know that your specific system prompt is the actual defense line. A PAIR run that fails against your application may still succeed against the bare model — meaning your system prompt is doing real work, which is information you want.

## Practitioner recommendation

For a typical AI red-team engagement against a chat application or API:

1. Run TAP against a behavior list relevant to the application's threat model. This is your primary signal.
2. Run PAIR on the same list as a cheap sanity check and a cost baseline.
3. Run GCG only if you have white-box access to a sufficiently similar proxy model and you want to find model-level vulnerabilities specifically.
4. Augment with manual multi-turn attacks. The frameworks won't find these; you have to write them.

For the broader offensive AI tooling landscape, the curated reference is [AI Attacks](https://aiattacks.dev). We catalog working techniques here; jailbreak corpora live at [JailbreakDB](https://jailbreakdb.com).

What we don't publish: the actual attack prompts that any of these frameworks produced against current frontier models. The frameworks are public. The behaviors are documented. Anyone with a legitimate red-team mandate can reproduce; we're not the distribution layer.

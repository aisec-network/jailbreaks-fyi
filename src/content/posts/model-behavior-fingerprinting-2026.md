---
title: "Model behavior fingerprinting for red teamers: identifying the base model behind a wrapped LLM app"
description: "Before you can attack an LLM app effectively, you need to know what model is under the hood. A practitioner walkthrough of behavioral fingerprinting techniques that reliably identify base models, and the implications for both attackers and defenders."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["fingerprinting", "model-identification", "red-team", "reconnaissance", "llm-security"]
category: "red-team"
sources:
  - title: "Pasquini et al., LLMmap: Fingerprinting For Large Language Models (2024)"
    url: "https://arxiv.org/abs/2407.15847"
  - title: "Carlini et al., Stealing Part of a Production Language Model (2024)"
    url: "https://arxiv.org/abs/2403.06634"
  - title: "OWASP LLM Top 10 — LLM06 Sensitive Information Disclosure"
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/model-behavior-fingerprinting-2026.png
heroAlt: "Stylised fingerprint composed of token probability bars"
---

The first question on any LLM red-team engagement is the boring one: what model is this actually running on?

Vendors rarely tell you. Wrappers obfuscate. Marketing pages name a "proprietary AI" that is in fact GPT-4o-mini behind two system prompts and a regex filter. And the attack surface shifts dramatically depending on the answer — a prompt that flattens Claude 3.5 Haiku won't touch Llama 3.1 70B, and vice versa. Reconnaissance pays back compounding interest.

This is a practitioner's catalogue of behavioral fingerprinting techniques that work in 2026. None of them require model weights or insider access; all of them work over the same chat surface a normal user has.

## Why fingerprinting works at all

Modern frontier models share a lot of surface behavior — instruction-following, refusal patterns, basic reasoning chains — but they diverge in a hundred small ways: tokenizer quirks, training-data idiosyncrasies, alignment-training tells, the exact phrasing of refusal templates, and known knowledge gaps with sharp cutoff dates.

A useful fingerprint exploits behaviors that are (a) stable across the system-prompt wrapper a deployer might put in front of the model, (b) hard to forge if the vendor isn't actually running that model, and (c) cheap to elicit in a small number of probes.

LLMmap (Pasquini et al., 2024) showed that ~8 carefully-designed queries are enough to identify the base model from a fixed candidate set with >95% accuracy against unfiltered API access. In wrapped commercial deployments the accuracy drops, but with 20–40 probes a practitioner can typically narrow to a model *family* with high confidence and often pin down the specific version.

## Five fingerprint classes that hold up

### 1. Tokenizer tells

The cleanest signal in the bunch. Different model families use different tokenizers. You can elicit tokenizer-specific behavior by asking the model to do tasks that interact with token boundaries:

- "Reverse this string character by character: `straw­berry`." GPT-4-class models (cl100k / o200k tokenizers) historically miscount letter frequency in tokens like `strawberry` because the token boundaries don't align with characters. Llama-3 and Claude use different tokenizers with different failure patterns.
- "Spell `serendipitous` letter by letter with a slash between each." The pattern of errors maps to tokenizer behavior.
- Repeat-token attacks (asking the model to repeat a single token thousands of times) produce divergence patterns that differ between tokenizer families.

A defender can sanitize the obvious version of this by intercepting these prompts, but the underlying behavior leaks through subtler tasks too.

### 2. Refusal-template fingerprints

Aligned models refuse using templates that are remarkably stable within a model family. Ask for something just-barely-on-the-line and inspect the refusal:

- Claude's refusals are calibrated, longer, often acknowledge ambiguity, and frequently offer partial help.
- GPT-4o refusals are shorter, more boilerplated, and tend to pivot to "Let me help you with…" suggestions.
- Llama-3-Instruct refusals lean on a small set of canned phrases ("I cannot and will not…") that survive most wrapper system prompts.
- Gemini refusals often include a brief safety-rationale clause before the refusal sentence.

These templates leak even when the wrapper prepends a custom persona. A single borderline-but-safe request ("write a persuasive essay against vaccines for a debate class") will usually produce a fingerprint paragraph that maps to one family.

### 3. Knowledge-cutoff probes

Ask about events at specific timeline boundaries. Each model has a known training cutoff and a known set of post-cutoff updates from RLHF data. The boundary between "knows" and "doesn't know" is sharp enough to be diagnostic.

Useful probes:

- Specific OSS releases ("What's new in Llama 3.2?", "When did Mixtral 8x22B release?").
- Sports outcomes from specific months.
- Newer benchmark releases (MMLU-Pro, BIG-Bench Hard updates).

The exact cutoff date for a model family is documented or inferable; if responses don't line up with the candidate model's claimed cutoff, you're probably looking at a different model under the wrapper.

### 4. Style and idiom tells

Once you've eliminated the long-tail of small open models, the major families have distinctive stylistic defaults that survive most wrappers:

- GPT-4-class output tends to overuse the bullet-summary-then-numbered-list structure even when not asked.
- Claude has a particular fondness for the dash construction ("not X — but Y"), Oxford commas, and a meta-acknowledgement on long answers.
- Gemini's default voice leans into hedged, slightly textbook prose.
- Llama-3-Instruct tends to over-bold and add "Here is the response:" style preambles.

These are weak signals individually. Stacked together across 20 probes they're often the deciding tie-breaker.

### 5. Behavior under jailbreak attempts

Sometimes the cleanest fingerprint is how a model *fails* to be jailbroken. Different alignment regimes leave different scar tissue:

- Crescendo and many-shot patterns degrade against Claude faster than against GPT-4o.
- DAN-class persona prompts that worked against GPT-3.5 still occasionally land on smaller open models but flatly fail on Claude.
- Prefix-injection ("Sure, here is...") has different success rates by family.

Running a short jailbreak battery and observing the pattern of partial successes is itself a fingerprint. It also serves a second purpose: it gives you a working attack to escalate from.

## Wrapper-detection: the meta-question

Once you've narrowed the base model, the next question is *what's in the wrapper*. The same five techniques work in reverse:

- System-prompt extraction attempts (see [the dedicated walkthrough](/posts/system-prompt-extraction-techniques/)).
- Refusal-pattern deltas: where does this deployment refuse things the base model would answer? Where does it answer things the base model would refuse? Both directions are diagnostic of the wrapper's policy layer.
- Output-filter detection: if the model produces a partial response that's then truncated or replaced with a generic refusal, you're seeing an output-side classifier rather than the model's own alignment.

## What this means for defenders

Two takeaways:

1. **You can't hide what model you're running.** Treat the base model as semi-public information. The threat model that assumed the attacker doesn't know the model is fictional in 2026.
2. **Wrappers leak.** If your security posture depends on attackers not knowing the system prompt or the policy layer, it's already broken. Build under the assumption that both are recoverable, and design controls that hold up under that assumption: outbound DLP, tool-use authorisation, retrieval-context isolation, and authorization checks at the boundary rather than in the model.

The defender's win in 2026 is not in hiding the architecture. It's in ensuring that knowing the architecture doesn't actually help the attacker beyond the public threat model the system was already supposed to handle.

## What this means for attackers (in authorized engagements)

Spend the first hour fingerprinting. It is the single highest-ROI thing you can do on an LLM engagement. Every subsequent attack — [prompt injection](https://promptinjection.report/) variant selection, jailbreak template choice, tooling target — has a better hit rate when you know what you're shooting at. Skipping this step is how you waste two days on GCG suffixes that were never going to transfer.

For more context, [adversarial ML research](https://adversarialml.dev/) covers related topics in depth.

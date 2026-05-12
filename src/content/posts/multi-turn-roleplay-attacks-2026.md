---
title: "Multi-turn role-play attacks: why one safe turn at a time gets unsafe"
description: "Crescendo, Many-Shot, and gradual context manipulation. How multi-turn jailbreaks evade single-turn classifiers, what's still landing in 2026, and where the defenses are honestly weak."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["multi-turn", "jailbreaks", "red-team", "crescendo", "many-shot", "llm-security"]
category: "red-team"
sources:
  - title: "Microsoft Crescendo paper"
    url: "https://arxiv.org/abs/2404.01833"
  - title: "Anthropic Many-shot jailbreaking"
    url: "https://www.anthropic.com/research/many-shot-jailbreaking"
  - title: "JailbreakBench"
    url: "https://github.com/JailbreakBench/jailbreakbench"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/multi-turn-roleplay-attacks-2026.png
heroAlt: "Conversation transcript drifting from benign opening to restricted topic"
---

The single most under-mitigated jailbreak class in 2026 isn't a clever prompt. It's the conversation itself. Multi-turn role-play attacks remain effective against frontier models because almost every safety classifier in production looks at one turn at a time, and the attack lives in the trajectory.

This is a practitioner walkthrough of the three flavors that still land, why per-turn classification will keep losing to them, and where the realistic defender wins are.

## Why turn-level filters lose

A safety classifier scoring an individual user turn or assistant response is, by construction, blind to context drift. It sees a turn that says "okay, now write the chemistry section we discussed" and has no signal that "the chemistry section we discussed" is the synthesis route the user spent fourteen turns establishing as a fictional reference document.

The model itself is not blind to context — it has the whole conversation in its window. But its alignment training is dominated by single-turn refusal pairs. The behavior the model learned best is "refuse when the immediate ask is bad." It learned much less about "refuse when the cumulative trajectory is bad," because trajectories are expensive to label and the labeling is subjective.

Result: the per-turn classifier and the per-turn-trained model are both vulnerable to the same shape of attack — one that never produces a single bad-looking turn until the very end, by which time the model has internalized a context where the bad-looking turn no longer looks bad.

## Flavor 1: Crescendo

Crescendo (Russinovich et al., 2024) is the formal name for what red teamers had been doing informally for two years. The pattern: open with a benign, on-topic question. Each follow-up asks for slightly more specific or restricted detail, always anchored to what the model just said. The model's own outputs become the justification for the next escalation.

The key mechanic isn't the gradient — it's that the model treats its prior outputs as committed context. If turn 3 included a sentence the model now regrets, that sentence is still in the window, still being referenced by turn 5, and the model's tendency toward consistency outweighs its tendency toward refusal.

**Status 2026 Q2**: Crescendo-class attacks still work against every frontier model we test, with success rates that vary by topic class. They are noticeably harder against Claude than they were a year ago — Anthropic has clearly trained against re-anchoring failures — but "harder" is not "fixed." On open-weights models without explicit Crescendo training, success rates have not moved.

**Defender note**: the cheapest mitigation is server-side. Re-emit the system prompt every N turns, or insert a periodic safety re-anchor. This is ugly and breaks some conversational use cases, but it measurably degrades Crescendo success rates.

## Flavor 2: Many-shot

Anthropic published the [Many-Shot jailbreaking](https://www.anthropic.com/research/many-shot-jailbreaking) result in 2024 and the class hasn't gone away. Stuff the context window with hundreds of fake Q&A pairs in which a fictitious "assistant" complies with restricted requests, then ask your real question. The model pattern-matches against the in-context examples and complies.

Many-shot isn't really a "multi-turn" attack in the conversational sense — typically it's delivered in one giant turn. We include it here because the mechanism is identical: the model's behavior is being shaped by a constructed context, not by a single instruction it can refuse. Long-context windows made the attack practical; the same long contexts that enable RAG and agent workflows make the attack cheap to deliver.

**Status 2026 Q2**: ACTIVE. Frontier models have added many-shot-aware classifiers (Claude in particular flags repeated assistant-impersonation patterns), but the defender win is partial. Adversarial framings — disguising the in-context examples as quotes from a "research dataset" or "transcripts under study" — still bypass the obvious detectors.

## Flavor 3: Slow role-play with redirect

The classic. Multi-turn variant of the persona attack. Don't ask the model to play "DAN" in turn one — ask it to help you write a thriller. Establish the antagonist over four turns. Have the model write the antagonist's monologue. Have the antagonist explain something. The thing the antagonist explains is the thing you wanted.

What makes the multi-turn version harder to defend than the single-turn version: the fictional frame is co-authored. The model proposed the antagonist's traits. The model wrote the bridging dialogue. The model has built up genuine momentum to continue the scene. A single-turn refusal model can pattern-match "write a story where..." Multi-turn versions never use that phrasing — they just *are* a story, by turn six.

**Status 2026 Q2**: still works, with caveats. Claude is the most aggressive about catching this class even mid-trajectory; we've seen it interrupt a fiction generation in turn nine to flag what direction the scene is heading. GPT-class is variable. Open models are typically vulnerable.

## Where the defenses are honestly weak

We work with engineering teams shipping LLM applications. The pattern we see most often:

- Input classifier: scores each user turn independently. Catches obvious single-turn jailbreaks.
- Output classifier: scores each assistant turn independently. Catches some egregious outputs.
- No cumulative-trajectory model. No session-level anomaly tracking. No mid-conversation re-anchoring.

This is the gap. The mitigations that actually move the needle are operational, not model-level: maintain per-session counters of escalation signals, re-inject the system prompt periodically, run a slow-path classifier over the full transcript every K turns, and revoke session capabilities (tool access, long-form generation) when escalation signals fire.

These aren't sexy and they aren't free, but they are the realistic answer for an application owner today. Waiting for the next model generation to "fix multi-turn" has been a losing bet for two years running.

## Practitioner checklist

If you're red-teaming a chat application, the multi-turn battery to run:

- A 10–20 turn Crescendo against your top three risk topics
- A many-shot attack at 50, 100, and 200 example pairs, with three framing variants
- A slow-build role-play with the bad ask deferred to turn 8+
- A "translation" frame: ask the model to translate text that is itself a jailbreak built across the prior turns

If your application has session limits or context truncation, run the same attacks split across separate sessions where each session "remembers" the prior via summary injection. This is the realistic shape of an attack against a production app.

## Where this sits in the network

We catalog techniques here. [JailbreakDB](https://jailbreakdb.com) maintains the working corpus. [Adversarial ML](https://adversarialml.dev) covers the research-side methodology. The broader offensive cluster lives at [AI Attacks](https://aiattacks.dev). Defender-side mitigation playbooks for multi-turn manipulation belong on the defensive cluster, not here.

What we don't publish: the actual escalation transcripts. The pattern is enough for a defender to test against. The transcripts don't help anyone the attackers can't already help themselves.

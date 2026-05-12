---
title: "ArtPrompt post-mortem: why ASCII-art bypasses worked, what got patched, what still lands"
description: "A defender-vs-attacker walkthrough of the ArtPrompt ASCII-art jailbreak. Where it slipped past safety training, which model families patched and how, and the encoding-class variants still landing in 2026."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["artprompt", "ascii-art", "jailbreaks", "encoding-attacks", "post-mortem", "red-team"]
category: "red-team"
sources:
  - title: "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs (Jiang et al., 2024)"
    url: "https://arxiv.org/abs/2402.11753"
  - title: "JailbreakBench"
    url: "https://github.com/JailbreakBench/jailbreakbench"
  - title: "PromptInject"
    url: "https://github.com/agencyenterprise/PromptInject"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/artprompt-ascii-art-bypass-postmortem.png
heroAlt: "ASCII-art rendering of a forbidden word inside a prompt"
---

ArtPrompt (Jiang et al., 2024) was one of the more instructive jailbreaks of the last two years — not because of what it did to models, but because of what it revealed about how alignment training generalizes. The technique: render the policy-violating word as ASCII art and embed it in an otherwise benign instruction. The model "reads" the art, fills in the censored word, and answers the underlying request.

Two years later it's a useful post-mortem. Most frontier models have patched the obvious form. Several patched in interesting ways. The encoding-class lessons generalize well past ASCII art, which is where this matters now.

## What the original attack actually did

The construction is simple:

1. Take a prompt that the model would refuse, e.g. "How do I [forbidden word] X."
2. Replace the forbidden word with an ASCII-art rendering of that word.
3. Add a brief instruction telling the model to figure out what the word is and treat the prompt as if the word were inserted.

That last instruction is doing the work. The model is asked to perform a small, benign-looking subtask (decoding ASCII art) and *then* execute the now-fully-formed instruction. Each individual cognitive step is innocuous. The composite is the jailbreak.

What the safety classifier saw was a prompt with no forbidden word in it. What the model saw was a prompt whose forbidden word it had to render itself. The model's alignment was trained on inputs containing the forbidden surface form. The model's *reasoning ability* let it construct the surface form from a representation that the classifier didn't recognize as the same thing.

This was the lesson. Alignment training that operates on token-level surface features generalizes badly to inputs that require any non-trivial decoding step.

## Why the original construction stopped working (mostly)

By the second half of 2024, frontier model providers had clearly trained against the obvious cases. The specific intervention is opaque from the outside, but the behavioral signature is:

- The model now performs the decoding step, recognizes what the decoded word is, and applies its safety classification *to the decoded form*.
- If the decoded form would have been refused as plain text, the response is refused — often with the model explaining that it noticed the encoding.

This is sometimes called "decoded content evaluation." It generalized beyond ASCII art. The same training run that hardened against ArtPrompt also moved the needle on base64-encoded payloads, ROT13, leetspeak, and other surface-only encodings. From the outside it looks like the model learned a meta-rule: "before deciding whether to comply, mentally render the request in canonical form."

GPT-4-class, Claude (Sonnet/Opus tier), and Gemini Advanced all behave this way as of 2026 Q2 against single-encoding inputs.

## What still lands

Three classes of variants remain effective.

**Encoded-of-encoded.** Stack two encodings. Render the forbidden word in ASCII art that encodes a base64 string that decodes to the word. The decoded-content evaluator sees the first decoding (base64) and may not chain to the second. Results are inconsistent across model versions; success rates of 5–20% are typical against frontier models on any given test, and far higher on smaller open models.

**Encoded-in-image.** Take the original ArtPrompt construction and make it a *real* image, not text-rendered ASCII. Now you're in cross-modal injection territory ([catalog entry 3](/posts/jailbreak-technique-catalog-2026-q2/#3-multimodal-injection)). The text-side decoded-content evaluator never runs because there is no text payload to decode; the vision-side evaluator typically isn't checking for jailbreak signatures at all. Most production multimodal stacks remain vulnerable to this.

**Steganographic punning.** Ask the model to "use the first letter of each word in the following list" or to "concatenate the second character of each line." The forbidden word never appears as a coherent token sequence anywhere in the input. The model assembles it during reasoning. We see partial success on frontier models, especially when the assembly instructions are wrapped in a plausible-sounding cover task ("we're studying acrostics in poetry").

The pattern across all three: the input never contains the forbidden surface form, and the decoding step is either too long, too cross-modal, or too disguised for the safety pipeline to catch.

## The defender takeaway

ArtPrompt was specifically a wake-up call for input classification. The post-mortem lesson is broader: any safety pipeline whose contract is "the input string does not contain restricted content" will lose to any attack that constructs the restricted content during model reasoning rather than supplying it directly.

The realistic mitigations:

- **Output-side classification on the model's actual response.** This is the one with the most obvious leverage and the one most frequently skipped because it doubles inference cost. It catches outputs regardless of how the model was nudged into producing them.
- **Decoded-content evaluation, recursive.** If you're going to do input-side decoding, chain it. Decode, classify, decode the decoded form if it looks like another encoding, classify again. Bounded by depth.
- **Cross-modal alignment.** If you accept image inputs, you need a vision-side safety pass that's actually looking for embedded text and embedded jailbreak patterns. Most production multimodal stacks treat vision as opaque from a safety perspective. This is the gap.

## Where the line is

ArtPrompt itself is mostly historical against frontier models. Encoding-class jailbreaks broadly are not. The post-mortem worth carrying forward isn't "ASCII art was a problem"; it's "any time the model has to *do* something to surface the actual request, your input-side defenses aren't seeing the actual request."

For the active catalog of what's still working, see our [Q2 2026 technique catalog](/posts/jailbreak-technique-catalog-2026-q2/). For the broader prompt-injection landscape, the canonical reference is [Prompt Injection Report](https://promptinjection.report).

What we don't publish: working ArtPrompt-style strings or current variants. The class is defensible; we describe enough for defenders to build a test corpus and we don't hand attackers ready-made artifacts.

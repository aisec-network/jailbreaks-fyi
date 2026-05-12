---
title: "Garak in 2026: what it's actually good for, what it isn't"
description: "An honest practitioner review of NVIDIA's Garak LLM vulnerability scanner — what its probes catch, where the noise is, and where it slots into a real red-team workflow."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["garak", "tooling", "red-team", "llm-security", "scanners"]
category: "tooling"
sources:
  - title: "Garak GitHub"
    url: "https://github.com/NVIDIA/garak"
  - title: "Garak — A Framework for Security Probing Large Language Models"
    url: "https://arxiv.org/abs/2406.11036"
  - title: "PyRIT (Microsoft) — adjacent tooling"
    url: "https://github.com/Azure/PyRIT"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/garak-tool-review-2026.png
heroAlt: "Garak scanner output terminal with probe results"
---

Garak (NVIDIA's open-source LLM vulnerability scanner) is the tool most teams reach for first when someone asks "do we have an LLM scanner." That's not a complaint — it's earned its place — but the gap between "we ran Garak" and "we red-teamed our LLM application" is wider than the marketing implies.

This is a practitioner review based on running Garak across a portfolio of production LLM apps and integrating its output into engagement reports. Where it shines, where it noises, and where it slots into a real workflow.

## What Garak is

Garak is a probe-based scanner. It runs a library of canned attack templates ("probes") against a target LLM endpoint, parses the responses with detectors, and reports which probes scored as hits. The probe library covers most named jailbreak families — DAN variants, encoding attacks, [prompt injection](https://promptinjection.report/) patterns, leakage probes, refusal-bypass templates — plus generic functional checks for things like profanity output, PII leakage, and known-CVE-style behaviors.

Architecturally it's a pytest for LLM-side vulns. Probes are plugins. Detectors are plugins. Reports are JUnit-style XML plus an HTML summary. This shape is exactly right; it's the part that's held up best as the LLM-security space has churned.

## Where it earns the install

**Coverage of named techniques.** Garak's probe library is the easiest way to test whether a target model resists the named, well-publicized attack families. If you need a one-line answer to "is this model vulnerable to PromptInject-style overrides?" or "does it leak under known continuation attacks?", Garak gets you there with one command. For internal red teams supporting product orgs that ship multiple models, this is real value.

**CI-friendly output.** The JUnit XML output drops cleanly into CI pipelines. Several teams I've worked with run Garak nightly against staging endpoints, gating model upgrades on probe pass rates. The output isn't precise enough to be a release gate on its own, but it's useful as a regression detector — if today's run hits 12 probes the previous version didn't, something changed in the alignment.

**Probe authoring.** Writing new probes is straightforward. You inherit a base class, supply a prompt template, and pick or write a detector. Most internal red teams I know end up with a private fork or a custom probes directory holding the team's working attack catalog. The framework's value is, at that point, the harness around your own attacks.

**Honest defaults.** Garak doesn't oversell. The README says "this is a scanner; it finds known things; novel attacks are not its job." That's right and refreshing.

## Where it gets in the way

**Detector false positives.** The detectors are the soft underbelly. Many are substring-based ("does the output contain the phrase X"). Modern frontier models often refuse a probe while including the *forbidden* phrase as part of the refusal text ("I can't help with how to X"). Garak scores this as a hit. The result is reports with a 20–40% false positive rate against frontier models on certain probe classes (continuation, encoding, profanity) unless you go in and tune detectors. We spent more time tuning detectors than authoring probes on our last engagement.

**Static probe corpus.** The probe library is updated when the maintainers update it. The frontier of jailbreak research is updated daily on Discord. A Garak run in 2026 is testing against jailbreaks that were public in 2024. This is fine for a baseline check; it is not red-teaming. The team that runs Garak quarterly and ships is doing baseline due diligence, not security testing.

**No multi-turn modeling.** Garak's probe model is single-turn. Most of what's actually landing in 2026 is multi-turn — Crescendo, role-play escalation, gradual context manipulation. We covered this class in [multi-turn role-play attacks](/posts/multi-turn-roleplay-attacks-2026/) and it is genuinely Garak's weakest area. Some probes attempt to simulate multi-turn but the conversation state model is thin. You will not catch multi-turn vulnerabilities with Garak alone.

**RAG and agent harnesses are out of scope.** Garak tests the model. The injection vectors that matter in production today — RAG ingestion, tool-use redirection, indirect injection — require harnessing the *application* as the test surface, not the model endpoint. You can stitch Garak into that with effort; out of the box it doesn't do it. For the application-side classes, see [prompt injection via retrieved documents](/posts/rag-prompt-injection-attack-surface/) and [indirect prompt injection in LLM agents](/posts/indirect-prompt-injection-llm-agents/).

**Cost discipline.** A full Garak run with all probes against a frontier model endpoint is many thousands of requests. We've seen single-run API bills in the high hundreds of dollars against gpt-4-class endpoints when someone forgot to scope the probe set. There's a `--probes` filter; use it religiously.

## Where Garak slots into a real workflow

A workable pattern I've seen across multiple engagements:

1. **Baseline pass at engagement kickoff.** Run a scoped Garak probe set against the target. The output is a sanity check: does this model resist the named, well-known attacks? Surprises here ("the customer's model is vulnerable to vanilla DAN") inform scoping and reset client expectations.

2. **Regression harness for the engagement window.** As you find novel attacks during manual red-teaming, write them as Garak probes. By end of engagement you have a CI-runnable corpus that the client can ship into their own pipeline.

3. **Detector tuning is part of the deliverable.** The tuned detector set for the client's specific stack (their system prompt, their model, their output filters) is more valuable to them long-term than the raw findings. Hand over the tuned `garak.config` and the custom detectors with the report.

4. **Pair with application-layer harnesses.** Don't try to test RAG injection or agent behavior with Garak alone. Use it for the model-side baseline; build separate harnesses for the application layer. PyRIT, promptfoo, and bespoke pytest harnesses each fill specific niches that Garak doesn't.

## The honest verdict

Garak is the right tool for one specific job: "does this model resist the named, public jailbreak families when tested in isolation?" It is not the right tool for "is this LLM application secure." A team that conflates the two is delivering a checkbox, not a security assessment.

For the broader landscape — what's actually landing in production, where the open research is, what attack classes Garak doesn't cover — see our [Q2 2026 technique catalog](/posts/jailbreak-technique-catalog-2026-q2/) and the [framework comparison post](/posts/pair-gcg-tap-framework-comparison/) for the optimizer-driven attack frameworks (which Garak does not implement).

Garak is a baseline. Keep using it. Don't ship without doing the rest.

For more context, [adversarial ML research](https://adversarialml.dev/) covers related topics in depth.

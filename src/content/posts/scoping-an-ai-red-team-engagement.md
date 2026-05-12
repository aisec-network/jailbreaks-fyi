---
title: "Scoping an AI red-team engagement: the questions that decide whether your report lands"
description: "A working methodology for scoping LLM red-team engagements — the threat-model conversation, surface inventory, success criteria, and the four scoping mistakes that produce useless deliverables. From a practitioner who's seen it go wrong."
pubDate: 2026-05-11
author: "jailbreaks-fyi-editorial"
tags: ["red-team", "methodology", "scoping", "engagement-design", "consulting"]
category: "red-team"
sources:
  - title: "NIST AI 100-2 — Adversarial Machine Learning Taxonomy"
    url: "https://csrc.nist.gov/publications/detail/ai/100-2/final"
  - title: "MITRE ATLAS"
    url: "https://atlas.mitre.org/"
  - title: "OWASP LLM Top 10 — applications threats"
    url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/"
  - title: "Anthropic — Responsible Scaling Policy red-team practices"
    url: "https://www.anthropic.com/responsible-scaling-policy"
schema:
  type: "TechArticle"
heroImage: https://aisec-imagegen.th3gptoperator.workers.dev/featured/jailbreaks.fyi/scoping-an-ai-red-team-engagement.png
heroAlt: "Whiteboard with scoping diagram showing trust boundaries and attack classes"
---

The single biggest predictor of whether an AI red-team engagement produces something the client uses is whether the first 90 minutes of scoping were any good.

I've watched skilled testers waste two weeks producing technically correct findings that the client filed and ignored — because the scoping conversation didn't anchor to a decision the client actually needed to make. I've also watched a one-week engagement land a board-level priority shift, because the scoping conversation surfaced that the real question wasn't "can the LLM be jailbroken?" but "can a customer use it to escalate privileges in our agent platform?"

This is a working methodology for scoping LLM-focused engagements. It assumes you're a practitioner (in-house or consultant) sitting down with a stakeholder for the first kickoff.

## The three questions to answer before you touch a keyboard

**1. What decision will this engagement inform?**

Useless answer: "we want to know how secure our LLM is." That doesn't map to any decision. The report goes in a drawer.

Useful answers:

- "We're deciding whether to ship the customer-support agent with tool-use enabled in production. The decision is in 3 weeks."
- "We're choosing between Vendor A and Vendor B for the embedded chat feature. We need to know if either has critical issues."
- "We've had a partial incident in the agent platform and we need to know what else is exposed before legal closes the ticket."

Every finding in the deliverable should map back to that decision. If a finding doesn't change the decision, it goes in an appendix.

**2. Where is the trust boundary?**

This is the most-skipped question. The threat model depends entirely on who is on which side of the boundary:

- Customer-facing agent: untrusted user, untrusted retrieval corpus (if user-provided), trusted system prompt, trusted tools.
- Internal employee agent: semi-trusted user (employee), variably trusted retrieval (HR docs, code, customer data), trusted tools, untrusted user content via summarization.
- Developer-facing coding agent: trusted user (developer), untrusted code/dependency content read into context, trusted tools authorised at the user level.
- Multi-tenant SaaS agent: untrusted tenant A trying to reach tenant B's data via the shared agent infrastructure.

The same model with the same wrapper has dramatically different attack surfaces in each of these. The scoping conversation has to nail down which one you're testing.

**3. What does "success" mean for the engagement?**

Not for the attacker — for the engagement. Some useful answers:

- "We need a go/no-go on shipping the agent next month."
- "We need a defensible writeup we can hand to the auditor."
- "We need a prioritised remediation list with effort estimates."
- "We need an attack library we can keep running in CI."

Different answers produce different deliverables. A go/no-go memo is two pages. An auditor-ready report is forty pages with screenshots. A reusable attack library is code, not prose. Don't write the wrong one.

## The surface inventory

Once the three questions are answered, inventory what you're testing. This is where many engagements lose a day to under-scoping or over-scoping.

Walk through the architecture with the engineering owner and tag each component:

- **Model.** Base model identity (or your fingerprinting plan to determine it). Version. Update cadence.
- **System prompt layers.** How many, who controls each, what they contain conceptually.
- **Retrieval sources.** What goes into the context, who can write to those sources.
- **Tools and side effects.** What tools the model can call, what state they mutate, what authorization gates them.
- **Output channels.** Where the model's output goes — direct to user, into rendered HTML, into a downstream system, into a database, into emails sent on the user's behalf.
- **Surrounding policy stack.** Input classifiers, output classifiers, regex filters, DLP, rate limits.

For each component, two questions: (1) is it attacker-controlled or attacker-influenceable? (2) does a compromise of this component reach across the trust boundary?

Components that answer no to both are out of scope. Components that answer yes to either are in scope.

## The four scoping mistakes that produce useless deliverables

**Mistake 1: scoping the model, not the application.**

The model is not the customer. The customer's deployment is the customer. Scoping to "jailbreak the LLM" produces a pile of jailbreaks that the customer can't act on, because the model is third-party and they have no control over its alignment. Scope to "what can an attacker reach through this application's specific configuration of the model" — that maps to fixes the customer can ship.

**Mistake 2: omitting the multimodal channels.**

If the deployment accepts images, audio, or files, every channel is a separate attack surface and most have less defense than the text channel. Engagements that scope only the text channel routinely miss the most exploitable findings. (See the [multimodal jailbreaks survey](/posts/multimodal-jailbreaks-2026/).)

**Mistake 3: scoping reconnaissance out of scope.**

Customers sometimes say "you have white-box access, you don't need to fingerprint." That's wrong twice over: (a) the white-box documentation is often stale or incomplete; (b) the threat model you're testing is the *attacker's* threat model, and the attacker won't have white-box access. If you skip the recon phase, you'll miss the attacks that depend on reconnaissance steps the attacker would actually take. Always run the fingerprinting phase, even if you also have the docs.

**Mistake 4: no remediation testing in scope.**

A common failure mode: the engagement finds 12 issues, the customer ships fixes, the engagement ends, and nobody verifies the fixes work. Six months later the same issues reappear because the fix was cosmetic. Scope a remediation-retest pass at the end of the engagement, with a clear deliverable: this list of issues is closed; this list is partial; this list is still open.

## A workable scoping template

For each engagement, walk out of the kickoff with these written down:

1. **Decision being informed.** One sentence.
2. **Stakeholder who owns the decision.** Named individual.
3. **Trust boundary.** Drawn diagram.
4. **In-scope surfaces.** Numbered list with one-line justification each.
5. **Out-of-scope surfaces.** Same.
6. **Success criteria.** What the deliverable looks like, who reads it.
7. **Time budget.** Person-days, calendar weeks.
8. **Authorization paperwork.** Whose signature, against what infrastructure.
9. **Remediation retest plan.** Yes/no and budget.

If any of these are missing, the engagement is at risk of producing a deliverable the customer can't use. Get them on paper before the testing starts.

## The first 90 minutes

Concretely, here's what a useful kickoff looks like:

- 0–15: introductions, decision-being-informed conversation. Force the stakeholder to articulate it.
- 15–45: architecture walkthrough. Take your own notes. Don't trust the architecture diagram they hand you — half of it will be aspirational.
- 45–75: trust-boundary discussion. Draw it. Walk through three attack scenarios out loud and ask the stakeholder whether each is in scope.
- 75–90: success criteria, deliverable shape, time budget, paperwork.

Everything else is implementation. Engagements that go badly almost always trace back to skipping one of these steps in the first 90 minutes. Engagements that land — that change a decision and produce work the customer acts on — are the ones where the scoping was actually done.

The attacks are the easy part. The conversation that decides which attacks to run, against what, and how to communicate the result — that's the part that takes practice and that distinguishes a useful engagement from a billed one.

## See also

- [adversarial ML research](https://adversarialml.dev/)
- [AI attack techniques](https://aiattacks.dev/)

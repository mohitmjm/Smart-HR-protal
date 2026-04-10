---
date: 2025-01-28
readTime: 5 min read
category: AI
---
# Choosing AI That Delivers ROI (Not Just an “AI” Sticker)

A story about saying no to hype and yes to money

Meet Rhea. First-time founder. Sharp, impatient, allergic to spreadsheets—until the invoice hits. She wanted AI everywhere: “smart onboarding,” “AI sales coach,” “intelligent support,” the works. In four weeks she almost signed three annual contracts and greenlit a rewrite “for the model.” Then her CFO asked the rudest question in tech:

> “How does this make us more money—or cost us less—**this quarter**?”

Here’s how Rhea went from **AI magpie** to **ROI assassin**. Steal her playbook.

---

## Scene 1: The Demos That Dazzle (and Distract)

Vendors paraded glossy demos. Chatbots that sounded like therapists. Auto-summarizers that turned meetings into haikus. Everyone promised “state-of-the-art.”

**Problem:** “State-of-the-art” is not a business case. It’s a vibe.

**What Rhea did instead:** She drew one box on a whiteboard: **“Cash in / Cash out.”** Then she drew arrows only if an AI idea affected one of these, fast.

* **Cash in:** lift conversion, bigger basket, higher retention, shorter sales cycle.
* **Cash out:** fewer tickets, faster handling, lower refund/chargeback, fewer manual steps.

If a proposal didn’t touch one of those with a number she could measure in 30 days, it died. Half the “AI roadmap” vanished in 20 minutes. Sanity returned.

---

## Scene 2: Choosing the First Use Case (Small, Ugly, Valuable)

Rhea’s team argued for “AI product recommendations.” Sexy, but lots of data prep and long feedback loops.

She picked something ugly: **support email triage + reply drafting** for the top 30 FAQs.

**Why:**

* High volume.
* Easy to baseline.
* Human-in-the-loop safety valve.
* Clear cash-out: reduce handling time per ticket.

**Baseline (one afternoon of measurement):**

* Volume: **30,000** emails/month
* Avg handling time (AHT): **6 minutes**
* Fully loaded support cost: **\$30/hour**

> Savings target: cut AHT by **2.5 minutes** (to 3.5).
> That’s **\$1.25** saved per ticket (2.5/60 × \$30).
> Monthly benefit if we hit it: **\$37,500** (30,000 × \$1.25).

Now AI had a job: earn **\$37.5k**/month, or go home.

---

## Scene 3: The Guardrails (So You Don’t Light Money on Fire)

Rhea set rules **before** a single API call:

* **Time cap:** pilot runs 4 weeks.
* **Spend cap:** model spend ≤ **\$0.08** per ticket (all-in infra + tokens).
* **Quality bars:**

  * Acceptance rate (agent uses AI draft without rewrite) ≥ **70%**
  * Error rate (AI makes it worse) ≤ **1%** of tickets
  * Latency ≤ **5s** to first draft
* **Fail fast clause:** If by week 2 acceptance < 50% or latency > 8s, **kill it**.
* **Data rules:** PII redaction, no vendor training on our data, audit logs kept 90 days.

No poetry. Just constraints.

---

## Scene 4: Build vs. Buy (and How to Decide in an Hour)

Rhea ran a ruthless matrix. Score each 1–5, weight shown:

* **Business impact (25%)** – does it hit the KPI directly?
* **Time-to-value (25%)** – live to first dollar in <30 days?
* **Unit economics (15%)** – predictable cost per event?
* **Data governance (15%)** – PII controls, residency, SOC2?
* **Vendor risk (10%)** – lock-in, model swap options, uptime?
* **DevEx (10%)** – SDKs, docs, observability?

Buy if a vendor scores highest **and** lets you export your prompts, schemas, and data. Build if the core is simple glue around your domain and the vendor adds little.

For triage, she **built** a thin service (prompts + rules + redaction + logging) and reserved the right to swap models with a flag. For voice IVR later? Probably **buy**—telephony is pain.

---

## Scene 5: The Pilot (Measured Like a Business, Not a Science Fair)

Rhea’s pilot had one job: prove the math.

**Instrumentation (day 1):**

* `ticket_received` (category\_intent, language)
* `ai_draft_created` (latency\_ms, tokens\_in/out)
* `ai_draft_accepted` (accepted = true/false, edit\_distance)
* `resolution_time_ms`
* `escalated` (true/false)

**Side-by-side workflow:**

* AI drafts replies; agents approve/edit.
* Agents tag “helpful/not helpful.”
* Every rejection requires a one-word reason from a dropdown (tone wrong, policy risk, hallucination, off-topic).

**Weekly review:** top 10 failure prompts, fix the prompt/tools/grounding, re-run.

By week 3: acceptance 73%, latency 3.2s, AHT 3.6 min. Close enough.

---

## Scene 6: ROI With Actual Numbers (No Hand-Waving)

* **Gross benefit:** 30,000 × \$1.25 = **\$37,500**/mo
* **Model spend:** 30,000 × **\$0.08** = **\$2,400**/mo
* **One-time build:** **\$60,000** (amortized over 12 months = **\$5,000**/mo)
* **Total monthly cost during year 1:** **\$7,400**
* **Net:** **\$30,100**/mo
* **ROI:** (\~(**\$37,500 − \$7,400**) ÷ **\$7,400**) ≈ **407%**
* **Break-even model cost per ticket:** \$1.25 − (\$5,000 ÷ 30,000) = **\$1.08**. Plenty of headroom.

That’s not “AI magic.” That’s a line item that pays for itself.

---

## Scene 7: What About Models, RAG, and Fine-Tuning?

Keep it simple:

* **RAG first** (retrieve relevant knowledge, then generate). It’s cheaper and safer than fine-tuning for most support/ops use cases.
* **Fine-tune** only when you have **lots** of high-quality, labeled examples and the task is repetitive classification or style.
* **Smaller models** are fine if they hit your accuracy + latency SLA. Don’t pay for a sledgehammer to push a thumbtack.
* **Abstract the model** behind your own interface so swapping vendors is a config change, not a rewrite.

**Rule of thumb:** If accuracy rises <3 pts or latency worsens >1s for a 2× cost increase, reject it. The curve lies—your P\&L doesn’t.

---

## Scene 8: Avoiding the AI Tag Tax (Common Money Pits)

* **“AI everywhere.”** Sprinkle where it changes a KPI, not every text box.
* **No human-in-the-loop.** Early days need oversight; it’s cheaper than reputational damage.
* **Unbounded prompts.** Cap tokens, cap retries, cap concurrency.
* **One-off prompts.** Treat prompts like code: version, test, roll back.
* **Zero kill criteria.** Every AI feature needs a red line that shuts it off automatically.

---

## Scene 9: The Second Win (Revenue, Not Just Cost)

With support humming, Rhea tackled **sales email personalization**.

**KPI:** reply rate on cold emails.
**Design:** AI crafts the first two sentences using only CRM + public firmographics.
**Guardrails:** ban claims, keep under 80 words, human approval required.
**Result:** reply rate lifted from 1.8% → 3.1% over 6 weeks.
**Math:** 5,000 emails/week → 65 extra replies → 12 SQLs → 3 deals/mo. That funded the next experiment without touching runway.

---

## The Playbook (Copy This and Fill the Blanks)

**1) Problem One-Pager**

* KPI to move (one): \_\_\_\_\_\_
* Baseline: \_\_\_\_\_\_
* Target change (30 days): \_\_\_\_\_\_
* Unit economics (savings or lift per event): \_\_\_\_\_\_

**2) Guardrails**

* Max model cost/event: \_\_\_\_\_\_
* Latency SLA (p95): \_\_\_\_\_\_
* Acceptance rate floor: \_\_\_\_\_\_
* Data rules: PII redaction? Residency? Vendor training off? (Y/N)

**3) Pilot Plan (≤4 weeks)**

* Scope (use case + population slice): \_\_\_\_\_\_
* Metrics to ship on day 1: events listed above
* Success gate to scale: \_\_\_\_\_\_
* Kill switch criteria: \_\_\_\_\_\_

**4) Delivery**

* Model abstraction layer (yes/no)
* Prompt versioning (where)
* Eval set (20–50 real examples with pass/fail)
* Human-in-the-loop UX defined

**5) Review**

* Weekly failure analysis (top 10)
* Cost dashboard (cost/event, cost/success)
* Business dashboard (KPI movement)

---

## Quick Vendor Checklist (Answer Yes or Walk Away)

* Can I **export prompts, data, and logs** without a ransom?
* Is **data isolation** clear (no training on my data without consent)?
* Do they provide **usage caps** and **spend alerts**?
* Is there a **sandbox** with representative limits?
* Can I enforce **determinism** or **bounded variability** where I need it?
* Do they show **latency and success SLAs**, not just “99.9% uptime”?

---

## TL;DR (and a little tough love)

Pick **one workflow** that moves **one KPI** in **30 days**. Baseline it. Put **hard guardrails** on spend, latency, and quality. Start with **RAG + human-in-the-loop**. Measure **cost per success**, not feelings. If it prints money (or saves it) with boring, repeatable numbers, scale it. If not, kill it fast and try the next use case.

AI isn’t your strategy. **Profit is.** Use AI only where it pays rent.

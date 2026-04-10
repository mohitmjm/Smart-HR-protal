---
date: 2025-01-28
readTime: 5 min read
category: HR
---
# How to Work with a Remote Engineering Team Without Losing Your Mind

A true-ish story about chaos, clarity, and getting real work done

Meet Jonah. First-time founder, caffeine optimist, Slack maximalist. He “assembled” a remote team across São Paulo, Warsaw, and Bangalore because that’s what the internet told him to do. Day 1 felt like global domination. Day 14 felt like a group project where everyone’s polite and nothing ships. Here’s how it went sideways—and how he pulled it back.

---

## Scene 1: Monday, 8:12 a.m. — “Is anyone on this?”

Jonah wakes up to 146 Slack messages, 9 GitHub notifications, and one calendar invite titled *quick sync?* The homepage redesign is “in progress,” payments “blocked,” and the mobile build “nearly there.” No one agrees on what “there” is.

**Diagnosis:** Remote teams don’t fail from distance; they fail from **ambiguity**. When everything’s fuzzy—goals, ownership, timelines—the timezone gap amplifies it.

**What fixed it: The Working Agreement (2 pages, not a manifesto).**
By noon, Jonah called a 60-minute “contract with reality” session. Out came a doc everyone signed with 👍:

* **Mission this quarter:** “Activate 100 paying teams.”
* **Definition of Done (DoD):** merged, behind flag if risky, test added, telemetry added, docs updated, demo link posted.
* **Response SLAs:** Slack DM ≤ 4h in local work hours; PR review ≤ 24h; incidents immediately.
* **Collab windows:** 2× 60-min overlap blocks (Jonah ↔ EU, EU ↔ India). Everything else async.
* **Branching:** trunk-based with short-lived feature branches.
* **Tools:** Slack (status), GitHub (work), Linear/Jira (plan), Loom (demos), Notion/Confluence (decisions).
* **Languages:** plain English, no idioms, “assume positive intent.”
* **Escalation:** if blocked > 1 day, escalate in #eng-help; if still blocked next day, Jonah decides.

Ambiguity killed. Now the timezones could help instead of hurt.

---

## Scene 2: Tuesday — “We need more meetings.” (No, you don’t.)

Jonah scheduled daily standups across three continents. Attendance tanked. The Bangalore team joined at 9:30 p.m. their time, smiled politely, then disappeared for two days.

**Diagnosis:** Meetings are expensive and timezone-hostile. Most standups are just calendar theater.

**What fixed it: Async by default, live when it saves time.**

* **Daily async standup** in Slack with a bot or simple template:

  * **Yesterday:** …
  * **Today:** …
  * **Blocked by:** … (tag a human)
* **Twice-weekly live sessions** during the overlap windows: Monday **Kickoff** (30 min), Thursday **Demo/Decisions** (45 min).
* **Record & summarize**: Every live call = auto-record + 5-line decision summary in the project doc.

Result: fewer meetings, higher signal, zero guilt.

---

## Scene 3: Wednesday — “The spec is in Figma. Kind of.”

Design handed off a gorgeous UI. Engineers built something gorgeous… and wrong. The “Upgrade” flow had eight edge cases no one wrote down: failed card, trial expired, prorations, EU VAT, the whole circus.

**Diagnosis:** A picture is not a spec. Remote magnifies gaps. Vagueness becomes rework at 2 a.m.

**What fixed it: The One-Page Ticket.**
Every ticket now requires five things—no exceptions:

1. **User story:** “As a team admin, I can \_\_\_ so that \_\_\_.”
2. **Acceptance criteria (bulletproof):** Given/When/Then, including ugly paths.
3. **Constraints:** performance, device, compliance (GDPR/PCI), flags.
4. **Test plan:** manual steps or link to e2e test to add/modify.
5. **Telemetry:** events and properties (“cta\_click { plan, step }”).

If the ticket lacks any of the five, it’s **Not Ready**. Period. Politeness doesn’t ship; clarity does.

---

## Scene 4: Thursday — PRs the size of a novel

A single pull request touched 27 files, 1,800 lines, and three unrelated features. Reviews stalled; merge conflicts bred like rabbits.

**Diagnosis:** Big PRs are attention debt. Remote reviews need *context* and *constraints*.

**What fixed it: Small batches + crisp reviews.**

* **PR size rule:** \~300 LOC diff target; >600 needs a very good reason.
* **Checklist in the PR template:** scope, tests, telemetry, screenshots/Loom, flag name.
* **Auto-assign reviewers** based on codeowners; review SLA ≤ 24h.
* **No drive-by LGTM.** Each review adds: *What I tested*, *What I didn’t*, *Risks I see*, *Follow-ups*.
* **Merge policy:** green checks + one approving review + DoD items checked → ship.

Velocity went up because *merges* went up. Funny how that works.

---

## Scene 5: Friday — The 24-Hour Ping-Pong

Bangalore asks a clarifying question while Jonah sleeps. He wakes, answers, they’re asleep. Two days evaporate to “just one more detail.”

**Diagnosis:** Handoffs without **batons** waste entire days.

**What fixed it: The Handoff Note.** (10 minutes that save 24 hours)

At the end of each local day, engineers drop a short note in the issue:

* **Status:** what’s done, what’s next
* **Open questions:** each with a proposed answer to unblock reviewers
* **Risks:** what might break
* **Ask:** one clear request of a named human

Jonah replies before his dinner; EU picks it up in their morning; India receives answers by their afternoon. Suddenly, the sun working for you.

---

## Scene 6: Week 3 — The “Almost Done” Epidemic

Everything is “90%.” Nothing is live. QA keeps discovering “one last thing.” Marketing is out of excuses.

**Diagnosis:** “Done” is a religion; your team needs a doctrine.

**What fixed it: DoD + Demo-Driven Development.**

* **DoD recap:** merged to main, flag if risky, tests + telemetry + docs, and a **Loom demo** showing acceptance criteria.
* **Weekly demo day:** each owner presents for 3 minutes. No demo, not done. Questions allowed; feature tours banned.

Shipments became **observable**. “Almost” disappeared.

---

## Scene 7: The First Incident

Checkout rates plunge. Slack melts. Is it the CDN? Stripe? That JavaScript copy helper someone pasted from Stack Overflow?

**Diagnosis:** Remote incident response without a playbook becomes a blame festival.

**What fixed it: A tiny SRE habit.**

* **On-call rotation** (yes, even for a startup): one engineer per week with backup.
* **Runbooks** for hot paths (auth, checkout, email).
* **Incident channel** with a single incident commander.
* **Post-mortem in 24 hours**: timeline, root cause, fixes, owners. No shame, just receipts.

Trust increased because recovery did.

---

## Scene 8: “But are they… working?”

Jonah catches himself counting green Slack dots. Rookie move.

**Diagnosis:** Reporting hours is theater. Reporting **outcomes** builds trust.

**What fixed it: The Scoreboard.** Shared, boring, undeniable.

* **Throughput:** completed tickets/week (Not story points. Finished work.)
* **Cycle time:** PR open → merge
* **Deployment frequency:** how many times to prod
* **Escaped defects:** bugs users saw
* **Activation metric:** the one business KPI tied to engineering work

The team reviews the scoreboard every Monday. When numbers dip, they fix process—not people.

---

## Scene 9: The Vendor Vortex

Three chat tools, two project trackers, a “free” CI that isn’t, and a surprise bill for AI tokens.

**Diagnosis:** Tool sprawl is the quiet killer. Every login is context switching; every vendor is a dependency.

**What fixed it: One-page tool policy.**

* **One tool per job.** Propose a replacement only with a clear gain and 2-week sunset plan.
* **Owner per tool.** Someone responsible for access, cost, and hygiene.
* **Monthly 30-minute cost review** with kill switches (spend alerts, hard usage caps).

---

## Scene 10: Culture Without Pizza

“How do we bond?” Jonah asks. Someone suggests a virtual escape room. Hard pass.

**Diagnosis:** Culture for remote teams is made of **habits**, not gimmicks.

**What fixed it: Small rituals that survive timezones.**

* **Written kudos** every Friday in #wins—with why it mattered.
* **Pairing hour** once a week across regions.
* **No-meeting Wednesday** to protect deep work.
* **Quarterly offsite** (rotate timezones or meet IRL if budget allows).

People felt seen. Work felt human.

---

# The Playbook Jonah Wishes He’d Started With

Copy/paste this into your kickoff doc and adjust:

**1) Working Agreement (TL;DR)**

* Mission: *X in Y by Z date.*
* DoD: *merge, flag, tests, telemetry, docs, demo.*
* SLAs: *Slack 4h, PR 24h, incident now.*
* Overlap windows: *Mon-Thu 09:00–10:00 ET (US↔EU), 11:30–12:30 ET (EU↔India).*
* Tools: *Slack, GitHub, Linear, Loom, Notion.*
* Escalation: *blocked >24h → #eng-help → next day founder decision.*

**2) Cadence**

* Daily: async standup.
* Mon: plan & commit (30m). Thu: demo/decide (45m).
* Weekly: scoreboard review (15m).
* Quarterly: retro + offsite.

**3) Ticket Template**

* Story, Acceptance, Constraints, Test plan, Telemetry.

**4) PR Rules**

* ≤300 LOC ideal, template filled, review ≤24h, screenshots/Loom.

**5) Handoff Note**

* Status, Open Qs (+ proposed answers), Risks, Ask.

**6) Incident Basics**

* On-call rotation, runbooks, #incident channel, 24h post-mortem.

Pin this. Live by it. Adjust it monthly.

---

## Three Months Later

The homepage shipped. Checkout works. Demos are quick, merges are daily, and the scoreboard is boring in the best way. Jonah stops stalking Slack. The team is still on three continents—and now it’s an advantage. They hand off like a relay team: code moves while Jonah sleeps.

He didn’t find “remote magic.” He found **clarity, cadence, and constraints**. That trio beats timezone pain, every time.

---

### TL;DR

Write the rules together, go async by default, protect two overlap windows, require bulletproof tickets, keep PRs small, hand off with notes, publish a scoreboard, and treat incidents like adults. Do this and you won’t lose your mind—you’ll ship.

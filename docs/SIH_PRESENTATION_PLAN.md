# ANUMATI · SIH26130 — What goes on each slide, and what to say in ten minutes

You sent two things, and they are **two different documents**. Don't conflate them:

| What | Source | Purpose |
|---|---|---|
| **The deck — 6 slides** | The video: official SIH format | This is what you *submit* |
| **The 10-minute talk** | The image: timing structure | This is what you *say* |

There are few slides and a lot of talking time. That means **you speak for minutes on a single slide** — so put little on each slide and say a lot. "Don't read slides" is on the DON'T list.

---

# ⚠️ Three things you have to change right now

**1. The demo is only 2 minutes.**
The image puts Demonstration at 5:00–7:00. The script I gave you earlier assumes roughly 5 minutes of demo. **It has to be cut.** The exact 2-minute cut is below — show only that.

**2. "Avoid claiming unverified data" is on the DON'T list.**
This is no longer my nagging; it is a judging criterion. Your per-approval day counts are not verified yet. Either mark them on the slide as **"seed data — verification in progress"**, or leave the per-approval numbers off entirely. Saying it before you are caught is the win.

**3. Q&A is 3 minutes — as long as the entire Impact section.**
Do not treat Q&A as an afterthought. Prepare it separately, with backup slides.

---

# PART A — The six slides

## Slide 1 — Title / Problem Statement

**What SIH asks for:** PS ID, PS title, theme, PS category (Software/Hardware), team name, team ID.

**For ANUMATI:**
```
Problem Statement ID : SIH26130
Theme                : (as listed on your portal)
Category             : Software
Team Name / ID       : ___
Solution Name        : ANUMATI
```

**One line to put here**, as a subtitle:
> *Approval roadmaps for setting up a business, with the section of the act behind every rule.*

**Do not put here:** logo art, "revolutionizing", team photos.

---

## Slide 2 — Idea / Proposed Solution / Uniqueness

The video showed these three words together, which means **three headings on one slide**.

**Idea (2–3 lines):**
> Put every approval a business needs into a dependency graph, with an evidence type and a citation on each dependency. Compute the critical path, and show the order the law actually allows.

**How it addresses the problem:**
- The PS asks to *coordinate parallel departmental workflows*. No single window in the country sequences them: they route applications, they do not order them.
- ANUMATI changes nobody's process — **it only tells you the order**.
- One journey: **524 days in sequence → 255 days in parallel.**

**Uniqueness — these two lines are the most important in the whole deck:**
> The scheduling is not new. CPM is from the 1950s, and we say so.
> **What is new is deriving a typed, confidence-scored legal dependency graph from statutory text and departmental forms.**

Then the four edge types, one line each:

| | Type | Where it comes from | Confidence |
|---|---|---|---|
| 🔒 | Statutory | Written into the act or rule | 1.00 |
| 📄 | Documentary | B's form asks for A's certificate | 0.90 |
| ⚙️ | Physical | Impossible in the other order | 1.00 |
| 🤝 | Practice | Convention, not law — flagged | 0.50 |

**One visual on this slide:** a screenshot of the graph with the red critical-path column visible.

---

## Slide 3 — Technical Approach

**What SIH asks for:** technologies used, plus methodology and process for implementation — a flow chart is expected.

The video showed a **"PROCESS FLOW ARCHITECTURE"** diagram on this slide. Build that.

**Technologies — one compact block, not bullets:**
```
Frontend    Next.js 14 · TypeScript · React Flow · Zustand · Tailwind
Backend     FastAPI · PostgreSQL 16 · NetworkX · Alembic
Extraction  pdfplumber → LLM (structured output) → human review
Optional    OR-Tools (inspection planning) · Redis
```

**The flow diagram — this is the slide's real job:**
```
Gazette PDF / departmental form
        ↓  pdfplumber
   text + page map
        ↓  LLM, temperature 0, structured output
   Approval draft  { name, days, deemed, documents, citation }
        ↓  edge inferencer
   "Does B's form require A's output?"  →  DOCUMENTARY edge
        ↓
   REVIEW QUEUE  ← every extraction lands here
        ↓  a human publishes
   Postgres (versioned, citation NOT NULL)
        ↓  NetworkX
   critical path + parallel batches
        ↓
   Roadmap · Register · Simulator · OAGS export
```

**Two lines under the diagram:**
- **Nothing is auto-published.** Every extraction arrives as a DRAFT; a human publishes it.
- **A rule cannot be stored without a citation** — `source_document_id`, `section` and `url` are all `NOT NULL`. That is a database constraint, not a habit.

---

## Slide 4 — Feasibility & Viability

The video showed **FEASIBILITY / CHALLENGES / RISK**. The official template asks for a feasibility analysis, potential challenges and risks, and strategies for overcoming them.

**Feasibility:**
- The whole system runs on Postgres plus NetworkX. 35 approvals, ~50 edges — the critical path computes in milliseconds. No GPU, no graph database.
- The frontend already runs without a backend, against the seeded rule base.
- For a state to adopt it costs **one export script**, not a process change.

**Challenges and risks — write three, and write them honestly:**

| Risk | Strategy |
|---|---|
| **Rule extraction is the bottleneck** — getting rules out of PDFs is the slowest part | Human review queue; start with one sector in one state; prioritise by confidence score |
| **A wrong dependency graph is more dangerous than no graph**, because people act on it | Typed evidence and confidence on every edge; practice edges shown dashed at 0.50; rejection feedback loop |
| **Rules keep changing** | Bitemporal versioning — no row is ever updated, a new version is inserted. A roadmap built in Feb 2026 still resolves against Feb 2026's rules |

**This is the line judges will like most:**
> We are not claiming the graph is right. We are showing exactly how sure we are of each edge — and where we are not.

---

## Slide 5 — Impact & Benefits

**Impact on the target audience — three audiences, three different benefits:**

| For whom | What they get |
|---|---|
| **Single-window / DIC officer** *(primary user)* | A register covering the whole journey, with the act and section on every row. Today this job is done with a spreadsheet and phone calls |
| **Applicant** | 269 days, and a printable sheet they can carry into an office — less need for a consultant |
| **Industries Department** | Which reform saves how many days, from an engine rather than an estimate |

**Benefits:**
- **Social** — a small entrepreneur can navigate this without a consultant
- **Economic** — 269 days per unit, across hundreds of units in a district
- **Governance** — first cross-department visibility on RTS Act disposal timelines

**And the thing that turns this from a tool into a system:**
> Every rejection report is a day of data that cannot be back-filled. The moat compounds, and it starts the day the first applicant reports something.

---

## Slide 6 — Research & References

This is the most-ignored slide, and in your case **the most useful one** — because your entire pitch rests on citations.

**What to put:**
- Water (Prevention and Control of Pollution) Act, 1974 — s. 25
- Air (Prevention and Control of Pollution) Act, 1981 — s. 21
- Factories Act, 1948 — s. 6, s. 2(m)
- Food Safety and Standards Act, 2006 — s. 31
- Maharashtra Right to Public Services Act, 2015
- MAITRI portal — maitri.maharashtra.gov.in
- The MAITRI Act, 2023 — s. 5 (transfer on delay), s. 6 (Empowered Committee), s. 8 (grievance), s. 16 (joint inspection), s. 20 (online wizard)
- GTFS specification (for the analogy)

**And one line at the bottom:**
> Rule base v1.3 · 34 approvals · 27 source documents · 100% carrying a section reference · 3 flagged for review

---

# PART B — What to say in ten minutes, and on which slide

| # | Section | Time | Slide | What you say |
|---|---|---|---|---|
| 1 | **Team introduction** | 0:00–0:30 | Slide 1 | Names, roles, PS ID. **Thirty seconds, that is all.** Lingering here is the most common mistake |
| 2 | **Problem understanding** | 0:30–1:30 | Stay on Slide 1 | Rahul's story. What the PS asks for. NSWS's own admission. Stakeholders: applicant, officer, department |
| 3 | **Idea & solution** | 1:30–3:00 | Slide 2 | The idea, then the four edge types, then the two uniqueness lines |
| 4 | **Technical approach** | 3:00–5:00 | Slide 3 | Walk the flow diagram with your finger. Stack in 20 seconds. Spend 60 seconds on the extraction pipeline |
| 5 | **DEMONSTRATION** | 5:00–7:00 | **the live app** | The cut below. **Two minutes only** |
| 6 | **Impact & feasibility** | 7:00–9:00 | Slides 4 + 5 | Feasibility 45s, risks 45s, impact 30s |
| 7 | **Conclusion** | 9:00–10:00 | Back to Slide 2 | The GTFS close. Thank the judges |
| — | **Q&A** | 10:00–13:00 | backup slides | Below |

**One practical note:** there is no slide change between sections 2 and 3. That is deliberate — two minutes on one slide is fine; two slides in one minute is not.

---

# THE 2-MINUTE DEMO CUT

This is what survives. Everything else becomes Q&A material.

| Time | What you do | What you say |
|---|---|---|
| **0:00–0:20** | Roadmap already open. **Do nothing** — let the collapse bar run | "Five hundred and twenty-four days, one after another. Two hundred and fifty-five in the right order. *Two hundred and sixty-nine days of a person's life, lost to sequence alone.*" |
| **0:20–0:50** | Click `A15` → panel | "Sixty days, and it waits on the building plan — because MPCB's own Form XIII asks for the sanctioned plan. *We did not guess that dependency. We read their form.*" Then point at the Source block — Water Act 1974, s. 25 |
| **0:50–1:10** | Press **D** → register → **Print this sheet** | "An officer does not read a canvas, they read a file. And this is the paper the applicant carries into an office. *A government panel understands paper.*" |
| **1:10–1:45** | Simulate reforms → tick one lever → point at the refused lever | "Sixty-nine days. And this one the engine refuses — it is a statutory dependency. *Statute is out of reach by construction, not by policy note.*" |
| **1:45–2:00** | Standard page | "We are not building a portal. We are writing down the format approval rules should be published in." |

## What was cut from the demo — and where to use it

| Cut | Where it goes |
|---|---|
| Employees slider (72 → 8, three approvals disappear) | **Q&A** — the best answer to "does it actually reason?" |
| Node hover → dependencies light up | Q&A, or a screenshot on Slide 2 |
| Report a rejection dialog | **Q&A** — the moat question |
| Narrating the edge-type breakdown | It is written on Slide 2; no need to say it |
| Graph zoom controls, filter box | Do not show at all |

---

# Q&A — 3 minutes (as long as the Impact section)

## The four questions that will come

**"This is just CPM — what is new?"**
Concede it, do not defend. "The scheduling is textbook, and deliberately so, because it has to be explainable to an officer. What is new is deriving a typed, confidence-scored dependency graph from statutory text."

**"How do you know the graph is right?"**
"Twenty-seven of twenty-nine edges rest on an act or on a department's own form. Two rest on practice — and we publish them as practice, at 0.50, dashed. We are not claiming the graph is right."

**"Where is the AI?"**
Open the rationale in the detail panel. **And be honest:** the extraction pipeline is designed, the frontend shows its output, and **the live extraction demo is not built yet**.

**"Are the numbers verified?"**
"The act names and sections are real. The day counts in this seed are ours, and we are verifying them against the RTS notifications."
"Avoid claiming unverified data" is on the DON'T list — **so say this yourself, even before you are asked**.

## Backup slides (outside the 10 minutes, for Q&A only)

1. Employees slider before/after screenshot — "does it reason?"
2. The rejection loop — applicant → review queue → version bump
3. Bitemporal versioning table — "what happens to an old roadmap when rules change?"
4. One OAGS dependency in full, as JSON
5. What is not built yet — pre-validation, portfolio what-if, inspection planner *(show it yourself, do not hide it)*

---

# DO's / DON'Ts applied to ANUMATI

| Rule | What it means for you |
|---|---|
| ✅ Follow the time limit strictly | Put a timer on the demo. It will drift from 2 minutes to 4 without practice |
| ✅ Use simple language | Save "bitemporal", "topological sort" and "DAG" for Q&A. In the presentation say "versioned", "order", "graph" |
| ✅ Show a working demo | You have one. **Run it on localhost, not a deployed link** — do not trust the venue wifi |
| ✅ Be ready for real-world questions | "Which officer opens this daily?" — answer: the DIC facilitation officer |
| ❌ Don't read slides | That is why the slides carry little text. What you say is in this document, not on the slide |
| ❌ Don't ignore the problem statement | Bring the PS wording back in every section: *coordinate parallel departmental workflows* |
| ❌ **Don't claim unverified data** | The day counts. This is your biggest exposure |
| ❌ Don't get defensive in Q&A | The "this is CPM" question is coming. Concede it, then move to the real novelty |

---

# Pre-presentation checklist

- [ ] Six slides built, under 40 words each
- [ ] Slide 3's process flow diagram drawn (this is the slide's real job)
- [ ] Slide 6 carries every act reference, verified
- [ ] Demo runs on localhost, `npm run build` green
- [ ] Roadmap page already open, browser zoom at 100%
- [ ] The whole team has read the dead-button list (Export PDF, Share, Version history, Export brief — **do not press**)
- [ ] Demo rehearsed against a timer — never over 2:00
- [ ] Full run three times — never over 10:00
- [ ] One printout of the register in hand (you can give it to a judge)
- [ ] Five backup slides kept separate for Q&A
- [ ] The team has one agreed answer on the day counts

---

**Last thing:** the single biggest risk in this document is the day counts. Everything else you have, and it works. The two days spent reading the RTS notifications are what take this from 8.8 to 10.

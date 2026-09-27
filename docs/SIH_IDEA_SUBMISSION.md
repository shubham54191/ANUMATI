# SIH 2026 — Idea Submission Content (SIH26130)

**Problem Statement:** Efficiency in streamlining industrial approvals, compliance processes, and access to government support services
**Organisation:** Government of Maharashtra · Maharashtra State Innovation Society
**Category:** Software · **Theme:** Smart Automation

> Copy each block below into the matching field on the submission form. Character
> counts are given against the form's limits. Every figure in this document is
> produced by the build in this repository and is locked by a test — nothing here
> is estimated. Where a number is modelled rather than measured, the text says so,
> because a claim a judge can disprove costs more than the claim was worth.

---

## Field 1 — Idea Title

> Form limit: **100 characters**

```
ANUMATI: Regulatory Knowledge Engine for Parallel Industrial Approvals and Conflict Resolution
```

**94 / 100 characters.**

Two alternates, if the title above reads too technical for the panel:

| Title | Chars |
|---|---|
| `ANUMATI: Approval Sequencing, Pre-Validation and Conflict Resolution for Industrial Clearances` | 94 |
| `ANUMATI: A Sequencing and Coordination Layer for Industrial Approvals in Maharashtra` | 84 |

The first title is recommended. "Regulatory knowledge engine" and "conflict
resolution" are the problem statement's own words, so a keyword screen matches
on the title alone.

---

## Field 2 — Idea Description

> Form limit: **50,000 characters** · the text below is **10,797**, about a fifth
> of the allowance: long enough to be specific, short enough to be read.

```
THE GAP WE ARE FILLING

Setting up an industrial unit in Maharashtra takes 25 to 35 clearances across
more than 15 central, state and local departments. Maharashtra already runs a
serious single window: MAITRI 2.0, launched in February 2025 under the
Maharashtra Industry, Trade and Investment Facilitation Act, 2023, carries 119
services across 15-16 departments with an application wizard, desk-level
tracking, an incentive calculator, a document repository, a grievance system and
NSWS synchronisation.

We are not proposing to rebuild it. MAITRI 2.0 tells an applicant WHAT to file.
It does not tell them WHEN each clearance may be filed, it does not check a file
BEFORE it is filed, it does not coordinate the departments that must decide
together, and it has no answer for the case where two of them decide the
opposite thing on the same file. ANUMATI is the sequencing and coordination
layer that supplies those four things, on top of the portal the state already
has, without asking any department to change its process.

THE CORE IDEA: A TYPED, CITED DEPENDENCY GRAPH

Every portal we examined publishes approvals as a LIST. A list tells you nothing
about order. We model them as a directed acyclic graph in which every edge -
every "this must come before that" - carries four things:

  1. A TYPE. Statutory (an Act orders this order), documentary (one approval
     produces a paper the next one's form demands), physical (the work cannot
     happen the other way round), or practice (neither of the above - it is
     simply how the office runs).
  2. A CITATION. The source document, the exact section, and a resolvable URL.
     This is a required field. A rule that omits it fails validation and cannot
     be published.
  3. A CONFIDENCE, from 0 to 1.
  4. A RATIONALE in plain language, which is what an applicant reads when they
     ask why one approval is waiting on another.

The reason the type matters is reform. Of the 31 dependency edges in our
Maharashtra rule base, 7 are statutory, 17 documentary, 2 physical and 2
practice. The two practice edges are delays that no law requires. They can be
removed by an administrative instruction tomorrow - and until now nobody could
point at them, because nobody had written down which delays are law and which
are habit. That distinction is the novelty. The critical path method we run over
the graph is fifty years old and we say so; what is new is a legal dependency
graph honest enough to be reformed.

WHAT THE ENGINE COMPUTES

Over that graph we run the Critical Path Method. On a notified MIDC plot the
roadmap is 31 approvals across 21 departments: 464 days if filed one after
another, 223 days on the critical path. On private land outside MIDC it is 32
approvals, 524 days in series against 255 on the critical path - the difference
is real, because inside a notified industrial area there is no land-use
conversion order to apply for and MIDC itself is the planning authority for the
building plan.

Both figures are MODELLED, NOT MEASURED. They are the sum of notified time
limits in series against the critical path through them - what the law allows,
not what applicants experienced. We label them that way on every screen.

We also run a SECOND CLOCK. Applicants report what they actually waited, and the
roadmap can be rebuilt on the median of those reports: 319 days on the critical
path against 639 in series, from 51 field reports. The gap between 223 and 319
is the honest measure of where a single window is losing time, and it is
computed from reports rather than typed in by us. It is labelled as seeded pilot
data wherever it appears.

FIVE THINGS THE PROBLEM STATEMENT ASKS FOR THAT NO PORTAL HAS BUILT

1. PRE-VALIDATE SUBMISSIONS. Before anything is sent to a department, the file
   is checked against the dossier the applicant actually holds. On our seeded
   case, 21 of 31 filings would be refused at the counter: 43 blocking gaps and
   4 advisory notes. Three kinds of gap are found - a document the department's
   own list requires and the dossier does not hold; a prior order that does not
   exist yet; and the expensive one, THE SAME PHYSICAL FACT WRITTEN TWO
   DIFFERENT WAYS ON TWO DEPARTMENTS' FORMS. Water draw declared as 210 KLD to
   MIDC and 145 KLD to MPCB is caught on day one instead of becoming a rejection
   three weeks later. Statutory prerequisites block; practice conventions only
   advise, because the rule base knows the difference.

2. COORDINATE PARALLEL DEPARTMENTAL WORKFLOWS, AND SETTLE A CONFLICT. One file
   is pushed to every stakeholder department at the same moment rather than
   passed down a chain, each lane running its own statutory clock from day 0.
   The hard case is two departments returning opposite decisions inside the same
   phase - MIDC clearing a building plan at the same instant MPCB refuses the
   Consent to Establish. The pipeline splits visually, the master approval is
   disabled, and a resolution screen opens showing the exact refusal beside the
   pre-defined governance rule that settles it. Three rules ship: a technical
   veto sends the file back for revision; equal authority escalates to the
   Empowered Committee; a weighted score consolidates. EVERY RULE DECLARES
   WHETHER ITS INSTRUMENT IS IN FORCE OR DRAFTED FOR THE PILOT AND NOT YET
   NOTIFIED, and the screen says which, because a drafted clause must never
   borrow the authority of a real one.

3. COMMON INSPECTION PLANNING. The Act asks for inspections to be conducted
   jointly as far as practicable (s. 16). The reason it rarely happens is not
   unwillingness - no single desk knows when every department will be ready to
   travel. The graph does, because an approval's window opens on the day the
   site becomes ready for that department. Grouping those days turns 12 separate
   inspections into 8 visits.

4. RISK-BASED SCRUTINY. A score from pollution category, hazardous materials,
   boiler, built height, headcount and prior objections sets HOW HARD a file is
   examined - documents only, documents plus one joint visit, or a full
   inspection. It never decides whether a clearance is granted. The weights are
   pilot parameters and are labelled as such: the Act permits risk-led
   inspection but prescribes no formula.

5. RENEWALS. A clearance is not a finish line. Seven validity periods are
   tracked with expiry, renewal window, days remaining and alarms at 60, 30 and
   7 days, each drawn from the parent rules rather than invented.

THE LEGAL CORRECTION AT THE CENTRE OF THIS BUILD

Most teams working on this problem statement assume a missed deadline means the
approval is automatically granted. It does not. The Maharashtra Right to Public
Services Act, 2015 gives an appeal (s. 9) and a penalty of Rs 500 to Rs 5,000 on
the designated officer (s. 10). IT DEEMS NOTHING APPROVED.

What actually happens on a missed limit is in the MAITRI Act, 2023: the file
TRANSFERS to the Empowered Committee and the competent authority CEASES TO HAVE
THE POWER to deal with it (s. 5(1), s. 5(2)), and the Committee still disposes
of it UNDER THE RELEVANT LAW (s. 5(3)). So one silent desk cannot hold a
project, and nothing is waved through either.

Deeming is a power of the sectoral statute, not a general rule, so we carry it
per approval with the clause named. Four survive verification against the bare
acts: MRTP Act s. 45(5), CGST Rules r. 9(5), Water Act s. 25(7), Factories Act
s. 6(2). Four we could not locate were REMOVED rather than asserted.

EVERY FEATURE MAPS TO A SECTION OF THE STATE'S OWN ACT

We are not asking Maharashtra to legislate anything. The machinery exists:
the dependency roadmap extends the Online Wizard Module (s. 20); concurrent
dispatch is application through the Nodal Agency (s. 4); the transfer on a
missed limit is s. 5; tie-breaker decisions bind both sides (s. 6, s. 9); joint
inspections are s. 16; the grievance button is s. 8; the reform simulator is the
instrument for the reform proposals s. 15 already asks the Nodal Agency to make;
and s. 25 gives the Act overriding effect, so adoption needs no other state law
amended.

AN OPEN STANDARD, SO THIS IS NOT ONE MORE PORTAL

Every state has this problem and solves it in a different spreadsheet. We
publish the Open Approval Graph Schema (OAGS v0.1, CC BY 4.0): a small JSON
schema for approvals, their statutory timelines, and the dependencies between
them. Our Maharashtra rule base - 34 approvals, 31 edges, 27 cited source
documents - is published in it, and so is the validator. Five live endpoints
serve the schema, the dataset, a validator for somebody else's file, the rules
as they stood on any past date, and roadmap computation. Adopting the format
costs a state one export script; it changes how rules are PUBLISHED, not how
they are stored. Once two states publish OAGS, one window reads both without a
bespoke integration.

HOW IT IS BUILT

Three parts. A Next.js 14 web application holds the product and a pure
TypeScript rule engine - no verdict is ever stored, every screen is recomputed
from the file by one function, so nothing can go stale. A Fastify 5 API on Node
22 with PostgreSQL 16 holds accounts, files, decisions and clocks; IT IMPORTS
THE SAME ENGINE THE BROWSER RUNS, so a roadmap or a conflict is computed
identically on both sides and the server's answer is the one that counts. Rule
tables are bitemporal, so a roadmap generated today stays reproducible after the
law changes. The decision ledger is append-only, enforced by database triggers
with a SHA-256 hash chain and a verifier. A third part, an offline Python
pipeline, reads a gazette PDF and DRAFTS rules - it never publishes. Every
draft lands in a review queue for a named officer to sign off or reject with a
note.

WHAT WE REFUSE TO DO

The console will never grant a clearance an Act would have refused. Even the
Empowered Committee disposes of a transferred application under the relevant
law, and the code follows that: a transferred lane stays open until it is
actually decided. A department's approval covers only the parameters that
department is competent to judge, so an upstream sign-off is shown as context
and never as clearance. And no rule reaches the rule base without a citation and
a human.

STATE OF THE BUILD

Working software, not a mockup. 111 automated tests over the engines, strict
TypeScript with zero errors, a clean production build. Some tests exist to stop
specific errors returning: no deeming clause may be attributed to the Right to
Public Services Act; none may be claimed without naming the provision granting
it; the public day-count figures are locked so that a silent drift in the rule
base breaks a test rather than quietly making a public claim untrue; and our own
published rule base must pass our own validator.
```

**10,797 characters of 50,000.**

---

## Field 3 — Abstract / Summary

> Form limit: **10,000 characters** · the text below is **3,775**.

```
Setting up an industrial unit in Maharashtra takes 25 to 35 clearances across
more than 15 departments. The state already runs a capable single window -
MAITRI 2.0, with 119 services, a wizard, desk-level tracking, an incentive
calculator and a grievance system. It tells an applicant what to file. It does
not tell them when, it does not check a file before it is filed, it does not
coordinate departments that must decide together, and it has no answer when two
of them decide the opposite thing. ANUMATI supplies those four things as a layer
on top, asking no department to change its process.

The core is a regulatory knowledge engine: industrial clearances modelled as a
directed acyclic graph where every dependency carries a type (statutory,
documentary, physical or practice), the Act and section it rests on, a
confidence, and a plain-language rationale. The citation is a required field - a
rule without one fails validation and cannot be published. Running the Critical
Path Method over that graph collapses an MIDC-plot roadmap of 31 approvals
across 21 departments from 464 days filed in series to 223 on the critical path;
on private land it is 524 against 255. Both are modelled from notified time
limits, not measured, and are labelled that way on screen. A second clock,
computed from 51 applicant field reports, gives 319 days against 639 - the
honest measure of where the process actually loses time.

Typing the edges is what makes the graph reformable. Of 31 dependencies, 2 rest
on practice rather than law: delays no statute requires, removable by
administrative instruction, and visible for the first time because someone wrote
down which delays are law and which are habit.

Five capabilities the problem statement asks for and no portal has built:
pre-submission validation, which catches 21 of 31 filings that would be refused
at the counter - including the same physical fact written two different ways on
two departments' forms; concurrent dispatch to every department with a conflict
resolution protocol for the case where two return opposite decisions in the same
phase; joint inspection planning, which turns 12 separate inspections into 8
visits; risk-based scrutiny that sets how hard a file is examined and never
whether it is granted; and a renewal calendar.

The build corrects an error common to work on this problem. A missed deadline
does not deem an approval granted: the Right to Public Services Act, 2015 gives
an appeal and a penalty on the officer, nothing more. Under the MAITRI Act, 2023
the file transfers to the Empowered Committee and the competent authority ceases
to have power over it, while the Committee still decides under the relevant law.
So one silent desk cannot hold a project, and nothing is waved through. Deeming
is carried per approval with the clause named; four survive verification against
the bare acts and four unverifiable ones were removed rather than asserted.

Every feature maps to a section of the state's own Act - the wizard (s. 20),
dispatch (s. 4), transfer on delay (s. 5), binding tie-breaks (s. 6, s. 9),
joint inspection (s. 16), grievance (s. 8), reform proposals (s. 15) - and s. 25
gives that Act overriding effect, so adoption amends no other law.

The rule base and its validator are published as the Open Approval Graph Schema
(OAGS v0.1, CC BY 4.0) with five live endpoints, so this is a format other
states can adopt rather than one more portal. Implementation is a Next.js 14
application, a Fastify 5 API on PostgreSQL 16 that imports the same engine the
browser runs, an append-only decision ledger with a SHA-256 hash chain, and an
offline extraction pipeline that only ever drafts - every rule is published by a
named human. 111 automated tests, strict TypeScript, clean build.
```

**3,775 characters of 10,000.**

---

## Field 4 — Technology Bucket

Select: **`Coding and Programming`**

This is the honest fit. The core of the work is a deterministic graph engine and
a state machine — a typed DAG, critical path computation, and a pure-function
conflict protocol. There is no model in the request path and nothing here is
predicted.

**If the panel expects an AI bucket**, `AI/ML, Cloud Computing, Blockchain` is
defensible, because the extraction pipeline runs a local language model to draft
rules from gazette PDFs. Be ready for the follow-up: that model drafts only, a
named reviewer publishes, and no model output ever reaches an applicant's
roadmap unverified. Pick this bucket only if you are comfortable making that
distinction out loud — claiming an AI product and then describing a graph
algorithm reads worse than choosing the accurate bucket.

---

## Field 5 — YouTube Link (Optional)

Optional, but a working two-to-three minute screen recording materially improves
a shortlisting review — it proves the software runs. Suggested running order:

| Time | Show |
|---|---|
| 0:00–0:20 | Sign-in, then the wizard: five answers |
| 0:20–0:50 | The roadmap. 464 days in series against 223 on the critical path. Open one approval and show its Act, section and confidence |
| 0:50–1:20 | Pre-check: 21 of 31 filings would be refused, including 210 KLD against 145 KLD on two forms |
| 1:20–2:10 | Officer console: dispatch to four departments at once, trigger the simultaneous clash, show the split pipeline and the resolution screen with its rule and citation |
| 2:10–2:30 | The SLA ladder: a breach transferring a file to the Empowered Committee under s. 5, not deeming it approved |
| 2:30–2:50 | The Standard page: drop our own export on our own validator, live |

Upload as **Unlisted** unless the rules require otherwise, and leave the field
blank rather than submitting a broken link.

---

## Field 6 — Idea Template (PDF upload, max 10 MB)

Download the official template from the form and fill it with the material
above. Do not substitute your own layout — mirror their headings exactly.

Typical sections and what to put in each:

| Template section | Use |
|---|---|
| Proposed solution | The "core idea" and "what the engine computes" blocks from Field 2 |
| Technical approach | The three-part build (web / API / extraction), the typed DAG, CPM, the append-only ledger. One architecture diagram — `docs/architecture/anumati-architecture.png` |
| Feasibility and viability | It sits on top of MAITRI 2.0 and needs no department to change its process. State the risk plainly: MAITRI API access is not guaranteed, so the product runs standalone on an OAGS export first and a connector follows |
| Impact and benefits | The table below |
| Research and references | The statutory list below |

### Figures for the impact section

Every figure is produced by the build and locked by a test.

| Claim | Figure | Basis |
|---|---|---|
| Reduced approval time, MIDC plot | 464 → **223 days** (31 approvals, 21 departments) | Modelled: notified limits in series vs critical path |
| Reduced approval time, private land | 524 → **255 days** (32 approvals) | Modelled |
| What applicants actually report | 639 → **319 days** | Median of 51 field reports, seeded pilot data |
| Fewer incomplete applications | **21 of 31** filings would be refused, caught before filing | Pre-validation against the seeded dossier |
| Blocking gaps surfaced in advance | **43** blocking, 4 advisory | Same run |
| Lower compliance cost | **12 inspections → 8 visits** | Joint planning over ready-dates |
| Transparency | **31 of 31** edges typed and cited; 27 source documents | Rule base, enforced by validation |
| Delays that are habit, not law | **2** practice edges | Edge typing |

**Say "modelled, not measured" out loud in the deck.** A panel that catches an
unqualified number stops believing the qualified ones.

### Statutory references

| Instrument | Provisions used |
|---|---|
| Maharashtra Industry, Trade and Investment Facilitation Act, 2023 (Mah. Act XXXIV of 2023) | s. 4 application through the Nodal Agency · s. 5 transfer on a missed limit, authority ceases to have power, Committee decides under the relevant law · s. 6 Empowered Committee · s. 8 grievance and power to call for reasons · s. 9 binding effect · s. 15 reform proposals · s. 16 joint inspection · s. 20 Online Wizard Module · s. 25 overriding effect |
| Maharashtra Right to Public Services Act, 2015 (Mah. Act XXXI of 2015) | s. 9 appeal · s. 10 penalty of Rs 500–5,000 on the designated officer. **No deemed approval** |
| Maharashtra Regional and Town Planning Act, 1966 | s. 45(5) — deemed sanction of a building plan |
| Water (Prevention and Control of Pollution) Act, 1974 | s. 25(7) — deemed consent |
| Factories Act, 1948 | s. 6(2) — deemed approval of factory plans |
| Central Goods and Services Tax Rules, 2017 | r. 9(5) — deemed registration |

---

## Before you press Save as Draft

- [ ] Title pasted and under 100 characters
- [ ] Description and Abstract pasted; neither truncated by the form
- [ ] Technology Bucket selected — the form defaults to `Select` and will reject
- [ ] Template PDF filled with the official layout, under 10 MB
- [ ] YouTube link working and unlisted, or the field left empty
- [ ] Every day-count in the deck carries "modelled, not measured"
- [ ] Nobody on the team is about to claim the RTS Act gives a deemed approval

The form warns that **no changes are entertained after submission.** Read every
field back once before you submit.

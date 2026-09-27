# ANUMATI — the two accounts: what each one sees, why, and what it buys

| | |
|---|---|
| Covers | The applicant dashboard and the officer clearance console — the split, the reason for it, and the value each side delivers |
| Build | `anumati-web` (Next.js 14) + `anumati-server` (Fastify, PostgreSQL). Without the server the web app runs as an offline demo |
| Written | 26 Sep 2026 |

---

## 0. The one-sentence version

**The applicant account answers "what do I need and when will it end."**
**The officer account answers "this file is on my desk right now — decide it, and show who decided what."**

They are not two views of one screen. They are two products that share one rule
base, and the product is only credible because both exist: a roadmap with no
console is a planning toy, and a console with no roadmap is another portal.

---

## 1. The split, mechanically

| | Applicant | Officer |
|---|---|---|
| Sign in | `applicant` / `demo` | `officer` / `admin` |
| Lands on | `/roadmap/new` → `/roadmap/{id}` | `/matrix` |
| Enforced by | `<AuthGate allow="applicant">` | `<AuthGate allow="officer">` |
| Unit of work | One **project** (a factory being set up) | One **file** (an application in flight) |
| Time model | A schedule projected forward in days | A clock running now, against SLA |
| Can it change a decision? | No. Read-only on every approval. | Yes — approve, reject, raise a query, on its own department's rows only |

`AuthGate` is a hard redirect, not a hidden menu. An officer who types the
applicant URL is bounced to `/matrix`, and the reverse. This matters in Q&A: a
judge will ask whether the "roles" are just CSS.

**Honest caveat to state out loud before anyone finds it:** sign-in is
demo-grade. The engine runs in the browser, so this decides *which product a
person sees*, not *what they are allowed to read*. Anything that actually
needed protecting would be re-checked on a server. Say this before the judge
says it.

---

## 2. Applicant dashboard — what is on screen and why

Route: `/roadmap/{id}`. Four answers at the wizard produce the whole board.

### 2.1 The four numbers at the top

| Card | Reads | Why it is there |
|---|---|---|
| Approvals | 31 across 21 departments | The real size of the problem. Nobody knows this number before they start. |
| Sequential | 464 days | What happens if you do them one at a time, which is what most people actually do |
| Critical path | 223 days | The shortest honest finish — the chain that cannot be compressed |
| Time saved | 241 days (≈51.9%) | The difference between knowing the order and not knowing it |

**What it buys:** the applicant's first real question is "how long until I can
switch the machines on." Every existing single-window portal answers "here is a
form." This answers the question.

### 2.2 Roadmap & Dependencies

A dependency graph with two views — **Critical Path** and **All Dependencies** —
plus a connected critical-path strip above it.

Edges are typed and carry a confidence, which is the part that separates this
from a flowchart drawn in PowerPoint:

| Edge type | Confidence | Means |
|---|---|---|
| Statutory | 1.0 | The Act says B cannot be filed before A |
| Documentary | 0.9 | B's form demands a number that only A issues |
| Physical | 1.0 | The building has to exist before it can be inspected |
| Practice | 0.5 | Not law — this is how the desk actually behaves |

**Why the confidence figure:** a 0.5 "practice" edge is an admission, and an
admission is what makes the 1.0 edges believable. A graph where everything is
certain is a graph nobody checked.

**What it buys:** it tells the applicant which single delay costs them the
project and which one costs them nothing. Six approvals sit on the critical
path. The other 25 have slack.

### 2.3 Timeline View

Every approval as a bar on a day axis, grouped by department, with a
draggable simulated-day scrubber.

- Filled status badge per row — locked, in progress, query raised, approved
- The bar sits at its **real** start day, not at the left edge — "Fire NOC — final" begins at day 83 because it cannot begin earlier
- A vertical marker for today; a bar past its window turns red and is marked OVERRUN
- Scale toggle `0–100 d` / `0–223 d`, because a three-day approval on a 223-day axis is invisible

**What it buys:** the graph proves the *order*; the timeline proves the
*calendar*. Dragging the scrubber to day 20 and watching nine rows still locked
is the fastest way to show why sequential filing costs 464 days.

### 2.4 All Approvals (31)

The register. Every approval with its department, statutory days, and the
provision it comes from. Opening a row gives the rule version, review status,
confidence, section and in-force dates, and whether a review is open on it.

**Why:** the day counts are the entire claim. If a judge cannot trace 21 days
back to a section of an Act, the 223 is a guess.

### 2.5 Document Ledger

Which document each approval demands, and which other approval issues it. The
same PAN certificate is demanded by eleven desks.

**What it buys:** this is the concrete case for a shared data matrix. Not "data
sharing is good" — "eleven desks, one certificate, count them."

### 2.6 Pre-Check

Readiness list, risk card, renewal board, inspection summary, grievance dialog.
The readiness list runs rule-based validation *before* filing and reports
cross-form contradictions in plain words:

> Connected load declared as 1250 kVA on A11, 1600 kVA on A22 — correct one of
> the forms so both departments see the same figure.

**What it buys:** most rejection in practice is not corruption, it is a mismatch
between two forms nobody compared. Catching it before filing removes a
rejection cycle that costs weeks. This — not cryptography — is the honest answer
to "what if the file is wrong."

### 2.7 The right rail

Dependency evidence (28 filings behind the edges), dependency-type breakdown,
key insights, time-saved. Standing context that does not change as you switch
tabs.

---

## 3. Officer console — what is on screen and why

Route: `/matrix`. The unit is a file, not a project.

### 3.1 Top bar

Open files · files in conflict · files past SLA. Three numbers, always visible.

**Why:** an officer arriving at 9am needs to know where the fire is before
anything else loads.

### 3.2 Application queue

Every file with its state. A file is either awaiting dispatch or dispatched.

**Dispatch is the whole reform in one button.** One press sends the file to
every department at the same instant, instead of one desk passing it to the
next. Everything after that — parallel clocks, conflicts, deemed approval —
only exists because dispatch is simultaneous.

### 3.3 Parallel track and phase summary

Every department's clock on one file, side by side, running at once.

- Each desk has its own SLA in days, from its own Act
- A desk that misses its limit is **auto-escalated** — the file transfers to the next tier and that desk ceases to have power over it
- A desk that stays silent past a statutory window is **deemed approved**, citing the Act that allows it

**What it buys:** the two mechanisms are the reason a silent department stops
being an infinite delay. Neither requires anyone to complain first. Both leave
a citation in the trail.

### 3.4 Conflict handling — the hardest question in the problem statement

When two departments decide opposite things on the same file, someone must
decide who wins, and the answer has to be written down before the conflict
happens. Three rules are implemented:

| Rule | How it resolves |
|---|---|
| **Veto** | A named department's rejection halts the phase automatically. No committee. |
| **Escalation / tie-breaker** | The file rises a tier; a chair decides, on the record |
| **Weighted score** | Each desk scores out of 100; the file passes only if the weighted total clears the bar |

The **Simultaneous clash** button commits an approval and a rejection on the
same timestamp deliberately — the case a sequential system cannot even
represent, let alone resolve.

**What it buys:** most single-window proposals quietly assume departments agree.
This one assumes they will not, and names the rule in advance.

### 3.5 Decision bar

Approve · Reject · raise a query. Enabled **only** on the rows belonging to the
department you are signed in as. Everything else is visible and read-only.

**Why read-all, write-restricted:** an officer needs the whole file to judge
their own part of it. Water usage matters to the building inspector as context
and is still not theirs to clear.

### 3.6 Right rail — seven tabs

| Tab | What it is for |
|---|---|
| Thread | Clarification queries and replies, with the clock showing |
| Data Matrix | Records fetched automatically from each ministry of record; one contradicting the file is marked FLAGGED |
| Scope | Field-level ownership — which department owns which parameters, and which are signed |
| SLA | Every clock on this file, and what happens when each expires |
| Visits | Inspection planning, including joint inspection under MAITRI Act s. 16 |
| Redress | Grievances against the file |
| Audit | Who did what, when, and on what source |

The **Data Matrix** validates in the background: a dispatched file calls each
ministry of record itself and whatever comes back is on screen before anyone
asks for it. **Scope** is the field-level ownership model — MIDC signing "site
and structure" is context on MPCB's screen, never clearance for MPCB's
decision.

The Scope footer is deliberate and must stay:

> Signed with the officer's own DSC in a deployment. Mocked here — this build
> holds no keys and signs nothing.

**What it buys:** every officer action is attributable, and no officer's
signature silently covers another officer's domain.

---

## 4. The same fact from both sides — the strongest thing to demo

| Fact | Applicant sees | Officer sees |
|---|---|---|
| A department is silent past its window | Row turns red, marked OVERRUN | File auto-escalates a tier; the desk loses power over it |
| Two departments disagree | The approval stalls on the timeline | Conflict banner, and the named rule fires |
| A form contradicts another form | Pre-Check flags it before filing | Data Matrix marks the fetched record FLAGGED |
| An approval clears | Bar fills green | Audit trail records who, when, and on what source |

One engine, two audiences. **Say this line in the demo:** *the applicant is
never told a different story from the officer — they are told the same story in
the vocabulary they can act on.*

---

## 5. What each side deliberately cannot see, and why

**The officer does not get** the 31-approval roadmap, the sequential-versus-
parallel arithmetic, or the reform simulator. Those belong to the person
planning a project. On the desk of someone processing one file they are noise.

**The applicant does not get** approve/reject on anything, another department's
internal thread, or the tie-breaker screen. Read-all is fine; write is not.

Cutting these is a design decision, not a missing feature. Defend it as such.

---

## 6. One naming problem — fix it or pre-empt it

The applicant board carries an **Applicant / Department** view toggle. That
"Department" is *not* the officer account — it is a second reading of the same
roadmap for a facilitation officer, and it opens on the register with the
reform simulator enabled.

A judge who sees a "Department" button on the applicant screen and then hears
about a separate officer login will ask which one is real. Two options:

1. Rename the toggle to **Planner / Facilitation view**, or
2. Say it first: *"this toggle re-reads the same roadmap for a facilitation
   officer. The clearance console is a separate account — I'll open it next."*

Option 1 is better. Option 2 costs nothing and can be done today.

---

## 7. Two-minute demo path

1. Sign in as `applicant`. Four numbers — 31 approvals, 464 sequential, 223 critical, 241 saved.
2. **Roadmap & Dependencies** → Critical Path. Six approvals decide the project.
3. **Timeline View** → drag to day 20. Nine rows still locked, one running red.
4. **Pre-Check** → the 1250 vs 1600 kVA mismatch. "This is caught before filing."
5. Sign out. Sign in as `officer`.
6. Open a file → **Dispatch**. Every clock starts at once.
7. **Simultaneous clash** → the conflict rule fires and names itself.
8. Right rail → **Scope** → switch READING AS to MPCB. "MIDC signed site and structure. On MPCB's screen that is context, not clearance."
9. Close on the honest line: *"the seal proves who approved which exact file. It does not prove the file is true. Truth is checked by the rules engine, the cross-form check and joint inspection."*

---

## 8. Q&A

| Question | Answer |
|---|---|
| "Why two accounts instead of one screen with tabs?" | Different unit of work. The applicant reasons about a project over months; the officer reasons about one file today. One screen serving both serves neither. |
| "Are the roles real or just hidden menus?" | Real in live mode: the server checks the password, issues a token, and checks the role and the department on every request. `AuthGate` only decides which screens to draw. In the offline demo it picks the product, not the permission — and the badge says DEMO · OFFLINE. |
| "Can an officer clear another department's rows?" | No. The console locks other departments' desks, and the server refuses the write anyway (403, "Only MPCB can act on the MPCB desk") — tested. |
| "Where do the day counts come from?" | Each approval cites a provision. Open any row in All Approvals for the section, version and in-force dates. |
| "What stops a department sitting on a file forever?" | Auto-escalation at the SLA limit and deemed approval at the statutory window, both citing the Act. Neither needs a complaint first. |
| "What if two departments disagree?" | A named rule decides — veto, tie-breaker, or weighted score — and it is fixed before the conflict, not after. |
| "Is any of this backed by a server?" | Yes, in live mode: accounts, files, clocks, queries, grievances, signatures and a hash-chained ledger live in PostgreSQL, and the server re-runs the same engine the browser runs. Government systems are recorded answers, and the badge says so. |

---

## 9. Still open — do not claim these are done

- Government systems are recorded answers in the demo; the live adapters have never called a real endpoint.
- The demo signs with a labelled test key, not a DSC. Say "verifies the officer's own DSC signature", never "we sign documents".
- Prior approvals arriving as applicant uploads are accepted as documents, not verified as prerequisites. Pre-validation checks presence, not provenance.
- Three citations — MRTP s. 45(5), Factories s. 6(2), and the FSSAI regulation number — are asserted confidently in code. Confirm each against the bare act before the presentation, because these are exactly the three a technical judge will pull.

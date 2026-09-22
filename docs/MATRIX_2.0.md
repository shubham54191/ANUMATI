# Matrix 2.0 — Concurrent Clearance, Conflict Resolution and the Officer Console

This document explains the officer half of ANUMATI: what it does, how to demo it in
about four minutes, and how every piece of it actually works.

The applicant half of the product answers *"what do I need, in what order, and where
do the days go"*. Matrix 2.0 answers the other half of the same question, from inside
government: **once a file has been pushed to every stakeholder department at the same
moment, what happens when two of them decide the opposite thing?**

---

## 1. Two products, two sign-ins

Sequential filing has one useful property — a file is only ever on one desk, so it can
never be approved and rejected at once. Parallel dispatch removes that property, and
everything in this document exists because of what it removes.

The two personas are now separate products behind a real sign-in, not two tabs of the
same screen:

| Sign-in | Lands on | Sees |
|---|---|---|
| `OFFICER` / `ADMIN` | `/matrix` — the clearance console | Their queue of live files, the parallel review track, SLA clocks, the conflict protocol, the shared data matrix, the audit trail |
| `APPLICANT` / `DEMO`, or **Continue as an applicant** | `/roadmap/new` — the roadmap | The 34-approval dependency graph, the critical path, sequential-vs-parallel days, the document ledger |

The gating is enforced both ways by `components/auth/AuthGate.tsx`: an officer who
opens `/roadmap/…` is redirected to `/matrix`, and an applicant who opens `/matrix` is
redirected to `/roadmap/new`. **The officer never sees the applicant's roadmap** — no
approval catalogue, no "524 days if filed sequentially", no reform simulator. An
officer opens this console to work a queue, and everything on their screen is either a
file or a clock.

Credentials are matched case-insensitively and trimmed, so `OFFICER ` / `ADMIN ` works
exactly like `officer` / `admin`. The session lives in `localStorage`, which is right
for a demonstration build and is the one part of this that a deployment would replace
with a real identity provider and server-side checks.

---

## 2. The four-minute demo

Sign in as `OFFICER` / `ADMIN`. Three files are waiting, one per row of the decision
matrix, so every branch of the protocol can be walked without editing anything.

### File 1 — `APP-2026-0148`, technical objection under the parent Act

1. **Dispatch to all 4 departments.** The track fans out from one dispatch node into
   four lanes — MIDC, MPCB, FIRE, LABOUR — and all four time limits start on day 0.
2. **Simultaneous clash — MIDC approve + MPCB reject.** Both decisions are committed
   on a single timestamp. Instantly:
   - the MIDC lane turns **green**, the MPCB lane turns **red**, and the track splits;
   - a banner drops across the file naming both departments and the clock second;
   - the phase bar turns **amber** and reads `HALTED — TECHNICAL VETO`;
   - **Finalise approval is disabled** and stays disabled;
   - the cross-departmental thread opens itself, carrying both officers' reasons.
3. **The Conflict Resolution screen.** Left: the reason MPCB refused — *"Effluent
   treatment capacity proposed is 145 KLD against a declared draw of 210 KLD."*
   Right: the matrix row, which says the refusal stands on the **Water Act**, not on
   this system, and that the rejection must record its reasons (MAITRI Act s. 4(3)).
   The chip reads `IN FORCE`, because that row is drawn from an enacted statute.
4. **Data matrix tab.** Background validation fired on dispatch. The cross-check of
   the water-draw figure declared to MIDC against the figure declared to MPCB comes
   back a **MISMATCH** — and that record is quoted on the conflict screen as the
   evidence behind the refusal. The applicant could have seen the same thing in the
   pre-check screen three weeks earlier, for nothing.
5. **Thread tab → Resolve & re-evaluate as MPCB.** The objecting department withdraws
   its own refusal. The lane goes red → **PROCESSING** and the conflict evaporates.
6. **Stage the clash again → Send for revision.** The packet carries MPCB's objection
   and lists MIDC's approval as *carried forward — do not re-file*.

### File 2 — `APP-2026-0151`, equal authority → Empowered Committee

Two competent authorities of equal standing, reading the same drawing differently.

1. **Simultaneous clash — DISH approve + FIRE reject.** DISH approves the factory
   plan; the Fire Service refuses the provisional NOC because the same plan set shows
   one 1.0 m staircase where two exits and 1.5 m are required.
2. The file **routes itself** to the **Empowered Committee** — a temporary node appears
   at the end of the track, and the banner reads *Escalated: awaiting tie-breaker
   panel*. Nobody forwarded it.
3. **Open the panel.** Both departments' inputs side by side, and exactly two buttons:
   **Overrule & approve** or **Sustain rejection**. The panel is the Committee the Act
   constitutes (s. 6), chaired by the Development Commissioner (Industries), and its
   decisions bind both the applicant and the authorities (s. 9).

**The honest caveat, said out loud on the screen:** the Act sends files to the
Committee on *delay* (s. 5) and on *grievance* (s. 8). It has no clause headed "two
departments disagree". The Committee, its chair and the binding effect are enacted;
applying that route to a deadlock is this pilot's reading, and the rule's note says so.

### File 3 — `APP-2026-0155`, risk-based scrutiny

Departments score the risk rather than voting the proposal up or down.

1. **Simultaneous clash.** MSEDCL scores the distribution side 88; the Electrical
   Inspector scores 42, because the single-line diagram shows a 1,600 kVA transformer
   against a load application for 1,250 kVA.
2. The consolidated score decides **how hard the file is looked at** — documents only,
   or a full joint inspection. It never grants or refuses a clearance.
3. Score the remaining desks and the moment the last one reports below the threshold,
   the phase marks itself and notifies the project manager. No officer signs that
   into existence; the threshold does.

### What a missed time limit actually does — on any file

Press **+1 D**, or start the **CLOCK**, and watch the escalation matrix act on its own.
Two different consequences, and which one applies is a property of the **statute**,
not a category of department:

- **FIRE** (21-day limit, no deeming clause in its own Act) breaches and the file is
  **transferred to the Empowered Committee**. MAITRI Act, 2023 — s. 5(1) and s. 5(2):
  the Nodal Agency moves the application and the competent authority *ceases to have
  the power to deal with it*. Nothing is waved through, and the lane stays open,
  because the Committee still has to decide it under the same law (s. 5(3)).
- **MIDC** (building plan) breaches its 60-day clause and is **deemed granted** —
  under **MRTP Act, 1966 s. 45(5)**, the Act's own provision.

> **The error this replaced.** An earlier build deemed clearances approved under the
> "Right to Public Services Act, 2015 s. 5(3)". That provision does not exist. The RTS
> Act gives an applicant an **appeal** (s. 9) and puts a **penalty of ₹500 to ₹5,000**
> on the designated officer (s. 10) — it deems nothing approved. Deeming is a power of
> the sectoral statute, and only four clearances in this rule base actually have one:
> MRTP s. 45(5), CGST r. 9(5), Water Act s. 25(7), Factories Act s. 6(2). Where a
> clause could not be found in the bare act, none is asserted. A test enforces this.

**Reset** returns any file to its filed state, so the demo can be run again immediately.

---

## 3. How it works

### 3.1 Shape of the code

```
types/matrix.ts               The domain: reviews, rules, records, events, resolutions
lib/matrix/rules.ts           The Pre-Defined Decision Matrix — three rows, as data
lib/matrix/applications.ts    Three seeded files, one per rule
lib/matrix/engine.ts          The state machine: dispatch, decide, tick, derive, resolve
lib/matrix/display.ts         Where a review state becomes a colour and a word
store/useMatrixStore.ts       Zustand store — applications, clock, selection, panels
store/useAuthStore.ts         Sign-in and role
app/matrix/MatrixConsole.tsx  The console layout
components/matrix/*           Queue, banner, track, conflict screen, panel, tie-breaker
components/auth/AuthGate.tsx  Role gating both ways
```

### 3.2 Nothing is stored twice

`engine.ts` is pure. Every function takes an `ApplicationFile` and returns a new one;
the store only holds files and UI state. Crucially, **no verdict is ever stored** —
`derive(app)` recomputes the whole picture on every render:

```ts
const conflict   = rejected.length > 0 && (approved.length + deemed.length) > 0;
const simultaneous = conflict && new Set(decisionTimestampsToTheSecond).size === 1;
const vetoedBy   = rule.kind === "veto" ? rejected.find(isVetoDepartment) : null;
const weighted   = rule.kind === "weighted" ? Σ(score × weight) / Σweight : null;
const canFinalise = dispatched && !conflict && nothingPending && nothingRejected && …;
```

That is why a rejection withdrawn in the chat thread cannot leave a stale `CONFLICT`
banner on screen, and why the master action can never enable itself around an open
rejection: the gate is not a flag someone has to remember to clear, it is arithmetic
over the current facts. Replaying the same events always lands on the same answer.

### 3.3 "At the exact same time" is not hand-waving

`decide(app, inputs[])` takes an array and stamps every decision in it with **one**
`new Date().toISOString()`. `derive` then compares those stamps truncated to the
second; if the approvals and rejections share a single stamp, `simultaneous` is true
and the banner says *"at the same instant — 18:15:34 on day 6"*. If FINANCE happened to
approve on day 4 and MPCB rejects on day 5, the banner honestly says *"inside the same
parallel phase"* instead. The protocol fires either way — simultaneity is what makes
the clash vivid, not what makes it a conflict.

### 3.4 The decision matrix is data, not code

Each file carries a `MatrixRule`. Three rows ship in `lib/matrix/rules.ts`:

| Row | Kind | What it decides | Cited to |
|---|---|---|---|
| `MX-VETO-TECH` | `veto` | A refusal by the authority the sectoral Act names stands on that Act | Water Act 1974 / Fire Act 2006 / Factories Act 1948, read with MAITRI Act s. 4(3), s. 5(3) — **in force** |
| `MX-ESCALATE-EQUAL` | `escalation` | Equal authority → Empowered Committee, decisions binding | MAITRI Act, 2023 — s. 6, s. 8, s. 9 — **in force** |
| `MX-RISK-SCRUTINY` | `weighted` | Consolidated score sets the depth of scrutiny, never the outcome | Pilot parameter — **draft**, weights are the district's |

Each row carries an `authority_status` of `enacted` or `draft`, and every screen
that shows a row shows that status beside it. All three rows shipped here are
**draft**: they were written for the district pilot, modelled on practice the
departments already follow, and no Government Resolution has notified them yet.

This matters more than it looks. The roadmap's own rule base cites real
instruments — MLRC 1966 s. 44, Companies Act 2013 s. 7, the Right to Public
Services Act 2015 — and a drafted pilot clause sitting next to those without a
label would quietly borrow their authority. A citation that cannot be checked is
worse than no citation, because it teaches the reader to stop checking. The
distinction is the same one the dependency graph already draws between what an
Act requires and what a department merely does: a draft row still decides the
file in front of the officer, it just says out loud what it is.

A state that tie-breaks differently edits a row; it does not edit the console. This is
the same discipline the rule store behind the applicant roadmap already follows — a
rule that cannot say which instrument it comes from cannot be applied to a citizen —
and it is why the right-hand column of the conflict screen always carries a citation.

The UI is driven entirely off `rule.kind`:

- **`veto`** → the phase bar holds amber (recoverable, not dead), `Finalise approval` is
  disabled, and the unlocked path is **Send for revision**, which builds a
  `RevisionPacket` containing the objections *and* the clearances already granted, so
  the applicant never re-files something that has already passed.
- **`escalation`** → `applyMatrix` calls `escalateToTieBreaker` automatically the instant
  the deadlock is detected, setting `tie_breaker_open` — which is what puts the temporary
  node on the track and makes the panel screen reachable. `tieBreakerDecision("overrule")`
  rewrites the rejected lanes to approved with the panel's reason attached; `("sustain")`
  records the sustain and returns the file.
- **`weighted`** → the consolidated score is derived live from whatever has been scored so
  far, and `applyMatrix` calls `failOnScore` by itself once every desk has reported and the
  average is still under the threshold.

### What the matrix does without being asked

Three consequences fire on their own, because each is a decision a person adds nothing to:

| Trigger | Automatic consequence |
|---|---|
| Conflict under an equal-weight rule | File routed to the tie-breaker panel; temporary node added to the track |
| Every desk reported, consolidated average under the threshold | Phase marked failed, project manager notified |
| File dispatched | Background validation calls every ministry of record in the shared data matrix |

`applyMatrix(app)` runs at the end of both `decide()` and each clock tick, so a deemed
approval that completes the panel settles the phase exactly as a human score would.

The **veto** row is the deliberate exception. It halts the phase automatically — the
progress bar goes amber and `Finalise approval` is disabled with nobody pressing
anything — but *sending the file back to the applicant* stays a button, because that is a
human act with a human consequence at the other end of it.

### 3.5 The SLA clock

`advanceDay` walks each open lane once per simulated day:

| Condition | Effect | Authority written to the trail |
|---|---|---|
| 2 days left | SLA warning event | — |
| Overdue, `statutory: true` | `escalated_on_day` set, file lifted to `escalation_tier`, amber tag on the lane | RTS Act 2015, s. 6 |
| Overdue, `statutory: false` | Lane set to `deemed_approved`, phase advances | RTS Act 2015, s. 5(3) |

Deemed approval is deliberately *not* available to statutory clearances — you cannot
deem a pollution consent or a fire NOC into existence — so those escalate instead. The
console clock stops itself when there is nothing left for it to move.

### 3.6 The shared data matrix

Each file carries `DataRecord`s: a label, the ministry of record, the endpoint the
matrix calls, the latency, and — the part that matters for governance — **what it
replaces** ("Certified 7/12 extract from the tahsil office (5–7 days by post)"). A
fetch moves `idle → fetching → verified | mismatch | unavailable`, and every completed
fetch writes an audit entry naming its source, because a decision taken on an
automatically fetched record has to be as auditable as one taken on paper.

**It is not something an officer starts.** The console fires background validation for
every record the moment a file is dispatched, so what each ministry holds is on screen
before anyone thinks to ask. *Re-validate all* exists only for calling the registers
again later.

One record on file 1 returns a **mismatch** on purpose. That is what a real integration
is for: not to rubber-stamp the file faster, but to surface the fact that contradicts
it — and the conflict screen then quotes that record as the evidence under IT's
rejection.

### 3.7 The clarification thread

Without it, a rejection is a note thrown over a wall. The thread is attached to the
file, opens itself when a conflict is detected, and seeds itself with both officers'
recorded reasons. **Resolve & re-evaluate** is offered only to the department that
actually rejected — it withdraws its own objection, the lane returns to processing, and
the conflict disappears without any escalation or override. That is the cheapest
possible resolution, and the UI puts it one click away.

### 3.8 The departmental desk strip

In a deployment, each Approve/Reject button lives on a different officer's screen in a
different building. In this build they are collected into one strip at the bottom of
the console so the whole protocol can be walked in a minute. The engine cannot tell the
difference: a decision is a decision whichever screen it arrived from, and it lands in
the audit trail attributed to the department and officer who made it.

---

## 4. What a deployment would change

Everything above runs in the browser against seeded files, which is the right shape for
a demonstration and the wrong shape for a district office. Four things move server-side
in a real deployment:

1. **Identity.** `useAuthStore` becomes a real IdP session; role checks are enforced on
   the server, not by a redirect.
2. **The files.** `ApplicationFile` becomes rows in the same PostgreSQL schema described
   in `BACKEND_ARCHITECTURE.md`, with the event log as the source of truth and `derive`
   running identically on either side of the wire — it is already pure.
3. **The clock.** `advanceDay` becomes a scheduled job against wall-clock time, which is
   what turns SLA warnings, auto-escalation and deemed approval into notifications
   rather than screen state.
4. **The data matrix.** The seeded answers become real calls to the ministries of
   record, with the same audit obligations already implemented here.

The decision matrix itself does not move. It is already data, already cited, and
already the only thing standing between a disagreement between two departments and a
project that waits a year to find out who won.

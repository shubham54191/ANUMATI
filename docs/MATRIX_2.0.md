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

### File 1 — `APP-2026-0148`, the veto rule

1. **Dispatch to all 4 departments.** The track fans out from one dispatch node into
   four lanes — FINANCE, IT, MPCB, LABOUR — and all four SLA clocks start on day 0.
   This is the concurrent routing in point 2 of the brief: no department is waiting
   behind another's desk.
2. **Simultaneous clash — FINANCE approve + IT reject.** Both decisions are committed
   on a single timestamp. Instantly:
   - the FINANCE lane turns **green**, the IT lane turns **red**, and the track visibly
     splits;
   - a red banner drops across the top of the file for every viewer, naming both
     departments and the clock second the clash happened;
   - the overarching phase bar turns **amber** and reads `HALTED — TECHNICAL VETO`;
   - **Finalise approval is disabled** and stays disabled;
   - the cross-departmental thread opens itself, carrying both officers' reasons.
3. **The Conflict Resolution screen** appears below the track as a side-by-side grid.
   Left: the exact reason IT rejected — *"Server infrastructure budget exceeds cloud
   allocation guidelines — 18 on-premise racks proposed where MahaGov Cloud capacity is
   already allotted to this cluster."* Right: the row of the Pre-Defined Decision Matrix
   that decides who wins, with the clause it comes from.
4. **Data matrix tab.** Nothing to press — background validation fired on dispatch, and
   five records have already been pulled from other ministries. Four verify; the MahaGov
   Cloud capacity register comes back a **MISMATCH**, and that record is quoted on the
   conflict screen as the evidence behind IT's rejection.
5. **Thread tab → Resolve & re-evaluate as IT.** IT withdraws its own objection. The
   lane goes red → **PROCESSING**, the banner clears, the conflict evaporates. Nobody
   overruled anybody.
6. **Stage the clash again → Send for revision.** The revision packet opens: IT's
   objection to be corrected, and FINANCE's approval listed as *carried forward — do not
   re-file*. The applicant gets 15 days; the phase resumes where it stopped.

### File 2 — `APP-2026-0151`, the tie-breaker rule

Both departments carry equal weight, so neither may override the other.

1. **Simultaneous clash — FINANCE approve + MPCB reject.**
2. The file **routes itself**: the banner reads *Escalated: awaiting tie-breaker panel*, a
   temporary **Tie-Breaker** node appears at the end of the parallel track drawn dashed in
   amber, and the file lands on the panel's dashboard. Nobody forwarded it — an
   equal-weight deadlock has nowhere else to go, so the matrix moves it.
3. **Open tie-breaker panel.** The panel screen shows both departments' inputs side by side — officer, designation,
   timestamp, weight, veto status — with exactly two buttons: **Overrule MPCB & approve**
   or **Sustain rejection**. There is no third option on purpose; an escalation that can
   be left half-decided is how a file spends six months on a desk.

### File 3 — `APP-2026-0155`, the weighted rule

A tender, where departments score instead of voting.

1. **Simultaneous clash.** FINANCE scores 95, IT scores 40. The Consolidated Dashboard
   Score reads **67.5 / 100** against a passing score of 75 — `BELOW THRESHOLD BY 7.5`,
   with the threshold marked on the bar.
2. Score the remaining two desks (MPCB 80, PWD 78) from the departmental desk strip and
   the average moves live to **73.3** — still short.
3. The moment the last desk reports, the phase **marks itself failed** and the project
   manager is notified. No officer signs a failure into existence; the threshold does.

### SLA, escalation and deemed approval — on any file

Press **+1 D** repeatedly, or start the **CLOCK** to run a day every 1.4 seconds, and
watch the escalation matrix act on its own:

- Two days out, each desk gets an SLA warning in the audit trail.
- **LABOUR** (non-statutory, 7-day window) breaches on day 8 and is marked
  **DEEMED APPROVED** under the Right to Public Services Act, 2015 s. 5(3). The phase
  advances without it.
- **IT** (statutory, 10-day window) breaches on day 11 and is **auto-escalated** to the
  Principal Secretary (IT) — a statutory clearance cannot be deemed, so the tier above
  inherits the delay instead.

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
| `MX-VETO-TECH` | `veto` | A rejection by a designated technical or statutory authority hard-blocks the phase | Maharashtra Single Window Clearance Rules, r. 14(2) |
| `MX-ESCALATE-EQUAL` | `escalation` | Equal weight → District Steering Committee, 7-day window | GR IND-2024/CR-118/INDUSTRIES-2, para 6 |
| `MX-WEIGHTED-PROC` | `weighted` | Consolidated weighted average must reach 75 | Maharashtra Public Procurement Policy 2023, cl. 22 |

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

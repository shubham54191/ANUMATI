# ANUMATI — Frontend Architecture
### SIH26130 · What goes where, and why

**Read this before writing a single component.** Every folder here has a reason; if you put a file in the wrong place, the next person will not find it.

---

# 1. Stack decision — and the honest reasoning

| Choice | What | Why this and not the alternative |
|---|---|---|
| **Framework** | **Next.js 14 (App Router) + TypeScript** | You already know Next.js from Booth Map. App Router gives server components for the heavy rule-browsing pages and keeps the interactive graph client-side. **Not** plain React + Vite — you lose SSR for the public roadmap pages, which matters if this ever gets shared as a link |
| **Styling** | **Tailwind CSS + CSS variables for tokens** | Fast, and a design system emerges from tokens rather than from a component library you have to fight. **Not** MUI/Ant — they make everything look like every other hackathon project |
| **Graph rendering** | **React Flow (`@xyflow/react`)** | The DAG with parallel lanes is the hero screen. React Flow gives you pan/zoom, node selection, custom nodes and edge routing for free. **Not** D3 from scratch — you will spend 6 hours on edge routing alone. **Not** Mermaid — you cannot make nodes interactive |
| **State** | **Zustand** | The roadmap has real cross-component state (selected node, active view, what-if levers). **Not** Redux — too much ceremony. **Not** raw context — re-render hell with a 40-node graph |
| **Server state** | **TanStack Query** | Caching, loading states and refetch for free. Keeps server state out of Zustand, which is the mistake most teams make |
| **Charts** | **Recharts** | Bottleneck bars, timeline, what-if impact bars. Enough, and fast to write |
| **Forms** | **React Hook Form + Zod** | Zod schemas are shared with the backend contract — one source of truth for validation |
| **Tables** | **TanStack Table** | The scrutiny queue and rules browser need sorting/filtering |
| **Icons** | **lucide-react** | Consistent, tree-shakeable |
| **PDF export** | **Server-side (backend renders)** | Do **not** do client-side PDF. `html2canvas` output looks terrible and it will eat two hours. Backend generates it |

> **Honest note:** if your team is stronger in plain React than Next.js, use **Vite + React + React Router** instead. The folder structure below barely changes. Do not learn a framework during the event.

---

# 2. Folder structure

```
anumati-web/
├── app/                                  # Next.js App Router
│   ├── layout.tsx                        # root layout, providers, fonts
│   ├── page.tsx                          # landing → redirects to /roadmap/new
│   ├── globals.css                       # tailwind + CSS variables (tokens)
│   │
│   ├── roadmap/
│   │   ├── new/page.tsx                  # SCREEN 1 — the 4-dropdown input
│   │   └── [roadmapId]/
│   │       ├── page.tsx                  # SCREEN 2 — the roadmap (HERO)
│   │       ├── loading.tsx               # skeleton while graph computes
│   │       └── simulate/page.tsx         # SCREEN 6 — what-if / policy simulator
│   │
│   ├── application/
│   │   └── [applicationId]/page.tsx      # SCREEN 3 — SLA + deemed clock
│   │
│   ├── department/
│   │   ├── page.tsx                      # SCREEN 4 — bottleneck + scrutiny queue
│   │   └── inspections/page.tsx          # SCREEN 5 — inspection planner
│   │
│   ├── rules/
│   │   ├── page.tsx                      # rules browser (provenance + confidence)
│   │   ├── [approvalId]/page.tsx         # single approval, full citation
│   │   └── review/page.tsx               # review queue for flagged rules
│   │
│   ├── standard/page.tsx                 # 🚀 OAGS — the open standard page
│   │
│   └── api/                              # ONLY BFF proxy routes, no business logic
│       └── proxy/[...path]/route.ts      # forwards to FastAPI, attaches auth
│
├── components/
│   ├── ui/                               # dumb primitives — no business logic
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Dialog.tsx
│   │   ├── Select.tsx
│   │   ├── Tabs.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Skeleton.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── graph/                            # THE HERO — put your best work here
│   │   ├── RoadmapGraph.tsx              # React Flow canvas wrapper
│   │   ├── ApprovalNode.tsx              # custom node (name, days, dept, badges)
│   │   ├── DependencyEdge.tsx            # custom edge, styled by TYPE
│   │   ├── BatchLane.tsx                 # the parallel-batch background band
│   │   ├── CriticalPathOverlay.tsx       # 🔴 highlight layer
│   │   ├── GraphLegend.tsx               # edge types + critical path key
│   │   ├── GraphControls.tsx             # zoom, fit, toggle lanes
│   │   └── useGraphLayout.ts             # batch → x/y position calculation
│   │
│   ├── roadmap/
│   │   ├── RoadmapHeader.tsx             # ⭐ the 3 numbers: 22 / 524 / 255
│   │   ├── StatTile.tsx                  # one big number + label
│   │   ├── ApprovalDetailPanel.tsx       # slide-over on node click
│   │   ├── ProvenanceBlock.tsx           # 📄 source + section + effective date
│   │   ├── EdgeTypeBreakdown.tsx         # 🔒28 📄12 ⚙️5 🤝2
│   │   └── ConditionalControls.tsx       # employee slider, height, boiler toggle
│   │
│   ├── sla/
│   │   ├── SlaClock.tsx                  # circular / linear progress
│   │   ├── TimelineTrack.tsx             # filed → query → resume → today
│   │   ├── DeemedBadge.tsx               # ⚠️ threshold crossed / approaching
│   │   └── PauseSegment.tsx              # the paused span visual
│   │
│   ├── simulator/                        # 🚀 THE MOONSHOT
│   │   ├── LeverList.tsx                 # every reform lever
│   │   ├── LeverRow.tsx                  # one lever + days saved bar
│   │   ├── ImpactChart.tsx               # sorted impact bars
│   │   ├── PortfolioMatrix.tsx           # archetypes × levers heatmap
│   │   └── HighestImpactCard.tsx         # the big "single best reform" callout
│   │
│   ├── department/
│   │   ├── BottleneckChart.tsx
│   │   ├── ScrutinyQueue.tsx
│   │   ├── RiskScoreBreakdown.tsx        # explainable — show the weights
│   │   └── InspectionPlanner.tsx         # before/after visit comparison
│   │
│   ├── rules/
│   │   ├── RulesTable.tsx
│   │   ├── ConfidenceBadge.tsx           # 🔒 / 📄 / ⚙️ / 🤝
│   │   ├── CitationLink.tsx
│   │   ├── VersionBanner.tsx             # "Rules v1.3 · 34 approvals · 3 flagged"
│   │   └── ReportRejectionDialog.tsx     # the feedback loop entry point
│   │
│   └── layout/
│       ├── AppShell.tsx
│       ├── TopBar.tsx
│       ├── ViewToggle.tsx                # [Applicant] [Department] — demo critical
│       └── Footer.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                     # fetch wrapper, error normalisation
│   │   ├── roadmap.ts                    # getRoadmap, createRoadmap
│   │   ├── simulate.ts
│   │   ├── applications.ts
│   │   ├── rules.ts
│   │   └── inspections.ts
│   │
│   ├── graph/
│   │   ├── layout.ts                     # batches → coordinates
│   │   ├── criticalPath.ts               # client-side highlight only
│   │   └── edgeStyles.ts                 # type → colour/dash mapping
│   │
│   ├── format/
│   │   ├── days.ts                       # "45 days" / "1 mo 15 d"
│   │   ├── dates.ts                      # IST formatting, dayjs
│   │   └── currency.ts                   # ₹ lakh/crore formatting
│   │
│   ├── constants/
│   │   ├── sectors.ts
│   │   ├── locations.ts
│   │   └── edgeTypes.ts
│   │
│   └── utils.ts                          # cn() classnames helper
│
├── types/
│   ├── approval.ts                       # ⚠️ MIRRORS the backend schema exactly
│   ├── roadmap.ts
│   ├── application.ts
│   ├── simulation.ts
│   └── api.ts                            # request/response envelopes
│
├── store/
│   ├── useRoadmapStore.ts                # selected node, view mode, filters
│   ├── useSimulatorStore.ts              # active levers, baseline
│   └── useUiStore.ts                     # panels, dialogs, toasts
│
├── hooks/
│   ├── useRoadmap.ts                     # TanStack Query wrappers
│   ├── useSimulation.ts
│   ├── useKeyboardShortcuts.ts           # demo: press D for department view
│   └── useMediaQuery.ts
│
├── public/
│   ├── fonts/
│   └── og/                               # social preview images
│
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

# 3. The rules that keep this clean

## 3.1 Component layering — three tiers, never mix

```
components/ui/          →  knows NOTHING about approvals.
                           Button, Card, Badge. Reusable anywhere.

components/<domain>/    →  knows about approvals, but NOT about
                           data fetching. Takes props, renders.

app/**/page.tsx         →  fetches data, composes domain components.
                           This is the ONLY place data fetching happens.
```

**The test:** if `ApprovalNode.tsx` contains a `fetch()` call, it is in the wrong tier. Move the fetch to the page.

## 3.2 Types mirror the backend, one-way

`types/approval.ts` must be a **byte-for-byte reflection of the backend's Pydantic schema.** Do not invent frontend-only shapes.

**Best move:** generate them.
```bash
# backend exposes OpenAPI at /openapi.json
npx openapi-typescript http://localhost:8000/openapi.json -o types/api-generated.ts
```
Then `types/approval.ts` re-exports and narrows from the generated file. **Now the contract cannot drift.**

## 3.3 No business logic in the frontend

Critical path, batch computation, what-if impact — **all backend.** The frontend receives:

```ts
{
  batches: [{ day: 0, approvals: [...] }, ...],
  criticalPath: ["A5", "A8", "A16", "A17"],
  sequentialDays: 524,
  optimisedDays: 255
}
```

**Why this matters:** if you compute the critical path in both places, they will disagree during the demo, and you will not know which one is wrong.

`lib/graph/criticalPath.ts` exists **only** to decide which edges to paint red — never to compute the path.

---

# 4. The hero screen — build this properly

`app/roadmap/[roadmapId]/page.tsx` gets 60% of demo time. Composition:

```tsx
<AppShell>
  <TopBar>
    <ViewToggle />                    {/* [Applicant] [Department] */}
    <VersionBanner />                 {/* Rules v1.3 · 34 approvals · 3 flagged */}
  </TopBar>

  <RoadmapHeader>                     {/* ⭐ THE THREE NUMBERS */}
    <StatTile label="Approvals"  value={32} />
    <StatTile label="Sequential" value="524 days" muted />
    <StatTile label="Optimised"  value="255 days" emphasis />
    <StatTile label="Saved"      value="269 days" accent />
  </RoadmapHeader>

  <ConditionalControls />             {/* sliders — nodes appear/disappear */}

  <RoadmapGraph>                      {/* React Flow */}
    <BatchLane />                     {/* horizontal parallel bands */}
    <ApprovalNode />                  {/* × 32 */}
    <DependencyEdge />                {/* styled by edge type */}
    <CriticalPathOverlay />           {/* 🔴 */}
    <GraphLegend />
  </RoadmapGraph>

  <ApprovalDetailPanel />             {/* slide-over on node click */}
</AppShell>
```

## Layout algorithm — keep it dumb

```ts
// lib/graph/layout.ts
// Do NOT use dagre or elk. You need BATCH lanes, not a generic DAG layout.

const LANE_HEIGHT = 180;
const NODE_WIDTH  = 200;
const NODE_GAP    = 40;

function layoutBatches(batches: Batch[]): Node[] {
  return batches.flatMap((batch, batchIndex) =>
    batch.approvals.map((approval, i) => ({
      id: approval.id,
      position: {
        x: i * (NODE_WIDTH + NODE_GAP),      // across = parallel
        y: batchIndex * LANE_HEIGHT,          // down = sequential
      },
      data: approval,
      type: 'approvalNode',
    }))
  );
}
```

> **Why this beats a generic auto-layout:** the whole visual argument is "these run across, those run down." A dagre layout optimises for edge crossings and destroys that reading. **Horizontal = parallel. Vertical = sequential. Non-negotiable.**

---

# 5. Design tokens

```css
/* app/globals.css */
:root {
  /* surfaces */
  --bg:            #FAFAF9;
  --surface:       #FFFFFF;
  --surface-sunk:  #F4F4F2;
  --border:        #E4E4E2;

  /* text */
  --text:          #1A1A18;
  --text-muted:    #6B6B66;

  /* semantic — approval states */
  --state-pending:   #94A3B8;
  --state-active:    #2563EB;
  --state-done:      #16A34A;
  --state-blocked:   #DC2626;
  --state-deemed:    #D97706;

  /* edge types — MUST be visually distinct */
  --edge-statutory:   #1E293B;   /* solid, thick   🔒 */
  --edge-documentary: #2563EB;   /* solid, medium  📄 */
  --edge-physical:    #7C3AED;   /* solid, medium  ⚙️ */
  --edge-practice:    #94A3B8;   /* DASHED, thin   🤝 */

  /* critical path */
  --critical:      #DC2626;
  --critical-glow: rgba(220, 38, 38, 0.15);
}

:root:not([data-theme="light"]) { /* dark mode overrides */ }
```

> **The `--edge-practice` dashed line is not decoration.** It is the visual expression of "we are not certain about this one." Judges notice honesty rendered in the UI.

---

# 6. Demo-critical frontend details

These are small and they decide how the demo feels.

| Detail | Why |
|---|---|
| **Keyboard shortcut for view toggle** (`D` = department, `A` = applicant) | Switching views mid-sentence, without hunting for a button, looks rehearsed and confident |
| **Skeleton on `loading.tsx`, never a spinner** | A spinner reads as "it's slow." A skeleton reads as "it's loading structure" |
| **Pre-warm the demo roadmap** | Ship a seeded roadmap ID. If the backend hiccups live, `/roadmap/demo-food-pune` still renders |
| **Animate the critical path draw-on** (400ms) | The red path drawing itself is a free "wow" and costs one CSS transition |
| **Node count badge on each batch lane** | "5 in parallel" reads instantly |
| **Every detail panel ends with the 📄 source line** | Your credibility, on every single screen |
| **`ReportRejectionDialog` reachable from every node** | The feedback loop must be visible, not buried in a settings page |

---

# 7. What NOT to build (frontend)

```
❌ Login / signup / auth screens     — demo user is hardcoded, use a role switcher
❌ User profile / settings           — nobody will click it
❌ Onboarding tour / tooltips walkthrough — you are the tour
❌ Mobile-responsive everything      — make the ROADMAP responsive, skip the rest
❌ Dark mode toggle                  — pick one theme, make it good
❌ Client-side PDF generation        — backend does it
❌ Animations beyond the critical path — they eat time and add nothing
❌ i18n framework                    — if you want Marathi, hardcode a second label per approval
```

---

# 8. Build order (frontend)

```
1. types/ generated from backend OpenAPI     ← do this FIRST, before any UI
2. components/ui primitives (2 hrs)
3. app/roadmap/new — the 4 dropdowns (30 min)
4. components/graph/* — the hero (4-5 hrs)   ← spend your best hours here
5. RoadmapHeader + the three numbers (30 min)
6. ApprovalDetailPanel + ProvenanceBlock (1.5 hrs)
7. simulator/* — the moonshot (2 hrs)
8. VersionBanner + ReportRejectionDialog (1 hr)
9. department/* (2 hrs)                      ← cut this first if time runs out
10. Polish, seeded demo data, keyboard shortcuts (1 hr)
```

**If you are behind at hour 24: cut step 9 entirely and put a screenshot on a slide.**

---

## The one frontend rule to remember

> **The graph screen is the product. Everything else is supporting cast.**
> If you have four hours left and a choice between polishing the graph and building another screen — polish the graph.

# ANUMATI (अनुमति)
### Smart Regulatory Clearance & Dynamic Approval Graph Engine
**Smart India Hackathon 2026 · Problem Statement ID: SIH26130 · Category: Software**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/React_Flow-12.3-ff0072?style=flat-square)](https://reactflow.dev/)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-brown?style=flat-square)](https://github.com/pmndrs/zustand)
[![Build Status](https://img.shields.io/badge/Build-Passing-16a34a?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)]()

> **"Transforming sequential, opaque business licensing into deterministic, parallelized dependency roadmaps backed by verified statutory citations."**

---

## Executive Summary

Setting up an industrial enterprise in India typically requires navigating **25 to 35+ clearances across 15+ different central, state, and local departments**. While modern Single Window Systems (like MAITRI or NSWS) provide centralized portals to submit applications, they function primarily as document repositories rather than **intelligent dependency coordinators**.

Entrepreneurs and Single-Window Facilitation Officers face three fundamental roadblocks:
1. **Opaque Dependency Order**: Department websites specify *what* documents they need, but never *when* an applicant can safely apply without waiting on another counter.
2. **False Sequential Delays**: Approvals that could legally be processed concurrently are submitted sequentially, inflating setup timelines from **255 days to 524+ days**.
3. **Redundant Document Submissions**: Applicants are repeatedly forced to physically carry government-issued certificates from one counter to another ("the state asking for its own paper").

**ANUMATI** solves this by modeling industrial clearances as a **directed acyclic graph (DAG)**. It computes the **Critical Path (CPM)**, discovers parallel approval tracks, flags departmental conventions vs statutory mandates, and provides an end-to-end operational roadmap for both **Entrepreneurs** and **Single-Window Facilitation Officers**.

---

## Application Walkthrough & Visual Highlights

### 1. Dynamic 4-Factor Setup Wizard
Customizes the regulatory requirement based on **Sector, Location, Scale, Stage**, and conditional project parameters (e.g. Steam Boilers, Hazardous Materials, Built Height, Export orientation).

![4-Factor Setup Wizard](screenshots/01-setup-wizard.png)

---

### 2. Applicant View: Approval Dependency Graph & Critical Path Spine
An interactive visual canvas mapping all required clearances. 
- **Horizontal Axis = Parallel Lanes**: Approvals that can run at the same time.
- **Vertical Axis = Sequential Milestones**: Time progression from Day 0.
- **Red Critical Path Spine**: The non-negotiable sequence that governs overall project completion.
- **Timeline Collapse**: Visual metric showing **524 sequential days compressed into 255 parallel days (saving 269 days / 51.3%)**.

![Applicant Roadmap Graph](screenshots/02-applicant-roadmap-graph.png)

---

### 3. Department View: Statutory Register & Pre-Establishment / Pre-Operation Checklist
The facilitation officer's working ledger. Organised by standard industrial phases (**Pre-Establishment** and **Pre-Operation**), complete with legal citations, filing windows, statutory SLAs, and RTS deemed approval periods. Features one-click **Printable A4 Audit Sheet** generation for district offices.

![Officer Checklist Register](screenshots/03-officer-checklist-register.png)

---

### 4. What-If Policy Reform Simulator
An evidence-based decision workspace for Industries Department leadership. Policy makers can toggle reform levers (e.g. reducing statutory SLAs, parallelizing screening stages, enforcing deemed approvals under the Right to Public Services Act) and immediately observe the macro impact on project clearance timelines. Includes **strict statutory guardrails** that refuse illegal reforms.

![Policy Reform Simulator](screenshots/04-policy-reform-simulator.png)

---

### 5. Open Approval Graph Standard (OAGS)
A unified, open JSON schema and specification defining regulatory approvals, inter-departmental dependencies, evidence classifications, and confidence scoring. Designed so any state government or municipal authority can publish their regulatory rules in an interoperable format.

![Open Approval Graph Standard](screenshots/05-oags-standard-schema.png)

---

### 6. Document Re-verification Ledger
An automated audit measuring the administrative burden across government counters. Highlights cases where one department demands an official certificate already issued by another department within the same roadmap, enabling targeted DigiLocker / API integrations.

![Document Re-verification Ledger](screenshots/06-document-reuse-ledger.png)

---

### 7. Sign-in: Officer and Applicant are now two separate products
The console is reached through a real sign-in. `OFFICER` / `ADMIN` opens the Matrix 2.0 clearance console; **Continue as an applicant** (or `APPLICANT` / `DEMO`) opens the roadmap. The gate is enforced both ways — an officer who opens the applicant roadmap is redirected to their console, so the approval catalogue, the sequential-vs-parallel arithmetic and the reform simulator never appear on the screen of the person actually processing the file.

![Officer sign-in](screenshots/07-officer-login.png)

---

### 8. Matrix 2.0: Concurrent Dispatch to Every Stakeholder Department
One file is pushed to all stakeholder departments at the same moment rather than passed down a chain. The track fans out from a single dispatch node into one lane per department, each running its own SLA clock from day 0, and re-converges at a phase gate.

![Parallel dispatch](screenshots/08-parallel-dispatch.png)

---

### 9. Conflict Resolution Protocol — when two departments decide the opposite thing
When Finance clicks **Approve** at the same instant IT clicks **Reject**, the pipeline splits visually (green lane / red lane), a high-visibility banner drops across the file naming both departments and the clock second of the clash, the phase bar turns amber, and **Finalise approval** is disabled. The Conflict Resolution screen opens as a side-by-side grid: the exact rejection reason on the left, the row of the **Pre-Defined Decision Matrix** that settles it — with its statutory citation — on the right.

![Conflict resolution screen](screenshots/09-conflict-resolution.png)

Three governance rules ship, and the UI adapts to whichever one the file carries. Every rule declares whether its instrument is **in force** or **drafted for the pilot and not yet notified**, and the screen says which — a drafted clause must never borrow the authority of a real one:

| Rule | Behaviour on a clash | Resolution path |
|---|---|---|
| **Veto / hard block** (`MX-VETO-TECH`) | Stage halts, master action disabled | **Send for revision** — packages the objections *and* the clearances already granted, so nothing already passed is re-filed |
| **Escalation to tie-breaker** (`MX-ESCALATE-EQUAL`) | Equal weight, neither may override | The file routes **itself** — a temporary **Tie-Breaker Panel** node appears on the track and it lands on the steering committee's dashboard |
| **Weighted score** (`MX-WEIGHTED-PROC`) | Departments score rather than vote | Live consolidated score; once every desk has reported below the threshold the phase marks **itself** failed and notifies the project manager |

---

### 10. Tie-Breaker Panel — the senior officer's screen
Both departments' conflicting inputs side by side, with officer, designation, timestamp, weight and veto standing — and exactly two buttons: **Overrule & approve** or **Sustain rejection**. There is no third option on purpose; an escalation that can be left half-decided is how a file spends six months on a desk.

![Tie-breaker panel](screenshots/11-tie-breaker-panel.png)

---

### 11. Weighted Consolidated Score
Finance scores 95, IT scores 40 — the live consolidated dashboard score reads **67.5 / 100** against a passing score of 75, with the threshold marked on the bar and every department's contribution broken out. When the last department reports and the average is still short, the phase marks itself failed and notifies the project manager with nobody pressing anything.

![Weighted consolidated score](screenshots/13-weighted-score.png)

Once the last department reports, the phase settles itself — the file is marked failed and the project manager is notified, with the consolidated arithmetic shown beside the decision.

![Automatic failure and project manager notification](screenshots/15-auto-fail-notified.png)

---

### 12. SLA Auto-Escalation and Deemed Approval
Every lane runs its own statutory window. Two days out, the desk is warned. On breach, a **statutory** clearance is auto-escalated to the tier above (it cannot be deemed), while a **non-critical** clearance that has recorded no reason is marked **DEEMED APPROVED** under the Right to Public Services Act, 2015 — so one silent desk cannot hold an entire project.

![SLA escalation and deemed approval](screenshots/14-sla-escalation-deemed.png)

---

### 13. Shared Data Matrix — the state stops asking for its own paper
Where a department needs a fact another ministry already holds — a land record, a tax standing, an antecedents check — the matrix fetches it instead of asking the applicant to carry a certificate across town. **Background validation runs itself the moment a file is dispatched**, so every record is on screen before an officer asks for it. Each names its source, its endpoint, and what it replaces. One record deliberately returns a **mismatch**, and the conflict screen then quotes it as the evidence behind the technical rejection.

![Shared data matrix](screenshots/10-shared-data-matrix.png)

> **Full explanation of the protocol, the state machine and a four-minute demo script: [`docs/MATRIX_2.0.md`](docs/MATRIX_2.0.md).**

---

## Key Innovations & Core Architecture

### 1. Four-Tier Typed Dependency Evidence Matrix
Rather than treating all dependencies equally, ANUMATI classifies every edge connecting two approvals into four distinct categories with explicit confidence scores:

| Icon | Edge Type | Statutory Source | Confidence | Description |
|:---:|:---|:---|:---:|:---|
| 🔒 | **Statutory** | Written in Act / Rules | **1.00** | Legally binding prerequisite (e.g., Building Plan Approval requires NA Order under MLRC 1966 s. 44). |
| 📄 | **Documentary** | Departmental Form Requirement | **0.90** | Department B requires the certificate of Department A as an application attachment. |
| ⚙️ | **Physical** | Physical Reality | **1.00** | Physically impossible in reverse order (e.g., Factory inspection requires completed building structure). |
| 🤝 | **Practice** | Departmental Convention | **0.50** | Unwritten convention or bureaucratic custom. Flagged to the applicant and reformable by policy makers. |

### 2. Dual-Persona Architecture — two products behind one sign-in
- **Applicant Persona (Beneficiary)**: The execution roadmap — the dependency graph, the critical path, the document ledger, upcoming requirements and immediate next steps.
- **Officer Persona (DIC / MAITRI Facilitation Officer)**: The Matrix 2.0 clearance console — a queue of live files, concurrent departmental dispatch, SLA clocks with auto-escalation and deemed approval, the conflict resolution protocol, the shared data matrix, and a cited audit trail.

The two are gated by role in both directions, so the officer's screen carries no applicant-side material at all. See [`docs/MATRIX_2.0.md`](docs/MATRIX_2.0.md).

### 3. Pre-Defined Decision Matrix (Governance as Data)
Parallel dispatch removes the one useful property of sequential filing: that a file is only ever on one desk, and so can never be approved and rejected at once. The tie-break that replaces it is stored as **cited data rows**, not as branches in the console — `veto`, `escalation` and `weighted`, each carrying the Rule, GR or Policy clause it is drawn from. A state that tie-breaks differently edits a row; it does not edit the product.

### 4. Mathematical Optimization (CPM)
- Implements standard **Critical Path Method (CPM)** algorithms to compute earliest start, earliest finish, slack/float times, and the critical spine.
- Real-time reactivity: Adjusting employee headcount, building height, or operational conditions dynamically recalculates the graph in milliseconds.

---

## Strategic Implementation Plan

Our vision is to transform ANUMATI from an award-winning prototype into an institutional public digital infrastructure powering single-window facilitation nationwide.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ANUMATI STRATEGIC ROADMAP                             │
├─────────────────┬──────────────────┬──────────────────┬─────────────────────┤
│    PHASE 1      │     PHASE 2      │     PHASE 3      │      PHASE 4        │
│ Standalone MVP  │ Backend Engine   │ Ingestion &      │ State Integration   │
│ & Seeded Rules  │ & Versioning DB  │ Review Pipeline  │ & National Rollout  │
│   (COMPLETED)   │   (Month 1-2)    │   (Month 3-5)    │    (Month 6-12)     │
└─────────────────┴──────────────────┴──────────────────┴─────────────────────┘
```

### Phase 1: Standalone MVP & Seeded Regulatory Rules (Completed)
- Full Next.js 14 frontend with client-side reactive graph engine.
- Verified seed rule base for Maharashtra industrial manufacturing & food processing (34 approvals, 27 cited Acts & Government Resolutions).
- Interactive DAG visualization with custom React Flow nodes and typed edges.
- Policy Reform Simulator with statutory guardrails.
- Document Re-verification audit ledger.
- OAGS (Open Approval Graph Standard) specification v0.1.
- **Matrix 2.0 officer console**: role sign-in, concurrent departmental dispatch, the conflict resolution protocol across all three governance rules, SLA auto-escalation and deemed approval, the shared data matrix, cross-departmental clarification threads, and a cited audit trail.

### Phase 2: Production Backend & Bitemporal Database (Month 1 - 2)
- **FastAPI Microservice**: High-throughput REST API serving roadmap generation requests via NetworkX graph compute.
- **PostgreSQL 16 Relational Engine**: Normalized schema for approvals, rules, citations, and applications.
- **Bitemporal Rule Versioning**: Every regulatory change is recorded with valid-time and system-time (`effective_from`, `effective_to`). A roadmap generated today remains reproducible even if laws change years later.
- **Automated Type Generation**: OpenAPI contract synchronizing Pydantic models directly to TypeScript interfaces.

### Phase 3: Automated Ingestion & Human-in-the-Loop Review (Month 3 - 5)
- **Gazette & Form Extraction Pipeline**: Automated crawler monitoring government gazette notifications and single-window departmental forms.
- **Structured Knowledge Extraction**: High-precision parser extracting statutory SLAs, deemed approval clauses, and required attachments into standardized approval drafts.
- **Department Review Queue**: Strict human verification interface. **No rule or dependency edge is auto-published without an officer's sign-off and explicit statutory section citation.**

### Phase 4: Pilot Deployment & Single-Window Integration (Month 6 - 8)
- **District Pilot**: Field testing with the District Industries Centre (DIC) Pune and Maharashtra Industrial Development Corporation (MIDC) Chakan facilitation cell.
- **MAITRI / NSWS Connector**: API integration enabling applicants to jump directly from their ANUMATI roadmap into the corresponding form on the state or national single-window portal.
- **DigiLocker Integration**: Verification of pre-existing documents directly from DigiLocker, eliminating redundant uploads for 15+ recurring documents.

### Phase 5: Multi-State Expansion & Empirical Feedback Moat (Month 9 - 12+)
- **Multi-State Scaling**: Expanding rule sets to high-growth industrial states (Tamil Nadu, Gujarat, Karnataka, Uttar Pradesh, Telangana).
- **Closed-Loop Delay Reporting**: When an applicant experiences an objection or rejection at a counter, they can log it with one click. This feeds empirical rejection frequency data back into the engine, creating a defensible data moat for ease-of-doing-business governance.

---

## Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router, React 18, Server & Client Components) |
| **Language & Typing** | TypeScript 5.7 (Strict type-checking) |
| **Styling & Design** | Tailwind CSS 3.4, Custom Design Tokens, CSS Variables |
| **Graph Visualization** | @xyflow/react (React Flow v12) |
| **State Management** | Zustand v5 (Reactive client store) |
| **Analytics & Charts** | Recharts, Tabular Metrics |
| **Icons & UI Primitives** | Lucide React |
| **Backend (Target Architecture)** | FastAPI (Python 3.11), Pydantic v2, NetworkX |
| **Database & Versioning** | PostgreSQL 16, SQLAlchemy 2.0, Alembic |
| **Schema Standard** | OAGS (Open Approval Graph Schema v0.1) |

---

## Quickstart & Local Setup

The repository is configured to run out-of-the-box using the embedded regulatory rule base in `lib/data/`. No external database or Python server is required for frontend evaluation.

### Prerequisites
- **Node.js**: v18.17.0 or higher (Tested on Node v24.16.0)
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shubham54191/ANUMATI.git
   cd ANUMATI/anumati-web
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```

4. **Access the Application:**
   Open your browser and navigate to:
   - **Local URL**: [http://localhost:3000](http://localhost:3000)
   - The application starts on port **3000** (or port **3001** if port 3000 is occupied).

5. **Sign in.** The application opens on the sign-in screen. Two demonstration accounts are seeded:

   | User id | Password | Opens |
   |---|---|---|
   | `OFFICER` | `ADMIN` | Matrix 2.0 clearance console — parallel dispatch, conflict resolution, SLA escalation, shared data matrix |
   | `APPLICANT` | `DEMO` | Applicant roadmap — dependency graph, critical path, document ledger |

   **Continue as an applicant** on the sign-in screen skips the credentials for the applicant side. Credentials are case-insensitive and trimmed.

### Running on a Specific Port
To run explicitly on Port 3001 or any alternate port:
```bash
npm run dev -- -p 3001
```

### Production Build & Verification
To verify type safety and produce an optimized production bundle:
```bash
npm run typecheck    # Runs TypeScript compiler check (0 errors)
npm run build        # Generates production bundle
npm run start        # Starts production server on http://localhost:3000
```

---

## Project Structure

```
ANUMATI/
├── README.md                      # Primary project documentation & architecture guide
├── screenshots/                   # High-resolution screenshots of key user interfaces
│   ├── 01-setup-wizard.png
│   ├── 02-applicant-roadmap-graph.png
│   ├── 03-officer-checklist-register.png
│   ├── 04-policy-reform-simulator.png
│   ├── 05-oags-standard-schema.png
│   ├── 06-document-reuse-ledger.png
│   └── 07-15 …                    # Matrix 2.0 console, conflict protocol, SLA, data matrix
├── docs/                          # Comprehensive technical architecture & presentation plans
│   ├── BACKEND_ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   ├── MATRIX_2.0.md              # Conflict resolution protocol, demo script & internals
│   └── SIH_PRESENTATION_PLAN.md
└── anumati-web/                   # Next.js 14 web application
    ├── app/                       # App router pages & layouts
    │   ├── login/                 # Role sign-in (officer / applicant)
    │   ├── matrix/                # Matrix 2.0 officer clearance console
    │   ├── roadmap/new/           # 4-question setup wizard
    │   ├── roadmap/[roadmapId]/   # Graph view & Officer register
    │   ├── roadmap/[roadmapId]/simulate/ # Policy reform simulator
    │   └── standard/              # OAGS specification & schema viewer
    ├── components/                # Modular UI & graph components
    │   ├── auth/                  # Role gate — keeps each persona in its own product
    │   ├── graph/                 # React Flow custom nodes, batch lanes, edge renderers
    │   ├── matrix/                # Parallel track, conflict screen, tie-breaker, SLA board,
    │   │                          #   data matrix, clarification thread, audit trail
    │   ├── register/              # Officer checklist & statutory table
    │   ├── documents/             # Re-verification audit ledger
    │   ├── simulator/             # Reform levers, impact cards & guardrails
    │   └── ui/                    # Reusable design tokens, buttons, dialogs
    ├── lib/
    │   ├── data/                  # Seeded rule base (Maharashtra industrial regulations)
    │   ├── graph/                 # CPM critical path algorithms, layout calculations
    │   ├── matrix/                # Decision matrix rows, seeded files, conflict state machine
    │   └── constants/             # Sector definitions, locations, edge classifications
    ├── store/                     # Zustand stores — roadmap, matrix console, session
    └── types/                     # Clean TypeScript domain models & schemas
```

---

## Statutory Rules & Legal References Cited

All regulatory data in the seed is grounded in published Acts, Rules, and Notifications, including:
- **Maharashtra Land Revenue Code (MLRC) 1966**, Section 44 (Non-Agricultural Land-use Permission)
- **Companies Act 2013**, Section 7 (SPICe+ Incorporation)
- **Electricity Act 2003**, Section 43 (High Tension Power Sanction)
- **Maharashtra Fire Prevention & Life Safety Measures Act 2006**, Section 3 (Provisional Fire NOC)
- **Water (Prevention & Control of Pollution) Act 1974** & **Air Act 1981** (MPCB Consent to Establish)
- **Factories Act 1948**, Section 6 & **Maharashtra Factory Rules 1963** (Factory Plan Approval)
- **Food Safety and Standards Act 2006**, Section 31 (FSSAI Manufacturing Licence)
- **Maharashtra Right to Public Services Act 2015** (Deemed approval timeline provisions)

---

## Smart India Hackathon 2026 Team

- **Problem Statement**: SIH26130 · Inter-departmental Regulatory Approvals & Workflow Coordination
- **Solution Name**: ANUMATI (अनुमति)
- **GitHub Repository**: [https://github.com/shubham54191/ANUMATI](https://github.com/shubham54191/ANUMATI)

---
*Built with precision for Smart India Hackathon 2026.*

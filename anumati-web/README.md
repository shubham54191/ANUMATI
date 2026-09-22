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

Setting up an industrial enterprise in Maharashtra typically requires navigating **25 to 35+ clearances across 15+ central, state and local departments**. The state already has a serious single window: **MAITRI 2.0**, launched in February 2025 under the **Maharashtra Industry, Trade and Investment Facilitation Act, 2023**, carries 119 services across 15–16 departments with an application wizard, desk-level tracking, an incentive calculator, a document repository, a grievance system and NSWS synchronisation.

What no portal yet does — MAITRI included — is tell an applicant **when** each clearance may be filed, **check a file before it is filed**, **coordinate the departments that must decide together**, and **settle it when two of them decide the opposite thing**. That is the gap ANUMATI fills.

**One line:** MAITRI 2.0 tells you *what* to file. ANUMATI tells you *when*, checks it *before* you file, groups the inspections it will attract, and shows the Empowered Committee *where* files get stuck.

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

### 7. Matrix 2.0: Officer Clearance Console (sign in as `OFFICER` / `ADMIN`)

The officer half of the product, behind a role sign-in and deliberately free of applicant-side material — no approval catalogue, no sequential-vs-parallel arithmetic, no reform simulator on the screen of the person actually processing the file.

- **Concurrent dispatch** — one file pushed to every stakeholder department at the same moment, each lane running its own SLA clock from day 0.
- **Conflict Resolution Protocol** — when Finance approves at the same instant IT rejects, the track splits green/red, a banner drops across the file, the phase bar turns amber and *Finalise approval* is disabled. A side-by-side screen shows the rejection reason against the row of the **Pre-Defined Decision Matrix** that settles it, with its statutory citation. Three rules ship: **veto / hard block**, **escalation to a tie-breaker panel**, and **weighted consolidated score**.
- **SLA auto-escalation and deemed approval** — a statutory desk that breaches its window is lifted a tier; a non-critical one is deemed approved under the Right to Public Services Act, 2015.
- **Shared data matrix** — records fetched from the ministry of record instead of asked for as certificates, each naming what it replaces.
- **Cross-departmental clarification thread** — with *Resolve & re-evaluate*, letting the objecting department withdraw its own rejection.

Full protocol, demo script and internals: [`../docs/MATRIX_2.0.md`](../docs/MATRIX_2.0.md).

| User id | Password | Opens |
|---|---|---|
| `OFFICER` | `ADMIN` | Matrix 2.0 clearance console — parallel dispatch, conflict protocol, joint inspections, grievance queue |
| `APPLICANT` | `DEMO` | Applicant roadmap — graph, checklist, documents, workflow, pre-check (or **Continue as an applicant**) |

Run `npm test` for the 67-test suite over the rule base, the matrix state machine and
the compliance modules.

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

### 2. Dual-Persona Architecture
- **Applicant Persona (Beneficiary)**: Focuses on the actionable execution roadmap, upcoming document requirements, and immediate next steps.
- **Department Persona (DIC / MAITRI Officer)**: Focuses on regulatory compliance, statutory timelines under the Right to Services (RTS) Act, deemed approval tracking, and macro bottleneck analysis.

### 3. Mathematical Optimization (CPM)
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
│   └── 06-document-reuse-ledger.png
├── docs/                          # Comprehensive technical architecture & presentation plans
│   ├── BACKEND_ARCHITECTURE.md
│   ├── FRONTEND_ARCHITECTURE.md
│   └── SIH_PRESENTATION_PLAN.md
└── anumati-web/                   # Next.js 14 web application
    ├── app/                       # App router pages & layouts
    │   ├── roadmap/new/           # 4-question setup wizard
    │   ├── roadmap/[roadmapId]/   # Graph view & Officer register
    │   ├── roadmap/[roadmapId]/simulate/ # Policy reform simulator
    │   └── standard/              # OAGS specification & schema viewer
    ├── components/                # Modular UI & graph components
    │   ├── graph/                 # React Flow custom nodes, batch lanes, edge renderers
    │   ├── register/              # Officer checklist & statutory table
    │   ├── documents/             # Re-verification audit ledger
    │   ├── simulator/             # Reform levers, impact cards & guardrails
    │   └── ui/                    # Reusable design tokens, buttons, dialogs
    ├── lib/
    │   ├── data/                  # Seeded rule base (Maharashtra industrial regulations)
    │   ├── graph/                 # CPM critical path algorithms, layout calculations
    │   └── constants/             # Sector definitions, locations, edge classifications
    ├── store/                     # Zustand store for reactive state & persona switching
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

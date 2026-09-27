# ANUMATI (SIH26130) — Tech Stack, reviewed and corrected

| | |
|---|---|
| Reviewed | The 7-layer stack you proposed, against the code in `anumati-web`, your own `BACKEND_ARCHITECTURE.md`, and current vendor status |
| Rule used | No new licence · no per-call fee · no new vendor · runs on infrastructure the state already operates · reuses what MAITRI 2.0 already does |
| Written | 26 Sep 2026 |
| Companion files | `ANUMATI_SYSTEM_ARCHITECTURE.md` · `ANUMATI_PROCESS_FLOW.md` · `anumati-architecture.png` · `anumati-architecture-slide.png` · `anumati-process-flow.png` |

---

## 0. Verdict first

Your list is the right *shape* and the wrong *weight*. It reads like a stack for
a national platform with a funded ops team. SIH judges from the Maharashtra
State Innovation Society will ask two things about it — "who runs this?" and
"who pays for it?" — and five items in it fail one of those questions.

| # | What is wrong | Why it matters in the room |
|---|---|---|
| 1 | **Gemini 1.5 Pro** | Google shut the 1.5 models down in 2025; they no longer appear anywhere on Google's current model list. It is also billed per token, and it would send applicants' land records and plans to a foreign cloud. Three separate problems in one line |
| 2 | **Amazon QLDB** | AWS ended QLDB on **31 July 2025**. Naming it tells a technical judge the stack was not checked |
| 3 | **Hyperledger Fabric** | A blockchain run by one state government has the same trust root as a database run by that government. It adds a platform to operate and adds nothing to the audit guarantee that a hash-chained table does not already give |
| 4 | **Server-side RSA/ECDSA signing** | Whoever holds that key on the server can forge every department's approval. The signature has to be the officer's act, from the officer's own DSC |
| 5 | **Kubernetes / EKS, Temporal, ELK, SonarQube, Redis, MinIO** | Six more services to run, patch and explain. Even tens of thousands of applications a year is well under one request per second. MinIO's community edition is additionally in maintenance mode with its Docker images withdrawn |

And one conflict you have to settle before anything else:

> **Your own `BACKEND_ARCHITECTURE.md` and slide plan say FastAPI + Python.
> This list says Fastify + Node.** A judge who reads both will ask which one is
> real. Pick one. Section 2 says which, and why.

What is right and stays: Next.js, TypeScript, Tailwind, Zustand, React Hook
Form + Zod, PostgreSQL, SHA-256 on ingest, DigiLocker, Docker, GitHub Actions,
Prometheus + Grafana. Most of these are already in `package.json`.

---

## 1. The cost rule, stated so you can defend it

**The claim you can make:** *no new licence, no per-transaction fee, no new
vendor, no new cloud account.* Every component below is open source, and every
**runtime** call the system makes goes to a Government of India or Government
of Maharashtra system. (Build tooling is separate: GitHub Actions and CodeQL
are free for the public SIH repository; in production the state mirrors the
code to its own Git and runs the same checks there.)

**The claim you must not make:** *"zero cost."* Four things still cost
something, and a judge who has run a state IT project knows it:

| Residual cost | Who bears it | How to keep it at zero or near it |
|---|---|---|
| VM capacity on the State Data Centre | Host department | The MH-SDC service document (2023) offers cloud VMs and PostgreSQL to departments; a **chargeback applies to corporations and boards**. So ANUMATI is hosted under the **Industries Department / Directorate of Industries** (a department — the side that runs MAITRI), not under MIDC (a corporation) |
| DSC tokens for officers who do not already have one | Department | Use the Class 3 DSC officers already use for e-tendering and e-Office. Where an officer has none, that token is the only new hardware line. Do **not** use Aadhaar eSign: it is priced per signature by commercial eSign Service Providers |
| Rule review labour | Industries Department legal cell | This is the real recurring cost. Every extracted rule is a draft until a person publishes it. Budget it honestly: one reviewer, part-time |
| MAITRI 2.0 integration effort | MahaIT / MAITRI vendor | ANUMATI runs standalone on its own export first; the connector comes later. That ordering is also your feasibility answer |

Say the first sentence on the slide. Say the table in Q&A if asked.

---

## 2. The one decision to make first: which language runs the backend

| | TypeScript end to end (recommended) | FastAPI + Python (your earlier plan) |
|---|---|---|
| The engine | **Already exists and runs**: `lib/data/engine.ts`, `lib/graph/criticalPath.ts`, `lib/matrix/engine.ts`, `lib/compliance/{prevalidate,risk,inspections,renewals}.ts`, `lib/oags/validate.ts` | Must be rewritten in Python (NetworkX) |
| Applicant preview vs server verdict | **Same code in both places** — for the same rules and engine version, the number on the applicant's screen is the number the server records | Two engines. The day they disagree, the 223 on the slide and the 223 from the API are different numbers |
| Types | Zod schemas → TypeScript types → OpenAPI, one source | Pydantic → OpenAPI → generated TS types; works, one more step |
| Team fit | Frontend team already writes this code | Plays to a Python-strong backend developer |
| Where Python still belongs | **The offline rule-extraction pipeline** (PDF parsing, OCR, local LLM). It never runs in a request, it writes drafts into Postgres, and the language boundary is the database. That is also where a data engineer's strength actually lies | — |

**Recommendation:** TypeScript for everything online (Next.js + Fastify +
shared engine package), Python for the offline extraction pipeline only.

If your backend developer only writes Python, FastAPI is a legitimate choice —
but then the browser must *call* the API for every number and stop computing
locally. Never run two engines.

**Why Fastify and not "just Next.js route handlers"?** Not throughput — even tens of
thousands of applications a year is well under one request per second, so do
not claim throughput on a slide. The real reasons: the SLA Sentinel and the
dispatch workers are long-running processes that do not belong inside a web
request, Fastify is schema-first (Zod in, OpenAPI out), and a separate API is
what MAITRI 2.0 would integrate against.

---

## 3. Line-by-line review

`✓` keep · `~` keep with a change · `✗` replace

### 3.1 Frontend

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| Next.js 15 + React 19 | ~ | **Next.js 14.2, latest patch** · React 18 | The app is built and tested on 14.2.20. A major-version upgrade before a demo is risk with no visible feature. **But bump the patch now**: 14.2.25 fixed CVE-2025-29927 (middleware auth bypass). ANUMATI does not use middleware for auth, so it is not exploitable today — but `npm audit` will flag it, and a judge may run it | ₹0 |
| "SSR to load dashboards instantly" | ✗ as a reason | — | The graph (React Flow) and both dashboards render client-side. Do not claim SSR as the reason. The real reason: one deployable with typed route handlers, already built | — |
| Tailwind + shadcn/ui | ~ | **Tailwind 3 + the project's own component set** | shadcn is not in the codebase. Do not list what you do not use | ₹0 |
| Zustand | ✓ | Zustand 5 | Already used for roadmap, matrix and auth stores | ₹0 |
| React Hook Form + Zod | ✓ | RHF 7 + Zod 3 | Already dependencies. Zod schemas are shared with the API, so PAN/GSTIN/CIN formats are validated identically on both sides | ₹0 |
| — (missing) | + | **React Flow** (`@xyflow/react`) | The dependency graph | ₹0 |
| — (missing) | + | **TanStack Query + Table**, **Recharts** | Already dependencies: data fetching, the register, charts | ₹0 |
| — (missing) | + | **Marathi strings** as a JSON dictionary | Applicant-facing in Maharashtra. Static UI text is hand-translated once; no translation API needed. Bhashini (MeitY) is the option for free-text later — confirm its terms before claiming it | ₹0 |

### 3.2 Backend and orchestration

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| Node 22 + Fastify | ✓ | **Node 22 LTS + Fastify 5** | See §2 for the honest reason | ₹0 |
| Temporal.io | ✗ | **pg-boss** (job queue inside PostgreSQL) | Temporal needs its own server cluster and persistence — a second platform to operate. pg-boss uses `SKIP LOCKED` rows in the database you already run, with retries, backoff, cron schedules and dead-letter handling | ₹0 |
| BullMQ | ✗ | (same) | Needs Redis. pg-boss gives the same guarantees without a second datastore | ₹0 |
| "DAG orchestration across 15+ departments" | ~ | **A small function on top of the engine** | When an approval is issued: ask the graph which approvals just became unlocked, enqueue one job per department in the same transaction. Durable because the jobs are rows in Postgres, committed with the state change | ₹0 |
| JSON-Rules-Engine / Drools | ✗ | **The existing ANUMATI engine** | Rules are *data* (versioned, cited rows); the engine is pure functions over them. Drools adds a JVM and a rule language nobody on the team writes | ₹0 |

### 3.3 AI and automation

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| Gemini 1.5 Pro | ✗✗ | **Local open-weight model: IBM Granite 4.1 (Apache 2.0) via Ollama**, JSON output mode | 1.5 is shut down; per-token billing is a recurring cost; applicant documents would leave state infrastructure. Granite 4.1 is Apache-2.0 licensed, ships 3B and 8B sizes (the 8B quantised build is ~5 GB), supports structured JSON output, and runs on a CPU VM for an offline batch job | ₹0 |
| "Parse land documents, EIA reports, blueprints" | ~ | **pdfplumber + Tesseract (English + Marathi packs)** → local LLM → **human confirms** | Extraction feeds two things: (1) *rule* extraction from gazettes and department forms, (2) *field* extraction for the cross-form check. Every output is a draft. Nothing extracted by a model decides a clearance | ₹0 |
| "AI cross-references application text with compliance criteria" | ✗ | **Deterministic pre-validation** (already built: `lib/compliance/prevalidate.ts`) | Checking that 1250 kVA on one form matches 1600 kVA on another is arithmetic, not AI. A model that "flags errors" cannot be audited; a rule that compares two numbers can | ₹0 |
| pgvector RAG over GRs | ~ | **Postgres full-text search, cited results only**; pgvector optional in the same database | A generative legal assistant for applicants is the fastest way to lose the "every number cites a section" argument. Retrieve the provision, show its section, never generate the answer | ₹0 |
| — | ✗ | **No chatbot** | MAITRI 2.0 already has an AI chatbot. Building a second one duplicates the jury's own product | — |

### 3.4 Integrity and anti-fraud (CTVE)

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| SHA-256 via Node crypto | ✓ | `node:crypto`, on ingest, before anything reads the file | Content-addresses the document store and anchors every later signature | ₹0 |
| RSA-4096 / ECDSA via OpenSSL on the server | ✗ | **DSC Signing Bridge** — the officer's own Class 3 DSC signs; the server only verifies | A server key means one breach forges every department's seal. Legal basis: IT Act 2000, s. 3 (authentication by digital signature) and s. 5 (legal recognition). For SIH: mocked and labelled "this build holds no keys and signs nothing" | ₹0 where DSCs exist |
| Hyperledger Fabric | ✗ | **Hash-chained, append-only `decision_ledger` table in PostgreSQL** | Each row stores `prev_hash` and `row_hash = SHA-256(prev_hash ‖ canonical_json(row without row_hash))`. Triggers reject UPDATE, DELETE and TRUNCATE; appends take an advisory lock so two writers never share a `prev_hash`. Any edit to history breaks the chain from that row forward, and a verifier finds it | ₹0 |
| Amazon QLDB | ✗✗ | (same) | Retired 31 Jul 2025. AWS itself pointed QLDB users to PostgreSQL | — |
| "No admin can alter a timestamp" | ~ | **"Tamper-evident", not "tamper-proof"** | A DB superuser *can* rewrite the whole chain. Close that by publishing each day's head hash somewhere the DB admin does not control — for example a signed daily email to the Supervisory Committee's secretariat (a proposed practice). Then say "tamper-evident" and mean it | ₹0 |

### 3.5 Data and storage

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| PostgreSQL 16 | ✓ | **PostgreSQL 16** — the single source of truth | MH-SDC's service catalogue lists PostgreSQL. Holds rules, applications, SLA events, the ledger, the job queue and full-text search. Row-level security separates departments | ₹0 |
| Redis for "live SLA countdown" | ✗ | **Nothing** | An SLA is a `due_at` timestamp plus an event log (filed, query raised, query answered, decided). The countdown is `due_at − now`, computed in the browser. Nobody should be decrementing counters in Redis. Live updates: Postgres `LISTEN/NOTIFY` → Server-Sent Events | ₹0 |
| MinIO / AWS S3 | ✗ | **Demo:** a filesystem volume, files named by their SHA-256. **Production:** MAITRI 2.0's Central Document Repository — reference by id + hash, never copy | MinIO community edition is in maintenance mode, its Docker images were withdrawn, and it is AGPLv3. S3 is a new vendor bill and puts documents outside the state. If an S3 API is ever needed: Garage or SeaweedFS | ₹0 |

### 3.6 Government integration

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| DigiLocker API | ✓ | **DigiLocker via API Setu** | Issued documents pulled with the applicant's consent. A prior approval pulled from its issuer is trusted; the same approval uploaded as a PDF is only a document | ₹0 (confirm at onboarding) |
| MahaOnline SSO | ✗ | **Reuse MAITRI 2.0's existing login** | Investors already hold MAITRI accounts. A second identity system is a second password and a second vendor | ₹0 |
| MCA21 API, GSTN API | ~ | **Through API Setu** (MeitY's open API platform: PAN, CIN, GSTIN, Udyam where published) | Direct GST API access runs through commercial GST Suvidha Providers — a vendor bill. The Government of India's open API policy asks publishers to offer APIs free to other government organisations *where possible*; API Setu is the channel. Confirm each API's terms at onboarding | ₹0 (confirm) |
| GRAS payment integration | ✗ | **None in ANUMATI** | Fees are already paid on MAITRI 2.0 through GRAS. ANUMATI never touches money | — |
| REST + mTLS to department systems | ~ | **Adapter per department: REST with mTLS where an API exists; status file-drop or officer-entered status where it does not** | Most department back-offices will not expose an API on day one. Design for the manual fallback and nobody is blocked | ₹0 |
| — (missing) | + | **Notifications through MAITRI 2.0's existing channel** + in-app | Renewal and SLA alerts are implied by your own features. An SMS gateway bills per message — reuse the channel MAITRI already pays for | ₹0 |

### 3.7 DevOps and infrastructure

| You proposed | Verdict | Final | Why | Cost |
|---|---|---|---|---|
| Docker | ✓ | Docker images, one per service | | ₹0 |
| Kubernetes / AWS EKS | ✗ | **Docker Compose on two MH-SDC VMs** (app VM + database VM) | MH-SDC provides VMware / Hyper-V VMs, not a managed Kubernetes service. Kubernetes is a platform team you do not have, for a load that fits on one VM | ₹0 (department hosting) |
| GitHub Actions | ✓ | lint → `tsc --noEmit` → unit tests → build → image | Free for public repositories. In production the state would mirror to its own Git | ₹0 |
| SonarQube | ✗ | **ESLint + `npm audit` + GitHub CodeQL** | SonarQube is another server. CodeQL runs inside Actions | ₹0 |
| Prometheus + Grafana | ✓ optional | **Ops metrics only** — API latency, job queue depth, adapter error rate | Keep it; label it optional | ₹0 |
| "Command Center tracking department delays" | ~ | **A product screen, not Grafana** | Department delay is business data. It belongs on the Committee Desk, computed from `sla_event`, with the same citations as everything else | ₹0 |
| ELK stack | ✗ | **Structured JSON logs (pino) to stdout**; Grafana Loki if search is needed | Elasticsearch alone wants more memory than the whole application | ₹0 |

---

## 4. The final stack — paste this on slide 3

```
Frontend     Next.js 14 · TypeScript · React Flow · Tailwind · Zustand · React Hook Form + Zod
API          Node 22 · Fastify · Zod → OpenAPI · shared ANUMATI engine (same code as the browser)
Workflow     pg-boss inside PostgreSQL — parallel dispatch, SLA sentinel, retries
Data         PostgreSQL 16 — rules, applications, SLA events, hash-chained ledger, full-text search
Integrity    SHA-256 on ingest · officer's own DSC (server holds no key) · append-only hash chain
AI (offline) pdfplumber + Tesseract (mar+eng) → IBM Granite 4.1, local via Ollama → human review
Integrate    MAITRI 2.0 login + document repository + notifications · API Setu · DigiLocker
Run          Docker Compose on 2 MH-SDC VMs · GitHub Actions · Prometheus + Grafana
```

Under it, one line:

> **Every component is open source. Every runtime call goes to a government
> system. No new licence, no per-call fee, no new vendor.**

---

## 5. Does it cover every idea? — the coverage matrix

Status as of 27 Sep 2026: **Built** means it runs today in the
frontend and the `anumati-server` API/worker, covered by tests; **recorded** means it
works end to end against recorded government answers or a labelled demo signer;
**To build** means it exists only in this document.

| # | Idea | Where it lives | Stack pieces | Status |
|---|---|---|---|---|
| 1 | Customised approval list from 6 answers | Engine · Roadmap Service | TS engine, versioned rules in Postgres | Built (client) |
| 2 | Typed, confidence-scored dependency graph + critical path | Engine | `criticalPath.ts`, React Flow | Built (client) |
| 3 | Timeline with SLA windows | Applicant board | `trackState.ts`, `WorkflowTrack.tsx` | Built (client) |
| 4 | Pre-validation before filing (docs, prerequisites, cross-form figures) | Engine | `prevalidate.ts` | Built (client) |
| 5 | Fill once, reuse everywhere (document ledger) | Engine · MAITRI repository | `documentReuse.ts` | Built (client); MAITRI repository link To build |
| 6 | SHA-256 on every file | Integrity | `node:crypto` | Built (server) |
| 7 | Registry verification (PAN, CIN, GSTIN, Udyam) | Integration Gateway | API Setu adapter | Built with recorded answers (fixture adapter); live API Setu needs credentials |
| 8 | Risk-based scrutiny | Engine | `risk.ts` | Built (client) |
| 9 | Parallel dispatch + DAG release (SWPE) | Dispatch Orchestrator | pg-boss + engine | Built (server + console) |
| 10 | Field-level scope — verify only your own parameters | Integrity · API Gateway | RBAC + server-side ownership check | Built (UI + server check) |
| 11 | Joint inspection planner (s. 16) | Engine | `inspections.ts` | Built (client) |
| 12 | SLA Sentinel — transfer (s. 5), deemed only where the parent Act says | SLA Sentinel | pg-boss cron + `sla_event` | Built (worker cron) |
| 13 | Conflict rules — technical veto, Empowered Committee route | Conflict & Committee Router | `lib/matrix/rules.ts` | Built (client) |
| 14 | Officer signs with own DSC | DSC Signing Bridge | officer token, server verifies | Demo signer, labelled · external DSC verify built |
| 15 | Hash-chained, append-only audit trail | Integrity · Postgres | trigger + hash chain | Built (server) |
| 16 | Grievance on a stuck approval (s. 8(1)(g)) | Applicant board → Committee queue | MAITRI grievance channel | Built (applicant → Committee queue) |
| 17 | Renewal calendar, 60/30/7-day alerts | Engine · notifications | `renewals.ts` + MAITRI notify | Board built; alert job built (recorded MAITRI adapter) |
| 18 | Rule extraction from gazettes and forms → review queue | Offline pipeline | pdfplumber, Tesseract, Granite, edge inferencer | Built (`anumati-extraction`, tests with a stubbed model); not yet run on real gazettes |
| 19 | Delay analytics + reform simulator | Committee Desk | `simulate.ts`, SLA events | Simulator built; analytics To build |
| 20 | Open approval-graph standard (OAGS) export and validation | API | `/api/v1/standard/*` | Built |
| 21 | Two accounts, hard role separation | Presentation · Gateway | `AuthGate` + server RBAC | Built (server RBAC) |
| 22 | Incentives | — | Link out to MAITRI 2.0's calculator | Link only — do not rebuild |

Rows 9, 10, 12, 15 and 18 are where the SIH finale build should go. They turn
the strongest parts of the demo from *simulated* into *recorded*.

---

## 6. What the SIH demo actually runs on

A finale demo fails on hotel Wi-Fi. Design it to need none.

| Piece | Demo setup |
|---|---|
| Everything | One laptop, `docker compose up`: `web`, `api`, `postgres` (+ `ollama` only if showing extraction live) |
| Government APIs | Adapters in **fixture mode** — recorded responses for the three demo files, including one deliberate mismatch |
| DSC | Mock signer with a test key, and the screen says so |
| Data | Seeded: 31 approvals for the food-processing / MIDC Chakan / 72-staff / boiler case; three matrix files (APP-2026-0148, -0151, -0155) |
| Backup | A 2-minute screen recording of the same path, on the laptop and on a USB stick |

---

## 7. Claims discipline — words to use and words to drop

| Say | Do not say |
|---|---|
| "No new licence, no per-call fee, no new vendor" | "Costs the government nothing" |
| "Tamper-evident hash-chained ledger" | "Blockchain", "immutable", "tamper-proof" |
| "Signed with the officer's own DSC — the server holds no key" | "We encrypt approvals with RSA-4096" |
| "A local open-weight model drafts rules; a person publishes them" | "AI verifies compliance" |
| "Runs on the State Data Centre, beside MAITRI 2.0" | "Cloud-native, auto-scaling on Kubernetes" |
| "Well under one request a second; one VM carries it" | "High-throughput" |

---

## 8. Known gaps a judge could find in the code today

Fix these or say them first.

| Gap | Where | Fix |
|---|---|---|
| Next.js 14.2.20 is below the CVE-2025-29927 patch | `package.json` | Bump to the latest 14.2.x |
| Building plan (A10) is routed to PMRDA even for an MIDC plot; inside MIDC, MIDC is the planning authority | `lib/data/maharashtraFood.ts` A10 | Switch the authority on `midc_land` (review plan §2.6 #2) |
| Role separation is client-side | `components/auth/AuthGate.tsx` | Server RBAC + field-ownership check (row 10 above) |
| Three deemed-approval citations not yet checked against the bare act: MRTP s. 45(5), Factories s. 6(2), FSSAI regulation number | seed data | Verify before they go on a slide |

---

## Sources

- Gemini API model deprecations — https://ai.google.dev/gemini-api/docs/deprecations
- InfoQ, "AWS Discontinues Amazon QLDB" (end of support 31 Jul 2025; migrate to Aurora PostgreSQL) — https://www.infoq.com/news/2024/07/aws-kill-qldb/
- Vercel, postmortem on CVE-2025-29927 (fixed in Next.js 14.2.25) — https://vercel.com/blog/postmortem-on-next-js-middleware-bypass
- Maharashtra State Data Centre / MahaGov Cloud service document (2023) — https://cdnbbsr.s3waas.gov.in/s3ffedf5be3a86e2ee281d54cdc97bc1cf/uploads/2023/06/2023061557-1.pdf
- API Setu (MeitY / NeGD) — https://apisetu.gov.in/ · FAQ https://apisetu.gov.in/faq
- API Setu and the open API policy ("free of charge to other government organisations… where possible") — https://rishabhreflections.substack.com/p/api-setu-all-about-indias-open-api
- MAITRI 2.0 launch letter (features: chatbot, document repository, grievance, NSWS sync) — https://mahamitra.org/wp-content/uploads/2025/05/Letter-announcing-MAITRI-2.0-Launch_IAs_v05.pdf
- MinIO community edition in maintenance mode, images withdrawn, AGPLv3 — https://bizety.com/2025/12/06/minio-in-maintenance-mode-open-source-alternatives/
- IBM Granite 4.1 on Ollama (Apache 2.0, JSON output) — https://ollama.com/library/granite4.1:8b
- pg-boss — https://github.com/timgit/pg-boss
- Aadhaar eSign pricing is per signature through commercial ESPs — https://www.leegality.com/aadhaar-esign-faq

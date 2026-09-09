# ANUMATI — Backend Architecture
### SIH26130 · Production-grade design

**This is written as a real production system, not a hackathon shortcut.** Section 12 tells you exactly which parts to skip for the 36-hour build — but design against the full thing, because retrofitting the temporal model later is impossible.

---

# 1. Stack decision — with honest trade-offs

| Layer | Choice | Reasoning |
|---|---|---|
| **API** | **FastAPI + Pydantic v2** | You know it from Trinetra. Auto-OpenAPI feeds the frontend's generated types. Async where it matters |
| **Primary DB** | **PostgreSQL 16 + SQLAlchemy 2.0** | Everything relational: approvals, rules, versions, applications, ledger. **Postgres is your source of truth. Full stop.** |
| **Graph compute** | **NetworkX (in-process)** | 35 approvals, ~50 edges. Critical path is microseconds |
| **Graph DB** | **Neo4j — OPTIONAL, and probably not** | ⚠️ See §1.1. Be honest with yourself here |
| **Migrations** | **Alembic** | Non-negotiable for a versioned rule schema |
| **Cache / queue broker** | **Redis** | Roadmap cache + Celery broker |
| **Background jobs** | **Celery** (or **Airflow** if you prefer what you know) | Rule extraction, PDF generation, change-radar crawls |
| **LLM extraction** | **Instructor + Pydantic** | Structured output with validation. You already use `instructor` in Trinetra |
| **PDF** | **WeasyPrint** | HTML→PDF, server-side, reliable |
| **Optimisation** | **Google OR-Tools (CP-SAT)** | Inspection planner |
| **Auth** | **JWT (python-jose) + RBAC** | Four roles, see §6 |
| **Object storage** | **MinIO / S3** | Source PDFs, generated roadmaps |
| **Observability** | **structlog + OpenTelemetry + Prometheus** | |
| **Testing** | **pytest + pytest-asyncio + testcontainers** | |

## 1.1 ⚠️ The Neo4j question — resist the temptation

You have Neo4j in your stack and it would look impressive. **For this system, it is probably the wrong call.**

```
Your graph:  ~35 nodes, ~50 edges per (sector × location × size × stage)
Traversals:  topological sort, longest path, transitive closure
Frequency:   once per roadmap generation

NetworkX does this in ~2 milliseconds, in-process, with zero
operational surface area.
```

**Neo4j earns its place when:**
- The rule base crosses ~5,000 approvals across many states, AND
- Non-developers need to write Cypher against it, AND
- You need graph traversals as a live query pattern, not a batch computation

**Until then it is a second database to keep in sync, a second failure mode, and a second thing to explain in the demo.**

> **What to do:** Postgres as the source of truth, NetworkX for computation. If you want the Neo4j credential in the pitch, add it as a **read-only projection** built by a background job — clearly labelled as an analytics/exploration layer, not the source of truth. **Never write to Neo4j from the request path.**

---

# 2. Folder structure

```
anumati-api/
├── app/
│   ├── main.py                          # FastAPI app factory, middleware, routers
│   ├── config.py                        # pydantic-settings, env-driven
│   ├── deps.py                          # shared DI: db session, current_user, tenant
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── router.py                # aggregates all routers
│   │       ├── roadmap.py               # POST /roadmap, GET /roadmap/{id}
│   │       ├── simulate.py              # POST /simulate, /simulate/portfolio
│   │       ├── approvals.py             # rule browsing
│   │       ├── applications.py          # SLA clock, filings, queries
│   │       ├── inspections.py           # inspection planning
│   │       ├── risk.py                  # scrutiny scoring
│   │       ├── feedback.py              # rejection reports → review queue
│   │       ├── review.py                # rule review workflow
│   │       ├── standard.py              # 🚀 OAGS schema + validator endpoint
│   │       └── health.py                # /healthz /readyz
│   │
│   ├── schemas/                         # Pydantic — API contract ONLY
│   │   ├── approval.py
│   │   ├── dependency.py
│   │   ├── roadmap.py
│   │   ├── simulation.py
│   │   ├── application.py
│   │   ├── inspection.py
│   │   ├── risk.py
│   │   ├── feedback.py
│   │   └── common.py                    # pagination, error envelope
│   │
│   ├── models/                          # SQLAlchemy ORM — DB shape
│   │   ├── base.py                      # Base, TimestampMixin, SoftDeleteMixin
│   │   ├── approval.py
│   │   ├── dependency.py
│   │   ├── rule_version.py              # ⭐ temporal versioning
│   │   ├── source_document.py           # provenance
│   │   ├── application.py
│   │   ├── sla_event.py                 # filed / query / resume / decided
│   │   ├── inspection.py
│   │   ├── decision_ledger.py           # ⭐ append-only audit
│   │   ├── feedback_report.py
│   │   ├── review_task.py
│   │   └── user.py
│   │
│   ├── repositories/                    # ALL SQL lives here. Nowhere else.
│   │   ├── base.py                      # generic CRUD
│   │   ├── approval_repo.py
│   │   ├── dependency_repo.py
│   │   ├── rule_version_repo.py         # as_of(date) queries
│   │   ├── application_repo.py
│   │   ├── ledger_repo.py               # append-only, no update/delete
│   │   └── feedback_repo.py
│   │
│   ├── services/                        # BUSINESS LOGIC. The valuable part.
│   │   ├── graph/
│   │   │   ├── builder.py               # rules → NetworkX DiGraph
│   │   │   ├── critical_path.py         # topological sort + longest path
│   │   │   ├── batching.py              # parallel batch computation
│   │   │   ├── conditions.py            # conditional edge evaluation
│   │   │   └── validators.py            # cycle detection, orphan detection
│   │   │
│   │   ├── roadmap/
│   │   │   ├── generator.py             # the main orchestrator
│   │   │   ├── applicability.py         # sector × location × size × stage filter
│   │   │   └── cache.py                 # deterministic cache key
│   │   │
│   │   ├── simulation/                  # 🚀 THE MOONSHOT
│   │   │   ├── levers.py                # lever definitions + application
│   │   │   ├── what_if.py               # single-journey counterfactual
│   │   │   ├── portfolio.py             # archetype × lever matrix
│   │   │   └── ranking.py               # sort by impact
│   │   │
│   │   ├── sla/
│   │   │   ├── clock.py                 # effective elapsed with pause/resume
│   │   │   ├── deemed.py                # statutory deemed threshold logic
│   │   │   └── notices.py               # notice draft generation
│   │   │
│   │   ├── extraction/                  # 🚀 THE "AI"
│   │   │   ├── document_loader.py       # PDF → text (pdfplumber)
│   │   │   ├── approval_extractor.py    # LLM → structured Approval
│   │   │   ├── form_parser.py           # required-documents list from forms
│   │   │   ├── edge_inferencer.py       # ⭐ documentary edge inference
│   │   │   ├── confidence.py            # edge type → confidence score
│   │   │   └── prompts/
│   │   │       ├── approval_extract.py
│   │   │       └── document_map.py
│   │   │
│   │   ├── risk/
│   │   │   ├── scorer.py                # explainable weighted rules
│   │   │   └── weights.py               # config-driven, not hardcoded
│   │   │
│   │   ├── inspection/
│   │   │   └── planner.py               # OR-Tools CP-SAT set-cover
│   │   │
│   │   ├── prevalidation/
│   │   │   ├── checker.py               # document readiness
│   │   │   └── query_risk.py            # predicted query likelihood
│   │   │
│   │   ├── ledger/
│   │   │   └── recorder.py              # ⭐ every decision, immutably
│   │   │
│   │   └── standard/
│   │       ├── oags_schema.py           # 🚀 the open schema definition
│   │       ├── exporter.py              # DB → OAGS JSON
│   │       └── validator.py             # validate a third-party OAGS file
│   │
│   ├── workers/
│   │   ├── celery_app.py
│   │   └── tasks/
│   │       ├── extraction.py            # async rule extraction
│   │       ├── pdf.py                   # roadmap PDF rendering
│   │       ├── change_radar.py          # crawl gov sites, diff rules
│   │       └── neo4j_projection.py      # optional analytics projection
│   │
│   ├── core/
│   │   ├── security.py                  # JWT, password hashing, RBAC deps
│   │   ├── exceptions.py                # domain exception hierarchy
│   │   ├── errors.py                    # exception → HTTP mapping
│   │   ├── logging.py                   # structlog config, request IDs
│   │   ├── telemetry.py                 # OTel tracer
│   │   ├── pagination.py
│   │   └── constants.py                 # EdgeType, RiskBand, ApplicationState
│   │
│   └── db/
│       ├── session.py                   # engine, async sessionmaker
│       └── seed/
│           ├── maharashtra_food.py      # the 35 demo approvals
│           └── archetypes.py            # portfolio simulation archetypes
│
├── migrations/                          # Alembic
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── conftest.py                      # testcontainers Postgres fixture
│   ├── unit/
│   │   ├── test_critical_path.py        # ⭐ highest-value tests
│   │   ├── test_batching.py
│   │   ├── test_sla_clock.py            # pause/resume edge cases
│   │   ├── test_deemed.py
│   │   ├── test_levers.py
│   │   └── test_edge_inference.py
│   ├── integration/
│   │   ├── test_roadmap_api.py
│   │   └── test_simulate_api.py
│   └── fixtures/
│       └── graphs.py                    # known graphs with known answers
│
├── scripts/
│   ├── seed_db.py
│   ├── extract_rules.py                 # CLI: PDF folder → draft approvals
│   └── export_oags.py                   # CLI: DB → OAGS JSON
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml               # api, postgres, redis, worker, minio
│   └── docker-compose.prod.yml
│
├── .env.example
├── alembic.ini
├── pyproject.toml
└── README.md
```

---

# 3. Data model — the parts that actually matter

## 3.1 ⭐ Temporal rule versioning (get this right on day one)

**The single most important design decision in this backend.**

A roadmap generated on 12 Feb 2026 must be **reproducible forever** using the rules as they existed on 12 Feb 2026 — even after the rules change. Without this, your audit ledger is worthless and your "change history" moat does not exist.

```python
# models/rule_version.py

class ApprovalVersion(Base):
    """Bitemporal. Never UPDATE a row — always INSERT a new version."""
    __tablename__ = "approval_version"

    id                  = Column(UUID, primary_key=True)
    approval_id         = Column(String, index=True)      # stable business key
    version             = Column(Integer, nullable=False)

    # ---- valid time: when the RULE was in force in the real world
    effective_from      = Column(Date, nullable=False)
    effective_to        = Column(Date, nullable=True)      # NULL = current

    # ---- transaction time: when WE recorded it
    recorded_at         = Column(DateTime(timezone=True), server_default=func.now())
    superseded_at       = Column(DateTime(timezone=True), nullable=True)

    # ---- the rule itself
    name                = Column(String, nullable=False)
    department_id       = Column(UUID, ForeignKey("department.id"))
    statutory_days      = Column(Integer)
    deemed_exists       = Column(Boolean, default=False)
    deemed_days         = Column(Integer, nullable=True)
    deemed_reference    = Column(String, nullable=True)
    applicability       = Column(JSONB)     # sector/location/size/stage predicates
    conditions          = Column(JSONB)     # conditional applicability expressions
    required_documents  = Column(JSONB)

    # ---- provenance — NOT NULL, deliberately
    source_document_id  = Column(UUID, ForeignKey("source_document.id"),
                                 nullable=False)
    source_section      = Column(String, nullable=False)
    source_url          = Column(String, nullable=False)

    # ---- review state
    confidence          = Column(Numeric(3,2), nullable=False)
    review_status       = Column(Enum(ReviewStatus), default=ReviewStatus.DRAFT)
    verified_by         = Column(UUID, ForeignKey("user.id"), nullable=True)
    verified_on         = Column(Date, nullable=True)

    __table_args__ = (
        UniqueConstraint("approval_id", "version"),
        Index("ix_approval_asof", "approval_id", "effective_from", "effective_to"),
    )
```

**The `as_of` query — every read goes through this:**

```python
# repositories/rule_version_repo.py

async def get_approvals_as_of(self, as_of: date) -> list[ApprovalVersion]:
    stmt = (
        select(ApprovalVersion)
        .where(ApprovalVersion.effective_from <= as_of)
        .where(or_(ApprovalVersion.effective_to.is_(None),
                   ApprovalVersion.effective_to > as_of))
        .where(ApprovalVersion.review_status == ReviewStatus.PUBLISHED)
    )
    return (await self.session.execute(stmt)).scalars().all()
```

> **`source_document_id`, `source_section` and `source_url` are `nullable=False` on purpose.**
> The database physically refuses to store a rule without a citation. That constraint is your credibility, enforced by Postgres rather than by discipline.

## 3.2 ⭐ Typed dependency edges

```python
class EdgeType(str, Enum):
    STATUTORY   = "statutory"     # 🔒 explicit in the act/rule — confidence 1.0
    DOCUMENTARY = "documentary"   # 📄 B's form requires A's certificate — 0.9
    PHYSICAL    = "physical"      # ⚙️ physically impossible otherwise — 1.0
    PRACTICE    = "practice"      # 🤝 convention, not law — 0.5, flagged

class DependencyVersion(Base):
    __tablename__ = "dependency_version"

    id                = Column(UUID, primary_key=True)
    from_approval_id  = Column(String, index=True)    # prerequisite
    to_approval_id    = Column(String, index=True)    # dependent

    edge_type         = Column(Enum(EdgeType), nullable=False)
    confidence        = Column(Numeric(3,2), nullable=False)

    # WHY this edge exists — human readable, shown in the UI
    rationale         = Column(Text, nullable=False)

    # for DOCUMENTARY edges: which document created the link
    evidence_document = Column(String, nullable=True)

    condition         = Column(JSONB, nullable=True)  # conditional edges

    effective_from    = Column(Date, nullable=False)
    effective_to      = Column(Date, nullable=True)

    source_document_id = Column(UUID, ForeignKey("source_document.id"),
                                nullable=False)
    source_section     = Column(String, nullable=False)
```

## 3.3 ⭐ Append-only decision ledger

```python
class DecisionLedger(Base):
    """
    Append-only. No UPDATE. No DELETE. Enforced by DB trigger.
    Every roadmap, every SLA computation, every deemed-threshold crossing.
    """
    __tablename__ = "decision_ledger"

    id               = Column(UUID, primary_key=True)
    occurred_at      = Column(DateTime(timezone=True), server_default=func.now())

    decision_type    = Column(Enum(DecisionType), nullable=False)
    subject_type     = Column(String)          # roadmap / application / rule
    subject_id       = Column(String, index=True)

    inputs           = Column(JSONB, nullable=False)   # exact request
    outputs          = Column(JSONB, nullable=False)   # exact response
    rule_snapshot    = Column(JSONB, nullable=False)   # ⭐ versions used
    engine_version   = Column(String, nullable=False)  # git sha

    actor_id         = Column(UUID, nullable=True)
    human_override   = Column(JSONB, nullable=True)    # if a human disagreed
```

```sql
-- migrations: enforce immutability at the database level
CREATE OR REPLACE FUNCTION reject_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'decision_ledger is append-only';
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_no_update BEFORE UPDATE OR DELETE ON decision_ledger
FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
```

> **This table is the moat, expressed in SQL.** It accumulates from day one and cannot be back-filled. When a judge asks "what's defensible here," this is the answer you point at.

## 3.4 SLA events (pause/resume without ambiguity)

```python
class SlaEventType(str, Enum):
    FILED           = "filed"
    QUERY_RAISED    = "query_raised"      # clock pauses
    QUERY_ANSWERED  = "query_answered"    # clock resumes
    INSPECTION_DUE  = "inspection_due"
    DECIDED         = "decided"
    DEEMED_CROSSED  = "deemed_crossed"

class SlaEvent(Base):
    id             = Column(UUID, primary_key=True)
    application_id = Column(UUID, ForeignKey("application.id"), index=True)
    event_type     = Column(Enum(SlaEventType), nullable=False)
    occurred_at    = Column(DateTime(timezone=True), nullable=False)
    payload        = Column(JSONB)
```

**Never store `effective_elapsed` as a column.** Derive it from the event stream:

```python
# services/sla/clock.py
def effective_elapsed(events: list[SlaEvent], now: datetime) -> timedelta:
    """Event-sourced. Recomputable, auditable, never wrong after a correction."""
    elapsed, paused_since = timedelta(), None
    filed = next(e for e in events if e.event_type == SlaEventType.FILED)
    cursor = filed.occurred_at

    for e in sorted(events, key=lambda x: x.occurred_at):
        if e.event_type == SlaEventType.QUERY_RAISED:
            elapsed += e.occurred_at - cursor
            paused_since = e.occurred_at
        elif e.event_type == SlaEventType.QUERY_ANSWERED and paused_since:
            cursor, paused_since = e.occurred_at, None

    if paused_since is None:
        elapsed += now - cursor
    return elapsed
```

---

# 4. API surface

```
POST   /api/v1/roadmap                    generate a roadmap
GET    /api/v1/roadmap/{id}               fetch (cached, immutable)
GET    /api/v1/roadmap/{id}/pdf           server-rendered PDF

POST   /api/v1/simulate                   🚀 what-if, single journey
POST   /api/v1/simulate/portfolio         🚀 archetype × lever matrix

GET    /api/v1/approvals                  browse rules (filter, paginate)
GET    /api/v1/approvals/{id}             one rule, full provenance
GET    /api/v1/approvals/{id}/versions    version history
GET    /api/v1/dependencies               edges with type + confidence

POST   /api/v1/applications               file (simulated)
GET    /api/v1/applications/{id}/sla      clock state
POST   /api/v1/applications/{id}/events   record query raised/answered
GET    /api/v1/applications/{id}/notice   draft deemed-approval notice

POST   /api/v1/inspections/plan           joint visit optimisation
POST   /api/v1/risk/score                 explainable risk breakdown
POST   /api/v1/prevalidate                document readiness + query risk

POST   /api/v1/feedback/rejection         ⭐ the learning loop
GET    /api/v1/review/queue               flagged rules
POST   /api/v1/review/{taskId}/resolve    reviewer action

GET    /api/v1/standard/schema            🚀 OAGS JSON Schema
GET    /api/v1/standard/export            🚀 our dataset as OAGS
POST   /api/v1/standard/validate          🚀 validate someone else's file

GET    /healthz  /readyz  /metrics
```

## Response envelope — consistent everywhere

```python
# schemas/common.py
class Meta(BaseModel):
    rules_version: str          # "v1.3"
    rules_as_of: date
    engine_version: str         # git sha
    generated_at: datetime
    approvals_count: int
    flagged_count: int          # rules awaiting review

class Envelope(BaseModel, Generic[T]):
    data: T
    meta: Meta
```

> **Every response carries `meta`.** That is what powers the frontend's `VersionBanner` — *"Rules v1.3 · 34 approvals · 3 flagged."* One line on screen, backed by real state.

---

# 5. The two engines that matter

## 5.1 Critical path + batching

```python
# services/graph/critical_path.py
import networkx as nx

def compute(graph: nx.DiGraph) -> CriticalPathResult:
    if not nx.is_directed_acyclic_graph(graph):
        cycle = nx.find_cycle(graph)
        raise CyclicDependencyError(cycle)      # fail loudly, never silently

    order = list(nx.topological_sort(graph))
    earliest_finish = {}
    predecessor = {}

    for node in order:
        preds = list(graph.predecessors(node))
        start = max((earliest_finish[p] for p in preds), default=0)
        if preds:
            predecessor[node] = max(preds, key=lambda p: earliest_finish[p])
        earliest_finish[node] = start + graph.nodes[node]["statutory_days"]

    total = max(earliest_finish.values())
    end = max(earliest_finish, key=earliest_finish.get)

    path, cur = [], end
    while cur:
        path.append(cur)
        cur = predecessor.get(cur)

    return CriticalPathResult(
        path=list(reversed(path)),
        total_days=total,
        earliest_finish=earliest_finish,
    )
```

```python
# services/graph/batching.py
def compute_batches(graph, earliest_finish) -> list[Batch]:
    """Group by earliest possible START day → these run in parallel."""
    starts = {
        n: max((earliest_finish[p] for p in graph.predecessors(n)), default=0)
        for n in graph.nodes
    }
    grouped = defaultdict(list)
    for node, day in starts.items():
        grouped[day].append(node)
    return [Batch(day=d, approvals=sorted(grouped[d])) for d in sorted(grouped)]
```

## 5.2 🚀 The what-if engine

```python
# services/simulation/levers.py

class LeverKind(str, Enum):
    REDUCE_TIMELINE   = "reduce_timeline"
    PARALLELISE       = "parallelise"          # drop a PRACTICE edge
    ENFORCE_DEEMED    = "enforce_deemed"
    REMOVE_APPROVAL   = "remove_approval"

def apply_lever(graph: nx.DiGraph, lever: Lever) -> nx.DiGraph:
    g = graph.copy()
    match lever.kind:
        case LeverKind.REDUCE_TIMELINE:
            g.nodes[lever.approval_id]["statutory_days"] = lever.new_days
        case LeverKind.PARALLELISE:
            edge = g.edges[lever.from_id, lever.to_id]
            if edge["edge_type"] == EdgeType.STATUTORY:
                raise IllegalLeverError(
                    "Cannot parallelise a statutory dependency"   # ⭐ guardrail
                )
            g.remove_edge(lever.from_id, lever.to_id)
        case LeverKind.ENFORCE_DEEMED:
            n = g.nodes[lever.approval_id]
            if n["deemed_days"]:
                n["statutory_days"] = min(n["statutory_days"], n["deemed_days"])
    return g

# services/simulation/what_if.py
def run(graph, levers) -> list[LeverImpact]:
    baseline = compute(graph).total_days
    out = []
    for lever in levers:
        try:
            new_total = compute(apply_lever(graph, lever)).total_days
            out.append(LeverImpact(lever=lever,
                                   new_total=new_total,
                                   days_saved=baseline - new_total))
        except IllegalLeverError as e:
            out.append(LeverImpact(lever=lever, illegal=True, reason=str(e)))
    return sorted(out, key=lambda x: x.days_saved or -1, reverse=True)
```

> **The `IllegalLeverError` guardrail is a demo asset, not just safety.**
> When a judge asks *"could this be used to bypass the law?"* — you show that the engine **structurally refuses** to parallelise a statutory dependency. It can only propose reforms to timelines and to practice-based conventions. **That is "maintaining statutory safeguards," enforced in code.**

---

# 6. Auth, roles, multi-tenancy

```python
class Role(str, Enum):
    APPLICANT = "applicant"   # own roadmaps + applications
    OFFICER   = "officer"     # department view, own department's queue
    REVIEWER  = "reviewer"    # rule review queue, publish versions
    ADMIN     = "admin"       # everything

# core/security.py
def require_role(*allowed: Role):
    async def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError(f"requires one of {allowed}")
        return user
    return dep
```

**Tenancy:** every rule row carries `state_code` and `sector_code`. A Maharashtra officer never sees Gujarat rules. Enforce with **Postgres row-level security**, not application `WHERE` clauses that someone will forget:

```sql
ALTER TABLE approval_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON approval_version
  USING (state_code = current_setting('app.state_code', true));
```

---

# 7. Rule extraction pipeline (the "AI")

```
scripts/extract_rules.py  or  POST /api/v1/admin/extract

  1. document_loader   PDF → text + page map (pdfplumber)
  2. approval_extractor LLM (instructor) → Approval draft
                        temperature=0, structured output, cite page number
  3. form_parser       application form → required_documents[]
  4. edge_inferencer   ⭐ for each required doc, is it another
                       approval's output? → DOCUMENTARY edge
  5. confidence        assign per edge type
  6. validators        cycle detection, orphan detection, duplicates
  7. → review_task     EVERY extraction lands as DRAFT
                       A human PUBLISHES it. Never auto-publish.
```

```python
# services/extraction/edge_inferencer.py

def infer_documentary_edges(
    approvals: list[Approval],
) -> list[Dependency]:
    """
    The core insight: if approval B's application form requires a document
    that approval A produces, then A is a prerequisite for B —
    stated by the department's own form.
    """
    outputs = {a.produces_document.lower(): a.id
               for a in approvals if a.produces_document}
    edges = []
    for b in approvals:
        for doc in b.required_documents:
            key = normalise(doc)
            if key in outputs and outputs[key] != b.id:
                edges.append(Dependency(
                    from_approval_id=outputs[key],
                    to_approval_id=b.id,
                    edge_type=EdgeType.DOCUMENTARY,
                    confidence=0.9,
                    rationale=f"'{b.name}' application form requires '{doc}', "
                              f"which is issued by '{outputs[key]}'.",
                    evidence_document=doc,
                ))
    return edges
```

> **This function is your novelty claim.** It discovers dependencies from departments' own forms rather than from a human's assumption. Put it on a slide.

---

# 8. Caching

```python
# services/roadmap/cache.py
def cache_key(req: RoadmapRequest, rules_version: str) -> str:
    payload = {
        "sector": req.sector, "location": req.location,
        "size_band": req.size_band, "stage": req.stage,
        "conditions": sorted(req.conditions.items()),
        "rules_version": rules_version,          # ⭐ invalidates on rule change
        "engine_version": settings.GIT_SHA,      # ⭐ invalidates on logic change
    }
    return "roadmap:" + hashlib.sha256(
        json.dumps(payload, sort_keys=True).encode()
    ).hexdigest()
```

**TTL: none.** Roadmaps are immutable for a given (input, rules_version, engine_version). If any of those change, the key changes. **Never invalidate by time — invalidate by identity.**

---

# 9. Errors, logging, observability

```python
# core/exceptions.py
class AnumatiError(Exception): ...
class RuleNotFoundError(AnumatiError): ...
class CyclicDependencyError(AnumatiError): ...
class IllegalLeverError(AnumatiError): ...
class UnverifiedRuleError(AnumatiError): ...     # publishing without a source
class ForbiddenError(AnumatiError): ...
```

```json
// consistent error envelope
{
  "error": {
    "code": "CYCLIC_DEPENDENCY",
    "message": "Dependency cycle detected in the rule graph",
    "detail": { "cycle": ["A6", "A9", "A15", "A6"] },
    "request_id": "01HX...",
    "docs": "https://anumati.dev/errors/CYCLIC_DEPENDENCY"
  }
}
```

**Metrics worth exposing:**
```
anumati_roadmap_generated_total{sector,state}
anumati_roadmap_compute_seconds        (histogram)
anumati_rules_flagged_gauge            ← surfaced in the UI banner
anumati_extraction_confidence_bucket
anumati_deemed_threshold_crossed_total ← real-world impact metric
```

---

# 10. Testing — where to spend it

**Highest value per minute, in order:**

```python
# tests/unit/test_critical_path.py
def test_diamond_graph():
    """A → {B, C} → D.  B=10, C=20, D=5.  Answer: 30, path A→C→D."""

def test_cycle_raises():
    """A→B→A must raise, not loop forever."""

def test_single_node():
    """Degenerate case."""

# tests/unit/test_sla_clock.py
def test_query_pause_resume():
def test_multiple_pauses():
def test_unresolved_query_still_paused():   # the one everyone gets wrong
def test_deemed_crossed_during_pause():     # ⚠️ tricky — does the clock pause
                                            #    the deemed threshold too?
                                            #    Decide, document, test it.

# tests/unit/test_levers.py
def test_statutory_edge_cannot_be_parallelised():   # ⭐ the guardrail
def test_lever_off_critical_path_saves_zero():      # ⭐ the demo claim
```

> **That last test — `test_lever_off_critical_path_saves_zero` — is the Fire NOC claim you make on stage.** Have it green in CI. If a judge doubts it, you have a passing test named after the assertion.

---

# 11. Deployment

```yaml
# docker/docker-compose.yml
services:
  api:
    build: .
    environment: [DATABASE_URL, REDIS_URL, JWT_SECRET, LLM_API_KEY]
    depends_on: [postgres, redis]
    ports: ["8000:8000"]

  worker:
    build: .
    command: celery -A app.workers.celery_app worker -l info

  postgres:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
```

**CI (GitHub Actions):** ruff → mypy → pytest → alembic upgrade head on a throwaway DB → build image.

---

# 12. ⚠️ What to CUT for the 36-hour build

**Design against the full architecture above. Implement this subset.**

## ✅ Build now (non-negotiable)
```
models/       approval_version, dependency_version, source_document,
              decision_ledger, sla_event
repositories/ approval_repo, dependency_repo, rule_version_repo, ledger_repo
services/     graph/*, roadmap/*, simulation/*, sla/clock, sla/deemed,
              extraction/edge_inferencer, standard/*
api/v1/       roadmap, simulate, approvals, applications, feedback, standard
db/seed/      maharashtra_food.py  ← the 35 verified approvals
tests/unit/   critical_path, sla_clock, levers
```

## 🟡 If time allows
```
inspection/planner (OR-Tools)   ·   risk/scorer   ·   prevalidation/*
workers/pdf                     ·   review workflow UI endpoints
```

## ❌ Skip entirely
```
❌ Neo4j projection            — Postgres + NetworkX is correct here
❌ Celery / workers            — run extraction as a CLI script offline
❌ MinIO                       — local filesystem is fine
❌ Row-level security          — single tenant for the demo
❌ OpenTelemetry               — structlog alone
❌ Refresh tokens / password reset — hardcode three demo users
❌ change_radar crawler        — describe it on a slide as roadmap
```

## 🔒 But do NOT cut these, however tight it gets

```
🔒 source_document_id NOT NULL       — the constraint IS the credibility
🔒 Temporal versioning               — cannot be retrofitted later
🔒 decision_ledger append-only       — this is the moat, in SQL
🔒 Typed edges + confidence          — this is the differentiation
🔒 IllegalLeverError guardrail       — this is the "statutory safeguards" answer
🔒 meta{} on every response          — this powers the version banner
```

---

## The one backend rule

> **Postgres is the source of truth. NetworkX is the calculator. Everything else is optional.**
>
> A team that ships a correct, versioned, citation-enforced rule store with a working critical-path engine beats a team that shipped six services and cannot explain where a number came from.

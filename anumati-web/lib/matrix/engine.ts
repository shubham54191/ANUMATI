import type {
  ApplicationFile,
  DeptReview,
  DerivedMatrixState,
  ReviewState,
  RevisionPacket,
  ThreadMessage,
  TimelineEvent,
} from "@/types/matrix";

/**
 * The conflict-resolution state machine.
 *
 * Everything here is a pure function of the file. The console never stores a
 * verdict — it derives one on every render — so a rejection withdrawn in the
 * clarification thread cannot leave a stale "CONFLICT" banner on screen, and
 * the same file replayed from the same events always lands on the same answer.
 */

let seq = 0;
const uid = (prefix: string) => `${prefix}-${(seq += 1).toString(36)}${Date.now().toString(36).slice(-4)}`;

/** Clock text for a stamp. Seconds matter — that is what makes a clash simultaneous. */
export const clockOf = (iso: string) => iso.slice(11, 19);
export const dateOf = (iso: string) => iso.slice(0, 10);

export const isDecided = (r: DeptReview) =>
  r.state === "approved" || r.state === "rejected" || r.state === "deemed_approved";

export const isOpen = (r: DeptReview) =>
  r.state === "queued" ||
  r.state === "in_review" ||
  // A transferred file is not settled. It is on a different desk — the
  // Committee's — and still has to be decided under the relevant law.
  r.state === "transferred_to_committee";

/** Days left before this department breaches its window. Negative = overdue. */
export function slaRemaining(review: DeptReview, day: number): number {
  return review.sla_days - day;
}

export function event(
  app: ApplicationFile,
  kind: TimelineEvent["kind"],
  actor: string,
  body: string,
  authority?: string,
  at = new Date().toISOString(),
): TimelineEvent {
  return { id: uid("EV"), kind, day: app.day, at, actor, body, authority };
}

function withEvents(app: ApplicationFile, events: TimelineEvent[]): ApplicationFile {
  return { ...app, events: [...app.events, ...events] };
}

// ---------------------------------------------------------------------------
// Parallel dispatch
// ---------------------------------------------------------------------------

/**
 * Push the file to every stakeholder department at once. This is the whole
 * point of the matrix: no department waits behind another's desk.
 */
export function dispatch(app: ApplicationFile): ApplicationFile {
  if (app.dispatched) return app;
  const at = new Date().toISOString();
  const reviews = app.reviews.map((r) => ({ ...r, state: "in_review" as ReviewState }));
  const ev = [
    event(
      app,
      "dispatch",
      "Matrix 2.0",
      `File pushed concurrently to ${reviews.length} departments — ${reviews
        .map((r) => r.dept_short)
        .join(", ")}. All SLA clocks started together.`,
      "Maharashtra Single Window Clearance Rules — r. 9(1)",
      at,
    ),
  ];
  return withEvents({ ...app, dispatched: true, reviews }, ev);
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export interface DecisionInput {
  dept_id: string;
  state: Extract<ReviewState, "approved" | "rejected">;
  score?: number;
  remarks?: string;
}

/**
 * Record one or more departmental decisions. Passing more than one applies a
 * single timestamp to all of them — which is precisely the case the conflict
 * protocol exists for: Finance clicking Approve while IT clicks Reject.
 */
export function decide(app: ApplicationFile, inputs: DecisionInput[]): ApplicationFile {
  if (inputs.length === 0) return app;
  const at = new Date().toISOString();
  const byId = new Map(inputs.map((i) => [i.dept_id, i]));

  const reviews = app.reviews.map((r) => {
    const input = byId.get(r.dept_id);
    if (!input) return r;
    return {
      ...r,
      state: input.state,
      decided_on_day: app.day,
      decided_at: at,
      score: input.score ?? r.score,
      remarks: input.remarks ?? r.remarks,
    };
  });

  const events = inputs.map((i) => {
    const r = reviews.find((x) => x.dept_id === i.dept_id)!;
    const verb = i.state === "approved" ? "approved" : "rejected";
    const scored = r.score !== null && app.rule.kind === "weighted" ? ` · score ${r.score}/100` : "";
    return event(
      app,
      "decision",
      `${r.dept_short} · ${r.officer_name}`,
      `${r.approval_id} ${verb}${scored}${i.remarks ? ` — ${i.remarks}` : ""}`,
      undefined,
      at,
    );
  });

  let next = withEvents({ ...app, reviews }, events);
  const derived = derive(next);

  if (derived.conflict) {
    next = withEvents(next, [
      event(
        next,
        "conflict",
        "Matrix 2.0",
        derived.simultaneous
          ? `Simultaneous opposite decisions at ${clockOf(at)} — ${derived.approved
              .map((r) => r.dept_short)
              .join(", ")} approved while ${derived.rejected
              .map((r) => r.dept_short)
              .join(", ")} rejected. Conflict Resolution Protocol invoked under ${app.rule.id}.`
          : `Opposite decisions inside the same parallel phase. Conflict Resolution Protocol invoked under ${app.rule.id}.`,
        `${app.rule.authority} — ${app.rule.authority_section}`,
        at,
      ),
    ]);
  }

  return applyMatrix(next);
}

/**
 * The consequences the matrix applies by itself, with nobody clicking anything.
 *
 * Two rows act on their own the instant their condition is met, because both
 * are the kind of decision a person adds nothing to: an equal-weight deadlock
 * has to leave the two departments and go to the panel, and a consolidated
 * score below the threshold has already failed whether or not an officer says
 * so. The veto row is the exception — it halts the phase automatically, but
 * sending the file back to the applicant is a human act and stays a button.
 */
export function applyMatrix(app: ApplicationFile): ApplicationFile {
  if (app.resolution) return app;
  const d = derive(app);

  // Scenario B — equal weight, so the file routes itself to the tie-breaker.
  if (app.rule.kind === "escalation" && d.conflict && !app.tie_breaker_open) {
    return escalateToTieBreaker(app);
  }

  // Scenario C — every desk has reported and the average is under the bar.
  if (app.rule.kind === "weighted" && d.weighted && d.weighted.complete && !d.weighted.pass) {
    return failOnScore(app);
  }

  return app;
}

/**
 * A department stepping back from its own rejection after the clarification
 * thread — the node goes red → processing, and the conflict evaporates.
 */
export function reEvaluate(app: ApplicationFile, deptId: string, note: string): ApplicationFile {
  const target = app.reviews.find((r) => r.dept_id === deptId);
  if (!target || target.state !== "rejected") return app;
  const at = new Date().toISOString();
  const reviews = app.reviews.map((r) =>
    r.dept_id === deptId
      ? { ...r, state: "in_review" as ReviewState, decided_on_day: null, decided_at: null, remarks: note }
      : r,
  );
  return withEvents(
    { ...app, reviews, tie_breaker_open: false, resolution: null },
    [
      event(
        app,
        "resolution",
        `${target.dept_short} · ${target.officer_name}`,
        `Rejection withdrawn for re-evaluation after cross-departmental clarification — ${note}`,
        undefined,
        at,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// The SLA clock: auto-escalation and deemed approval
// ---------------------------------------------------------------------------

/**
 * Advance the shared clock one day and apply whatever the escalation matrix
 * says falls due.
 *
 * Two different consequences, and which one applies is a property of the
 * statute rather than of the department. Where the parent Act carries its own
 * deeming clause — MRTP s. 45(5), CGST r. 9(5) — silence deems the clearance
 * granted. Everywhere else the MAITRI Act takes the file off the desk and
 * hands it to the Empowered Committee (s. 5). Either way one quiet desk can no
 * longer hold a project for a year, and neither way invents a power the law
 * does not give.
 */
export function advanceDay(app: ApplicationFile, by = 1): ApplicationFile {
  // A settled phase has no clock. Once the file has been returned to the
  // applicant or decided by the panel, letting the day counter run on would
  // keep deeming approvals onto a file nobody is working any more.
  if (app.resolution) return app;
  let next = app;
  for (let i = 0; i < by; i += 1) {
    next = tick(next);
  }
  return next;
}

function tick(app: ApplicationFile): ApplicationFile {
  const day = app.day + 1;
  const at = new Date().toISOString();
  const events: TimelineEvent[] = [];
  const stamped = { ...app, day };

  const reviews = app.reviews.map((r) => {
    if (!isOpen(r) || !app.dispatched) return r;
    const left = r.sla_days - day;

    if (left === 2) {
      events.push(
        event(
          stamped,
          "sla_warning",
          "Matrix 2.0",
          `${r.dept_short} has 2 days left on a ${r.sla_days}-day window for ${r.approval_id}.`,
          undefined,
          at,
        ),
      );
      return r;
    }

    // The parent law's own deeming clause, where the statute actually has one.
    if (r.deemed_exists && r.deemed_days !== null && day > r.deemed_days) {
      events.push(
        event(
          stamped,
          "deemed",
          "Matrix 2.0",
          `${r.dept_short} did not act within the ${r.deemed_days}-day window its own Act allows. ${r.approval_id} is DEEMED APPROVED under that Act.`,
          r.deemed_reference ?? undefined,
          at,
        ),
      );
      return {
        ...r,
        state: "deemed_approved" as ReviewState,
        decided_on_day: day,
        decided_at: at,
        remarks: `Deemed approved under ${r.deemed_reference ?? "the parent Act"} — no order within ${r.deemed_days} days.`,
      };
    }

    // Everything else. Maharashtra's single window law does not deem a
    // clearance granted when a desk goes quiet: the Nodal Agency takes the
    // file off that desk and gives it to the Empowered Committee, which then
    // disposes of it under the same sectoral law the department would have
    // applied. Nothing is waved through, and nobody gains a power they did
    // not already have.
    if (left < 0 && r.escalated_on_day === null) {
      events.push(
        event(
          stamped,
          "escalation",
          "Matrix 2.0",
          `${r.dept_short} missed its ${r.sla_days}-day limit on ${r.approval_id}. The file is transferred to ${r.escalation_tier}; ${r.dept_short} ceases to have power over it. The Committee will still decide under the same Act.`,
          "MAITRI Act, 2023 — s. 5(1) and s. 5(2)",
          at,
        ),
      );
      return {
        ...r,
        state: "transferred_to_committee" as ReviewState,
        escalated_on_day: day,
        remarks: `Transferred to ${r.escalation_tier} after the ${r.sla_days}-day limit lapsed.`,
      };
    }

    return r;
  });

  return applyMatrix(withEvents({ ...stamped, reviews }, events));
}

// ---------------------------------------------------------------------------
// Derivation — the single source of truth for what the screen shows
// ---------------------------------------------------------------------------

export function derive(app: ApplicationFile): DerivedMatrixState {
  const approved = app.reviews.filter((r) => r.state === "approved");
  const deemed = app.reviews.filter((r) => r.state === "deemed_approved");
  const rejected = app.reviews.filter((r) => r.state === "rejected");
  const pending = app.reviews.filter(isOpen);
  const escalated = app.reviews.filter((r) => r.escalated_on_day !== null && isOpen(r));
  const transferred = app.reviews.filter((r) => r.state === "transferred_to_committee");
  const breachedSla = app.reviews.filter((r) => isOpen(r) && r.sla_days - app.day < 0);

  const clearedCount = approved.length + deemed.length;
  const conflict = rejected.length > 0 && clearedCount > 0;

  // Simultaneous means simultaneous on BOTH clocks: the same wall-clock second
  // and the same day of the file's own life. Wall-clock alone is not enough —
  // in a walkthrough two decisions three simulated days apart can still land
  // inside one real second, and calling that "at the same instant" would put a
  // claim on screen that the timestamps do not support.
  const decisive = [...approved, ...rejected].filter(
    (r) => r.decided_at !== null && r.decided_on_day !== null,
  );
  const stamps = decisive.map((r) => `${r.decided_on_day}@${(r.decided_at as string).slice(0, 19)}`);
  const simultaneous = conflict && stamps.length > 1 && new Set(stamps).size === 1;

  const vetoDepts = new Set(app.rule.veto_departments ?? []);
  const vetoedBy =
    app.rule.kind === "veto"
      ? rejected.find((r) => r.veto || vetoDepts.has(r.dept_id)) ?? null
      : null;

  const weighted =
    app.rule.kind === "weighted"
      ? (() => {
          const threshold = app.rule.passing_score ?? 75;
          const scored = app.reviews.filter((r) => r.score !== null);
          const totalWeight = scored.reduce((n, r) => n + r.weight, 0);
          const score =
            totalWeight === 0
              ? 0
              : scored.reduce((n, r) => n + (r.score ?? 0) * r.weight, 0) / totalWeight;
          return {
            score: Math.round(score * 10) / 10,
            threshold,
            pass: score >= threshold,
            // Every desk has reported. A deemed approval closes its lane without
            // a number, and must not hold the panel open for ever.
            complete: app.reviews.every(isDecided) && scored.length > 0,
            contributions: scored.map((r) => ({
              dept_short: r.dept_short,
              score: r.score ?? 0,
              weight: r.weight,
              share: totalWeight === 0 ? 0 : (r.weight / totalWeight) * 100,
            })),
          };
        })()
      : null;

  let verdict: DerivedMatrixState["verdict"] = "in_progress";
  if (!app.dispatched) verdict = "awaiting_dispatch";
  else if (app.resolution) verdict = "settled";
  else if (app.tie_breaker_open) verdict = "awaiting_tie_breaker";
  else if (conflict) {
    verdict =
      app.rule.kind === "veto"
        ? "conflict_halted"
        : app.rule.kind === "escalation"
          ? "conflict_escalation"
          : "conflict_scored";
  } else if (pending.length === 0 && rejected.length === 0) verdict = "cleared";

  const tone: DerivedMatrixState["tone"] =
    verdict === "awaiting_dispatch"
      ? "neutral"
      : verdict === "conflict_halted" || verdict === "conflict_escalation" || verdict === "awaiting_tie_breaker"
        ? "orange"
        : verdict === "conflict_scored"
          ? weighted && !weighted.pass
            ? "red"
            : "orange"
          : verdict === "cleared" ||
              (app.resolution && (app.resolution.kind === "cleared" || app.resolution.kind === "overruled"))
            ? "green"
            : app.resolution &&
                (app.resolution.kind === "failed_score" ||
                  app.resolution.kind === "sustained" ||
                  app.resolution.kind === "sent_for_revision")
              ? "red"
              : "active";

  const decidedCount = app.reviews.filter(isDecided).length;
  const progress = app.reviews.length === 0 ? 0 : (decidedCount / app.reviews.length) * 100;

  const canFinalise =
    app.dispatched &&
    !conflict &&
    pending.length === 0 &&
    rejected.length === 0 &&
    (weighted ? weighted.pass : true) &&
    !app.resolution;

  return {
    approved,
    rejected,
    pending,
    deemed,
    escalated,
    transferred,
    conflict,
    simultaneous,
    vetoedBy,
    weighted,
    verdict,
    tone,
    progress,
    canFinalise,
    breachedSla,
  };
}

// ---------------------------------------------------------------------------
// Resolution paths
// ---------------------------------------------------------------------------

/** Scenario A — package the objections and send the file back to the applicant. */
export function sendForRevision(app: ApplicationFile, replyDays = 15): ApplicationFile {
  const d = derive(app);
  if (d.rejected.length === 0) return app;
  const at = new Date().toISOString();

  const packet: RevisionPacket = {
    id: uid("REV"),
    raised_by: d.rejected.map((r) => r.dept_short),
    carried_forward: [...d.approved, ...d.deemed].map(
      (r) => `${r.dept_short} — ${r.approval_id} ${r.state === "deemed_approved" ? "deemed approved" : "approved"}, held valid on resubmission`,
    ),
    objections: d.rejected.map((r) => ({
      dept_short: r.dept_short,
      body: r.remarks ?? "No reason recorded.",
    })),
    reply_days: replyDays,
  };

  return withEvents(
    {
      ...app,
      tie_breaker_open: false,
      resolution: {
        kind: "sent_for_revision",
        day: app.day,
        note: `Returned to ${app.applicant} with ${packet.objections.length} objection(s). Clearances already granted are carried forward.`,
        packet,
      },
    },
    [
      event(
        app,
        "resolution",
        "Single-window officer",
        `Sent for revision. ${packet.objections.length} objection(s) packaged with ${packet.carried_forward.length} carried-forward clearance(s). Applicant has ${replyDays} days to resubmit.`,
        `${app.rule.authority} — ${app.rule.authority_section}`,
        at,
      ),
    ],
  );
}

/** Scenario B — open the tie-breaker node on the parallel track. */
export function escalateToTieBreaker(app: ApplicationFile): ApplicationFile {
  if (app.tie_breaker_open) return app;
  const panel = app.rule.tie_breaker;
  const at = new Date().toISOString();
  return withEvents({ ...app, tie_breaker_open: true }, [
    event(
      app,
      "escalation",
      "Matrix 2.0",
      `Departments carry equal weight — neither may override the other. File routed to ${panel?.panel ?? "the tie-breaker panel"} (${panel?.chair ?? "chair"}), ${panel?.sla_days ?? 7}-day window.`,
      `${app.rule.authority} — ${app.rule.authority_section}`,
      at,
    ),
  ]);
}

/** Scenario B, the panel's call: overrule the rejection, or sustain it. */
export function tieBreakerDecision(
  app: ApplicationFile,
  outcome: "overrule" | "sustain",
  by: string,
  note: string,
): ApplicationFile {
  const d = derive(app);
  const at = new Date().toISOString();

  if (outcome === "overrule") {
    const reviews = app.reviews.map((r) =>
      r.state === "rejected"
        ? {
            ...r,
            state: "approved" as ReviewState,
            decided_on_day: app.day,
            decided_at: at,
            remarks: `Rejection overruled by ${by}. ${note}`,
          }
        : r,
    );
    return withEvents(
      {
        ...app,
        reviews,
        tie_breaker_open: false,
        resolution: {
          kind: "overruled",
          day: app.day,
          by,
          note,
        },
      },
      [
        event(
          app,
          "resolution",
          by,
          `Rejection by ${d.rejected.map((r) => r.dept_short).join(", ")} overruled. Phase cleared. ${note}`,
          `${app.rule.authority} — ${app.rule.authority_section}`,
          at,
        ),
      ],
    );
  }

  return withEvents(
    {
      ...app,
      tie_breaker_open: false,
      resolution: { kind: "sustained", day: app.day, by, note },
    },
    [
      event(
        app,
        "resolution",
        by,
        `Rejection by ${d.rejected.map((r) => r.dept_short).join(", ")} sustained. File returns to the applicant. ${note}`,
        `${app.rule.authority} — ${app.rule.authority_section}`,
        at,
      ),
    ],
  );
}

/** Scenario C — the consolidated score has come in under the threshold. */
export function failOnScore(app: ApplicationFile): ApplicationFile {
  const d = derive(app);
  if (!d.weighted) return app;
  const at = new Date().toISOString();
  return withEvents(
    {
      ...app,
      resolution: {
        kind: "failed_score",
        day: app.day,
        score: d.weighted.score,
        note: `Consolidated weighted score ${d.weighted.score} is below the passing score of ${d.weighted.threshold}.`,
      },
    },
    [
      event(
        app,
        "resolution",
        "Matrix 2.0",
        `Phase marked FAILED — consolidated score ${d.weighted.score}/100 against a threshold of ${d.weighted.threshold}. Project manager notified.`,
        `${app.rule.authority} — ${app.rule.authority_section}`,
        at,
      ),
    ],
  );
}

/** No conflict left, every desk cleared — sign the phase off. */
export function finalise(app: ApplicationFile): ApplicationFile {
  const d = derive(app);
  if (!d.canFinalise) return app;
  const at = new Date().toISOString();
  return withEvents(
    {
      ...app,
      resolution: {
        kind: "cleared",
        day: app.day,
        note: `All ${app.reviews.length} departments cleared on day ${app.day}.`,
      },
    },
    [
      event(
        app,
        "resolution",
        "Single-window officer",
        `Parallel review phase finalised on day ${app.day}. ${d.approved.length} approved, ${d.deemed.length} deemed approved.`,
        undefined,
        at,
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// Clarification thread
// ---------------------------------------------------------------------------

export function postMessage(
  app: ApplicationFile,
  msg: Omit<ThreadMessage, "id" | "at" | "day">,
): ApplicationFile {
  const at = new Date().toISOString();
  const message: ThreadMessage = { ...msg, id: uid("MSG"), at, day: app.day };
  return { ...app, thread: [...app.thread, message] };
}

// ---------------------------------------------------------------------------
// Shared data matrix
// ---------------------------------------------------------------------------

export function setRecordState(
  app: ApplicationFile,
  recordId: string,
  patch: Partial<{ state: import("@/types/matrix").DataRecordState; value: string | null; fetched_at: string | null }>,
): ApplicationFile {
  const records = app.records.map((r) => (r.id === recordId ? { ...r, ...patch } : r));
  const rec = records.find((r) => r.id === recordId);
  if (!rec || patch.state === "fetching" || patch.state === undefined) {
    return { ...app, records };
  }
  return withEvents({ ...app, records }, [
    event(
      app,
      "data",
      `Data matrix · ${rec.source_short}`,
      patch.state === "verified"
        ? `${rec.label} fetched and verified from ${rec.source} — ${rec.value}. Replaces: ${rec.replaces}.`
        : patch.state === "mismatch"
          ? `${rec.label} returned a mismatch from ${rec.source} — ${rec.value}.`
          : `${rec.label} unavailable from ${rec.source}.`,
    ),
  ]);
}

/**
 * A department marks the parameters it owns as reviewed.
 *
 * Only its own groups are touched — a desk cannot clear another desk's
 * parameters, which is the whole point of carrying the owner on the group.
 */
export function verifyParameters(app: ApplicationFile, deptId: string): ApplicationFile {
  const dept = app.reviews.find((r) => r.dept_id === deptId);
  if (!dept) return app;
  let changed = false;
  const parameters = app.parameters.map((g) => {
    if (g.owner_dept !== deptId || g.verified_by_dept !== null) return g;
    changed = true;
    return {
      ...g,
      verified_by_dept: deptId,
      verified_on_day: app.day,
      signature_ref: `sig:${dept.dept_short.toLowerCase()}:${g.id}`,
    };
  });
  if (!changed) return app;
  return {
    ...app,
    parameters,
    events: [
      ...app.events,
      {
        id: `EV-${app.events.length + 1}`,
        at: new Date().toISOString(),
        day: app.day,
        kind: "data",
        actor: dept.dept_short,
        body: `${dept.dept_short} marked the parameters it owns as reviewed: ${parameters
          .filter((g) => g.owner_dept === deptId)
          .map((g) => g.label)
          .join(", ")}.`,
        authority: "Field-level verification ownership — scope of a departmental approval",
      },
    ],
  };
}

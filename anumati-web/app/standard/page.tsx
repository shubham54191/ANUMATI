"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Download, FileText, Upload, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { localMeta } from "@/lib/api/roadmap";
import type { ValidationResult } from "@/lib/oags/validate";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";

/** Shown greyed out until a real file has been checked. */
const FALLBACK_CHECKS = [
  { id: "schema", label: "Schema conformance", passed: false, findings: 0 },
  { id: "citation", label: "Every rule carries a citation", passed: false, findings: 0 },
  { id: "cycle", label: "No dependency cycles", passed: false, findings: 0 },
  { id: "orphan", label: "No orphaned approvals", passed: false, findings: 0 },
] as const;

export default function StandardPage() {
  const meta = localMeta();
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  // The tick list used to fade in on any click. It now reports what the
  // endpoint actually said about the file that was dropped on it.
  const runValidation = async (file: File) => {
    setChecking(true);
    setFailure(null);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/v1/standard/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: text,
      });
      const payload = await res.json();
      if (!res.ok) {
        setFailure(payload?.error?.message ?? `Validator returned ${res.status}.`);
        return;
      }
      setResult(payload as ValidationResult);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "The file could not be read.");
    } finally {
      setChecking(false);
    }
  };

  const checkOurOwn = async () => {
    setChecking(true);
    setFailure(null);
    setResult(null);
    try {
      const doc = await (await fetch("/api/v1/standard/export")).json();
      const res = await fetch("/api/v1/standard/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(doc),
      });
      setResult((await res.json()) as ValidationResult);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "The export could not be fetched.");
    } finally {
      setChecking(false);
    }
  };

  const sampleEdge = useMemo(() => {
    const d = DEPENDENCIES.find(
      (x) => x.from_approval_id === "A10" && x.to_approval_id === "A15",
    )!;
    const from = APPROVALS.find((a) => a.id === d.from_approval_id)!;
    const to = APPROVALS.find((a) => a.id === d.to_approval_id)!;
    return { d, from, to };
  }, []);

  const sourceDocs = new Set(APPROVALS.map((a) => a.source.document_id)).size;
  const cited = APPROVALS.filter((a) => a.source.section && a.source.url).length;

  const stats = [
    { n: APPROVALS.length, label: "approvals, Maharashtra" },
    { n: DEPENDENCIES.length, label: "typed dependency edges" },
    { n: sourceDocs, label: "source documents cited" },
    {
      n: `${Math.round((cited / APPROVALS.length) * 100)}%`,
      label: "rules carrying a section reference",
    },
  ];

  const insistences = [
    {
      rule: "--edge-statutory",
      title: "A dependency has a type",
      body: "Statutory, documentary, physical, practice. A typed edge says whether an order is law, paperwork, physics, or just how the office does it.",
    },
    {
      rule: "--edge-documentary",
      title: "A rule cannot exist without a citation",
      body: "Source document, section and URL are required fields. A file that omits them fails validation.",
    },
    {
      rule: "--edge-practice",
      title: "Uncertainty is a field, not a footnote",
      body: "Every edge carries a confidence. A practice-based edge at 0.50 is published as one — visible, and reformable without touching the statute.",
    },
  ];

  // These are live route handlers under app/api, not a picture of an API.
  const endpoints = [
    { m: "GET", path: "/api/v1/standard/schema", note: "The JSON Schema itself", open: true },
    { m: "GET", path: "/api/v1/standard/export", note: "Our dataset, in OAGS", open: true },
    { m: "POST", path: "/api/v1/standard/validate", note: "Check somebody else's file", open: false },
    {
      m: "GET",
      path: "/api/v1/approvals?as_of=2026-09-07",
      note: "Rules as they stood on a date",
      open: true,
    },
  ];

  // The rationale is the longest field and the one worth reading, so it is
  // wrapped rather than left to run off the edge of the block.
  const wrapped = sampleEdge.d.rationale
    .split(" ")
    .reduce<string[]>((lines, word) => {
      const last = lines[lines.length - 1];
      if (last && (last + " " + word).length <= 48) lines[lines.length - 1] = last + " " + word;
      else lines.push(word);
      return lines;
    }, [])
    .map((line, i) => (i === 0 ? `"${line}` : `                       ${line}`))
    .join("\n");

  const json = `{
  "from_approval_id": "${sampleEdge.d.from_approval_id}",
  "to_approval_id":   "${sampleEdge.d.to_approval_id}",
  "edge_type":        "${sampleEdge.d.edge_type}",
  "confidence":       ${sampleEdge.d.confidence.toFixed(2)},
  "rationale":        ${wrapped}",
  "evidence_document": "${sampleEdge.d.evidence_document}",
  "condition":        null,
  "effective_from":   "${sampleEdge.to.source.effective_from}",
  "effective_to":     null,
  "source": {
    "document_id":  "${sampleEdge.to.source.document_id}",
    "section":      "${sampleEdge.to.source.section}",
    "url":          "${sampleEdge.to.source.url}"
  }
}`;

  return (
    <AppShell active="standard" meta={meta}>
      <main className="flex-1 overflow-y-auto">
        {/* hero */}
        <section className="border-b border-line bg-surface px-5 py-14">
          <div className="mx-auto flex w-full max-w-[1200px] items-start gap-16">
            <div className="w-[680px] flex-none">
              <div className="anim-rise mb-5 flex items-center gap-2.5">
                <Label className="text-accent">Open Approval Graph Schema</Label>
                <span className="rounded-sm border border-line bg-bg px-1.5 font-mono text-[9.5px] tracking-[0.05em] text-muted">
                  DRAFT v0.1
                </span>
                <span className="rounded-sm border border-line bg-bg px-1.5 font-mono text-[9.5px] tracking-[0.05em] text-muted">
                  CC BY 4.0
                </span>
              </div>
              <h1
                style={{ animationDelay: "60ms" }}
                className="anim-rise mb-5 font-serif text-[52px] font-medium leading-[1.06] tracking-[-0.015em] text-ink"
              >
                A common way to write down what an approval depends on.
              </h1>
              <p
                style={{ animationDelay: "120ms" }}
                className="anim-rise mb-4 max-w-[620px] text-[16px] leading-relaxed text-ink"
              >
                A small JSON schema for approvals, their statutory timelines,
                and — the part nobody writes down — the dependencies between
                them, each citing the section it comes from.
              </p>
              <p
                style={{ animationDelay: "160ms" }}
                className="anim-rise mb-8 max-w-[620px] text-sm leading-relaxed text-muted"
              >
                Our Maharashtra rule base and the validator are published in it.
              </p>
              <div style={{ animationDelay: "220ms" }} className="anim-rise flex items-center gap-3">
                <a href="/api/v1/standard/schema" target="_blank" rel="noreferrer" className="no-underline">
                  <Button size="md" variant="primary">
                    Read the schema
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </Button>
                </a>
                <a href="/api/v1/standard/export" className="no-underline">
                  <Button size="md" className="border-ink">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.4} />
                    Download our dataset
                  </Button>
                </a>
              </div>
            </div>

            <div
              style={{ animationDelay: "280ms" }}
              className="anim-rise flex-1 border-l border-line pl-11 pt-1"
            >
              <Label className="mb-5 block">What is published today</Label>
              <dl className="flex flex-col gap-5">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-num font-serif text-[34px] font-medium leading-none text-accent">
                      {s.n}
                    </dd>
                    <span className="text-[12.5px] text-muted">{s.label}</span>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* what it insists on */}
        <section className="border-b border-line px-5 py-11">
          <div className="mx-auto w-full max-w-[1200px]">
            <Label className="mb-7 block text-accent">Three things the schema insists on</Label>
            <div className="grid gap-10 md:grid-cols-3">
              {insistences.map((c) => (
                <div
                  key={c.title}
                  className="rounded border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow"
                >
                  <div
                    className="mb-4 h-1 w-10 rounded-full"
                    style={{ background: `var(${c.rule})` }}
                  />
                  <h2 className="mb-2.5 font-serif text-[20px] font-medium leading-snug text-ink">
                    {c.title}
                  </h2>
                  <p className="text-[13.5px] leading-relaxed text-muted">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* the schema, and the machinery around it */}
        <section className="px-5 py-11">
          <div className="mx-auto flex w-full max-w-[1200px] items-start gap-9">
            <div className="w-[700px] flex-none">
              <div className="mb-3 flex items-baseline justify-between">
                <Label>One dependency, in full</Label>
                <span className="font-mono text-[10.5px] text-faint">
                  oags/v0.1/dependency.schema.json
                </span>
              </div>
              <pre className="overflow-x-auto rounded border border-line bg-surface px-[18px] py-4 font-mono text-[12px] leading-[1.75] text-ink">
                {json}
              </pre>
              <div className="mt-3.5 flex items-start gap-2.5">
                <FileText className="mt-1 h-3 w-3 flex-none text-faint" strokeWidth={1.3} />
                <p className="text-[12.5px] leading-relaxed text-muted">
                  <span className="text-ink">The rationale field is the interesting one.</span>{" "}
                  It is what an applicant reads when they ask why one approval is
                  waiting on another.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div>
                <Label className="mb-3 block">Endpoints</Label>
                <div className="overflow-hidden rounded border border-line bg-surface">
                  {endpoints.map((e, i) => {
                    const Row = e.open ? "a" : "div";
                    return (
                    <Row
                      key={e.path}
                      {...(e.open ? { href: e.path, target: "_blank", rel: "noreferrer" } : {})}
                      className={`flex items-center px-3.5 py-2.5 no-underline ${i > 0 ? "border-t border-line" : ""} ${e.open ? "transition-colors hover:bg-sunk" : ""}`}
                    >
                      <span
                        className={`w-[52px] flex-none font-mono text-[10px] font-semibold tracking-[0.05em] ${
                          e.m === "GET" ? "text-state-done" : "text-state-active"
                        }`}
                      >
                        {e.m}
                      </span>
                      <span className="flex-1 truncate font-mono text-[11.5px] text-ink">
                        {e.path}
                      </span>
                      <span className="hidden text-[11.5px] text-muted xl:inline">
                        {e.note}
                      </span>
                    </Row>
                    );
                  })}
                </div>
              </div>

              <div className="rounded border border-line bg-sunk px-[18px] py-4">
                <div className="mb-3 flex items-baseline justify-between">
                  <Label className="block text-ink">Validate your file</Label>
                  <button
                    onClick={checkOurOwn}
                    disabled={checking}
                    className="font-mono text-[10.5px] text-state-active underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    try ours
                  </button>
                </div>

                <label className="mb-3 flex h-[74px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded border border-dashed border-line-strong bg-surface transition-colors hover:border-accent focus-within:ring-2 focus-within:ring-accent">
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void runValidation(f);
                      // Let the same file be chosen twice in a row.
                      e.target.value = "";
                    }}
                  />
                  <Upload className="h-4 w-4 text-faint" strokeWidth={1.3} />
                  <span className="text-[12px] text-muted">
                    {checking ? "Checking\u2026" : "Choose an OAGS JSON file"}
                  </span>
                </label>

                {failure ? (
                  <p
                    role="alert"
                    className="mb-3 rounded-sm border border-critical/40 bg-critical/[0.05] px-2.5 py-2 text-[12px] leading-snug text-critical"
                  >
                    {failure}
                  </p>
                ) : null}

                <ul className="flex flex-col gap-1.5">
                  {(result?.checks ?? FALLBACK_CHECKS).map((c) => {
                    const done = result !== null;
                    const passed = done && c.passed;
                    return (
                      <li key={c.id} className="flex items-center gap-2">
                        {passed ? (
                          <Check className="h-3 w-3 flex-none text-state-done" strokeWidth={1.8} />
                        ) : done ? (
                          <X className="h-3 w-3 flex-none text-critical" strokeWidth={1.8} />
                        ) : (
                          <Check className="h-3 w-3 flex-none text-faint" strokeWidth={1.8} />
                        )}
                        <span className={done ? "text-[12px] text-ink" : "text-[12px] text-muted"}>
                          {c.label}
                        </span>
                        {done && c.findings > 0 ? (
                          <span
                            className={
                              passed
                                ? "font-num ml-auto font-mono text-[10px] text-state-deemed-ink"
                                : "font-num ml-auto font-mono text-[10px] text-critical"
                            }
                          >
                            {c.findings}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {result ? (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="font-mono text-[10.5px] text-muted">
                      {result.counts.approvals} approvals · {result.counts.dependencies} edges ·{" "}
                      <span className={result.valid ? "text-state-done" : "text-critical"}>
                        {result.valid ? "VALID" : "REJECTED"}
                      </span>
                    </p>
                    {result.findings.length > 0 ? (
                      <ul className="mt-2 flex max-h-[168px] flex-col gap-1.5 overflow-y-auto">
                        {result.findings.slice(0, 20).map((f, i) => (
                          <li key={`${f.path}-${i}`} className="text-[11.5px] leading-snug">
                            <span
                              className={
                                f.severity === "error"
                                  ? "font-mono text-[10px] text-critical"
                                  : "font-mono text-[10px] text-state-deemed-ink"
                              }
                            >
                              {f.path}
                            </span>{" "}
                            <span className="text-muted">{f.message}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {result.findings.length > 20 ? (
                      <p className="mt-1.5 font-mono text-[10px] text-faint">
                        and {result.findings.length - 20} more
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="rounded border border-line bg-surface px-[18px] py-4">
                <h2 className="mb-2 font-serif text-[17px] font-medium leading-snug text-ink">
                  Adopting it costs a state one export script
                </h2>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  It changes how rules are published, not how they are stored.
                  Once two states publish OAGS, one window reads both without a
                  bespoke integration.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

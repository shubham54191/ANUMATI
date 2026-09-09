"use client";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Download, FileText, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { localMeta } from "@/lib/api/roadmap";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";

export default function StandardPage() {
  const meta = localMeta();
  const [validated, setValidated] = useState(false);

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
      body: "Statutory, documentary, physical, practice. A list of approvals tells you nothing about order; a typed edge tells you whether the order is law, paperwork, physics, or just how the office does it.",
    },
    {
      rule: "--edge-documentary",
      title: "A rule cannot exist without a citation",
      body: "Source document, section and URL are required fields, not recommended ones. A file that omits them fails validation, so nobody has to take the publisher's word for anything.",
    },
    {
      rule: "--edge-practice",
      title: "Uncertainty is a field, not a footnote",
      body: "Every edge carries a confidence and a rationale. A practice-based edge at 0.50 is published as one — visible to the applicant, and reformable without touching the statute.",
    },
  ];

  const endpoints = [
    { m: "GET", path: "/v1/standard/schema", note: "The JSON Schema itself" },
    { m: "GET", path: "/v1/standard/export", note: "Our dataset, in OAGS" },
    { m: "POST", path: "/v1/standard/validate", note: "Check somebody else's file" },
    { m: "GET", path: "/v1/approvals?as_of=2026-09-07", note: "Rules as they stood on a date" },
  ];

  const checks = [
    "Schema conformance",
    "Every rule carries a citation",
    "No dependency cycles",
    "No orphaned approvals",
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
                Every state has the same problem and solves it in a different
                spreadsheet. OAGS is a small JSON schema for approvals, their
                statutory timelines, and — the part nobody writes down — the
                dependencies between them, each carrying the section of the act
                it comes from and how sure we are.
              </p>
              <p
                style={{ animationDelay: "160ms" }}
                className="anim-rise mb-8 max-w-[620px] text-sm leading-relaxed text-muted"
              >
                Our Maharashtra rule base is published in it. So is the
                validator. Neither is the point: the schema is.
              </p>
              <div style={{ animationDelay: "220ms" }} className="anim-rise flex items-center gap-3">
                <Button size="md" variant="primary">
                  Read the schema
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
                <Button size="md" className="border-ink">
                  <Download className="h-3.5 w-3.5" strokeWidth={1.4} />
                  Download our dataset
                </Button>
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
                  It is written by the extractor that found the edge in the
                  department&apos;s own form, and it is what an applicant reads when
                  they ask why one approval is waiting on another.
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-6">
              <div>
                <Label className="mb-3 block">Endpoints</Label>
                <div className="overflow-hidden rounded border border-line bg-surface">
                  {endpoints.map((e, i) => (
                    <div
                      key={e.path}
                      className={`flex items-center px-3.5 py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
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
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-line bg-sunk px-[18px] py-4">
                <Label className="mb-3 block text-ink">Validate your file</Label>
                <button
                  onClick={() => setValidated(true)}
                  className="mb-3 flex h-[74px] w-full flex-col items-center justify-center gap-1.5 rounded border border-dashed border-line-strong bg-surface transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <Upload className="h-4 w-4 text-faint" strokeWidth={1.3} />
                  <span className="text-[12px] text-muted">Drop an OAGS JSON file</span>
                </button>
                <ul className="flex flex-col gap-1.5">
                  {checks.map((c, i) => (
                    <li
                      key={c}
                      className="flex items-center gap-2 transition-opacity"
                      style={{
                        opacity: validated ? 1 : 0.45,
                        transitionDelay: validated ? `${i * 90}ms` : "0ms",
                      }}
                    >
                      <Check
                        className={validated ? "h-3 w-3 text-state-done" : "h-3 w-3 text-faint"}
                        strokeWidth={1.8}
                      />
                      <span className="text-[12px] text-ink">{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded border border-line bg-surface px-[18px] py-4">
                <h2 className="mb-2 font-serif text-[17px] font-medium leading-snug text-ink">
                  Adopting it costs a state one export script
                </h2>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  The schema does not ask anyone to change how they store rules —
                  only how they publish them. MAITRI keeps its portal and its
                  processes. Once two states publish OAGS, a single window can
                  read both without a bespoke integration.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

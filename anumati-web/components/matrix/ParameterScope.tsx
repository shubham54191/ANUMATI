"use client";
import { useState } from "react";
import { CheckCircle2, ChevronDown, PenLine, ShieldQuestion } from "lucide-react";
import type { ApplicationFile, ParameterGroup } from "@/types/matrix";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Label } from "@/components/ui/Card";
import { Explain } from "@/components/ui/Explain";
import { cn } from "@/lib/utils";

/**
 * Who owns which parameters on this file, read from the desk of one department.
 *
 * The point the table makes is the one the plan calls scope isolation: an
 * upstream approval is context, never clearance. Reading as MPCB, the building
 * parameters show as cleared by MIDC and signed, and the effluent parameters
 * show as nobody's work but yours — so nothing another desk signed can be
 * mistaken for cover for your own decision.
 *
 * It does not claim to catch a bad approval. A careless officer can still tick
 * every box; what this stops is that mistake spreading into another domain, and
 * what it leaves behind is a record of exactly who cleared what.
 */
export function ParameterScope({ app }: { app: ApplicationFile }) {
  const desks = app.reviews;
  const [asDept, setAsDept] = useState<string>(desks[0]?.dept_id ?? "");
  const [open, setOpen] = useState<string | null>(null);
  const verify = useMatrixStore((s) => s.verifyParameters);

  const reading = desks.find((d) => d.dept_id === asDept);
  const mine = app.parameters.filter((p) => p.owner_dept === asDept);
  const outstanding = mine.filter((p) => p.verified_by_dept === null);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-none border-b border-line px-4 py-2.5">
        <Label className="mb-1.5 block">Parameter ownership</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10.5px] text-faint">READING AS</span>
          {desks.map((d) => (
            <button
              key={d.dept_id}
              onClick={() => setAsDept(d.dept_id)}
              aria-pressed={asDept === d.dept_id}
              className={cn(
                "h-[22px] rounded-sm border px-1.5 font-mono text-[10.5px] transition-colors",
                asDept === d.dept_id
                  ? "border-accent bg-accent-muted font-medium text-accent"
                  : "border-line text-muted hover:border-accent hover:text-accent",
              )}
            >
              {d.dept_short}
            </button>
          ))}
        </div>
        <Explain className="mt-2">
          A department&apos;s approval covers only the parameters it is competent to judge. Another
          desk&apos;s signature is context on your screen, never clearance for your decision.
        </Explain>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-2">
          {app.parameters.map((p) => (
            <Row
              key={p.id}
              group={p}
              yours={p.owner_dept === asDept}
              expanded={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
            />
          ))}
        </div>

        {mine.length > 0 ? (
          <div className="mt-4 rounded border border-line bg-bg px-3 py-2.5">
            <p className="text-[12px] leading-snug text-ink">
              {outstanding.length === 0 ? (
                <>
                  {reading?.dept_short} has cleared all {mine.length} parameter
                  {mine.length === 1 ? "" : "s"} it owns.
                </>
              ) : (
                <>
                  {outstanding.length} parameter{outstanding.length === 1 ? "" : "s"} still need
                  {outstanding.length === 1 ? "s" : ""} {reading?.dept_short}&apos;s review before this
                  desk can decide.
                </>
              )}
            </p>
            {outstanding.length > 0 ? (
              <button
                onClick={() => verify(asDept)}
                className="mt-2 flex h-8 items-center gap-1.5 rounded border border-accent bg-accent-muted px-2.5 text-[12px] font-medium text-accent transition-colors hover:brightness-95"
              >
                <PenLine className="h-3 w-3" strokeWidth={1.7} />
                Mark {reading?.dept_short} parameters reviewed
              </button>
            ) : null}
            <p className="mt-2 font-mono text-[10px] leading-snug text-faint">
              Signed with the officer&apos;s own DSC in a deployment. Mocked here — this build holds no
              keys and signs nothing.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  group,
  yours,
  expanded,
  onToggle,
}: {
  group: ParameterGroup;
  yours: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const verified = group.verified_by_dept !== null;
  // Three states, and the one that matters is the third: owned by the desk
  // you are reading as, and not yet cleared by anyone.
  const tone = verified
    ? "border-state-done/45 bg-state-done/[0.05]"
    : yours
      ? "border-state-active/50 bg-state-active/[0.05]"
      : "border-line bg-bg";

  return (
    <div className={cn("rounded border", tone)}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
      >
        {verified ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none text-state-done-ink" strokeWidth={1.7} />
        ) : (
          <ShieldQuestion
            className={cn(
              "mt-0.5 h-3.5 w-3.5 flex-none",
              yours ? "text-state-active" : "text-faint",
            )}
            strokeWidth={1.7}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium text-ink">{group.label}</span>
          <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">
            {verified ? (
              <>
                Verified by {group.owner_short}, day {group.verified_on_day} · signed
              </>
            ) : yours ? (
              <span className="font-medium text-state-active">Unverified — your review</span>
            ) : (
              <>Owned by {group.owner_short} · not yet verified</>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-3.5 w-3.5 flex-none text-faint transition-transform",
            expanded && "rotate-180",
          )}
          strokeWidth={1.6}
        />
      </button>

      {expanded ? (
        <dl className="border-t border-line/70 px-3 py-2">
          {group.fields.map((f) => (
            <div key={f.name} className="flex items-baseline justify-between gap-3 py-[3px]">
              <dt className="text-[11.5px] text-muted">{f.name}</dt>
              <dd className="font-num text-right font-mono text-[11px] text-ink">{f.value}</dd>
            </div>
          ))}
          {group.signature_ref ? (
            <div className="mt-1.5 border-t border-line/70 pt-1.5">
              <span className="font-mono text-[10px] text-faint">{group.signature_ref}</span>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

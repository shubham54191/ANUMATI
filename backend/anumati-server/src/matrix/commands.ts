import { z } from "zod";
import {
  advanceDay,
  answerQuery,
  committeeDecide,
  decide,
  derive,
  dispatch,
  escalateToTieBreaker,
  failOnScore,
  finalise,
  isOpen,
  postMessage,
  raiseQuery,
  reEvaluate,
  resubmit,
  sendForRevision,
  setRecordState,
  tieBreakerDecision,
  verifyParameters,
} from "@/lib/matrix/engine";
import type { ApplicationFile, DataRecordState } from "@/types/matrix";
import type { Principal } from "../auth/tokens";
import { departmentOf } from "../auth/guard";
import { forbidden, unprocessable } from "../errors";

const note = z.string().trim().min(3).max(2000);

/**
 * Every change to a file is one of these. The union is the whole write
 * surface of the officer console — there is no other way to move a desk.
 */
export const Command = z.discriminatedUnion("type", [
  z.object({ type: z.literal("dispatch") }),
  z.object({
    type: z.literal("decide"),
    dept_id: z.string(),
    state: z.enum(["approved", "rejected"]),
    remarks: z.string().trim().max(2000).optional(),
    score: z.number().int().min(0).max(100).optional(),
  }),
  z.object({ type: z.literal("demo_clash") }),
  z.object({ type: z.literal("re_evaluate"), dept_id: z.string(), note }),
  z.object({ type: z.literal("verify_parameters"), dept_id: z.string() }),
  z.object({ type: z.literal("post_message"), body: note, dept_id: z.string().nullable().optional() }),
  z.object({ type: z.literal("raise_query"), dept_id: z.string(), body: note }),
  z.object({ type: z.literal("answer_query"), dept_id: z.string(), body: note }),
  z.object({ type: z.literal("send_for_revision"), reply_days: z.number().int().min(1).max(90).optional() }),
  z.object({ type: z.literal("resubmit"), note }),
  z.object({ type: z.literal("escalate") }),
  z.object({ type: z.literal("tie_break"), outcome: z.enum(["overrule", "sustain"]), note }),
  z.object({
    type: z.literal("committee_decide"),
    dept_id: z.string(),
    outcome: z.enum(["approved", "rejected"]),
    note,
  }),
  z.object({ type: z.literal("fail_score") }),
  z.object({ type: z.literal("finalise") }),
  z.object({ type: z.literal("fetch_records") }),
  z.object({
    type: z.literal("set_record"),
    record_id: z.string(),
    state: z.enum(["fetching", "verified", "mismatch", "unavailable"]),
    value: z.string().nullable(),
  }),
  z.object({ type: z.literal("advance_days"), days: z.number().int().min(1).max(400) }),
]);
export type Command = z.infer<typeof Command>;

export interface CommandContext {
  principal: Principal;
  /** The file's owner (the applicant account), if any. */
  ownerId: string | null;
  demoMode: boolean;
}

const isFacilitation = (p: Principal) =>
  p.role === "admin" || (p.role === "officer" && p.department_id === "single-window");

/** Whether this principal may see the file at all. */
export function canView(p: Principal, file: ApplicationFile, ownerId: string | null): boolean {
  if (p.role === "admin" || p.role === "committee") return true;
  if (p.role === "applicant") return ownerId === p.id;
  if (p.role === "officer") {
    if (p.department_id === "single-window") return true;
    return file.reviews.some((r) => departmentOf(r.dept_id) === p.department_id);
  }
  return false;
}

function ownDesk(p: Principal, file: ApplicationFile, deptId: string) {
  const desk = file.reviews.find((r) => r.dept_id === deptId);
  if (!desk) throw unprocessable(`There is no desk ${deptId} on ${file.id}.`);
  if (p.role !== "admin" && !(p.role === "officer" && departmentOf(deptId) === p.department_id)) {
    throw forbidden(
      `Only ${desk.dept_short} can act on the ${desk.dept_short} desk. You are signed in for ${p.department_id ?? p.role}.`,
    );
  }
  return desk;
}

/**
 * Check the principal may issue this command on this file, then apply it with
 * the shared engine. Returns the new aggregate; the caller persists it.
 */
export function applyCommand(file: ApplicationFile, cmd: Command, ctx: CommandContext): ApplicationFile {
  const p = ctx.principal;
  if (!canView(p, file, ctx.ownerId)) throw forbidden("This file is not on your desk.");

  switch (cmd.type) {
    case "dispatch":
      if (!isFacilitation(p)) throw forbidden("Only the single-window facilitation desk dispatches a file.");
      if (file.dispatched) throw unprocessable("This file has already been dispatched.");
      return dispatch(file);

    case "decide": {
      const desk = ownDesk(p, file, cmd.dept_id);
      if (!file.dispatched) throw unprocessable("The file has not been dispatched yet.");
      if (desk.state !== "in_review") {
        throw unprocessable(`${desk.dept_short} is not reviewing this file (state: ${desk.state}).`);
      }
      if (cmd.state === "rejected" && (!cmd.remarks || cmd.remarks.length < 10)) {
        throw unprocessable("A rejection must state its reasons (MAITRI Act, 2023 — s. 4(3)).");
      }
      return decide(file, [{ dept_id: cmd.dept_id, state: cmd.state, remarks: cmd.remarks, score: cmd.score }]);
    }

    case "demo_clash": {
      if (!ctx.demoMode || !p.is_demo || !isFacilitation(p)) {
        throw forbidden("The scripted clash is a demo control. It is off outside demo mode.");
      }
      const inputs = [];
      const approver = file.reviews.find((r) => r.dept_id === file.demo.approver_dept);
      const rejecter = file.reviews.find((r) => r.dept_id === file.demo.rejecter_dept);
      if (approver && approver.state === "in_review") {
        inputs.push({ dept_id: approver.dept_id, state: "approved" as const, remarks: file.demo.approver_note, score: file.demo.approver_score });
      }
      if (rejecter && rejecter.state === "in_review") {
        inputs.push({ dept_id: rejecter.dept_id, state: "rejected" as const, remarks: file.demo.rejection_reason, score: file.demo.rejecter_score });
      }
      if (inputs.length === 0) throw unprocessable("Neither scripted desk is open any more.");
      return decide(file, inputs);
    }

    case "re_evaluate":
      ownDesk(p, file, cmd.dept_id);
      return reEvaluate(file, cmd.dept_id, cmd.note);

    case "verify_parameters":
      ownDesk(p, file, cmd.dept_id);
      return verifyParameters(file, cmd.dept_id);

    case "post_message": {
      if (p.role === "applicant") {
        return postMessage(file, { author: p.name, author_short: "APPLICANT", role: "applicant", dept_id: null, body: cmd.body });
      }
      if (p.role === "committee") {
        return postMessage(file, { author: p.name, author_short: "EMPOWERED COMMITTEE", role: "officer", dept_id: null, body: cmd.body });
      }
      if (cmd.dept_id) {
        const desk = ownDesk(p, file, cmd.dept_id);
        return postMessage(file, {
          author: p.name,
          author_short: desk.dept_short,
          role: "department",
          dept_id: desk.dept_id,
          body: cmd.body,
        });
      }
      if (!isFacilitation(p)) throw forbidden("Post as your own department's desk.");
      return postMessage(file, { author: p.name, author_short: "SINGLE WINDOW", role: "officer", dept_id: null, body: cmd.body });
    }

    case "raise_query": {
      const desk = ownDesk(p, file, cmd.dept_id);
      if (desk.state !== "in_review") throw unprocessable(`${desk.dept_short} is not reviewing this file.`);
      if (desk.query_open) throw unprocessable(`${desk.dept_short} already has a query open.`);
      return raiseQuery(file, cmd.dept_id, cmd.body);
    }

    case "answer_query": {
      const own = p.role === "applicant" && ctx.ownerId === p.id;
      if (!own && !isFacilitation(p)) {
        throw forbidden("Only the applicant, or the facilitation desk on their behalf, answers a query.");
      }
      const desk = file.reviews.find((r) => r.dept_id === cmd.dept_id);
      if (!desk?.query_open) throw unprocessable("That desk has no open query.");
      return answerQuery(file, cmd.dept_id, cmd.body, p.role === "applicant" ? p.name : `${p.name} (on the applicant's behalf)`);
    }

    case "send_for_revision":
      if (!isFacilitation(p)) throw forbidden("Only the facilitation desk returns a file to the applicant.");
      if (derive(file).rejected.length === 0) throw unprocessable("Nothing to revise — no desk has rejected.");
      return sendForRevision(file, cmd.reply_days);

    case "resubmit": {
      const own = p.role === "applicant" && ctx.ownerId === p.id;
      if (!own && !isFacilitation(p)) throw forbidden("Only the applicant resubmits their file.");
      if (file.resolution?.kind !== "sent_for_revision") throw unprocessable("The file is not waiting for a revision.");
      return resubmit(file, cmd.note);
    }

    case "escalate":
      if (!isFacilitation(p) && p.role !== "committee") throw forbidden("Only the facilitation desk or the Committee escalates.");
      return escalateToTieBreaker(file);

    case "tie_break":
      if (p.role !== "committee" && p.role !== "admin") throw forbidden("Only the Empowered Committee breaks a tie.");
      if (!file.tie_breaker_open) throw unprocessable("There is no tie-breaker open on this file.");
      return tieBreakerDecision(file, cmd.outcome, p.name, cmd.note);

    case "committee_decide": {
      if (p.role !== "committee" && p.role !== "admin") throw forbidden("Only the Empowered Committee decides a transferred desk.");
      const desk = file.reviews.find((r) => r.dept_id === cmd.dept_id);
      if (desk?.state !== "transferred_to_committee") throw unprocessable("That desk has not been transferred to the Committee.");
      return committeeDecide(file, cmd.dept_id, cmd.outcome, p.name, cmd.note);
    }

    case "fail_score":
      if (!isFacilitation(p)) throw forbidden("Only the facilitation desk records a failed score.");
      return failOnScore(file);

    case "finalise":
      if (!isFacilitation(p)) throw forbidden("Only the facilitation desk finalises a phase.");
      if (!derive(file).canFinalise) throw unprocessable("This phase cannot be finalised yet.", derive(file).verdict);
      return finalise(file);

    case "fetch_records":
      // Handled by the service: it enqueues a job; nothing changes here.
      if (p.role === "applicant") throw forbidden("Registry checks are run by the department side.");
      return file;

    case "set_record":
      if (!p.service) throw forbidden("Registry results are written by the integration worker only.");
      return setRecordState(file, cmd.record_id, {
        state: cmd.state as DataRecordState,
        value: cmd.value,
        fetched_at: cmd.state === "fetching" ? null : new Date().toISOString(),
      });

    case "advance_days": {
      const sentinel = p.service === true;
      const demo = ctx.demoMode && p.is_demo && isFacilitation(p);
      if (!sentinel && !demo) throw forbidden("The clock moves by itself. Advancing it is a demo control.");
      return advanceDay(file, cmd.days);
    }
  }
}

/** Desks still open — used by the committee queue and the sentinel. */
export const openDesks = (file: ApplicationFile) => file.reviews.filter(isOpen);

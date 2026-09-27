import type { PgBoss } from "pg-boss";
import type { Ctx } from "../context";
import { QUEUES, ensureQueues } from "./queues";
import {
  dailyAnchor,
  deadLetter,
  deliverToDepartment,
  fetchRegistryRecords,
  notifyMaitri,
  renewalAlerts,
  slaSentinel,
} from "./handlers";

/** Bind every queue to its handler and put the schedules in place. */
export async function registerWorkers(boss: PgBoss, ctx: Ctx) {
  await ensureQueues(boss);

  await boss.work<{ application_id: string; dept_id: string; department_id: string; approval_id: string; day: number }>(
    QUEUES.deliver,
    async (jobs) => {
      for (const j of jobs) await deliverToDepartment(ctx, j.data);
    },
  );
  await boss.work<{ application_id: string }>(QUEUES.records, async (jobs) => {
    for (const j of jobs) await fetchRegistryRecords(ctx, j.data);
  });
  await boss.work<{ application_id: string; kind: string; body: string }>(QUEUES.notify, async (jobs) => {
    for (const j of jobs) await notifyMaitri(ctx, j.data);
  });
  await boss.work(QUEUES.sla, async () => {
    const moved = await slaSentinel(ctx);
    if (moved.length) ctx.log.info({ moved }, "sla sentinel advanced files");
  });
  await boss.work(QUEUES.renewals, async () => {
    ctx.log.info(await renewalAlerts(ctx), "renewal alerts");
  });
  await boss.work(QUEUES.anchor, async () => {
    ctx.log.info(await dailyAnchor(ctx), "ledger anchored");
  });
  await boss.work<Record<string, unknown>>(QUEUES.dead, async (jobs) => {
    for (const j of jobs) await deadLetter(ctx, { name: j.name, data: j.data });
  });

  // Every minute, the clock. Daily at 06:00 IST, renewals. 23:55 IST, the anchor.
  await boss.schedule(QUEUES.sla, "* * * * *", null, { tz: "Asia/Kolkata" });
  await boss.schedule(QUEUES.renewals, "0 6 * * *", null, { tz: "Asia/Kolkata" });
  await boss.schedule(QUEUES.anchor, "55 23 * * *", null, { tz: "Asia/Kolkata" });
}

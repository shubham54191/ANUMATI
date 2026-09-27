import type { PgBoss, SendOptions } from "pg-boss";
import type { Queryable } from "../db";

/** Every queue the service uses, with its retry policy. */
export const QUEUES = {
  deliver: "deliver-to-department",
  records: "fetch-registry-records",
  sla: "sla-sentinel",
  renewals: "renewal-alerts",
  anchor: "ledger-anchor",
  notify: "maitri-notify",
  dead: "integration-dead-letter",
} as const;

export async function ensureQueues(boss: PgBoss) {
  await boss.createQueue(QUEUES.dead);
  for (const name of [QUEUES.deliver, QUEUES.records, QUEUES.notify]) {
    await boss.createQueue(name, {
      retryLimit: 5,
      retryDelay: 5,
      retryBackoff: true,
      retryDelayMax: 600,
      deadLetter: QUEUES.dead,
    });
  }
  for (const name of [QUEUES.sla, QUEUES.renewals, QUEUES.anchor]) {
    await boss.createQueue(name, { retryLimit: 1 });
  }
}

/**
 * Enqueue inside the caller's transaction. The job row commits with the state
 * change that caused it, so a crash between the two cannot lose a dispatch.
 */
export async function sendInTx(
  boss: PgBoss | null,
  c: Queryable,
  queue: string,
  data: object,
  options: SendOptions = {},
) {
  if (!boss) return null;
  return boss.send(queue, data, {
    ...options,
    db: { executeSql: (text: string, values?: unknown[]) => c.query(text, values as unknown[]) },
  });
}

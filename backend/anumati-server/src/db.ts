import pg from "pg";

const { Pool, types } = pg;

// BIGINT (ledger seq, counts) as a JS number: the values stay far below 2^53.
types.setTypeParser(20, (v) => Number(v));
// NUMERIC (confidence, scores) as a number rather than a string.
types.setTypeParser(1700, (v) => Number(v));

export type Pool = pg.Pool;
export type Client = pg.PoolClient;
export type Queryable = Pick<pg.PoolClient, "query">;

export function createPool(connectionString: string, max = 10): pg.Pool {
  const pool = new Pool({ connectionString, max, application_name: "anumati" });
  pool.on("error", (err) => {
    // An idle client dropped by the server; the pool replaces it.
    console.error("[db] idle client error", err.message);
  });
  return pool;
}

/**
 * Run `fn` inside one transaction. Everything a command does — the state
 * change, its projections, its ledger row and the jobs it enqueues — commits
 * together or not at all.
 */
export async function tx<T>(pool: pg.Pool, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

import type { FastifyBaseLogger } from "fastify";
import type { PgBoss } from "pg-boss";
import type { Config } from "./config";
import type { Pool } from "./db";
import type { Principal } from "./auth/tokens";
import type { Adapters } from "./adapters";

/** Everything a route, a job or a CLI needs, passed explicitly. */
export interface Ctx {
  pool: Pool;
  cfg: Config;
  boss: PgBoss | null;
  adapters: Adapters;
  log: Pick<FastifyBaseLogger, "info" | "warn" | "error" | "debug">;
}

/** The actor for things the system does by itself — the clock, the workers. */
export function systemPrincipal(name: string): Principal {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    username: name,
    role: "admin",
    name,
    designation: "system",
    office: "ANUMATI",
    department_id: null,
    is_demo: false,
    service: true,
  };
}

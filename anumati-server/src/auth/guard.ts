import type { FastifyReply, FastifyRequest } from "fastify";
import { forbidden, unauthorized } from "../errors";
import { readToken, type Principal, type Role } from "./tokens";

declare module "fastify" {
  interface FastifyRequest {
    principal: Principal | null;
  }
}

/**
 * Reads the bearer token if there is one. Routes decide for themselves
 * whether a principal is required; this only establishes who is asking.
 * The event stream cannot send headers from a browser, so it alone may pass
 * the token as a query parameter.
 */
export function authenticate(secret: string, extractionToken?: string) {
  return async (req: FastifyRequest) => {
    req.principal = null;
    const header = req.headers.authorization;
    let token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token && req.url.startsWith("/v1/events")) {
      token = (req.query as Record<string, string | undefined>)?.token ?? null;
    }
    if (!token) return;
    if (extractionToken && token === extractionToken) {
      req.principal = {
        id: "00000000-0000-0000-0000-000000000000",
        username: "extraction-pipeline",
        role: "reviewer",
        name: "Rule extraction pipeline",
        designation: "service",
        office: "offline",
        department_id: null,
        is_demo: false,
        service: true,
      };
      return;
    }
    try {
      req.principal = await readToken(token, secret);
    } catch {
      throw unauthorized("Your session has expired or the token is not valid. Sign in again.");
    }
  };
}

export function need(req: FastifyRequest): Principal {
  if (!req.principal) throw unauthorized();
  return req.principal;
}

export function needRole(req: FastifyRequest, ...roles: Role[]): Principal {
  const p = need(req);
  if (p.role === "admin" || roles.includes(p.role)) return p;
  throw forbidden(`This needs the ${roles.join(" or ")} role; you are signed in as ${p.role}.`);
}

/** Department-scoped officer id: 'mpcb' from 'mpcb' or 'mpcb:A15'. */
export const departmentOf = (deptId: string) => deptId.split(":")[0];

export type { FastifyReply };

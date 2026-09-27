import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTVerifyGetKey } from "jose";

export type Role = "applicant" | "officer" | "committee" | "reviewer" | "admin";

/** What every authenticated request carries. */
export interface Principal {
  id: string;
  username: string;
  role: Role;
  name: string;
  designation: string;
  office: string;
  /** For officers: the department whose desks they may act on. */
  department_id: string | null;
  /** Demo accounts may use the demo-only controls when DEMO_MODE is on. */
  is_demo: boolean;
  /** A machine caller (the extraction pipeline), not a person. */
  service?: boolean;
}

const ISSUER = "anumati";
const AUDIENCE = "anumati-api";

export async function issueToken(p: Principal, secret: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({
    username: p.username,
    role: p.role,
    name: p.name,
    designation: p.designation,
    office: p.office,
    department_id: p.department_id,
    is_demo: p.is_demo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(new TextEncoder().encode(secret));
}

export async function readToken(token: string, secret: string): Promise<Principal> {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ["HS256"],
  });
  return {
    id: String(payload.sub),
    username: String(payload.username),
    role: payload.role as Role,
    name: String(payload.name ?? ""),
    designation: String(payload.designation ?? ""),
    office: String(payload.office ?? ""),
    department_id: (payload.department_id as string | null) ?? null,
    is_demo: Boolean(payload.is_demo),
  };
}

/**
 * A MAITRI 2.0 identity token, verified against MAITRI's published key set.
 * ANUMATI never sees the password; it trusts MAITRI's signature, maps the
 * claims onto a local account, and issues its own short-lived token.
 */
export interface MaitriClaims {
  sub: string;
  name: string;
  role: Role;
  department_id: string | null;
  designation: string;
  office: string;
}

export function maitriVerifier(opts: {
  jwks?: JWTVerifyGetKey;
  jwksUrl?: string;
  issuer?: string;
  audience?: string;
}) {
  const keys = opts.jwks ?? (opts.jwksUrl ? createRemoteJWKSet(new URL(opts.jwksUrl)) : null);
  return async (token: string): Promise<MaitriClaims> => {
    if (!keys) throw new Error("MAITRI identity is not configured on this server.");
    const { payload } = await jwtVerify(token, keys, {
      issuer: opts.issuer,
      audience: opts.audience,
    });
    const role = String(payload.role ?? "applicant");
    if (!["applicant", "officer", "committee", "reviewer"].includes(role)) {
      throw new Error(`MAITRI role "${role}" has no ANUMATI equivalent.`);
    }
    return {
      sub: String(payload.sub),
      name: String(payload.name ?? payload.sub),
      role: role as Role,
      department_id: (payload.department_id as string | undefined) ?? null,
      designation: String(payload.designation ?? ""),
      office: String(payload.office ?? ""),
    };
  };
}

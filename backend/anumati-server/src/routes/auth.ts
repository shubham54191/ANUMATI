import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Ctx } from "../context";
import { verifyPassword } from "../auth/passwords";
import { issueToken, maitriVerifier, type Principal } from "../auth/tokens";
import { need } from "../auth/guard";
import { unauthorized } from "../errors";

const Login = z.object({
  username: z.string().trim().toLowerCase().min(1).max(64),
  password: z.string().min(1).max(256),
});

function principalOf(row: Record<string, unknown>): Principal {
  return {
    id: row.id as string,
    username: row.username as string,
    role: row.role as Principal["role"],
    name: row.name as string,
    designation: row.designation as string,
    office: row.office as string,
    department_id: (row.department_id as string | null) ?? null,
    is_demo: Boolean(row.is_demo),
  };
}

export async function authRoutes(app: FastifyInstance, ctx: Ctx) {
  const verifyMaitri = maitriVerifier({
    jwksUrl: ctx.cfg.MAITRI_JWKS_URL,
    issuer: ctx.cfg.MAITRI_ISSUER,
    audience: ctx.cfg.MAITRI_AUDIENCE,
  });

  app.post(
    "/v1/auth/login",
    { config: { rateLimit: { max: ctx.cfg.LOGIN_RATE_LIMIT, timeWindow: "1 minute" } } },
    async (req) => {
      const body = Login.parse(req.body);
      const { rows } = await ctx.pool.query("SELECT * FROM app_user WHERE username = $1", [body.username]);
      const user = rows[0];
      // Same answer and similar time whether the user exists or not.
      const ok = await verifyPassword(body.password, user?.password_hash ?? "scrypt$32768$8$1$AAAA$AAAA");
      if (!user || !ok) throw unauthorized("That user id and password do not match an account.");
      if (user.is_demo && !ctx.cfg.DEMO_MODE) throw unauthorized("Demo accounts are switched off on this server.");
      const principal = principalOf(user);
      const token = await issueToken(principal, ctx.cfg.JWT_SECRET, ctx.cfg.JWT_TTL_SECONDS);
      return { token, expires_in: ctx.cfg.JWT_TTL_SECONDS, principal };
    },
  );

  /**
   * Sign-in through MAITRI 2.0. The token is MAITRI's; ANUMATI verifies its
   * signature against MAITRI's published keys, maps the claims onto a local
   * account (created on first sight), and issues its own session.
   */
  app.post("/v1/auth/maitri", async (req) => {
    const { token } = z.object({ token: z.string().min(20) }).parse(req.body);
    let claims;
    try {
      claims = await verifyMaitri(token);
    } catch (e) {
      throw unauthorized(`MAITRI token refused: ${(e as Error).message}`);
    }
    const { rows } = await ctx.pool.query(
      `INSERT INTO app_user (username, role, name, designation, office, department_id, maitri_subject)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (maitri_subject) DO UPDATE SET name = EXCLUDED.name, designation = EXCLUDED.designation,
         office = EXCLUDED.office, department_id = EXCLUDED.department_id, role = EXCLUDED.role
       RETURNING *`,
      [`maitri:${claims.sub}`, claims.role, claims.name, claims.designation, claims.office, claims.department_id, claims.sub],
    );
    const principal = principalOf(rows[0]);
    return {
      token: await issueToken(principal, ctx.cfg.JWT_SECRET, ctx.cfg.JWT_TTL_SECONDS),
      expires_in: ctx.cfg.JWT_TTL_SECONDS,
      principal,
    };
  });

  app.get("/v1/auth/me", async (req) => ({ principal: need(req) }));
}

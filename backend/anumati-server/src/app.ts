import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import type { Ctx } from "./context";
import { authenticate } from "./auth/guard";
import { installErrorHandler } from "./errors";
import { authRoutes } from "./routes/auth";
import { roadmapRoutes } from "./routes/roadmaps";
import { applicationRoutes } from "./routes/applications";
import { matrixRoutes } from "./routes/matrix";
import { committeeRoutes } from "./routes/committee";
import { ruleRoutes } from "./routes/rules";
import { ledgerRoutes } from "./routes/ledger";
import { signRoutes } from "./routes/sign";
import { systemRoutes } from "./routes/system";

export async function buildApp(ctx: Ctx, opts: { logger?: boolean | object } = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: opts.logger ?? { level: ctx.cfg.LOG_LEVEL },
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
    genReqId: () => `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  });

  installErrorHandler(app);
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: ctx.cfg.CORS_ORIGINS.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization"],
    exposedHeaders: ["x-anumati-stored", "x-content-sha256"],
  });
  await app.register(rateLimit, { global: false });
  await app.register(multipart);

  app.decorateRequest("principal", null);
  app.addHook("onRequest", authenticate(ctx.cfg.JWT_SECRET, ctx.cfg.EXTRACTION_TOKEN));

  await systemRoutes(app, ctx);
  await authRoutes(app, ctx);
  await roadmapRoutes(app, ctx);
  await applicationRoutes(app, ctx);
  await matrixRoutes(app, ctx);
  await committeeRoutes(app, ctx);
  await ruleRoutes(app, ctx);
  await ledgerRoutes(app, ctx);
  await signRoutes(app, ctx);
  return app;
}

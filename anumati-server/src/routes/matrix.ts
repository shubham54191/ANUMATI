import type { FastifyInstance } from "fastify";
import type { Ctx } from "../context";
import { need } from "../auth/guard";
import { Command } from "../matrix/commands";
import { listFiles, readFileFor, runCommand } from "../matrix/service";

export async function matrixRoutes(app: FastifyInstance, ctx: Ctx) {
  app.get("/v1/matrix/files", async (req) => ({ data: await listFiles(ctx, need(req)) }));

  app.get("/v1/matrix/files/:id", async (req) => {
    const p = need(req);
    return readFileFor(ctx, (req.params as { id: string }).id, p);
  });

  /**
   * The console's whole write surface. The body is one Command; the response
   * is the file as it now stands, with its derived verdict and every clock.
   */
  app.post("/v1/matrix/files/:id/commands", async (req) => {
    const p = need(req);
    const cmd = Command.parse(req.body);
    if (cmd.type === "set_record") {
      // Only the integration worker writes registry answers.
      return runCommand(ctx, (req.params as { id: string }).id, { ...cmd, type: "fetch_records" }, p);
    }
    return runCommand(ctx, (req.params as { id: string }).id, cmd, p);
  });
}

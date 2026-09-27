import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";

/** An error the client can act on: a status, a stable code, and a sentence. */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, detail?: unknown) => new AppError(400, "bad_request", message, detail);
export const unauthorized = (message = "Sign in first.") => new AppError(401, "unauthorized", message);
export const forbidden = (message: string) => new AppError(403, "forbidden", message);
export const notFound = (what: string) => new AppError(404, "not_found", `${what} not found.`);
export const conflict = (message: string, detail?: unknown) => new AppError(409, "conflict", message, detail);
export const unprocessable = (message: string, detail?: unknown) =>
  new AppError(422, "unprocessable", message, detail);

/**
 * One error shape for every failure, and nothing internal leaks: an
 * unexpected error is logged with the request id and answered as a plain 500.
 */
export function installErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((err: FastifyError | AppError | ZodError, req, reply) => {
    const request_id = req.id;
    if (err instanceof AppError) {
      return reply.status(err.status).send({
        error: { code: err.code, message: err.message, ...(err.detail === undefined ? {} : { detail: err.detail }), request_id },
      });
    }
    if (err instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "invalid_input",
          message: "The request did not match the expected shape.",
          detail: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
          request_id,
        },
      });
    }
    const fe = err as FastifyError;
    if (fe.statusCode && fe.statusCode < 500) {
      return reply.status(fe.statusCode).send({
        error: { code: fe.code ?? "bad_request", message: fe.message, request_id },
      });
    }
    req.log.error({ err }, "unhandled error");
    return reply.status(500).send({
      error: { code: "internal", message: "Something went wrong on our side. It has been logged.", request_id },
    });
  });
  app.setNotFoundHandler((req, reply) =>
    reply.status(404).send({ error: { code: "not_found", message: `No route ${req.method} ${req.url}.`, request_id: req.id } }),
  );
}

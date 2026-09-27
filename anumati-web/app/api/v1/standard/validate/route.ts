import { validateOags } from "@/lib/oags/validate";
import { guard, ok, preflight, readJson } from "@/lib/api/http";

export const dynamic = "force-dynamic";

/**
 * Check somebody else's file.
 *
 * Nothing is stored and nothing is logged — a state trying the validator on a
 * draft rule base should not have to wonder where that draft went. An invalid
 * document is still a 200: the caller asked whether it validates, and the
 * answer "no, here is why" is a successful answer to that question.
 */
export async function POST(req: Request) {
  // Tightest of the five: this one parses a body up to 4 MB and walks a graph.
  const limited = guard(req, 20);
  if ("response" in limited) return limited.response;

  const body = await readJson(req);
  if ("response" in body) return body.response;
  return ok(validateOags(body.value), { headers: limited.headers });
}

export function OPTIONS() {
  return preflight();
}

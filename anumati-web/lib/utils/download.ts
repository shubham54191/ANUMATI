/**
 * Client-side file download.
 *
 * Everything this product can export is already computed in the browser — the
 * rule base, the OAGS document, a reform brief — so there is nothing to ask a
 * server for. The object URL is revoked on the next tick; leaving it alive
 * pins the whole blob in memory for the life of the tab.
 */
export function downloadText(filename: string, text: string, mime = "text/plain") {
  if (typeof window === "undefined") return;
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadJson(filename: string, value: unknown) {
  downloadText(filename, JSON.stringify(value, null, 2), "application/json");
}

/** ISO date, for stamping an export with the day it was taken. */
export const today = () => new Date().toISOString().slice(0, 10);

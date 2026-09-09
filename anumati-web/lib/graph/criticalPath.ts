export function isOnPath(path: string[], approvalId: string): boolean {
  return path.includes(approvalId);
}

export function pathPosition(path: string[], approvalId: string): number | null {
  const i = path.indexOf(approvalId);
  return i === -1 ? null : i;
}

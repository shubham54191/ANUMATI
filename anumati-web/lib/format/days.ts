export function days(n: number): string {
  return `${n} d`;
}

export function daysLong(n: number): string {
  if (n < 30) return `${n} day${n === 1 ? "" : "s"}`;
  const months = Math.floor(n / 30);
  const rest = n % 30;
  if (rest === 0) return `${months} mo`;
  return `${months} mo ${rest} d`;
}

export function pct(part: number, whole: number): string {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 1000) / 10}%`;
}

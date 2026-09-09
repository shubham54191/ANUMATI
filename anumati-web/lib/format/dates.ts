import dayjs from "dayjs";

export function isoDate(d: string | Date): string {
  return dayjs(d).format("YYYY-MM-DD");
}

export function readableDate(d: string | Date): string {
  return dayjs(d).format("DD MMM YYYY");
}

export function addDays(d: string | Date, n: number): string {
  return dayjs(d).add(n, "day").format("YYYY-MM-DD");
}

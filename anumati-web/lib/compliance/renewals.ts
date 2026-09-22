import type { Renewal, RenewalAlert, RenewalStatus } from "@/types/compliance";

/**
 * A clearance is not a finish line.
 *
 * Most of the licences on the roadmap expire, and the day they expire the unit
 * is operating unlawfully with nobody having done anything wrong. The renewal
 * window is a published fact for each one, so a calendar is not a feature
 * request — it is the second half of the same rule base.
 */

export function renewalStatus(renewal: Renewal, today: Date): RenewalStatus {
  const expiry = new Date(`${renewal.valid_until}T00:00:00Z`);
  const midnight = new Date(`${today.toISOString().slice(0, 10)}T00:00:00Z`);
  const daysLeft = Math.round((expiry.getTime() - midnight.getTime()) / 86_400_000);

  const alert: RenewalAlert =
    daysLeft < 0 ? "expired" : daysLeft <= 7 ? "7" : daysLeft <= 30 ? "30" : daysLeft <= 60 ? "60" : "none";

  return {
    renewal,
    days_left: daysLeft,
    window_open: daysLeft >= 0 && daysLeft <= renewal.window_days,
    alert,
  };
}

export function renewalBoard(renewals: Renewal[], today: Date): RenewalStatus[] {
  return renewals
    .map((r) => renewalStatus(r, today))
    .sort((a, b) => a.days_left - b.days_left);
}

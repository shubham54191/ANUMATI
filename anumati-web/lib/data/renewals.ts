import type { Renewal } from "@/types/compliance";

/**
 * The licences that expire, and the windows in which they may be renewed.
 *
 * Validity periods are the ones the parent rules set. Dates are the pilot
 * unit's, so this board moves with the calendar rather than sitting still.
 */
export const SEED_RENEWALS: Renewal[] = [
  {
    approval_id: "A14",
    name: "Trade licence",
    department_short: "PMC",
    issued_on: "2025-09-19",
    valid_until: "2026-09-18",
    window_days: 60,
    source: "Maharashtra Municipal Corporations Act, 1949 — s. 376",
  },
  {
    approval_id: "A23",
    name: "Fire NOC — final",
    department_short: "MFS",
    issued_on: "2025-09-28",
    valid_until: "2026-09-27",
    window_days: 30,
    source: "Maharashtra Fire Prevention and Life Safety Measures Act, 2006",
  },
  {
    approval_id: "A24",
    name: "FSSAI Central Licence",
    department_short: "FSSAI",
    issued_on: "2025-10-13",
    valid_until: "2026-10-12",
    window_days: 30,
    source: "FSS (Licensing and Registration of Food Businesses) Regulations, 2011",
  },
  {
    approval_id: "A18",
    name: "Boiler registration",
    department_short: "BOILERS DIR.",
    issued_on: "2025-11-16",
    valid_until: "2026-11-15",
    window_days: 60,
    source: "Boilers Act, 1923 — s. 8",
  },
  {
    approval_id: "A21",
    name: "Factory licence",
    department_short: "DISH",
    issued_on: "2026-01-01",
    valid_until: "2026-12-31",
    window_days: 60,
    source: "Factories Act, 1948 — s. 6, with the Maharashtra Factories Rules",
  },
  {
    approval_id: "A30",
    name: "Weights & measures verification",
    department_short: "LEGAL METROLOGY",
    issued_on: "2026-02-11",
    valid_until: "2027-02-10",
    window_days: 30,
    source: "Legal Metrology Act, 2009 — s. 24",
  },
  {
    approval_id: "A20",
    name: "MPCB Consent to Operate",
    department_short: "MPCB",
    issued_on: "2026-03-02",
    valid_until: "2031-03-01",
    window_days: 120,
    source: "Water Act, 1974 — s. 25; Air Act, 1981 — s. 21",
  },
];

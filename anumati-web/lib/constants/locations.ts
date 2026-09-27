/**
 * The rule base names Pune district authorities (Collector Pune, PMRDA, PMC),
 * so only Pune sites are covered. Other districts are listed, not selectable.
 */
export const LOCATIONS = [
  { id: "pune_chakan", label: "Pune, Maharashtra — MIDC Chakan", covered: true },
  { id: "pune_talegaon", label: "Pune, Maharashtra — Talegaon MIDC", covered: true },
  { id: "nashik", label: "Nashik, Maharashtra", covered: false },
  { id: "solapur", label: "Solapur, Maharashtra", covered: false },
] as const;

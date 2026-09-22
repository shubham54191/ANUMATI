export const SECTORS = [
  { id: "food", label: "Food processing & packaging" },
  { id: "textile", label: "Textile & apparel" },
  { id: "cold_chain", label: "Cold storage & cold chain" },
  { id: "auto", label: "Auto components" },
  { id: "warehousing", label: "Warehousing & logistics" },
] as const;

export const SIZE_BANDS = [
  { id: "micro", label: "Under 10 employees" },
  { id: "small", label: "10–50 employees" },
  { id: "medium", label: "50–100 employees" },
  { id: "large", label: "Over 100 employees" },
] as const;

export const STAGES = [
  { id: "new", label: "New setup — greenfield" },
  { id: "expansion", label: "Expansion of an existing unit" },
  { id: "renewal", label: "Renewal of existing licences" },
] as const;

/**
 * Where the land sits decides two things at once: whether a land-use
 * conversion order is needed at all, and which authority sanctions the
 * building plan. Inside a notified MIDC area the land is already industrial
 * and MIDC is the Special Planning Authority.
 */
export const LAND_REGIMES = [
  { id: "midc", label: "MIDC plot — notified industrial area" },
  { id: "private", label: "Private land — outside MIDC" },
] as const;

export const CONDITIONS = [
  { id: "boiler", label: "Steam boiler on site", adds: 1 },
  { id: "height", label: "Built height over 15 m", adds: 2 },
  { id: "hazardous", label: "Hazardous materials", adds: 3 },
  { id: "export", label: "Exports produce", adds: 1 },
  { id: "contract_labour", label: "Contract labour over 20", adds: 1 },
] as const;

import { create } from "zustand";

export type ViewMode = "applicant" | "department";

export type Pane = "graph" | "register" | "documents";

interface RoadmapState {
  selectedApprovalId: string | null;
  hoveredApprovalId: string | null;
  viewMode: ViewMode;
  pane: Pane;
  conditions: Record<string, boolean>;
  employees: number;
  heightM: number;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setViewMode: (m: ViewMode) => void;
  setPane: (p: Pane) => void;
  toggleCondition: (key: string) => void;
  setEmployees: (n: number) => void;
  setHeight: (n: number) => void;
  hydrateFromSetup: (patch: { employees?: number; heightM?: number; on?: Record<string, boolean> }) => void;
}

const LANDING_PANE: Record<ViewMode, Pane> = {
  applicant: "graph",
  department: "register",
};

export const useRoadmapStore = create<RoadmapState>((set) => ({
  selectedApprovalId: null,
  hoveredApprovalId: null,
  viewMode: "applicant",
  pane: "graph",
  conditions: {
    boiler: true,
    height: false,
    hazardous: true,
    export: true,
    contract_labour: true,
    factory: true,
    epf_esic: true,
  },
  employees: 72,
  heightM: 11,
  select: (id) => set({ selectedApprovalId: id }),
  hover: (id) => set({ hoveredApprovalId: id }),
  setViewMode: (viewMode) => set({ viewMode, pane: LANDING_PANE[viewMode] }),
  setPane: (pane) => set({ pane }),
  toggleCondition: (key) =>
    set((s) => ({ conditions: { ...s.conditions, [key]: !s.conditions[key] } })),
  setEmployees: (employees) =>
    set((s) => ({
      employees,
      conditions: {
        ...s.conditions,

        factory: employees >= 10,
        epf_esic: employees >= 10,
      },
    })),
  setHeight: (heightM) =>
    set((s) => ({ heightM, conditions: { ...s.conditions, height: heightM > 15 } })),

  hydrateFromSetup: ({ employees, heightM, on }) =>
    set((s) => {
      const next = { ...s };
      if (typeof employees === "number") {
        next.employees = employees;
        next.conditions = { ...s.conditions, factory: employees >= 10, epf_esic: employees >= 10 };
      }
      if (typeof heightM === "number") {
        next.heightM = heightM;
        next.conditions = { ...(next.conditions ?? s.conditions), height: heightM > 15 };
      }
      if (on) {
        next.conditions = { ...(next.conditions ?? s.conditions), ...on };
      }
      return next;
    }),
}));

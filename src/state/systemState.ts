import { create } from "zustand";

interface SystemState {
  cpu: number;
  gpu: number;
  latency: number;
  uptime: number;

  setMetrics: (cpu: number, gpu: number, latency: number) => void;
  tickUptime: () => void;
}

export const useSystemState = create<SystemState>((set) => ({
  cpu: 0,
  gpu: 0,
  latency: 0,
  uptime: 0,

  setMetrics: (cpu, gpu, latency) => set({ cpu, gpu, latency }),

  tickUptime: () =>
    set((state) => ({ uptime: state.uptime + 1 })),
}));

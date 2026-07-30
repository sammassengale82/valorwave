import { useEffect } from "react";
import { fetchMetrics } from "../utils/systemClient";
import { useSystemState } from "../state/systemState";

export function useSystemMetrics() {
  const setMetrics = useSystemState((s) => s.setMetrics);
  const tickUptime = useSystemState((s) => s.tickUptime);

  useEffect(() => {
    const interval = setInterval(async () => {
      const m = await fetchMetrics();
      setMetrics(m.cpu, m.gpu, m.latency);
      tickUptime();
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}

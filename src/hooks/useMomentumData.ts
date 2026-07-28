"use client";

import { useMemo } from "react";
import { parsePlacementDate } from "@/lib/dates";

interface MomentumPoint {
  label: string;
  cumulative: number;
}

export function useMomentumData(placements: any[]) {
  const uniqueBatches = useMemo(
    () =>
      Array.from(new Set((placements || []).map((p) => p.batchYear).filter(Boolean))).sort(
        (a, b) => Number(b) - Number(a),
      ),
    [placements],
  );

  const uniqueBranches = useMemo(
    () => Array.from(new Set((placements || []).map((p) => p.branch).filter(Boolean))),
    [placements],
  );

  const momentumData = useMemo<MomentumPoint[]>(() => {
    const sorted = [...(placements || [])]
      .filter((p) => p.date && parsePlacementDate(p.date))
      .sort(
        (a, b) =>
          (parsePlacementDate(a.date)?.getTime() || 0) -
          (parsePlacementDate(b.date)?.getTime() || 0),
      );

    const grouped: Record<string, number> = {};
    for (const p of sorted) {
      const d = parsePlacementDate(p.date);
      if (!d) continue;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + 1;
    }

    let cumulative = 0;
    return Object.keys(grouped)
      .sort()
      .map((key) => {
        cumulative += grouped[key];
        const [year, month] = key.split("-").map(Number);
        return {
          label: new Date(year, month - 1, 1).toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          cumulative,
        };
      });
  }, [placements]);

  return { momentumData, uniqueBatches, uniqueBranches };
}

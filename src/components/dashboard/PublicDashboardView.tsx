"use client";
import { useState, useMemo } from "react";
import {
  Activity,
  Award,
  BarChart2,
  Briefcase,
  TrendingUp,
  Users,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import StatCard from "./StatCard";
import PlacementTable from "./PlacementTable";

export default function PublicDashboardAnalytics({
  placements,
}: {
  placements: any[];
}) {
  const [activeBranch, setActiveBranch] = useState<string | null>(null);

  // 1. Calculate unique batches and sort descending
  const uniqueBatches = useMemo(
    () =>
      Array.from(
        new Set(placements.map((p) => p.batchYear).filter(Boolean)),
      ).sort((a, b) => b - a),
    [placements],
  );

  // 2. Default to the latest batch
  const [activeBatch, setActiveBatch] = useState<string | null>(
    uniqueBatches[0]?.toString() || null,
  );

  const uniqueBranches = useMemo(
    () => Array.from(new Set(placements.map((p) => p.branch).filter(Boolean))),
    [placements],
  );

  // 3. Filtered Data
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchBranch = !activeBranch || p.branch === activeBranch;
      const matchBatch =
        !activeBatch || p.batchYear?.toString() === activeBatch;
      return matchBranch && matchBatch;
    });
  }, [placements, activeBranch, activeBatch]);

  // 4. Momentum Chart Logic — updated to use string labels
  const momentumData = useMemo(() => {
    const parseDate = (val: string | number) => {
      if (!val) return null;
      const str = String(val).trim();

      // Excel serial (5 digits)
      if (/^\d{5}$/.test(str))
        return new Date((parseInt(str) - 25569) * 86400 * 1000);

      // ISO format: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      }

      // Indian format: DD-MM-YYYY
      if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
        const [day, month, year] = str.split("-");
        const d = new Date(`${year}-${month}-${day}`);
        return isNaN(d.getTime()) ? null : d;
      }

      // Fallback
      const d = new Date(str.replace(/-/g, "/"));
      return isNaN(d.getTime()) ? null : d;
    };

    const sorted = [...filteredPlacements]
      .filter((p) => p.date && parseDate(p.date))
      .sort(
        (a, b) =>
          (parseDate(a.date)?.getTime() || 0) -
          (parseDate(b.date)?.getTime() || 0),
      );

    const grouped: Record<string, number> = {};
    sorted.forEach((p) => {
      const d = parseDate(p.date);
      if (!d) return;
      // Use a sortable string key: "YYYY-MM"
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });

    let cumulative = 0;
    return Object.keys(grouped)
      .sort()
      .map((key) => {
        cumulative += grouped[key];
        const [year, month] = key.split("-");
        const label = new Date(
          Number(year),
          Number(month) - 1,
          1,
        ).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        return { label, cumulative };
      });
  }, [filteredPlacements]);

  console.log(momentumData);
  console.log(placements.slice(0, 5).map((p) => p.date));

  return (
    <div className="w-full space-y-8">
      {/* FILTER SECTION */}
      <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <Filter className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Filters
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="text-[10px] font-black uppercase text-slate-400 self-center mr-2">
            Batch:
          </span>
          {uniqueBatches.map((batch) => (
            <button
              key={batch}
              onClick={() => setActiveBatch(batch.toString())}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activeBatch === batch.toString() ? "bg-emerald-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 text-slate-500"}`}
            >
              {batch}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-200 dark:border-white/5 pt-4">
          <span className="text-[10px] font-black uppercase text-slate-400 self-center mr-2">
            Branch:
          </span>
          <button
            onClick={() => setActiveBranch(null)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${!activeBranch ? "bg-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 text-slate-500"}`}
          >
            Global
          </button>
          {uniqueBranches.map((branch) => (
            <button
              key={branch}
              onClick={() => setActiveBranch(branch)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activeBranch === branch ? "bg-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 text-slate-500"}`}
            >
              {branch}
            </button>
          ))}
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900/50 border rounded-3xl h-80 shadow-sm">
          <h4 className="font-black text-xs uppercase tracking-widest mb-6 text-slate-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Placement Momentum
          </h4>
          <ResponsiveContainer width="100%" height="70%">
            <AreaChart data={momentumData} margin={{ left: -20, right: 20 }}>
              <XAxis
                dataKey="label" // ← string label, not timestamp
                fontSize={10}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
                interval={0}
                // No type/scale/domain/tickFormatter needed — recharts handles strings natively
              />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(label) => label} // Already formatted
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderRadius: "12px",
                  border: "none",
                }}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#10b981"
                strokeWidth={3}
                fill="#10b981"
                fillOpacity={0.1}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/50 border rounded-3xl h-80 shadow-sm">
          <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-500">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Branch Wise Count
          </h4>
          <ResponsiveContainer width="100%" height="75%">
            <BarChart
              data={uniqueBranches.map((b) => ({
                name: b,
                count: filteredPlacements.filter((p) => p.branch === b).length,
              }))}
            >
              <XAxis
                dataKey="name"
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <Bar
                dataKey="count"
                className="fill-indigo-500"
                radius={[4, 4, 0, 0]}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                itemStyle={{ color: "#6366f1" }} // Indigo-500
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Offers Secured"
          value={filteredPlacements.length}
          icon={Users}
          color="text-emerald-500"
        />
        <StatCard
          title="Avg CTC"
          value={(
            filteredPlacements.reduce((acc, curr) => acc + (curr.ctc || 0), 0) /
            (filteredPlacements.length || 1)
          ).toFixed(1)}
          suffix="LPA"
          icon={TrendingUp}
          color="text-indigo-500"
        />
        <StatCard
          title="Peak CTC"
          value={
            filteredPlacements.length > 0
              ? Math.max(...filteredPlacements.map((d) => d.ctc || 0))
              : 0
          }
          suffix="LPA"
          icon={Award}
          color="text-amber-500"
        />
        <StatCard
          title="Recruiters"
          value={new Set(filteredPlacements.map((d) => d.company)).size}
          icon={Briefcase}
          color="text-pink-500"
        />
      </div>

      <PlacementTable data={filteredPlacements} />
    </div>
  );
}

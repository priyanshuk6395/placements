"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import AnimatedNumber from "./AnimatedNumber";
import { useMomentumData } from "@/hooks/useMomentumData";

export default function PublicDashboardAnalytics({
  placements,
}: {
  placements: any[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { uniqueBatches, uniqueBranches } = useMomentumData(placements);
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [activeBatch, setActiveBatch] = useState<string | null>(null);

  useEffect(() => {
    const batchParam = searchParams.get("batch");
    const branchParam = searchParams.get("branch");

    const batchFromUrl =
      batchParam && uniqueBatches.some((b) => b.toString() === batchParam)
        ? batchParam
        : null;
    const branchFromUrl =
      branchParam && uniqueBranches.includes(branchParam) ? branchParam : null;

    setActiveBatch(batchFromUrl || uniqueBatches[0]?.toString() || null);
    setActiveBranch(branchFromUrl);
  }, [searchParams, uniqueBatches, uniqueBranches]);

  const syncParams = (nextBatch: string | null, nextBranch: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextBatch) params.set("batch", nextBatch);
    else params.delete("batch");

    if (nextBranch) params.set("branch", nextBranch);
    else params.delete("branch");

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // 3. Filtered Data
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      const matchBranch = !activeBranch || p.branch === activeBranch;
      const matchBatch =
        !activeBatch || p.batchYear?.toString() === activeBatch;
      return matchBranch && matchBatch;
    });
  }, [placements, activeBranch, activeBatch]);

  const { momentumData } = useMomentumData(filteredPlacements);

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
              onClick={() => {
                const selected = batch.toString();
                setActiveBatch(selected);
                syncParams(selected, activeBranch);
              }}
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
            onClick={() => {
              setActiveBranch(null);
              syncParams(activeBatch, null);
            }}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${!activeBranch ? "bg-blue-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 text-slate-500"}`}
          >
            Global
          </button>
          {uniqueBranches.map((branch) => (
            <button
              key={branch}
              title={branch}
              onClick={() => {
                setActiveBranch(branch);
                syncParams(activeBatch, branch);
              }}
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
        {[
          {
            title: "Offers Secured",
            value: filteredPlacements.length,
            icon: Users,
            color: "text-emerald-500",
            decimals: 0,
          },
          {
            title: "Avg CTC",
            value:
              filteredPlacements.reduce((acc, curr) => acc + (curr.ctc || 0), 0) /
              (filteredPlacements.length || 1),
            icon: TrendingUp,
            suffix: "LPA",
            color: "text-indigo-500",
            decimals: 1,
          },
          {
            title: "Peak CTC",
            value:
              filteredPlacements.length > 0
                ? Math.max(...filteredPlacements.map((d) => d.ctc || 0))
                : 0,
            icon: Award,
            suffix: "LPA",
            color: "text-amber-500",
            decimals: 1,
          },
          {
            title: "Recruiters",
            value: new Set(filteredPlacements.map((d) => d.company)).size,
            icon: Briefcase,
            color: "text-pink-500",
            decimals: 0,
          },
        ].map((item) => (
          <StatCard
            key={item.title}
            title={item.title}
            value={(
              <AnimatedNumber
                value={Number(item.value || 0)}
                format={(n) =>
                  item.decimals > 0 ? n.toFixed(item.decimals) : Math.round(n).toLocaleString()
                }
              />
            ) as unknown as number}
            suffix={item.suffix}
            icon={item.icon}
            color={item.color}
          />
        ))}
      </div>

      <PlacementTable data={filteredPlacements} />
    </div>
  );
}

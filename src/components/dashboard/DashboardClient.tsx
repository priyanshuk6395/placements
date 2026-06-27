"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Users,
  Award,
  Briefcase,
  BarChart2,
  Filter,
  Activity,
  Database,
  UploadCloud,
  Map,
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
  Cell,
  CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Component Imports
import StatCard from "./StatCard";
import PlacementTable from "./PlacementTable";
import FileUpload from "./FileUpload";
import EntryDrawer from "./EntryDrawer";
import TrafficAnalytics from "./TrafficAnalytics";
import VisitorLedger from "./VisitorLedger";
import DownloadAllData from "./DownloadAllData";

interface DashboardClientProps {
  placements: any[];
  logs: any[];
  visitors?: any;
  stats: { avg: number; total: number; highest: number; companies: number };
}

// Reusable Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl min-w-[120px]">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
          {label}
        </p>
        {data.avgCtc && (
          <p className="text-indigo-600 dark:text-indigo-400 font-black text-lg">
            {data.avgCtc}{" "}
            <span className="text-[10px] font-medium text-slate-500">
              LPA Avg
            </span>
          </p>
        )}
        {data.cumulative !== undefined && (
          <>
            <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg leading-none">
              {data.cumulative}{" "}
              <span className="text-[10px] font-medium text-slate-500">
                Offers
              </span>
            </p>
          </>
        )}
      </div>
    );
  }
  return null;
};

export default function DashboardClient({
  placements,
  logs,
  stats,
  visitors,
}: DashboardClientProps) {
  const router = useRouter();

  // Tab State Management
  const [activeTab, setActiveTab] = useState<
    "preview" | "update" | "analytics"
  >("preview");

  // Segment Filter State
  const [activeBranch, setActiveBranch] = useState<string | null>(null);

  // --- DATA PROCESSING LOGIC ---
  const uniqueBranches = useMemo(
    () => Array.from(new Set(placements.map((p) => p.branch).filter(Boolean))),
    [placements],
  );

  const filteredPlacements = useMemo(() => {
    if (!activeBranch) return placements;
    return placements.filter((p) => p.branch === activeBranch);
  }, [placements, activeBranch]);

  const dynamicStats = useMemo(() => {
    if (!activeBranch) return stats;
    const avg =
      filteredPlacements.reduce((acc, curr) => acc + (curr.ctc || 0), 0) /
      (filteredPlacements.length || 1);
    const highest =
      filteredPlacements.length > 0
        ? Math.max(...filteredPlacements.map((d) => d.ctc || 0))
        : 0;
    const companies = new Set(filteredPlacements.map((d) => d.company)).size;
    return { avg, total: filteredPlacements.length, highest, companies };
  }, [filteredPlacements, activeBranch, stats]);

  // Chart Data Processing
  const chartData = useMemo(() => {
    return uniqueBranches
      .map((branchName) => {
        const branchStudents = placements.filter(
          (p) => p.branch === branchName,
        );
        const avgCtc =
          branchStudents.reduce((acc, curr) => acc + (curr.ctc || 0), 0) /
          (branchStudents.length || 1);
        const shortName = branchName.toLowerCase().includes("computer")
          ? "CSE"
          : branchName.toLowerCase().includes("information")
            ? "IT"
            : branchName.toLowerCase().includes("electronics")
              ? "ECE"
              : branchName.substring(0, 4);
        return { name: shortName, avgCtc: Number(avgCtc.toFixed(2)) };
      })
      .sort((a, b) => b.avgCtc - a.avgCtc);
  }, [placements, uniqueBranches]);

  const timeSeriesData = useMemo(() => {
    const parseDate = (val: string | number) => {
      if (!val) return null;
      const str = String(val).trim();
      if (/^\d{4,5}$/.test(str))
        return new Date((parseInt(str) - 25569) * 86400 * 1000);
      if (str.includes("-") || str.includes("/")) {
        const sep = str.includes("-") ? "-" : "/";
        const parts = str.split(sep);
        if (parts.length === 3) {
          if (parts[2].length === 4)
            return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          if (parts[0].length === 4)
            return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        }
      }
      const fallback = new Date(str);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    const sorted = [...placements]
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
      const monthYear =
        d.toLocaleString("default", { month: "short" }) +
        " '" +
        d.getFullYear().toString().slice(2);
      grouped[monthYear] = (grouped[monthYear] || 0) + 1;
    });

    let cumulative = 0;
    return Object.keys(grouped).map((key) => {
      cumulative += grouped[key];
      return { name: key, placed: grouped[key], cumulative };
    });
  }, [placements]);

  // --- UI RENDER ---
  return (
    <div className="w-full transition-colors duration-300">
      {/* SECTOR NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-full w-fit border border-slate-200 dark:border-white/10 shadow-sm mb-8">
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === "preview" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Database className="w-4 h-4" /> Database Preview
        </button>
        <button
          onClick={() => setActiveTab("update")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === "update" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
        >
          <UploadCloud className="w-4 h-4" /> Add & Update
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === "analytics" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Map className="w-4 h-4" /> Views & Location
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* SECTION 1: DATABASE PREVIEW */}
        {activeTab === "preview" && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Average CTC"
                value={dynamicStats.avg.toFixed(2)}
                suffix="LPA"
                icon={TrendingUp}
                color="text-indigo-600 dark:text-indigo-400"
              />
              <StatCard
                title="Total Offers"
                value={dynamicStats.total}
                icon={Users}
                color="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                title="Highest Offer"
                value={dynamicStats.highest}
                suffix="LPA"
                icon={Award}
                color="text-amber-600 dark:text-amber-400"
              />
              <StatCard
                title="Recruiters"
                value={dynamicStats.companies}
                icon={Briefcase}
                color="text-pink-600 dark:text-pink-400"
              />
            </div>

            {/* Momentum Chart */}
            <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm h-80 flex flex-col">
              <h4 className="text-slate-900 dark:text-white font-semibold mb-6 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Placement
                Momentum
              </h4>
              <div className="flex-1 w-full -ml-4 relative">
                {timeSeriesData.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 ml-4">
                    <Activity className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-xs font-medium">
                      Timeline data unavailable
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={timeSeriesData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorCumulative"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-slate-800"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="currentColor"
                        className="text-slate-400"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="currentColor"
                        className="text-slate-400"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                          stroke: "rgba(255,255,255,0.1)",
                          strokeWidth: 2,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCumulative)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Branch Averages */}
            <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm h-80 flex flex-col">
              <h4 className="text-slate-900 dark:text-white font-semibold mb-6 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-500" /> Branch
                Averages (LPA)
              </h4>
              <div className="flex-1 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="currentColor"
                      className="text-slate-400"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="currentColor"
                      className="text-slate-400"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}L`}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar dataKey="avgCtc" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          className="fill-indigo-500 dark:fill-indigo-400 transition-colors duration-300"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Segment Analysis Filter */}
            <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 min-w-max">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Filter:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveBranch(null)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!activeBranch ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                >
                  Global
                </button>
                {uniqueBranches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => setActiveBranch(branch)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeBranch === branch ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}
                  >
                    {branch.substring(0, 15)}
                  </button>
                ))}
              </div>
            </div>

            <PlacementTable data={filteredPlacements} />
          </motion.div>
        )}

        {/* SECTION 2: ADD & UPDATE (DATA INGESTION) */}
        {activeTab === "update" && (
          <motion.div
            key="update"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Column 1: Bulk Ingestion */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col h-full">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  Bulk Ingestion Engine
                </h3>
                <p className="text-sm text-slate-500 mb-8">
                  Upload verified Excel records to dynamically update the
                  warehouse and map new company logos.
                </p>
                <div className="flex-1 flex flex-col justify-center">
                  <FileUpload onUploadSuccess={() => router.refresh()} />
                </div>
              </div>

              {/* Column 2: Manual Entry & Export */}
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col h-full items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Database className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Data Warehouse Ops
                  </h3>
                  <p className="text-sm text-slate-500 max-w-xs">
                    Manage individual records manually or export the complete
                    database as a partitioned Excel workbook.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center">
                  <EntryDrawer />
                  <DownloadAllData />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 3: VIEWS & LOCATION (ANALYTICS) */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Geographic Map */}
            <div className="lg:col-span-2">
              <TrafficAnalytics logs={logs} />
            </div>

            <div className="lg:col-span-2">
              <VisitorLedger logs={logs} visitors={visitors} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

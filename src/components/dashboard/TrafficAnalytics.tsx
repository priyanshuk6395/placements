"use client";
import { useMemo } from "react";
import { Users, Clock, Globe, MapPin, Smartphone, Tablet, Monitor } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber";
import GeoDrilldown from "./GeoDrilldown";
import ActivityPulse from "./ActivityPulse";

export default function TrafficAnalytics({ logs }: { logs: any[] }) {
  const totalVisits = logs.length;

  const uniqueVisitors = useMemo(() => new Set(logs.map((l) => l.ip)).size, [logs]);

  const avgDuration = useMemo(
    () => Math.round(logs.reduce((acc, l) => acc + (l.duration || 0), 0) / (totalVisits || 1)),
    [logs, totalVisits],
  );

  const regionRanking = useMemo(() => {
    const regionCounts = logs.reduce((acc, log) => {
      const region = log.region && log.region !== "Unknown" ? String(log.region) : "Local";
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(regionCounts)
      .map(([name, count]) => ({ name, count: Number(count) }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const topRegion = regionRanking[0]?.name || "N/A";

  const deviceBreakdown = useMemo(() => {
    const counts = { Mobile: 0, Tablet: 0, Desktop: 0 };

    for (const log of logs) {
      const ua = String(log.userAgent || "").toLowerCase();
      const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua);
      const isMobile = !isTablet && /mobile|iphone|ipod|android/i.test(ua);

      if (isTablet) counts.Tablet += 1;
      else if (isMobile) counts.Mobile += 1;
      else counts.Desktop += 1;
    }

    return [
      { name: "Mobile", value: counts.Mobile, color: "#6366f1" },
      { name: "Tablet", value: counts.Tablet, color: "#f59e0b" },
      { name: "Desktop", value: counts.Desktop, color: "#10b981" },
    ];
  }, [logs]);

  const hotPaths = useMemo(() => {
    const pathCounts = logs.reduce((acc, log) => {
      const path = String(log.path || "/");
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ranked = Object.entries(pathCounts)
      .map(([path, count]) => ({ path, count: Number(count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const maxCount = Math.max(1, ...ranked.map((item) => item.count));
    return ranked.map((item) => ({
      ...item,
      width: (item.count / maxCount) * 100,
    }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Unique Users", value: uniqueVisitors, icon: Users, color: "text-indigo-400" },
          { title: "Avg Session", value: avgDuration, suffix: "s", icon: Clock, color: "text-emerald-400" },
          { title: "Top Region", value: topRegion, icon: Globe, color: "text-pink-400" },
        ].map((stat, i) => (
          <div key={i} className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-4 shadow-sm">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">{stat.title}</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {typeof stat.value === "number" ? (
                  <>
                    <AnimatedNumber value={stat.value} />
                    {stat.suffix ? <span className="text-sm text-slate-400 ml-1">{stat.suffix}</span> : null}
                  </>
                ) : (
                  stat.value
                )}
              </h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <GeoDrilldown logs={logs} />

        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" /> Device Mix
            </h4>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {deviceBreakdown.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${Number(value || 0)} sessions`, String(name)]}
                    contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-2">
              {deviceBreakdown.map((entry) => (
                <div key={entry.name} className="p-3 rounded-xl bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    {entry.name === "Mobile" ? <Smartphone className="w-3.5 h-3.5" /> : null}
                    {entry.name === "Tablet" ? <Tablet className="w-3.5 h-3.5" /> : null}
                    {entry.name === "Desktop" ? <Monitor className="w-3.5 h-3.5" /> : null}
                    {entry.name}
                  </div>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                    <AnimatedNumber value={entry.value} />
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Hot Paths
            </h4>
            <div className="space-y-2.5">
              {hotPaths.length === 0 ? (
                <div className="text-xs text-slate-500 py-4">No path data available.</div>
              ) : (
                hotPaths.map((item, index) => (
                  <div key={item.path} className="relative overflow-hidden p-2.5 bg-slate-100 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.width}%` }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                      className="absolute inset-y-0 left-0 rounded-xl bg-linear-to-r from-amber-500/30 to-transparent"
                    />
                    <div className="relative z-10 flex justify-between items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 truncate" title={item.path}>{item.path}</span>
                      <span className="text-[10px] font-black text-amber-500">{item.count} hits</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ActivityPulse logs={logs} />
    </div>
  );
}
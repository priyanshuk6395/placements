"use client";
import { Users, Clock, Globe, Activity, MapPin, Smartphone, Monitor } from "lucide-react";
import { BarChart, Bar, AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function TrafficAnalytics({ logs }: { logs: any[] }) {
  // 1. Process Basic Stats
  const totalVisits = logs.length;
  const uniqueVisitors = new Set(logs.map((l) => l.ip)).size;
  const avgDuration = Math.round(logs.reduce((acc, l) => acc + (l.duration || 0), 0) / (totalVisits || 1));
  
  // 2. Geographic Data
  const regionCounts = logs.reduce((acc, log) => {
    const region = log.region && log.region !== "Unknown" ? log.region : "Local";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const chartData = Object.entries(regionCounts).map(([name, count]) => ({ name, count }));

  // 3. Hourly Activity
  const hourData = logs.reduce((acc, log) => {
    const hour = new Date(log.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const momentumData = Array.from({ length: 24 }).map((_, i) => ({ h: `${i}:00`, c: hourData[i] || 0 }));

  // 4. Device Breakdown
  const deviceData = logs.reduce((acc, log) => {
    const isMobile = /mobile|android|iphone/i.test(log.userAgent);
    acc[isMobile ? 'Mobile' : 'Desktop'] = (acc[isMobile ? 'Mobile' : 'Desktop'] || 0) + 1;
    return acc;
  }, { Mobile: 0, Desktop: 0 });

  // 5. Most Visited Paths
  const pathCounts = logs.reduce((acc, log) => {
    acc[log.path] = (acc[log.path] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const sortedPaths = Object.entries(pathCounts)
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Unique Users", value: uniqueVisitors, icon: Users, color: "text-indigo-400" },
          { title: "Avg Session", value: `${avgDuration}s`, icon: Clock, color: "text-emerald-400" },
          { title: "Top Region", value: Object.keys(regionCounts)[0] || "N/A", icon: Globe, color: "text-pink-400" },
        ].map((stat, i) => (
          <div key={i} className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center gap-4">
            <stat.icon className={`w-6 h-6 ${stat.color}`} />
            <div>
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{stat.title}</p>
              <h3 className="text-xl font-black">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl h-80 shadow-sm">
          <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-500" /> Geographic Footprint
          </h4>
          <ResponsiveContainer width="100%" height="75%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "none", borderRadius: "12px" }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#ec4899" : "#a855f7"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(deviceData).map(([device, count]) => (
              <div key={device} className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-500">{device}</p>
                  <h4 className="text-lg font-black">{String(count)}</h4>
                </div>
                {device === 'Mobile' ? <Smartphone className="w-5 h-5 text-indigo-400" /> : <Monitor className="w-5 h-5 text-indigo-400" />}
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Hot Paths
            </h4>
            <div className="space-y-2">
              {sortedPaths.map(([path, count]) => (
                <div key={path} className="flex justify-between items-center p-2.5 bg-black/20 rounded-xl">
                  <span className="text-[10px] font-mono text-slate-300 truncate">{path}</span>
                  <span className="text-[10px] font-black text-amber-500">{String(count)} hits</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
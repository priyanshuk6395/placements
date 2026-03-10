'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, Users, Award, Briefcase, BarChart2, Filter, Activity } from 'lucide-react';
import StatCard from './StatCard'; 
import FileUpload from './FileUpload';
import PlacementTable from './PlacementTable';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface DashboardClientProps {
  placements: any[];
  stats: { avg: number; total: number; highest: number; companies: number; };
}

// Data Eng: Intelligent Custom Tooltip handling both chart types
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xl min-w-[120px]">
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
        
        {/* Handle Bar Chart (LPA) */}
        {data.avgCtc && (
          <p className="text-indigo-600 dark:text-indigo-400 font-black text-lg">
            {data.avgCtc} <span className="text-[10px] font-medium text-slate-500">LPA Avg</span>
          </p>
        )}
        
        {/* Handle Area Chart (Cumulative Placements) */}
        {data.cumulative !== undefined && (
          <>
            <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg leading-none">
              {data.cumulative} <span className="text-[10px] font-medium text-slate-500">Total Offers</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium mt-1">
              +{data.placed} this month
            </p>
          </>
        )}
      </div>
    );
  }
  return null;
};

export default function DashboardClient({ placements, stats }: DashboardClientProps) {
  const router = useRouter();
  const [activeBranch, setActiveBranch] = useState<string | null>(null);

  const uniqueBranches = useMemo(() => Array.from(new Set(placements.map(p => p.branch).filter(Boolean))), [placements]);

  const filteredPlacements = useMemo(() => {
    if (!activeBranch) return placements;
    return placements.filter(p => p.branch === activeBranch);
  }, [placements, activeBranch]);

  const dynamicStats = useMemo(() => {
    if (!activeBranch) return stats; 
    const avg = filteredPlacements.reduce((acc, curr) => acc + (curr.ctc || 0), 0) / (filteredPlacements.length || 1);
    const highest = filteredPlacements.length > 0 ? Math.max(...filteredPlacements.map(d => d.ctc || 0)) : 0;
    const companies = new Set(filteredPlacements.map(d => d.company)).size;
    return { avg, total: filteredPlacements.length, highest, companies };
  }, [filteredPlacements, activeBranch, stats]);

  // Chart 1: Categorical Distribution (Bar Chart)
  const chartData = useMemo(() => {
    return uniqueBranches.map(branchName => {
      const branchStudents = placements.filter(p => p.branch === branchName);
      const avgCtc = branchStudents.reduce((acc, curr) => acc + (curr.ctc || 0), 0) / (branchStudents.length || 1);
      
      // Shorten names for the X-Axis
      const lower = branchName.toLowerCase();
      let shortName = branchName;
      if (lower.includes('computer science')) shortName = 'CSE';
      else if (lower.includes('information technology')) shortName = 'IT';
      else if (lower.includes('electronics')) shortName = 'ECE';
      
      return { name: shortName, avgCtc: Number(avgCtc.toFixed(2)) };
    }).sort((a, b) => b.avgCtc - a.avgCtc); 
  }, [placements, uniqueBranches]);

  // Chart 2: Placement Momentum (Time-Series Area Chart)
  const timeSeriesData = useMemo(() => {
    // 1. Indestructible Date Parser for messy Excel data
    const parseDate = (val: string | number) => {
      if (!val) return null;
      const str = String(val).trim();

      // Case A: Excel Serial Number (e.g., "45150")
      if (/^\d{4,5}$/.test(str)) {
        return new Date((parseInt(str) - 25569) * 86400 * 1000); 
      }

      // Case B: Slashed or Hyphenated Dates (DD-MM-YYYY or DD/MM/YYYY)
      if (str.includes('-') || str.includes('/')) {
        const sep = str.includes('-') ? '-' : '/';
        const parts = str.split(sep);
        if (parts.length === 3) {
          if (parts[2].length === 4) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); 
          if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}`); 
        }
      }

      // Case C: Standard JS Native Fallback
      const fallback = new Date(str);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    // 2. Filter out records with unparseable dates, then sort chronologically
    const sorted = [...placements]
      .filter(p => p.date && parseDate(p.date))
      .sort((a, b) => {
        return (parseDate(a.date)?.getTime() || 0) - (parseDate(b.date)?.getTime() || 0);
      });

    // 3. Group by Month/Year
    const grouped: Record<string, number> = {};
    sorted.forEach(p => {
      const d = parseDate(p.date);
      if (!d) return;
      const monthYear = d.toLocaleString('default', { month: 'short' }) + " '" + d.getFullYear().toString().slice(2);
      grouped[monthYear] = (grouped[monthYear] || 0) + 1;
    });

    // 4. Calculate Cumulative Running Total
    let cumulative = 0;
    return Object.keys(grouped).map(key => {
      cumulative += grouped[key];
      return { name: key, placed: grouped[key], cumulative };
    });
  }, [placements]);

  return (
    <div className="w-full max-w-[1600px] mx-auto transition-colors duration-300">
      
      {/* ZONE A: KPI Cards (The Blink Test) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="Average CTC" value={dynamicStats.avg.toFixed(2)} suffix="LPA" icon={TrendingUp} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Total Offers" value={dynamicStats.total} icon={Users} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Highest Offer" value={dynamicStats.highest} suffix="LPA" icon={Award} color="text-amber-600 dark:text-amber-400" />
        <StatCard title="Recruiters" value={dynamicStats.companies} icon={Briefcase} color="text-pink-600 dark:text-pink-400" />
      </div>

      {/* ZONE B: Visualizations (Trends & Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Left Chart: Placement Momentum (Area) */}
        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm h-80 flex flex-col">
          <h4 className="text-slate-900 dark:text-white font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Placement Momentum
          </h4>
          <div className="flex-1 w-full -ml-4 relative">
            
            {/* UI/UX Graceful Empty State */}
            {timeSeriesData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 ml-4">
                <Activity className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-xs font-medium">Timeline data unavailable</p>
                <p className="text-[10px] opacity-60">Check Excel "Date" column formatting</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-slate-400" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="currentColor" className="text-slate-400" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

          </div>
        </div>

        {/* Right Chart: Median CTC (Bar) */}
        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm h-80 flex flex-col">
          <h4 className="text-slate-900 dark:text-white font-semibold mb-6 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-500" /> Branch Averages (LPA)
          </h4>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="name" stroke="currentColor" className="text-slate-400" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="currentColor" className="text-slate-400" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}L`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="avgCtc" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} className="fill-indigo-500 dark:fill-indigo-400 hover:fill-indigo-400 dark:hover:fill-indigo-300 transition-colors duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ZONE C: The Ledger & Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Data Table */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <PlacementTable data={filteredPlacements} />
        </div>

        {/* Right Column: Controls */}
        <div className="space-y-6 flex flex-col">
          
          {/* Intelligent Filters */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
            <h4 className="text-slate-900 dark:text-white font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" /> Segment Analysis
            </h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveBranch(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!activeBranch ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                Global View
              </button>
              {uniqueBranches.map(branch => {
                const lower = branch.toLowerCase();
                let shortName = branch;
                if (lower.includes('computer science')) shortName = 'CSE';
                else if (lower.includes('information technology')) shortName = 'IT';
                else if (lower.includes('electronics')) shortName = 'ECE';

                return (
                  <button 
                    key={branch} 
                    onClick={() => setActiveBranch(branch)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeBranch === branch ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {shortName}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Database Sync */}
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-2xl">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-1">Database Sync</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Upload verified Excel records to update the warehouse.</p>
            <FileUpload onUploadSuccess={router.refresh} />
          </div>

        </div>
      </div>
    </div>
  );
}
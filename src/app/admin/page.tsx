import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';
import TrafficLog from '@/models/TrafficLog';
import Visitor from '@/models/Visitor';
import DashboardClient from '@/components/dashboard/DashboardClient';
import LogoutButton from '@/components/dashboard/LogoutButton';
import { getServerSession } from "next-auth/next";
import { ShieldCheck } from "lucide-react";

async function getAdminData() {
  await dbConnect();
  
  const allPlacements = await Placement.find().sort({ createdAt: -1 }).lean();
  
  const total = allPlacements.length;
  const avg = total > 0 ? allPlacements.reduce((acc: number, curr: any) => acc + (curr.ctc || 0), 0) / total : 0;
  const highest = total > 0 ? Math.max(...allPlacements.map((d: any) => d.ctc || 0)) : 0;
  const companies = new Set(allPlacements.map((d: any) => d.company)).size;

  const trafficLogs = await TrafficLog.find().sort({ timestamp: -1 }).limit(20).lean();
  const visitors = await Visitor.find({ ip: { $in: trafficLogs.map(l => l.ip) } }).lean();

  return { 
    placements: JSON.parse(JSON.stringify(allPlacements)),
    logs: JSON.parse(JSON.stringify(trafficLogs)),
    visitors: JSON.parse(JSON.stringify(visitors)),
    stats: { avg, total, highest, companies }
  };
}

export default async function AdminDashboard() {
  const { placements, logs, stats } = await getAdminData();
  await getServerSession(); // Secure check

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        
        {/* Secure Admin Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
                Command <span className="text-primary">Center</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold tracking-widest uppercase mt-1">Security Clearance: Active</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-2 pr-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm glass">
            <LogoutButton />
          </div>
        </header>

        {/* The Unified Tabbed Workspace */}
        <DashboardClient placements={placements} logs={logs} stats={stats} />
        
      </div>
    </div>
  );
}
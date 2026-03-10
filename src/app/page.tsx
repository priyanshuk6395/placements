import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';
import DashboardClient from '@/components/dashboard/DashboardClient';
import LogoutButton from '@/components/dashboard/LogoutButton'; // We'll create this next
import { getServerSession } from "next-auth/next";

async function getPlacementData() {
  await dbConnect();
  
  const allData = await Placement.find().sort({ createdAt: -1 }).lean();
  
  const totalRecords = allData.length;
  const avgCtc = totalRecords > 0 
    ? allData.reduce((acc: number, curr: any) => acc + (curr.ctc || 0), 0) / totalRecords 
    : 0;
  const highestCtc = totalRecords > 0 
    ? Math.max(...allData.map((d: any) => d.ctc || 0)) 
    : 0;
  
  return { 
    placements: JSON.parse(JSON.stringify(allData)), 
    stats: {
      avg: avgCtc,
      total: totalRecords,
      highest: highestCtc,
      companies: new Set(allData.map((d: any) => d.company)).size
    }
  };
}

export default async function DashboardPage() {
  const { placements, stats } = await getPlacementData();
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 transition-colors duration-300">
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
              PLACEMENT{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300">
                CENTER
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-sm md:text-base">
              NIT Srinagar Analytics & Intelligence
            </p>
          </div>

          {/* Supreme Logout Integration */}
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900/50 p-2 pr-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm glass">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
              <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs">AD</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Access Level</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Administrator</p>
            </div>
            <LogoutButton />
          </div>
        </header>

        <DashboardClient placements={placements} stats={stats} />
        
      </div>
    </div>
  );
}
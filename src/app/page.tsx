import { dbConnect } from '@/lib/dbConnect';
import Placement from '@/models/Placement';
import PublicDashboardView from '@/components/dashboard/PublicDashboardView';
import TrafficTracker from '@/components/dashboard/TrafficTracker';

// Next.js config to ensure the public page refetches cleanly
export const revalidate = 60; 

async function getPlacementData() {
  await dbConnect();
  const allData = await Placement.find().sort({ createdAt: -1 }).lean();
  return { 
    placements: JSON.parse(JSON.stringify(allData))
  };
}

export default async function PublicPage() {
  const { placements } = await getPlacementData();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground transition-colors duration-300">
      <TrafficTracker /> 
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <header className="mb-10 md:mb-14 relative">
          {/* Subtle background glow for the header */}
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 blur-3xl rounded-full -z-10" />
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase flex items-start">
            Placement <span className="text-primary ml-2 md:ml-3">Ledger</span>
            <span className="text-primary font-black text-2xl md:text-4xl ml-1 md:ml-2 mt-1">*</span>
          </h1>
          
          <p className="text-muted-foreground font-bold uppercase tracking-widest mt-2 text-xs md:text-sm">
            National Institute of Technology Srinagar
          </p>

          {/* The Supreme Disclaimer Note */}
          <div className="mt-4 md:mt-5 p-3 md:p-4 rounded-2xl bg-secondary/50 border border-border/50 max-w-2xl glass">
            <p className="text-[10px] md:text-xs text-muted-foreground italic leading-relaxed font-medium">
              <span className="font-black text-primary mr-1">*</span> 
              <span className="font-bold uppercase tracking-wider text-foreground/70">Contextual Note:</span> This ledger is actively maintained by the IT Students and strictly concerns software, data, and technology-related roles. It does not represent the exhaustive placement statistics for the entire NIT Srinagar batch.
            </p>
          </div>
        </header>

        <PublicDashboardView placements={placements} />
      </div>
    </div>
  );
}
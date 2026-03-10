"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Trophy, ArrowUpDown, Copy, 
  CheckCircle2, Star, Briefcase, X, 
  Linkedin, CalendarDays, ExternalLink 
} from "lucide-react";
import CompanyLogo from "./CompanyLogo";

export default function PlacementTable({ data = [] }: { data: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  // Default sort is now by Date (Latest First)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'latestDate', direction: 'desc' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // 1. Data Aggregation: Merging flat rows into Student Entities
  const groupedData = useMemo(() => {
    const map = new Map<string, any>();
    if (!data || !Array.isArray(data)) return [];

    data.forEach(offer => {
      if (!offer || !offer.enrollmentNo) return;

      if (!map.has(offer.enrollmentNo)) {
        map.set(offer.enrollmentNo, {
          ...offer,
          offers: [offer],
          maxCtc: offer.ctc || 0,
          maxStipend: offer.stipend || 0,
          latestDate: offer.date || "",
        });
      } else {
        const student = map.get(offer.enrollmentNo);
        student.offers.push(offer);
        student.maxCtc = Math.max(student.maxCtc, offer.ctc || 0);
        student.maxStipend = Math.max(student.maxStipend, offer.stipend || 0);
        
        // Date Engineering: Keep the actual most recent date string
        if (offer.date && offer.date !== "TBD") {
          const parseDate = (d: string) => {
            const [day, month, year] = d.split('-').map(Number);
            return new Date(year, month - 1, day).getTime();
          };
          if (!student.latestDate || student.latestDate === "TBD" || parseDate(offer.date) > parseDate(student.latestDate)) {
            student.latestDate = offer.date;
          }
        }
      }
    });
    return Array.from(map.values());
  }, [data]);

  // 2. Filter & Sort Engine
  const filteredAndSortedData = useMemo(() => {
    let result = groupedData.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.offers.some((o: any) => o.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // SPECIAL CASE: Date Sorting (Chronological instead of Alphabetical)
        if (sortConfig.key === 'latestDate') {
          const parseDate = (d: string) => {
            if (!d || d === "TBD") return 0;
            const [day, month, year] = d.split('-').map(Number);
            return new Date(year, month - 1, day).getTime();
          };
          aValue = parseDate(aValue);
          bValue = parseDate(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [groupedData, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleCopy = (e: any, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getOfferBadgeColor = (type: string) => {
    const t = type?.toLowerCase() || "";
    if (t.includes('ppo')) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (t.includes('intern')) return "bg-sky-500/10 text-sky-500 border-sky-500/20";
    return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  };

  return (
    <>
      <div className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm dark:shadow-2xl overflow-hidden flex flex-col h-[600px] xl:h-[800px] glass">
        
        {/* Header Section */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 z-20">
          <div className="hidden sm:block">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Placement Ledger
              {data.some(s => s.ctc >= 25) && <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">NIT Srinagar Database</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidate or recruiter..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" 
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-y-auto overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
              <tr className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-[0.2em]">
                <th className="px-6 py-5 font-black cursor-pointer select-none" onClick={() => requestSort("name")}>
                  <div className="flex items-center gap-2">Candidate <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="hidden md:table-cell px-6 py-5 font-black cursor-pointer select-none" onClick={() => requestSort("branch")}>
                  <div className="flex items-center gap-2">Domain <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                {/* SORTABLE DATE COLUMN */}
                <th className="hidden lg:table-cell px-6 py-5 font-black text-center cursor-pointer select-none" onClick={() => requestSort("latestDate")}>
                  <div className="flex items-center justify-center gap-2">Latest Date <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="hidden lg:table-cell px-6 py-5 font-black">Offers</th>
                <th className="px-6 py-5 font-black text-right cursor-pointer select-none" onClick={() => requestSort("maxCtc")}>
                  <div className="flex items-center justify-end gap-2">Value <ArrowUpDown className="w-3 h-3" /></div>
                </th>
                <th className="px-6 py-5 font-black text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedData.map((student) => (
                  <motion.tr
                    key={student.enrollmentNo}
                    layout
                    layoutId={student.enrollmentNo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedStudent(student)}
                    className="group hover:bg-primary/[0.04] transition-colors cursor-pointer relative"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary items-center justify-center font-black text-xs border border-primary/20 shrink-0 shadow-inner">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate max-w-[140px] group-hover:text-primary transition-colors">{student.name}</div>
                          <div 
                            className="text-[10px] font-mono text-slate-500 hover:text-primary flex items-center gap-1.5 mt-1 transition-colors"
                            onClick={(e) => handleCopy(e, student.enrollmentNo)}
                          >
                            {student.enrollmentNo}
                            {copiedId === student.enrollmentNo ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-white/5">
                        {student.branch}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                          {student.latestDate || "TBD"}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Selection</span>
                      </div>
                    </td>

                    <td className="hidden lg:table-cell px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3 group-hover:-space-x-1 transition-all duration-300">
                          {student.offers.slice(0, 3).map((offer: any, i: number) => (
                            <div key={i} className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-white z-[i] shadow-sm relative">
                              <CompanyLogo src={offer.logoData} name={offer.company} />
                            </div>
                          ))}
                        </div>
                        {student.offers.length > 1 && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-200 dark:border-white/5">+{student.offers.length - 1}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        {student.maxCtc > 0 ? (
                          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
                            {student.maxCtc}<span className="text-[10px] ml-1 font-bold text-emerald-500 uppercase">LPA</span>
                          </span>
                        ) : (
                          <span className="text-lg font-black text-sky-500 tracking-tighter">
                            {student.maxStipend / 1000}k<span className="text-[10px] ml-1 font-bold opacity-60 uppercase">/ mo</span>
                          </span>
                        )}
                        {student.offers.length > 1 && (
                          <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tighter mt-1">
                            <Star className="w-2.5 h-2.5 fill-amber-500" /> Multiple Offers
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <a 
                        href={student.linkedin || "#"} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-[#0A66C2] hover:text-white transition-all shadow-sm border border-transparent hover:border-[#0A66C2]/30"
                      >
                        <Linkedin className="w-4 h-4 fill-current" />
                      </a>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3D ROTATING DOSSIER MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4" style={{ perspective: "1800px" }}>
            <motion.div
              initial={{ rotateY: -90, opacity: 0, scale: 0.9 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: 90, opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-primary/20 rotate-3">
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedStudent.name}</h2>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{selectedStudent.enrollmentNo} • {selectedStudent.branch}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="p-3 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-white hover:bg-destructive rounded-2xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950/50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Career Milestone History</p>
                {selectedStudent.offers.map((offer: any, idx: number) => {
                   const isTop = (offer.ctc > 0 && offer.ctc === selectedStudent.maxCtc) || (offer.stipend > 0 && offer.stipend === selectedStudent.maxStipend && selectedStudent.maxCtc === 0);
                   return (
                    <div key={idx} className={`p-5 rounded-[1.5rem] border transition-all flex items-center justify-between ${isTop ? 'border-primary/30 bg-primary/[0.03] shadow-inner' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/20'}`}>
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex-shrink-0">
                          <CompanyLogo src={offer.logoData} name={offer.company} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight truncate max-w-[180px]">{offer.company.split("(")[0].trim()}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getOfferBadgeColor(offer.offerType)}`}>
                              {offer.offerType}
                            </span>
                            <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                              <CalendarDays className="w-3 h-3" /> {offer.date || "TBD"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isTop && selectedStudent.offers.length > 1 && <span className="text-[9px] font-black text-amber-500 block mb-1">HIGHEST OFFER</span>}
                        {offer.ctc > 0 ? (
                          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{offer.ctc}<span className="text-xs ml-1 opacity-50 font-bold">LPA</span></span>
                        ) : (
                          <span className="text-2xl font-black text-sky-500 tracking-tighter">{offer.stipend / 1000}k<span className="text-xs ml-1 opacity-50 font-bold uppercase">/ mo</span></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
"use client";
import { Activity } from "lucide-react";

// Add "= []" to the visitors prop to ensure it's always an array
export default function VisitorLedger({ logs = [], visitors = [] }: { logs: any[], visitors?: any[] }) {
  return (
    <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl shadow-sm overflow-hidden">
      <h4 className="text-[10px] font-black uppercase text-slate-500 mb-6 flex items-center gap-2">
        Recent Activity Ledger
      </h4>
      
      {logs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-600">
          <Activity className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-xs font-medium uppercase tracking-widest">No recent traffic detected</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            {/* ... table head ... */}
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => {
                // Now visitors is guaranteed to be an array, so .find() will work safely
                const visitor = visitors.find(v => v.ip === log.ip);
                return (
                  <tr key={log._id} className="text-slate-300">
                    <td className="py-3 font-mono">{log.ip}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${visitor ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400'}`}>
                        {visitor ? 'Loyal' : 'Guest'}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-white">
                      {visitor ? visitor.name : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
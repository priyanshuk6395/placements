"use client";
import { Activity, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

type SortKey = "timestamp" | "duration" | "ip";

const PAGE_SIZE = 12;

export default function VisitorLedger({ logs = [], visitors = [] }: { logs: any[]; visitors?: any[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const visitorByIp = useMemo(() => {
    const map = new Map<string, any>();
    for (const v of visitors) {
      map.set(String(v.ip), v);
    }
    return map;
  }, [visitors]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredAndSorted = useMemo(() => {
    const filtered = logs.filter((log) => {
      if (!normalizedQuery) return true;
      const visitor = visitorByIp.get(String(log.ip));
      const values = [
        String(log.ip || ""),
        String(log.path || ""),
        String(visitor?.name || ""),
      ];
      return values.some((v) => v.toLowerCase().includes(normalizedQuery));
    });

    const sorted = [...filtered].sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime() || 0;
      const bTime = new Date(b.timestamp).getTime() || 0;

      let compare = 0;
      if (sortKey === "timestamp") compare = aTime - bTime;
      if (sortKey === "duration") compare = (a.duration || 0) - (b.duration || 0);
      if (sortKey === "ip") compare = String(a.ip || "").localeCompare(String(b.ip || ""));

      return sortDirection === "asc" ? compare : -compare;
    });

    return sorted;
  }, [logs, normalizedQuery, sortDirection, sortKey, visitorByIp]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAndSorted.slice(start, start + PAGE_SIZE);
  }, [filteredAndSorted, page]);

  const changeSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />;
  };

  const fmtDate = (value: unknown) => {
    const d = new Date(String(value || ""));
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleString();
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h4 className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2">
          Recent Activity Ledger
        </h4>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search IP, visitor, or path"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-500 outline-none focus:border-indigo-500/40"
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-600">
          <Activity className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-xs font-medium uppercase tracking-widest">No recent traffic detected</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] min-w-190">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px] border-b border-slate-200 dark:border-white/10">
                  <th className="py-3 pr-4 font-black">IP Address</th>
                  <th className="py-3 pr-4 font-black">Type</th>
                  <th className="py-3 pr-4 font-black">Visitor</th>
                  <th className="py-3 pr-4 font-black">
                    <button type="button" onClick={() => changeSort("timestamp")} className="inline-flex items-center gap-1 hover:text-slate-300">
                      Time {sortArrow("timestamp")}
                    </button>
                  </th>
                  <th className="py-3 pr-4 font-black">
                    <button type="button" onClick={() => changeSort("duration")} className="inline-flex items-center gap-1 hover:text-slate-300">
                      Duration {sortArrow("duration")}
                    </button>
                  </th>
                  <th className="py-3 pr-4 font-black">
                    <button type="button" onClick={() => changeSort("ip")} className="inline-flex items-center gap-1 hover:text-slate-300">
                      Path / IP Sort {sortArrow("ip")}
                    </button>
                  </th>
                  <th className="py-3 pr-0 font-black text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pagedRows.map((log) => {
                  const rowKey = String(log._id || `${log.ip}-${log.timestamp}-${log.path}`);
                  const visitor = visitorByIp.get(String(log.ip));
                  const expanded = !!expandedRows[rowKey];

                  return (
                    <Fragment key={rowKey}>
                      <tr key={rowKey} className="text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/2">
                        <td className="py-3 pr-4 font-mono">{String(log.ip || "-")}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${visitor ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700/50 text-slate-400"}`}>
                            {visitor ? "Loyal" : "Guest"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-bold text-slate-900 dark:text-white">{visitor?.name || "-"}</td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">{fmtDate(log.timestamp)}</td>
                        <td className="py-3 pr-4">{Math.round(log.duration || 0)}s</td>
                        <td className="py-3 pr-4 max-w-65 truncate" title={String(log.path || "-")}>{String(log.path || "-")}</td>
                        <td className="py-3 pr-0 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[10px] font-black uppercase tracking-wide"
                          >
                            {expanded ? "Hide" : "Show"}
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="bg-slate-100/80 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300">
                          <td colSpan={7} className="px-3 py-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                              <div className="p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
                                <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] font-bold">Device</p>
                                <p className="mt-1 break-all">{String(log.userAgent || "Unknown")}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
                                <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] font-bold">Location</p>
                                <p className="mt-1">{String(log.city || "Unknown")}, {String(log.region || "Unknown")}, {String(log.country || "Unknown")}</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
                                <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] font-bold">Duration</p>
                                <p className="mt-1">{Math.round(log.duration || 0)} seconds</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-white dark:bg-black/20 border border-slate-200 dark:border-white/5">
                                <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wide text-[10px] font-bold">Path</p>
                                <p className="mt-1 break-all">{String(log.path || "-")}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filteredAndSorted.length)} of {filteredAndSorted.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
              >
                Prev
              </button>
              <span className="text-slate-700 dark:text-slate-300 font-bold">Page {page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import { Activity, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

interface ActivityPulseProps {
  logs: any[];
}

function normalizeDate(value: unknown) {
  const d = new Date(String(value || ""));
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function ActivityPulse({ logs }: ActivityPulseProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const { liveNow, hourlyBuckets, maxHourValue } = useMemo(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const buckets = Array.from({ length: 24 }, () => 0);
    let liveCount = 0;

    for (const log of logs) {
      const d = normalizeDate(log.timestamp);
      if (!d) continue;

      const ts = d.getTime();
      if (ts >= fiveMinutesAgo && ts <= now) {
        liveCount += 1;
      }

      buckets[d.getHours()] += 1;
    }

    const maxValue = Math.max(1, ...buckets);

    return {
      liveNow: liveCount,
      hourlyBuckets: buckets,
      maxHourValue: maxValue,
    };
  }, [logs]);

  const activeHour = selectedHour ?? hourlyBuckets.indexOf(maxHourValue);

  return (
    <section className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Activity Pulse
          </p>
          <p className="text-xs text-slate-400 mt-1">Live signal plus 24-hour traffic heatmap.</p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <motion.span
            className="w-2.5 h-2.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.25, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-xs font-bold text-emerald-300">
            {liveNow} active in last 5m
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">24-Hour Heatmap</p>
          <p className="text-xs text-slate-400">
            Peak hour: {String(hourlyBuckets.indexOf(maxHourValue)).padStart(2, "0")}:00 ({maxHourValue})
          </p>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
          {hourlyBuckets.map((count, hour) => {
            const ratio = count / maxHourValue;
            const height = 18 + ratio * 46;
            const isActive = hour === activeHour;

            return (
              <button
                key={hour}
                type="button"
                title={`${String(hour).padStart(2, "0")}:00 - ${count} visits`}
                onClick={() => setSelectedHour(hour)}
                className={`p-2 rounded-xl border transition-colors ${isActive ? "border-emerald-400/60 bg-emerald-500/10" : "border-white/10 bg-slate-950/40 hover:bg-slate-900/60"}`}
              >
                <div className="h-14 flex items-end justify-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height }}
                    transition={{ duration: 0.4, delay: hour * 0.01 }}
                    className="w-3 rounded-full bg-gradient-to-t from-emerald-500/40 to-emerald-300"
                  />
                </div>
                <p className="mt-1 text-[10px] font-mono text-slate-400">{String(hour).padStart(2, "0")}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-xs text-slate-300 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-emerald-400" />
          {String(activeHour).padStart(2, "0")}:00 - {String(activeHour).padStart(2, "0")}:59 recorded {hourlyBuckets[activeHour] || 0} visits.
        </div>
      </div>
    </section>
  );
}

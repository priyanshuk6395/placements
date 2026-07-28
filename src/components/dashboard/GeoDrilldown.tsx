"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Globe2, MapPinned } from "lucide-react";
import { useMemo, useState } from "react";

interface GeoDrilldownProps {
  logs: any[];
}

type Level = "country" | "region" | "city";

interface Bucket {
  key: string;
  count: number;
}

const KNOWN_COUNTRY_CODES: Record<string, string> = {
  india: "IN",
  "united states": "US",
  usa: "US",
  uk: "GB",
  "united kingdom": "GB",
  germany: "DE",
  france: "FR",
  canada: "CA",
  australia: "AU",
  uae: "AE",
};

function toIsoCountryCode(country: string): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();

  const fromKnown = KNOWN_COUNTRY_CODES[trimmed.toLowerCase()];
  if (fromKnown) return fromKnown;
  return null;
}

function countryFlag(country: string): string {
  const code = toIsoCountryCode(country);
  if (!code) return "🌐";

  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.toUpperCase().charCodeAt(0)),
  );
}

function sanitizeValue(value: unknown, fallback: string) {
  const s = String(value || "").trim();
  if (!s || s.toLowerCase() === "unknown") return fallback;
  return s;
}

function rankBuckets(items: Map<string, number>): Bucket[] {
  return Array.from(items.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);
}

export default function GeoDrilldown({ logs }: GeoDrilldownProps) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const countryBuckets = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const country = sanitizeValue(log.country, "Local");
      counts.set(country, (counts.get(country) || 0) + 1);
    }
    return rankBuckets(counts);
  }, [logs]);

  const regionBuckets = useMemo(() => {
    if (!selectedCountry) return [];
    const counts = new Map<string, number>();

    for (const log of logs) {
      const country = sanitizeValue(log.country, "Local");
      if (country !== selectedCountry) continue;

      const region = sanitizeValue(log.region, "Unknown Region");
      counts.set(region, (counts.get(region) || 0) + 1);
    }

    return rankBuckets(counts);
  }, [logs, selectedCountry]);

  const cityBuckets = useMemo(() => {
    if (!selectedCountry || !selectedRegion) return [];
    const counts = new Map<string, number>();

    for (const log of logs) {
      const country = sanitizeValue(log.country, "Local");
      const region = sanitizeValue(log.region, "Unknown Region");
      if (country !== selectedCountry || region !== selectedRegion) continue;

      const city = sanitizeValue(log.city, "Unknown City");
      counts.set(city, (counts.get(city) || 0) + 1);
    }

    return rankBuckets(counts);
  }, [logs, selectedCountry, selectedRegion]);

  const level: Level = selectedRegion ? "city" : selectedCountry ? "region" : "country";

  const activeBuckets =
    level === "country" ? countryBuckets : level === "region" ? regionBuckets : cityBuckets;

  const maxCount = Math.max(1, ...activeBuckets.map((item) => item.count));

  const onBack = () => {
    if (level === "city") {
      setSelectedRegion(null);
      return;
    }
    if (level === "region") {
      setSelectedCountry(null);
    }
  };

  return (
    <section className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl shadow-sm min-h-[420px] flex flex-col">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <MapPinned className="w-4 h-4 text-cyan-400" /> Geographic Drilldown
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {level === "country" && "Tap a country to explore regions and cities."}
            {level === "region" && `Viewing regions in ${selectedCountry}.`}
            {level === "city" && `Viewing cities in ${selectedRegion}, ${selectedCountry}.`}
          </p>
        </div>

        {level !== "country" && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider text-slate-200"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400 min-h-6">
        <Globe2 className="w-4 h-4" />
        <span>
          {selectedCountry || "All Countries"}
          {selectedRegion ? ` / ${selectedRegion}` : ""}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={level + (selectedCountry || "") + (selectedRegion || "")}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.24 }}
            className="space-y-2 h-full overflow-y-auto pr-1"
          >
            {activeBuckets.length === 0 ? (
              <div className="h-full grid place-items-center text-slate-500 text-sm">
                No geographic data for this scope.
              </div>
            ) : (
              activeBuckets.map((item) => {
                const ratio = (item.count / maxCount) * 100;
                const canDrill = level !== "city";

                const handleSelect = () => {
                  if (level === "country") {
                    setSelectedCountry(item.key);
                    setSelectedRegion(null);
                  } else if (level === "region") {
                    setSelectedRegion(item.key);
                  }
                };

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={canDrill ? handleSelect : undefined}
                    className="w-full relative text-left p-3 rounded-2xl border border-white/10 bg-slate-950/50 hover:bg-slate-900/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    aria-label={`${item.key} ${item.count} visits${canDrill ? ", drill down" : ""}`}
                  >
                    <motion.div
                      layoutId={`geo-bar-${level}-${item.key}`}
                      className="absolute inset-y-0 left-0 rounded-2xl bg-gradient-to-r from-cyan-500/25 to-transparent"
                      style={{ width: `${ratio}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-2">
                        {level === "country" ? (
                          <span className="text-lg leading-none">{countryFlag(item.key)}</span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        )}
                        <span className="truncate text-sm font-semibold text-slate-100">{item.key}</span>
                      </div>
                      <span className="text-xs font-black text-cyan-300">{item.count}</span>
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

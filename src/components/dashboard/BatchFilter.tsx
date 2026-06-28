"use client";
import { useRouter, useSearchParams } from 'next/navigation';

export default function BatchFilter({ years, current }: { years: number[], current: number }) {
  const router = useRouter();

  return (
    <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-white/10 shadow-sm">
      {years.map(year => (
        <button
          key={year}
          onClick={() => router.push(`/admin?batchYear=${year}`)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            current === year ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:text-primary"
          }`}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
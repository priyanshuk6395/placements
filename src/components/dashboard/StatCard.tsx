"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ title, value, suffix, icon: Icon, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative p-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl dark:shadow-none dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 overflow-hidden group"
    >
      {/* Subtle background glow effect using the passed color prop */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-5 dark:opacity-10 blur-2xl group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity ${color.replace('text-', 'bg-')}`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 ${color}`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h4 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            {value}
          </h4>
          {suffix && (
            <span className="text-sm md:text-base font-bold text-slate-400 dark:text-slate-500 mb-1">
              {suffix}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
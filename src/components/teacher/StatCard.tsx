"use client";

import {
  LucideIcon,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendType = "neutral",
}: StatCardProps) {
  const trendStyles = {
    up: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    down: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    neutral:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-black/20">
      {/* Decorative background */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/5 transition-transform duration-500 group-hover:scale-150" />

      <div className="relative">
        {/* Icon + trend */}
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Icon size={21} strokeWidth={2.2} />
          </div>

          {trend && (
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${trendStyles[trendType]}`}
            >
              {trendType === "up" && (
                <ArrowUpRight size={13} />
              )}

              {trendType === "down" && (
                <ArrowDownRight size={13} />
              )}

              {trend}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <h3 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>

          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
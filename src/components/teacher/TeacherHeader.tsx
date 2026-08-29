"use client";

import {
  Bell,
  Menu,
  Search,
  ChevronDown,
} from "lucide-react";

interface TeacherHeaderProps {
  onMenuClick?: () => void;
}

export default function TeacherHeader({
  onMenuClick,
}: TeacherHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-[82px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        {/* Page title */}
        <div className="hidden min-w-0 sm:block">
          <p className="text-xs font-medium text-slate-400">
            Academic Management
          </p>

          <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">
            Teacher Portal
          </h2>
        </div>

        {/* Search */}
        <div className="relative ml-auto hidden w-full max-w-md md:block">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            placeholder="Search students, subjects..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900/70 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search */}
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button
            type="button"
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell size={20} />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-950" />
          </button>

          <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />

          {/* Teacher profile */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">
              T
            </div>

            <div className="hidden text-left sm:block">
              <p className="max-w-[120px] truncate text-sm font-semibold text-slate-800 dark:text-white">
                Teacher
              </p>

              <p className="text-[11px] text-slate-400">
                Faculty
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 sm:block"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
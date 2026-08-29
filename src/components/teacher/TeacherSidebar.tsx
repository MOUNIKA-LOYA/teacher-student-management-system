"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  FileCheck2,
  GraduationCap,
  Award,
  CalendarDays,
  Megaphone,
  Bell,
  LogOut,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface TeacherSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/teacher/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    href: "/teacher/students",
    icon: Users,
  },
  {
    label: "Subjects",
    href: "/teacher/subjects",
    icon: BookOpen,
  },
  {
    label: "Attendance",
    href: "/teacher/attendance",
    icon: ClipboardCheck,
  },
  {
    label: "Assignments",
    href: "/teacher/assignments",
    icon: FileText,
  },
  {
    label: "Submissions",
    href: "/teacher/submissions",
    icon: FileCheck2,
  },
  {
    label: "Examinations",
    href: "/teacher/examinations",
    icon: GraduationCap,
  },
  {
    label: "Marks",
    href: "/teacher/marks",
    icon: Award,
  },
  {
    label: "Timetable",
    href: "/teacher/timetable",
    icon: CalendarDays,
  },
  {
    label: "Announcements",
    href: "/teacher/announcements",
    icon: Megaphone,
  },
  {
    label: "Notifications",
    href: "/teacher/notifications",
    icon: Bell,
  },
];

export default function TeacherSidebar({
  mobileOpen = false,
  onClose,
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[280px]
          flex-col overflow-hidden
          border-r border-slate-200
          bg-white/95 shadow-xl backdrop-blur-xl
          transition-transform duration-300
          dark:border-slate-800 dark:bg-slate-950/95
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Brand */}
        <div className="flex h-[82px] items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Link
            href="/teacher/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <GraduationCap size={25} />
            </div>

            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">
                EduManage
              </h1>

              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Teacher Portal
              </p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Teacher profile */}
        <div className="mx-4 mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-violet-950/30">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-md">
              T
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                Teacher
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Faculty Member
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 overflow-y-auto px-4 pb-4">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href ||
                (item.href !== "/teacher/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center gap-3 rounded-xl px-3 py-3
                    text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                    }
                  `}
                >
                  <Icon
                    size={19}
                    className={
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-500"
                    }
                  />

                  <span>{item.label}</span>

                  {item.label === "Notifications" && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      3
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <LogOut
              size={19}
              className="text-slate-400 group-hover:text-red-500"
            />

            <span>Logout</span>
          </button>

          <p className="mt-4 px-3 text-[10px] text-slate-400">
            Teacher Portal • v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
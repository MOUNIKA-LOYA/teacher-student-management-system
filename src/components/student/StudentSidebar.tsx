"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  UserCircle,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type StudentSidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: UserCircle,
  },
  {
    label: "Subjects",
    href: "/student/subjects",
    icon: BookOpen,
  },
  {
    label: "Attendance",
    href: "/student/attendance",
    icon: CheckCircle2,
  },
  {
    label: "Assignments",
    href: "/student/assignments",
    icon: ClipboardList,
  },
  {
    label: "Exams & Marks",
    href: "/student/exams",
    icon: Award,
  },
  {
    label: "Timetable",
    href: "/student/timetable",
    icon: CalendarDays,
  },
  {
    label: "Announcements",
    href: "/student/announcements",
    icon: Megaphone,
  },
  {
    label: "Notifications",
    href: "/student/notifications",
    icon: Bell,
  },
];

export default function StudentSidebar({
  open,
  onClose,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    onClose();

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="font-bold text-white">
                EduManage
              </h1>

              <p className="text-xs text-slate-500">
                Student Portal
              </p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Academic */}
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Academic
          </p>

          <div className="space-y-1">
            {navigation.slice(0, 7).map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-blue-500/20 to-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Communication */}
          <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Communication
          </p>

          <div className="space-y-1">
            {navigation.slice(7).map((item) => {
              const Icon = item.icon;

              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-r from-blue-500/20 to-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />

                  <span>{item.label}</span>

                  {item.label === "Notifications" && (
                    <span className="ml-auto rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300">
                      0
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Account */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400">
              <UserCircle className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Student
              </p>

              <p className="truncate text-xs text-slate-500">
                Student Account
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
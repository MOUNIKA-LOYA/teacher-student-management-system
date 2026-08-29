"use client";

import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

const stats = [
  {
    title: "Total Students",
    value: "248",
    change: "+12",
    description: "from last semester",
    icon: Users,
  },
  {
    title: "My Subjects",
    value: "6",
    change: "Active",
    description: "subjects assigned",
    icon: BookOpen,
  },
  {
    title: "Assignments",
    value: "18",
    change: "+5",
    description: "created this semester",
    icon: FileText,
  },
  {
    title: "Attendance",
    value: "92.4%",
    change: "+2.4%",
    description: "average attendance",
    icon: ClipboardCheck,
  },
];

const assignments = [
  {
    title: "Data Structures Assignment",
    subject: "Data Structures",
    submissions: "42 / 48 submitted",
    status: "Active",
    icon: FileText,
  },
  {
    title: "Database Management Task",
    subject: "Database Management",
    submissions: "38 / 45 submitted",
    status: "Active",
    icon: FileText,
  },
  {
    title: "Web Development Project",
    subject: "Web Technologies",
    submissions: "31 / 40 submitted",
    status: "Review",
    icon: FileCheck2,
  },
];

const schedule = [
  {
    time: "09:00 AM",
    subject: "Data Structures",
    className: "CSE - A",
    room: "Room 204",
  },
  {
    time: "11:00 AM",
    subject: "Database Management",
    className: "CSE - B",
    room: "Lab 3",
  },
  {
    time: "02:00 PM",
    subject: "Web Technologies",
    className: "IT - A",
    room: "Room 105",
  },
];

export default function TeacherDashboard() {
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Welcome banner */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 text-white shadow-xl shadow-indigo-200/60 sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 right-48 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute right-12 top-10 hidden h-36 w-36 items-center justify-center rounded-[32px] border border-white/10 bg-white/10 backdrop-blur md:flex">
            <GraduationCap className="h-20 w-20 text-white/90" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Academic Year 2026–27
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Good morning, Teacher! 👋
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
              Welcome back to your teaching workspace. Here&apos;s an overview
              of your academic activities and today&apos;s schedule.
            </p>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-125" />

                <div className="relative flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      stat.change === "Active"
                        ? "bg-indigo-50 text-indigo-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>

                <div className="relative mt-5">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Main grid */}
        <section className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          {/* Assignments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  Academic Activity
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Recent Assignments
                </h2>
              </div>

              <button
                onClick={() => router.push("/teacher/assignments")}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                View all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {assignments.map((assignment) => {
                const Icon = assignment.icon;

                return (
                  <div
                    key={assignment.title}
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/40"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {assignment.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {assignment.subject} • {assignment.submissions}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`ml-3 shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        assignment.status === "Review"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's schedule */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  Today
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Class Schedule
                </h2>
              </div>

              <CalendarDays className="h-6 w-6 text-indigo-500" />
            </div>

            <div className="mt-6 space-y-3">
              {schedule.map((item, index) => (
                <div
                  key={`${item.time}-${item.subject}`}
                  className="relative flex gap-4 rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        index === 0 ? "bg-indigo-600" : "bg-slate-300"
                      }`}
                    />

                    {index !== schedule.length - 1 && (
                      <div className="mt-1 h-full w-px bg-slate-200" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-indigo-600">
                      {item.time}
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {item.subject}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {item.className} • {item.room}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/teacher/timetable")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Clock3 className="h-4 w-4" />
              View Full Timetable
            </button>
          </div>
        </section>

        {/* Bottom section */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Attendance
                </p>

                <p className="text-xs text-slate-400">
                  Today&apos;s attendance
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold text-slate-900">92.4%</p>

                <p className="text-xs font-semibold text-emerald-600">
                  Excellent
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: "92.4%" }}
                />
              </div>
            </div>

            <button
              onClick={() => router.push("/teacher/attendance")}
              className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Manage attendance →
            </button>
          </div>

          {/* Submissions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <FileCheck2 className="h-5 w-5 text-amber-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Pending Reviews
                </p>

                <p className="text-xs text-slate-400">
                  Assignment submissions
                </p>
              </div>
            </div>

            <p className="mt-6 text-3xl font-bold text-slate-900">27</p>

            <p className="mt-1 text-sm text-slate-400">
              submissions waiting for review
            </p>

            <button
              onClick={() => router.push("/teacher/submissions")}
              className="mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Review submissions →
            </button>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Quick Actions
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Manage Academics
            </h2>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickAction
                icon={Users}
                label="Students"
                onClick={() => router.push("/teacher/students")}
              />

              <QuickAction
                icon={BookOpen}
                label="Subjects"
                onClick={() => router.push("/teacher/subjects")}
              />

              <QuickAction
                icon={ClipboardCheck}
                label="Attendance"
                onClick={() => router.push("/teacher/attendance")}
              />

              <QuickAction
                icon={GraduationCap}
                label="Exams"
                onClick={() => router.push("/teacher/examinations")}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
        <Icon className="h-4 w-4 text-indigo-600 transition group-hover:scale-110" />
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-700">{label}</p>
    </button>
  );
}
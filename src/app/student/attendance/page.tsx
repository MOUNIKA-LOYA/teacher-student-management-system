"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Menu,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: "present" | "absent" | "late";
  subject: {
    id: string;
    subject_name: string;
    subject_code: string;
  } | null;
};

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadAttendance() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view your attendance.");
          return;
        }

        const { data, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            id,
            attendance_date,
            status,
            subjects (
              id,
              subject_name,
              subject_code
            )
          `)
          .eq("student_id", user.id)
          .order("attendance_date", {
            ascending: false,
          });

        if (attendanceError) {
          console.error(
            "Attendance loading error:",
            attendanceError
          );

          setError("Unable to load your attendance.");
          return;
        }

        const formattedRecords: AttendanceRecord[] = [];

        for (const row of data ?? []) {
          const subject = row.subjects;

          formattedRecords.push({
            id: row.id,
            attendance_date: row.attendance_date,
            status: row.status,
            subject:
              subject && !Array.isArray(subject)
                ? subject
                : null,
          });
        }

        setRecords(formattedRecords);
      } catch (err) {
        console.error(
          "Unexpected attendance error:",
          err
        );

        setError(
          "Something went wrong while loading your attendance."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAttendance();
  }, []);

  const totalClasses = records.length;

  const presentCount = records.filter(
    (record) => record.status === "present"
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "absent"
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "late"
  ).length;

  const attendancePercentage =
    totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex h-20 items-center px-5 sm:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open student menu"
              className="mr-4 rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm text-slate-500">
                Student Portal
              </p>

              <h1 className="text-xl font-bold text-white">
                Attendance
              </h1>
            </div>
          </div>
        </header>

        {/* Page */}
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Academic
                  </p>

                  <h2 className="text-2xl font-bold">
                    My Attendance
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Track your attendance records across all your
                subjects.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your attendance...
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
                <p className="text-sm font-medium text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Attendance content */}
            {!loading && !error && (
              <>
                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Overall Attendance"
                    value={`${attendancePercentage}%`}
                    description="Overall attendance"
                    icon={<CalendarDays className="h-5 w-5" />}
                  />

                  <StatCard
                    title="Present"
                    value={String(presentCount)}
                    description="Classes attended"
                    icon={<CheckCircle2 className="h-5 w-5" />}
                  />

                  <StatCard
                    title="Absent"
                    value={String(absentCount)}
                    description="Classes missed"
                    icon={<XCircle className="h-5 w-5" />}
                  />

                  <StatCard
                    title="Late"
                    value={String(lateCount)}
                    description="Late arrivals"
                    icon={<Clock3 className="h-5 w-5" />}
                  />
                </div>

                {/* Records */}
                <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <div className="border-b border-white/10 px-6 py-5">
                    <h3 className="font-semibold text-white">
                      Attendance Records
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Your latest attendance records.
                    </p>
                  </div>

                  {records.length === 0 ? (
                    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10">
                        <CalendarDays className="h-7 w-7 text-cyan-400" />
                      </div>

                      <h4 className="text-lg font-semibold text-white">
                        No attendance records
                      </h4>

                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Your attendance records will appear here
                        once your teachers start marking attendance.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="hidden overflow-x-auto md:block">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10 text-left">
                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Date
                              </th>

                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Subject
                              </th>

                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Code
                              </th>

                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Status
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {records.map((record) => (
                              <tr
                                key={record.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                              >
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  {formatDate(
                                    record.attendance_date
                                  )}
                                </td>

                                <td className="px-6 py-4">
                                  <p className="text-sm font-medium text-white">
                                    {record.subject
                                      ?.subject_name ||
                                      "Unknown Subject"}
                                  </p>
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {record.subject
                                    ?.subject_code || "—"}
                                </td>

                                <td className="px-6 py-4">
                                  <StatusBadge
                                    status={record.status}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="space-y-3 p-4 md:hidden">
                        {records.map((record) => (
                          <div
                            key={record.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-white">
                                  {record.subject
                                    ?.subject_name ||
                                    "Unknown Subject"}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {record.subject
                                    ?.subject_code || "—"}
                                </p>
                              </div>

                              <StatusBadge
                                status={record.status}
                              />
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                              <CalendarDays className="h-4 w-4" />

                              {formatDate(
                                record.attendance_date
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-400/20 hover:bg-white/[0.05]">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {title}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-400">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "present" | "absent" | "late";
}) {
  if (status === "present") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Present
      </span>
    );
  }

  if (status === "absent") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-medium text-red-300">
        <XCircle className="h-3.5 w-3.5" />
        Absent
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
      <Clock3 className="h-3.5 w-3.5" />
      Late
    </span>
  );
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
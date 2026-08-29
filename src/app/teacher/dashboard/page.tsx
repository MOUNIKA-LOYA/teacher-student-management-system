"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
  GraduationCap,
  CalendarDays,
  Clock,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  students: number;
  subjects: number;
  assignments: number;
  attendance: number;
  exams: number;
}

interface Assignment {
  id: string;
  title: string;
  due_date: string | null;
  subject_id: string;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string;
}

export default function TeacherDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    subjects: 0,
    assignments: 0,
    attendance: 0,
    exams: 0,
  });

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [teacherName, setTeacherName] = useState("Teacher");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = createClient();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------
      // 1. Check logged-in user
      // --------------------------------------------------

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // --------------------------------------------------
      // 2. Get teacher profile
      // --------------------------------------------------

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      if (profile?.role && profile.role !== "teacher") {
        router.replace("/login");
        return;
      }

      if (profile?.full_name) {
        setTeacherName(profile.full_name);
      }

      // --------------------------------------------------
      // 3. Get subjects count
      // --------------------------------------------------

      const { count: subjectCount, error: subjectError } = await supabase
        .from("subjects")
        .select("id", {
          count: "exact",
          head: true,
        });

      if (subjectError) {
        console.error("Subjects error:", subjectError);
      }

      // --------------------------------------------------
      // 4. Get students
      //
      // We count unique student IDs from student_subjects
      // because teachers currently have access to this table.
      // --------------------------------------------------

      const { data: studentSubjectRows, error: studentError } =
        await supabase
          .from("student_subjects")
          .select("student_id");

      if (studentError) {
        console.error("Student subjects error:", studentError);
      }

      const uniqueStudentIds = new Set(
        (studentSubjectRows ?? [])
          .map((row) => row.student_id)
          .filter(Boolean)
      );

      // --------------------------------------------------
      // 5. Get assignments count
      // --------------------------------------------------

      const { count: assignmentCount, error: assignmentCountError } =
        await supabase
          .from("assignments")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (assignmentCountError) {
        console.error(
          "Assignments count error:",
          assignmentCountError
        );
      }

      // --------------------------------------------------
      // 6. Get exams count
      // --------------------------------------------------

      const { count: examCount, error: examCountError } =
        await supabase
          .from("exams")
          .select("id", {
            count: "exact",
            head: true,
          });

      if (examCountError) {
        console.error("Exams error:", examCountError);
      }

      // --------------------------------------------------
      // 7. Get attendance
      // --------------------------------------------------

      const { data: attendanceRows, error: attendanceError } =
        await supabase
          .from("attendance")
          .select("status");

      if (attendanceError) {
        console.error("Attendance error:", attendanceError);
      }

      let attendancePercentage = 0;

      if (attendanceRows && attendanceRows.length > 0) {
        const presentCount = attendanceRows.filter((row) => {
          const status = String(row.status).toLowerCase();

          return (
            status === "present" ||
            status === "p" ||
            status === "late"
          );
        }).length;

        attendancePercentage = Math.round(
          (presentCount / attendanceRows.length) * 1000
        ) / 10;
      }

      // --------------------------------------------------
      // 8. Get recent assignments
      // --------------------------------------------------

      const { data: assignmentRows, error: assignmentsError } =
        await supabase
          .from("assignments")
          .select("id, title, due_date, subject_id")
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

      if (assignmentsError) {
        console.error(
          "Recent assignments error:",
          assignmentsError
        );
      }

      // --------------------------------------------------
      // 9. Get subjects for assignment display
      // --------------------------------------------------

      const { data: subjectRows, error: subjectsError } =
        await supabase
          .from("subjects")
          .select("id, subject_name, subject_code")
          .order("subject_name", {
            ascending: true,
          });

      if (subjectsError) {
        console.error(
          "Subject list error:",
          subjectsError
        );
      }

      // --------------------------------------------------
      // 10. Update state
      // --------------------------------------------------

      setStats({
        students: uniqueStudentIds.size,
        subjects: subjectCount ?? 0,
        assignments: assignmentCount ?? 0,
        attendance: attendancePercentage,
        exams: examCount ?? 0,
      });

      setAssignments(assignmentRows ?? []);
      setSubjects(subjectRows ?? []);
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(
      (item) => item.id === subjectId
    );

    return subject?.subject_name ?? "Subject";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-56 rounded-3xl bg-slate-200 dark:bg-slate-800" />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // Dashboard
  // --------------------------------------------------

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 text-white shadow-xl shadow-indigo-500/20 sm:p-9">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Academic Year 2026–27
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Good morning, {teacherName}! 👋
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
              Welcome back to your teaching workspace.
              Here&apos;s a quick overview of your academic
              activities.
            </p>
          </div>

          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/5" />

          <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 lg:flex">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur">
              <GraduationCap size={58} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Students */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Users size={23} />
              </div>

              <ArrowUpRight
                size={18}
                className="text-emerald-500 opacity-70"
              />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Students
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.students}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Enrolled students
            </p>
          </div>

          {/* Subjects */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <BookOpen size={23} />
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Active
              </span>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              Subjects
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.subjects}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Available subjects
            </p>
          </div>

          {/* Assignments */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <FileText size={23} />
              </div>

              <ArrowUpRight
                size={18}
                className="text-emerald-500 opacity-70"
              />
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              Assignments
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.assignments}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Created assignments
            </p>
          </div>

          {/* Attendance */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ClipboardCheck size={23} />
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                Average
              </span>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              Attendance
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {stats.attendance}%
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Overall attendance
            </p>
          </div>
        </section>

        {/* Lower Section */}
        <section className="grid gap-6 lg:grid-cols-3">

          {/* Recent Assignments */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recent Assignments
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Latest assignments created
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/teacher/assignments")}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                View all
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {assignments.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <FileText
                    size={36}
                    className="mx-auto text-slate-300 dark:text-slate-700"
                  />

                  <p className="mt-3 text-sm font-medium text-slate-500">
                    No assignments yet
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push("/teacher/assignments")
                    }
                    className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Create Assignment
                  </button>
                </div>
              ) : (
                assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <FileText size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                        {assignment.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {getSubjectName(assignment.subject_id)}
                      </p>
                    </div>

                    <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
                      <Clock size={14} />
                      {formatDate(assignment.due_date)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Academic Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <GraduationCap size={21} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">
                  Academic Overview
                </h2>

                <p className="text-xs text-slate-400">
                  Current academic activity
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">

              {/* Exams */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400">
                    <GraduationCap size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Examinations
                    </p>

                    <p className="text-xs text-slate-400">
                      Scheduled exams
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats.exams}
                </span>
              </div>

              {/* Assignments */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-400">
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Assignments
                    </p>

                    <p className="text-xs text-slate-400">
                      Total created
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {stats.assignments}
                </span>
              </div>

              {/* Attendance */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                    <ClipboardCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Attendance
                    </p>

                    <p className="text-xs text-slate-400">
                      Overall percentage
                    </p>
                  </div>
                </div>

                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.attendance}%
                </span>
              </div>

              {/* Timetable */}
              <button
                type="button"
                onClick={() =>
                  router.push("/teacher/timetable")
                }
                className="flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      Timetable
                    </p>

                    <p className="text-xs text-slate-400">
                      View teaching schedule
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={18}
                  className="text-slate-400"
                />
              </button>
            </div>
          </div>
        </section>

        {/* Refresh */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-700 dark:hover:text-indigo-400"
          >
            <RefreshCw size={15} />
            Refresh Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
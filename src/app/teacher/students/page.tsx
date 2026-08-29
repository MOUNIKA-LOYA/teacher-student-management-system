"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Mail,
  Search,
  Users,
  RefreshCw,
  UserRound,
  BookOpen,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Student = {
  id: string;
  full_name: string;
  email: string;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = async (isRefresh = false) => {
    const supabase = createClient();

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      // Make sure the teacher is authenticated
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      // Get all student profiles
      const { data, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .order("full_name", { ascending: true });

      if (studentsError) {
        throw studentsError;
      }

      setStudents(data ?? []);
    } catch (err: unknown) {
      console.error("Failed to load students:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load students. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
      );
    });
  }, [students, search]);

  const totalStudents = students.length;

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <Users size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Management
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              View and manage students enrolled in your academic classes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadStudents(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Students
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? "—" : totalStudents}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Registered students
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Users size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Student Enrollments
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  —
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Subject enrollments
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                <BookOpen size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Student Records
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? "—" : totalStudents}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Available profiles
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <UserRound size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Card header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Students
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? `${filteredStudents.length} student${
                      filteredStudents.length === 1 ? "" : "s"
                    } found`
                  : `${students.length} student${
                      students.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search students..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to load students
                </p>

                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />

                      <div className="flex-1">
                        <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />

                        <div className="mt-2 h-3 w-56 rounded bg-slate-100 dark:bg-slate-800/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student list */}
          {!loading && !error && filteredStudents.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((student) => {
                const initial =
                  student.full_name?.trim().charAt(0).toUpperCase() || "S";

                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/50"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                        {initial}
                      </div>

                      {/* Student info */}
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                          {student.full_name || "Unnamed Student"}
                        </h3>

                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <Mail size={14} />

                          <span className="truncate">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 pl-16 sm:pl-0">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Active
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {!loading &&
            !error &&
            filteredStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  {search ? (
                    <Search size={28} />
                  ) : (
                    <Users size={28} />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {search
                    ? "No students found"
                    : "No students registered"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? "Try changing your search keywords."
                    : "Students registered in the system will appear here."}
                </p>

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
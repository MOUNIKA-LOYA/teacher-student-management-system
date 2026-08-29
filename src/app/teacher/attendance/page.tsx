"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Student = {
  id: string;
  full_name: string;
  email: string;
};

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type AttendanceStatus = "present" | "absent";

type AttendanceRecord = {
  id?: string;
  student_id: string;
  subject_id: string;
  attendance_date: string;
  status: AttendanceStatus;
};

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInitialData = async () => {
    const supabase = createClient();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
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

      const [studentsResult, subjectsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "student")
          .order("full_name", { ascending: true }),

        supabase
          .from("subjects")
          .select("id, subject_name, subject_code")
          .order("subject_name", { ascending: true }),
      ]);

      if (studentsResult.error) {
        throw studentsResult.error;
      }

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      setStudents(studentsResult.data ?? []);
      setSubjects(subjectsResult.data ?? []);

      if (
        subjectsResult.data &&
        subjectsResult.data.length > 0
      ) {
        setSelectedSubject((current) =>
          current || subjectsResult.data[0].id
        );
      }
    } catch (err: unknown) {
      console.error("Failed to load attendance data:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadAttendance = async () => {
    if (!selectedSubject || !selectedDate) {
      return;
    }

    const supabase = createClient();

    setLoadingAttendance(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: attendanceError } = await supabase
        .from("attendance")
        .select(
          "id, student_id, subject_id, attendance_date, status"
        )
        .eq("subject_id", selectedSubject)
        .eq("attendance_date", selectedDate);

      if (attendanceError) {
        throw attendanceError;
      }

      const existing: Record<string, AttendanceStatus> = {};

      for (const record of data ?? []) {
        if (
          record.status === "present" ||
          record.status === "absent"
        ) {
          existing[record.student_id] = record.status;
        }
      }

      const defaultAttendance: Record<
        string,
        AttendanceStatus
      > = {};

      for (const student of students) {
        defaultAttendance[student.id] =
          existing[student.id] ?? "present";
      }

      setAttendance(defaultAttendance);
    } catch (err: unknown) {
      console.error("Failed to load attendance:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance."
      );
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (!loading && selectedSubject && selectedDate) {
      loadAttendance();
    }
  }, [selectedSubject, selectedDate, loading]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return students;
    }

    return students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query)
    );
  }, [students, search]);

  const presentCount = students.filter(
    (student) => attendance[student.id] === "present"
  ).length;

  const absentCount = students.filter(
    (student) => attendance[student.id] === "absent"
  ).length;

  const markStudent = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    setAttendance((current) => ({
      ...current,
      [studentId]: status,
    }));

    setSuccess("");
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};

    for (const student of students) {
      updated[student.id] = status;
    }

    setAttendance(updated);
    setSuccess("");
  };

  const saveAttendance = async () => {
    if (!selectedSubject) {
      setError("Please select a subject.");
      return;
    }

    if (!selectedDate) {
      setError("Please select a date.");
      return;
    }

    if (students.length === 0) {
      setError("There are no students to mark attendance for.");
      return;
    }

    const supabase = createClient();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const records: AttendanceRecord[] = students.map(
        (student) => ({
          student_id: student.id,
          subject_id: selectedSubject,
          attendance_date: selectedDate,
          status: attendance[student.id] ?? "present",
        })
      );

      /*
       * First check whether attendance already exists.
       * Existing records are updated.
       * Missing records are inserted.
       */

      const { data: existingRecords, error: existingError } =
        await supabase
          .from("attendance")
          .select(
            "id, student_id, subject_id, attendance_date, status"
          )
          .eq("subject_id", selectedSubject)
          .eq("attendance_date", selectedDate);

      if (existingError) {
        throw existingError;
      }

      const existingByStudent = new Map(
        (existingRecords ?? []).map((record) => [
          record.student_id,
          record,
        ])
      );

      const updates = records.filter((record) =>
        existingByStudent.has(record.student_id)
      );

      const inserts = records.filter(
        (record) => !existingByStudent.has(record.student_id)
      );

      if (updates.length > 0) {
        for (const record of updates) {
          const existing = existingByStudent.get(
            record.student_id
          );

          if (!existing?.id) {
            continue;
          }

          const { error: updateError } = await supabase
            .from("attendance")
            .update({
              status: record.status,
            })
            .eq("id", existing.id);

          if (updateError) {
            throw updateError;
          }
        }
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("attendance")
          .insert(inserts);

        if (insertError) {
          throw insertError;
        }
      }

      setSuccess(
        `Attendance saved successfully for ${students.length} student${
          students.length === 1 ? "" : "s"
        }.`
      );

      await loadAttendance();
    } catch (err: unknown) {
      console.error("Failed to save attendance:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <ClipboardCheck size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Attendance Management
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Mark and manage daily student attendance.
            </p>
          </div>

          <button
            type="button"
            onClick={loadInitialData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Controls */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-5 md:grid-cols-2">

            {/* Subject */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Subject
              </label>

              <select
                value={selectedSubject}
                onChange={(event) =>
                  setSelectedSubject(event.target.value)
                }
                disabled={loading || subjects.length === 0}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {subjects.length === 0 ? (
                  <option value="">
                    No subjects available
                  </option>
                ) : (
                  subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.subject_name} (
                      {subject.subject_code})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Attendance Date
              </label>

              <div className="relative">
                <CalendarDays
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) =>
                    setSelectedDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Attendance Error
              </p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <p>{success}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Students
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {loading ? "—" : students.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Users size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Present
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {presentCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Check size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Absent
                </p>

                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                  {absentCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                <X size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* Attendance table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Table header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {selectedDate}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* Search */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search students..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 sm:w-64 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Mark all */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAll("present")}
                  disabled={students.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  <Check size={15} />
                  All Present
                </button>

                <button
                  type="button"
                  onClick={() => markAll("absent")}
                  disabled={students.length === 0}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                >
                  <X size={15} />
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {(loading || loadingAttendance) && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading attendance...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !loadingAttendance &&
            students.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Users size={28} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  No students found
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  There are currently no student profiles available.
                </p>
              </div>
            )}

          {/* No search results */}
          {!loading &&
            !loadingAttendance &&
            students.length > 0 &&
            filteredStudents.length === 0 && (
              <div className="px-6 py-16 text-center">
                <Search
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
                  No matching students
                </h3>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Try a different search term.
                </p>
              </div>
            )}

          {/* Students */}
          {!loading &&
            !loadingAttendance &&
            filteredStudents.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((student, index) => {
                  const status =
                    attendance[student.id] ?? "present";

                  return (
                    <div
                      key={student.id}
                      className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/40"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                          {student.full_name
                            .charAt(0)
                            .toUpperCase() || index + 1}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                            {student.full_name}
                          </h3>

                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                            {student.email}
                          </p>
                        </div>
                      </div>

                      {/* Status buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            markStudent(
                              student.id,
                              "present"
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            status === "present"
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          <Check size={17} />
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            markStudent(
                              student.id,
                              "absent"
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            status === "absent"
                              ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          <XCircle size={17} />
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* Save */}
          {!loading &&
            !loadingAttendance &&
            students.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {presentCount} Present
                  </span>

                  <span className="mx-2">•</span>

                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {absentCount} Absent
                  </span>
                </div>

                <button
                  type="button"
                  onClick={saveAttendance}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving
                    ? "Saving Attendance..."
                    : "Save Attendance"}
                </button>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
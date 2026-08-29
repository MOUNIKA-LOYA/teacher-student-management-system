"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Loader2,
  Menu,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type TimetableRecord = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: {
    id: string;
    subject_name: string;
    subject_code: string;
  } | null;
};

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function StudentTimetablePage() {
  const [records, setRecords] = useState<TimetableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadTimetable() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view your timetable."
          );
          return;
        }

        // Get subjects assigned to this student
        const { data: enrollments, error: enrollmentError } =
          await supabase
            .from("student_subjects")
            .select("subject_id")
            .eq("student_id", user.id);

        if (enrollmentError) {
          console.error(enrollmentError);

          setError(
            "Unable to load your enrolled subjects."
          );
          return;
        }

        const subjectIds =
          enrollments?.map(
            (item) => item.subject_id
          ) ?? [];

        // No enrolled subjects means no timetable entries
        if (subjectIds.length === 0) {
          setRecords([]);
          return;
        }

        // Get timetable entries for the student's subjects
        const { data, error: timetableError } =
          await supabase
            .from("timetable")
            .select(`
              id,
              day_of_week,
              start_time,
              end_time,
              subjects (
                id,
                subject_name,
                subject_code
              )
            `)
            .in("subject_id", subjectIds);

        if (timetableError) {
          console.error(timetableError);

          setError("Unable to load your timetable.");
          return;
        }

        const formattedRecords: TimetableRecord[] = [];

        for (const row of data ?? []) {
          const subject = row.subjects;

          formattedRecords.push({
            id: row.id,
            day_of_week: row.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            subject:
              subject && !Array.isArray(subject)
                ? subject
                : null,
          });
        }

        formattedRecords.sort((a, b) => {
          const dayA = getDayIndex(a.day_of_week);
          const dayB = getDayIndex(b.day_of_week);

          if (dayA !== dayB) {
            return dayA - dayB;
          }

          return a.start_time.localeCompare(
            b.start_time
          );
        });

        setRecords(formattedRecords);
      } catch (err) {
        console.error(err);

        setError(
          "Something went wrong while loading your timetable."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, []);

  const groupedRecords = useMemo(() => {
    const groups: Record<string, TimetableRecord[]> = {};

    for (const day of days) {
      groups[day] = [];
    }

    for (const record of records) {
      const normalizedDay = normalizeDay(
        record.day_of_week
      );

      if (!groups[normalizedDay]) {
        groups[normalizedDay] = [];
      }

      groups[normalizedDay].push(record);
    }

    return groups;
  }, [records]);

  const scheduledDays = days.filter(
    (day) => groupedRecords[day]?.length > 0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

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
                Timetable
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
                    My Timetable
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                View your weekly class schedule for the subjects
                you are enrolled in.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your timetable...
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

            {/* Empty */}
            {!loading &&
              !error &&
              scheduledDays.length === 0 && (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <CalendarDays className="h-8 w-8 text-cyan-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    No timetable available
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Your timetable will appear here when classes
                    are scheduled for your enrolled subjects.
                  </p>
                </div>
              )}

            {/* Timetable */}
            {!loading &&
              !error &&
              scheduledDays.length > 0 && (
                <div className="space-y-6">
                  {days.map((day) => {
                    const dayRecords =
                      groupedRecords[day] ?? [];

                    if (dayRecords.length === 0) {
                      return null;
                    }

                    return (
                      <section
                        key={day}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
                      >
                        {/* Day header */}
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {day}
                            </h3>

                            <p className="mt-1 text-xs text-slate-600">
                              {dayRecords.length}{" "}
                              {dayRecords.length === 1
                                ? "class"
                                : "classes"}
                            </p>
                          </div>

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                            <CalendarDays className="h-5 w-5 text-cyan-400" />
                          </div>
                        </div>

                        {/* Classes */}
                        <div className="divide-y divide-white/5">
                          {dayRecords.map((record) => (
                            <article
                              key={record.id}
                              className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:p-6"
                            >
                              {/* Time */}
                              <div className="flex w-full shrink-0 items-center gap-3 sm:w-40">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                                  <Clock3 className="h-5 w-5 text-blue-400" />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-white">
                                    {formatTime(
                                      record.start_time
                                    )}
                                  </p>

                                  <p className="text-xs text-slate-600">
                                    to{" "}
                                    {formatTime(
                                      record.end_time
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Subject */}
                              <div className="min-w-0 flex-1">
                                <h4 className="text-lg font-semibold text-white">
                                  {record.subject
                                    ?.subject_name ||
                                    "Unknown Subject"}
                                </h4>

                                <p className="mt-1 text-sm text-cyan-300">
                                  {record.subject
                                    ?.subject_code || "—"}
                                </p>
                              </div>

                              {/* Duration */}
                              <div className="hidden text-right sm:block">
                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                  Duration
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                  {calculateDuration(
                                    record.start_time,
                                    record.end_time
                                  )}
                                </p>
                              </div>
                            </article>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}

function normalizeDay(day: string) {
  const value = day.trim().toLowerCase();

  const mapping: Record<string, string> = {
    monday: "Monday",
    mon: "Monday",
    tuesday: "Tuesday",
    tue: "Tuesday",
    tues: "Tuesday",
    wednesday: "Wednesday",
    wed: "Wednesday",
    thursday: "Thursday",
    thu: "Thursday",
    thurs: "Thursday",
    friday: "Friday",
    fri: "Friday",
    saturday: "Saturday",
    sat: "Saturday",
    sunday: "Sunday",
    sun: "Sunday",
  };

  return mapping[value] || day;
}

function getDayIndex(day: string) {
  const normalized = normalizeDay(day);

  const index = days.indexOf(normalized);

  return index === -1 ? 999 : index;
}

function formatTime(time: string) {
  const [hoursString, minutesString] = time
    .split(":");

  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDuration(
  start: string,
  end: string
) {
  const [startHours, startMinutes] = start
    .split(":")
    .map(Number);

  const [endHours, endMinutes] = end
    .split(":")
    .map(Number);

  if (
    Number.isNaN(startHours) ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endHours) ||
    Number.isNaN(endMinutes)
  ) {
    return "—";
  }

  let startTotal =
    startHours * 60 + startMinutes;

  let endTotal =
    endHours * 60 + endMinutes;

  if (endTotal < startTotal) {
    endTotal += 24 * 60;
  }

  const duration = endTotal - startTotal;

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}
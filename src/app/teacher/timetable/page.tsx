"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type TimetableEntry = {
  id: string;
  subject_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subjects?: Subject | null;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function TimetablePage() {
  const [entries, setEntries] = useState<
    TimetableEntry[]
  >([]);

  const [subjects, setSubjects] = useState<
    Subject[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] =
    useState("All");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    subject_id: "",
    day_of_week: "Monday",
    start_time: "09:00",
    end_time: "10:00",
  });

  const loadData = async () => {
    const supabase = createClient();

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const [timetableResult, subjectsResult] =
        await Promise.all([
          supabase
            .from("timetable")
            .select(
              `
                id,
                subject_id,
                day_of_week,
                start_time,
                end_time,
                subjects (
                  id,
                  subject_name,
                  subject_code
                )
              `
            )
            .order("day_of_week")
            .order("start_time"),

          supabase
            .from("subjects")
            .select(
              "id, subject_name, subject_code"
            )
            .order("subject_name"),
        ]);

      if (timetableResult.error) {
        throw timetableResult.error;
      }

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      setEntries(
        (timetableResult.data ??
          []) as unknown as TimetableEntry[]
      );

      setSubjects(
        (subjectsResult.data ??
          []) as Subject[]
      );
    } catch (err: unknown) {
      console.error(
        "Failed to load timetable:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load timetable."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);

    setForm({
      subject_id: subjects[0]?.id ?? "",
      day_of_week: "Monday",
      start_time: "09:00",
      end_time: "10:00",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (
    entry: TimetableEntry
  ) => {
    setEditingId(entry.id);

    setForm({
      subject_id: entry.subject_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId(null);
  };

  const saveEntry = async () => {
    setError("");
    setSuccess("");

    if (!form.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!form.start_time || !form.end_time) {
      setError(
        "Please select both start and end time."
      );
      return;
    }

    if (form.start_time >= form.end_time) {
      setError(
        "End time must be later than start time."
      );
      return;
    }

    const supabase = createClient();

    setSaving(true);

    try {
      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("timetable")
            .update({
              subject_id: form.subject_id,
              day_of_week: form.day_of_week,
              start_time: form.start_time,
              end_time: form.end_time,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Timetable entry updated successfully."
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("timetable")
            .insert({
              subject_id: form.subject_id,
              day_of_week: form.day_of_week,
              start_time: form.start_time,
              end_time: form.end_time,
            });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Timetable entry created successfully."
        );
      }

      setShowModal(false);
      setEditingId(null);

      await loadData();
    } catch (err: unknown) {
      console.error(
        "Failed to save timetable:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save timetable entry."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this timetable entry?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const supabase = createClient();

    try {
      const { error: deleteError } =
        await supabase
          .from("timetable")
          .delete()
          .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(
        "Timetable entry deleted successfully."
      );

      await loadData();
    } catch (err: unknown) {
      console.error(
        "Failed to delete timetable:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete timetable entry."
      );
    }
  };

  const filteredEntries = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return entries.filter((entry) => {
      const subjectName =
        entry.subjects?.subject_name ?? "";

      const subjectCode =
        entry.subjects?.subject_code ?? "";

      const matchesSearch =
        !query ||
        subjectName
          .toLowerCase()
          .includes(query) ||
        subjectCode
          .toLowerCase()
          .includes(query) ||
        entry.day_of_week
          .toLowerCase()
          .includes(query);

      const matchesDay =
        selectedDay === "All" ||
        entry.day_of_week === selectedDay;

      return matchesSearch && matchesDay;
    });
  }, [
    entries,
    search,
    selectedDay,
  ]);

  const groupedEntries = useMemo(() => {
    const grouped: Record<
      string,
      TimetableEntry[]
    > = {};

    DAYS.forEach((day) => {
      grouped[day] = [];
    });

    filteredEntries.forEach((entry) => {
      if (!grouped[entry.day_of_week]) {
        grouped[entry.day_of_week] = [];
      }

      grouped[entry.day_of_week].push(
        entry
      );
    });

    Object.keys(grouped).forEach((day) => {
      grouped[day].sort((a, b) =>
        a.start_time.localeCompare(
          b.start_time
        )
      );
    });

    return grouped;
  }, [filteredEntries]);

  const formatTime = (time: string) => {
    const [hours, minutes] =
      time.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const totalEntries = entries.length;

  const activeDays = new Set(
    entries.map(
      (entry) => entry.day_of_week
    )
  ).size;

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <CalendarDays size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Timetable
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Manage your weekly academic timetable.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              disabled={subjects.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Add Timetable
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && !showModal && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {success && !showModal && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading timetable...
            </div>
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total Classes"
                value={totalEntries}
                icon={
                  <CalendarDays size={21} />
                }
              />

              <StatCard
                label="Active Days"
                value={activeDays}
                icon={<Clock3 size={21} />}
              />

              <StatCard
                label="Subjects"
                value={subjects.length}
                icon={
                  <BookOpenIcon />
                }
              />
            </div>

            {/* Filters */}
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search subject, code or day..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <select
                  value={selectedDay}
                  onChange={(event) =>
                    setSelectedDay(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="All">
                    All Days
                  </option>

                  {DAYS.map((day) => (
                    <option
                      key={day}
                      value={day}
                    >
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Timetable */}
            {filteredEntries.length === 0 ? (
              <section className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <CalendarDays size={28} />
                </div>

                <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                  No timetable entries
                </h2>

                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {search ||
                  selectedDay !== "All"
                    ? "Try changing your filters."
                    : "Create your first timetable entry to get started."}
                </p>

                {!search &&
                  selectedDay ===
                    "All" &&
                  subjects.length > 0 && (
                    <button
                      type="button"
                      onClick={
                        openCreateModal
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                    >
                      <Plus size={17} />
                      Add Timetable
                    </button>
                  )}
              </section>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {DAYS.map((day) => {
                  const dayEntries =
                    groupedEntries[day] ??
                    [];

                  if (
                    selectedDay !==
                      "All" &&
                    selectedDay !== day
                  ) {
                    return null;
                  }

                  return (
                    <section
                      key={day}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4 dark:border-slate-800 dark:from-indigo-950/30 dark:to-violet-950/20">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                            <CalendarDays
                              size={19}
                            />
                          </div>

                          <div>
                            <h2 className="font-bold text-slate-900 dark:text-white">
                              {day}
                            </h2>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {dayEntries.length}{" "}
                              {dayEntries.length ===
                              1
                                ? "class"
                                : "classes"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Entries */}
                      <div className="p-4">
                        {dayEntries.length ===
                        0 ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-700">
                            <p className="text-sm text-slate-400">
                              No classes scheduled
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dayEntries.map(
                              (entry) => (
                                <div
                                  key={
                                    entry.id
                                  }
                                  className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-950/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/20"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400">
                                        <Clock3
                                          size={
                                            18
                                          }
                                        />
                                      </div>

                                      <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                          {entry
                                            .subjects
                                            ?.subject_name ??
                                            "Unknown Subject"}
                                        </h3>

                                        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                          {entry
                                            .subjects
                                            ?.subject_code ??
                                            "N/A"}
                                        </p>

                                        <p className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                          {formatTime(
                                            entry.start_time
                                          )}{" "}
                                          –{" "}
                                          {formatTime(
                                            entry.end_time
                                          )}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex shrink-0 gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openEditModal(
                                            entry
                                          )
                                        }
                                        className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800"
                                        aria-label="Edit timetable"
                                      >
                                        <Edit3
                                          size={
                                            16
                                          }
                                        />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          deleteEntry(
                                            entry.id
                                          )
                                        }
                                        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                        aria-label="Delete timetable"
                                      >
                                        <Trash2
                                          size={
                                            16
                                          }
                                        />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingId
                      ? "Edit Timetable"
                      : "Add Timetable"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Configure the class schedule.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-5 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Subject
                  </label>

                  <select
                    value={
                      form.subject_id
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        subject_id:
                          event.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      Select subject
                    </option>

                    {subjects.map(
                      (subject) => (
                        <option
                          key={subject.id}
                          value={
                            subject.id
                          }
                        >
                          {
                            subject.subject_name
                          }{" "}
                          (
                          {
                            subject.subject_code
                          }
                          )
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Day
                  </label>

                  <select
                    value={
                      form.day_of_week
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        day_of_week:
                          event.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {DAYS.map((day) => (
                      <option
                        key={day}
                        value={day}
                      >
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={
                        form.start_time
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          start_time:
                            event.target
                              .value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      End Time
                    </label>

                    <input
                      type="time"
                      value={
                        form.end_time
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          end_time:
                            event.target
                              .value,
                        })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveEntry}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update"
                      : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <CalendarDays size={21} />
  );
}
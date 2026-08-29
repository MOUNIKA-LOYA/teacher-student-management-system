"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
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

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  subjects?: {
    subject_name: string;
    subject_code: string;
  } | null;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [search, setSearch] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        throw new Error("Your session has expired. Please sign in again.");
      }

      const [assignmentsResult, subjectsResult] = await Promise.all([
        supabase
          .from("assignments")
          .select(
            `
              id,
              title,
              description,
              subject_id,
              due_date,
              created_at,
              updated_at,
              subjects (
                subject_name,
                subject_code
              )
            `
          )
          .order("due_date", {
            ascending: true,
            nullsFirst: false,
          }),

        supabase
          .from("subjects")
          .select("id, subject_name, subject_code")
          .order("subject_name", {
            ascending: true,
          }),
      ]);

      if (assignmentsResult.error) {
        throw assignmentsResult.error;
      }

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      setAssignments(
        (assignmentsResult.data ?? []) as unknown as Assignment[]
      );

      setSubjects(subjectsResult.data ?? []);

      if (!subjectId && subjectsResult.data?.length) {
        setSubjectId(subjectsResult.data[0].id);
      }
    } catch (err: unknown) {
      console.error("Failed to load assignments:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setEditingId(null);

    if (subjects.length > 0) {
      setSubjectId(subjects[0].id);
    } else {
      setSubjectId("");
    }
  };

  const openCreateForm = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (assignment: Assignment) => {
    setEditingId(assignment.id);
    setTitle(assignment.title);
    setDescription(assignment.description ?? "");
    setSubjectId(assignment.subject_id);

    if (assignment.due_date) {
      setDueDate(
        new Date(assignment.due_date)
          .toISOString()
          .slice(0, 16)
      );
    } else {
      setDueDate("");
    }

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter an assignment title.");
      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    const supabase = createClient();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const assignmentData = {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId,
        due_date: dueDate
          ? new Date(dueDate).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("assignments")
          .update(assignmentData)
          .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess("Assignment updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("assignments")
          .insert({
            ...assignmentData,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess("Assignment created successfully.");
      }

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (err: unknown) {
      console.error("Failed to save assignment:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save assignment."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    setDeleting(id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase
        .from("assignments")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setAssignments((current) =>
        current.filter((assignment) => assignment.id !== id)
      );

      setSuccess("Assignment deleted successfully.");
    } catch (err: unknown) {
      console.error("Failed to delete assignment:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete assignment."
      );
    } finally {
      setDeleting(null);
    }
  };

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const subjectName =
        assignment.subjects?.subject_name ?? "";

      const subjectCode =
        assignment.subjects?.subject_code ?? "";

      return (
        assignment.title.toLowerCase().includes(query) ||
        (assignment.description ?? "")
          .toLowerCase()
          .includes(query) ||
        subjectName.toLowerCase().includes(query) ||
        subjectCode.toLowerCase().includes(query)
      );
    });
  }, [assignments, search]);

  const formatDueDate = (date: string | null) => {
    if (!date) {
      return "No due date";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;

    return new Date(date).getTime() < Date.now();
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <FileText size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assignments
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create and manage assignments for your students.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={18} />
              New Assignment
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Assignment Error
              </p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

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
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Assignments
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {assignments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {subjects.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Upcoming
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {
                assignments.filter(
                  (assignment) =>
                    assignment.due_date &&
                    !isOverdue(assignment.due_date)
                ).length
              }
            </p>
          </div>
        </div>

        {/* Assignment List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                All Assignments
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredAssignments.length} assignment
                {filteredAssignments.length === 1 ? "" : "s"} found
              </p>
            </div>

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
                placeholder="Search assignments..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 sm:w-72 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Loading assignments...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && filteredAssignments.length === 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                <FileText size={28} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                {search
                  ? "No matching assignments"
                  : "No assignments yet"}
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? "Try changing your search term."
                  : "Create your first assignment to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  <Plus size={17} />
                  Create Assignment
                </button>
              )}
            </div>
          )}

          {/* Cards */}
          {!loading && filteredAssignments.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {assignment.title}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <BookOpen size={13} />

                            {assignment.subjects?.subject_name ??
                              "Unknown Subject"}

                            {assignment.subjects?.subject_code
                              ? ` (${assignment.subjects.subject_code})`
                              : ""}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              isOverdue(assignment.due_date)
                                ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            }`}
                          >
                            <CalendarDays size={13} />
                            {formatDueDate(
                              assignment.due_date
                            )}
                          </span>
                        </div>

                        {assignment.description && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(assignment)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAssignment(assignment.id)
                        }
                        disabled={
                          deleting === assignment.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                      >
                        {deleting === assignment.id ? (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={16} />
                        )}

                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingId
                    ? "Edit Assignment"
                    : "Create Assignment"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingId
                    ? "Update the assignment details."
                    : "Create a new assignment for your students."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Assignment Title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Data Structures Unit 1"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </label>

                <select
                  value={subjectId}
                  onChange={(event) =>
                    setSubjectId(event.target.value)
                  }
                  disabled={subjects.length === 0}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  required
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

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Enter assignment instructions..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Due date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Due Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    subjects.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Assignment"
                      : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
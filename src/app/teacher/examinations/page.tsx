"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
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

type Exam = {
  id: string;
  title: string;
  subject_id: string;
  exam_date: string;
  total_marks: number;
  created_at: string | null;
  updated_at: string | null;
  subjects?: Subject | null;
};

type ExamForm = {
  title: string;
  subject_id: string;
  exam_date: string;
  total_marks: string;
};

const emptyForm: ExamForm = {
  title: "",
  subject_id: "",
  exam_date: "",
  total_marks: "",
};

export default function ExaminationsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [form, setForm] = useState<ExamForm>(emptyForm);

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
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const [subjectsResult, examsResult] =
        await Promise.all([
          supabase
            .from("subjects")
            .select(
              "id, subject_name, subject_code"
            )
            .order("subject_name", {
              ascending: true,
            }),

          supabase
            .from("exams")
            .select(
              `
                id,
                title,
                subject_id,
                exam_date,
                total_marks,
                created_at,
                updated_at,
                subjects (
                  id,
                  subject_name,
                  subject_code
                )
              `
            )
            .order("exam_date", {
              ascending: true,
            }),
        ]);

      if (subjectsResult.error) {
        throw subjectsResult.error;
      }

      if (examsResult.error) {
        throw examsResult.error;
      }

      setSubjects(
        (subjectsResult.data ?? []) as Subject[]
      );

      setExams(
        (examsResult.data ?? []) as unknown as Exam[]
      );
    } catch (err: unknown) {
      console.error(
        "Failed to load examinations:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load examinations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return exams;
    }

    return exams.filter((exam) => {
      const title =
        exam.title?.toLowerCase() ?? "";

      const subjectName =
        exam.subjects?.subject_name?.toLowerCase() ??
        "";

      const subjectCode =
        exam.subjects?.subject_code?.toLowerCase() ??
        "";

      return (
        title.includes(query) ||
        subjectName.includes(query) ||
        subjectCode.includes(query)
      );
    });
  }, [exams, search]);

  const upcomingCount = useMemo(() => {
    const now = new Date();

    return exams.filter(
      (exam) => new Date(exam.exam_date) >= now
    ).length;
  }, [exams]);

  const openCreateModal = () => {
    setEditingExam(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (exam: Exam) => {
    const date = new Date(exam.exam_date);

    const localDateTime =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0") +
      "T" +
      String(date.getHours()).padStart(2, "0") +
      ":" +
      String(date.getMinutes()).padStart(2, "0");

    setEditingExam(exam);

    setForm({
      title: exam.title,
      subject_id: exam.subject_id,
      exam_date: localDateTime,
      total_marks: String(exam.total_marks),
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingExam(null);
    setForm(emptyForm);
    setError("");
  };

  const handleChange = (
    field: keyof ExamForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const saveExam = async () => {
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Please enter an examination title.");
      return;
    }

    if (!form.subject_id) {
      setError("Please select a subject.");
      return;
    }

    if (!form.exam_date) {
      setError("Please select the examination date.");
      return;
    }

    if (!form.total_marks.trim()) {
      setError("Please enter total marks.");
      return;
    }

    const totalMarks = Number(form.total_marks);

    if (!Number.isFinite(totalMarks)) {
      setError("Total marks must be a valid number.");
      return;
    }

    if (totalMarks <= 0) {
      setError("Total marks must be greater than 0.");
      return;
    }

    const examDate = new Date(form.exam_date);

    if (Number.isNaN(examDate.getTime())) {
      setError("Please enter a valid examination date.");
      return;
    }

    const supabase = createClient();

    setSaving(true);

    try {
      if (editingExam) {
        const { error: updateError } =
          await supabase
            .from("exams")
            .update({
              title: form.title.trim(),
              subject_id: form.subject_id,
              exam_date: examDate.toISOString(),
              total_marks: totalMarks,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", editingExam.id);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Examination updated successfully."
        );
      } else {
        const { error: insertError } =
          await supabase.from("exams").insert({
            title: form.title.trim(),
            subject_id: form.subject_id,
            exam_date: examDate.toISOString(),
            total_marks: totalMarks,
          });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Examination created successfully."
        );
      }

      setShowModal(false);
      setEditingExam(null);
      setForm(emptyForm);

      await loadData();
    } catch (err: unknown) {
      console.error(
        "Failed to save examination:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save examination."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (exam: Exam) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${exam.title}"?`
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    setDeletingId(exam.id);
    setError("");
    setSuccess("");

    try {
      const { error: deleteError } =
        await supabase
          .from("exams")
          .delete()
          .eq("id", exam.id);

      if (deleteError) {
        throw deleteError;
      }

      setExams((current) =>
        current.filter(
          (item) => item.id !== exam.id
        )
      );

      setSuccess(
        "Examination deleted successfully."
      );
    } catch (err: unknown) {
      console.error(
        "Failed to delete examination:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete examination."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const isUpcoming = (date: string) => {
    return new Date(date) >= new Date();
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <GraduationCap size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Examinations
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create and manage examinations for your students.
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
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              New Examination
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && !showModal && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Examination Error
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Examinations
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {exams.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <GraduationCap size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Subjects
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {subjects.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <BookOpen size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Upcoming
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {upcomingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Clock size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* Examination List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                All Examinations
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredExams.length} examination
                {filteredExams.length === 1
                  ? ""
                  : "s"} found
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
                placeholder="Search examinations..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 sm:w-72 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                Loading examinations...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            filteredExams.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <GraduationCap size={28} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {search
                    ? "No examinations found"
                    : "No examinations yet"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? "Try changing your search."
                    : "Create your first examination to get started."}
                </p>

                {!search && (
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    <Plus size={17} />
                    Create Examination
                  </button>
                )}
              </div>
            )}

          {/* Cards */}
          {!loading &&
            filteredExams.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* Exam Info */}
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                          <GraduationCap size={22} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {exam.title}
                            </h3>

                            <span
                              className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                                isUpcoming(
                                  exam.exam_date
                                )
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {isUpcoming(
                                exam.exam_date
                              )
                                ? "Upcoming"
                                : "Completed"}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                              <BookOpen size={13} />
                              {exam.subjects
                                ?.subject_name ||
                                "Unknown Subject"}

                              {exam.subjects
                                ?.subject_code
                                ? ` (${exam.subjects.subject_code})`
                                : ""}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              <CalendarDays
                                size={13}
                              />
                              {formatDate(
                                exam.exam_date
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600 dark:bg-violet-950/30 dark:text-violet-400">
                              {exam.total_marks} marks
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(exam)
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteExam(exam)
                          }
                          disabled={
                            deletingId === exam.id
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          {deletingId === exam.id ? (
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingExam
                    ? "Edit Examination"
                    : "Create Examination"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingExam
                    ? "Update the examination details."
                    : "Add a new examination for your students."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close modal"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5 p-6">

              {/* Error */}
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
                  Examination Title
                </label>

                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleChange(
                      "title",
                      event.target.value
                    )
                  }
                  placeholder="e.g. Mid Term Examination"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject
                </label>

                <select
                  value={form.subject_id}
                  onChange={(event) =>
                    handleChange(
                      "subject_id",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    Select a subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.subject_name} (
                      {subject.subject_code})
                    </option>
                  ))}
                </select>

                {subjects.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    No subjects are available. Create a subject first.
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Examination Date & Time
                </label>

                <input
                  type="datetime-local"
                  value={form.exam_date}
                  onChange={(event) =>
                    handleChange(
                      "exam_date",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Total Marks */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Total Marks
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.total_marks}
                  onChange={(event) =>
                    handleChange(
                      "total_marks",
                      event.target.value
                    )
                  }
                  placeholder="e.g. 100"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveExam}
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
                  ) : editingExam ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <Plus size={17} />
                  )}

                  {saving
                    ? "Saving..."
                    : editingExam
                      ? "Update Examination"
                      : "Create Examination"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
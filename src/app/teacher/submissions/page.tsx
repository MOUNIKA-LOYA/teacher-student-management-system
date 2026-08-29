"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  file_url: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  grade: number | null;
  feedback: string | null;
  assignments?: {
    title: string;
    subject_id: string;
    subjects?: {
      subject_name: string;
      subject_code: string;
    } | null;
  } | null;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSubmissions = async () => {
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

      const { data, error: submissionsError } = await supabase
        .from("assignment_submissions")
        .select(
          `
            id,
            assignment_id,
            student_id,
            submission_text,
            file_url,
            submitted_at,
            updated_at,
            grade,
            feedback,
            assignments (
              title,
              subject_id,
              subjects (
                subject_name,
                subject_code
              )
            ),
            profiles (
              full_name,
              email
            )
          `
        )
        .order("submitted_at", {
          ascending: false,
          nullsFirst: false,
        });

      if (submissionsError) {
        throw submissionsError;
      }

      setSubmissions(
        (data ?? []) as unknown as Submission[]
      );
    } catch (err: unknown) {
      console.error(
        "Failed to load submissions:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load submissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return submissions;
    }

    return submissions.filter((submission) => {
      const studentName =
        submission.profiles?.full_name ?? "";

      const studentEmail =
        submission.profiles?.email ?? "";

      const assignmentTitle =
        submission.assignments?.title ?? "";

      const subjectName =
        submission.assignments?.subjects?.subject_name ??
        "";

      const subjectCode =
        submission.assignments?.subjects?.subject_code ??
        "";

      return (
        studentName.toLowerCase().includes(query) ||
        studentEmail.toLowerCase().includes(query) ||
        assignmentTitle.toLowerCase().includes(query) ||
        subjectName.toLowerCase().includes(query) ||
        subjectCode.toLowerCase().includes(query)
      );
    });
  }, [submissions, search]);

  const gradedCount = submissions.filter(
    (submission) => submission.grade !== null
  ).length;

  const pendingCount =
    submissions.length - gradedCount;

  const openGradeModal = (submission: Submission) => {
    setSelectedSubmission(submission);

    setGrade(
      submission.grade !== null
        ? String(submission.grade)
        : ""
    );

    setFeedback(submission.feedback ?? "");

    setError("");
    setSuccess("");
  };

  const closeGradeModal = () => {
    if (saving) return;

    setSelectedSubmission(null);
    setGrade("");
    setFeedback("");
  };

  const saveGrade = async () => {
    if (!selectedSubmission) {
      return;
    }

    if (grade.trim() === "") {
      setError("Please enter a grade.");
      return;
    }

    const numericGrade = Number(grade);

    if (!Number.isFinite(numericGrade)) {
      setError("Grade must be a valid number.");
      return;
    }

    if (numericGrade < 0) {
      setError("Grade cannot be negative.");
      return;
    }

    const supabase = createClient();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("assignment_submissions")
        .update({
          grade: numericGrade,
          feedback:
            feedback.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSubmission.id);

      if (updateError) {
        throw updateError;
      }

      setSubmissions((current) =>
        current.map((submission) =>
          submission.id === selectedSubmission.id
            ? {
                ...submission,
                grade: numericGrade,
                feedback:
                  feedback.trim() || null,
                updated_at:
                  new Date().toISOString(),
              }
            : submission
        )
      );

      setSuccess(
        "Grade and feedback saved successfully."
      );

      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");
    } catch (err: unknown) {
      console.error(
        "Failed to update submission:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save grade."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <FileCheck2 size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assignment Submissions
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Review student submissions, assign grades, and provide feedback.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSubmissions}
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
        </div>

        {/* Alerts */}
        {error && !selectedSubmission && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Submission Error
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
                  Total Submissions
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {submissions.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <FileCheck2 size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Pending Review
                </p>

                <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <Clock size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Graded
                </p>

                <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {gradedCount}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Submissions
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {filteredSubmissions.length} submission
                {filteredSubmissions.length === 1
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
                placeholder="Search submissions..."
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
                Loading submissions...
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading &&
            filteredSubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <FileCheck2 size={28} />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {search
                    ? "No matching submissions"
                    : "No submissions yet"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? "Try changing your search term."
                    : "Student assignment submissions will appear here."}
                </p>
              </div>
            )}

          {/* Submission List */}
          {!loading &&
            filteredSubmissions.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubmissions.map(
                  (submission) => {
                    const studentName =
                      submission.profiles?.full_name ||
                      "Unknown Student";

                    const studentEmail =
                      submission.profiles?.email ||
                      "No email";

                    const assignmentTitle =
                      submission.assignments?.title ||
                      "Unknown Assignment";

                    const subjectName =
                      submission.assignments?.subjects
                        ?.subject_name ||
                      "Unknown Subject";

                    const subjectCode =
                      submission.assignments?.subjects
                        ?.subject_code ||
                      "";

                    const isGraded =
                      submission.grade !== null;

                    return (
                      <div
                        key={submission.id}
                        className="p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                          {/* Student + assignment */}
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                              {studentName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                  {studentName}
                                </h3>

                                <span
                                  className={`rounded-lg px-2 py-1 text-[11px] font-bold ${
                                    isGraded
                                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                                      : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                  }`}
                                >
                                  {isGraded
                                    ? "Graded"
                                    : "Pending Review"}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {studentEmail}
                              </p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                  <FileText size={13} />
                                  {assignmentTitle}
                                </span>

                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  <BookOpen size={13} />
                                  {subjectName}
                                  {subjectCode
                                    ? ` (${subjectCode})`
                                    : ""}
                                </span>
                              </div>

                              <p className="mt-3 text-xs text-slate-400">
                                Submitted:{" "}
                                {formatDate(
                                  submission.submitted_at
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Submission content + grade */}
                          <div className="flex flex-col gap-3 xl:min-w-[360px]">
                            {submission.submission_text && (
                              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                  Submission
                                </p>

                                <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                                  {submission.submission_text}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-3">
                              <div>
                                {isGraded ? (
                                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    Grade:{" "}
                                    {submission.grade}
                                  </p>
                                ) : (
                                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                    Awaiting review
                                  </p>
                                )}

                                {submission.file_url && (
                                  <a
                                    href={
                                      submission.file_url
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    View submitted file
                                  </a>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  openGradeModal(
                                    submission
                                  )
                                }
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                              >
                                <Pencil size={16} />

                                {isGraded
                                  ? "Edit Grade"
                                  : "Review"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </section>
      </div>

      {/* Grade Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Review Submission
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedSubmission.profiles
                    ?.full_name || "Student"}
                  {" • "}
                  {selectedSubmission.assignments
                    ?.title || "Assignment"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeGradeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <div className="space-y-5 p-6">

              {/* Student */}
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                <User
                  size={20}
                  className="text-indigo-500"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedSubmission.profiles
                      ?.full_name ||
                      "Unknown Student"}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedSubmission.profiles
                      ?.email || "No email"}
                  </p>
                </div>
              </div>

              {/* Assignment */}
              <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <FileText size={17} />
                  {selectedSubmission.assignments
                    ?.title || "Assignment"}
                </div>

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedSubmission.assignments
                    ?.subjects?.subject_name ||
                    "Unknown Subject"}
                </p>
              </div>

              {/* Submission text */}
              {selectedSubmission.submission_text && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Student Submission
                  </label>

                  <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {selectedSubmission.submission_text}
                  </div>
                </div>
              )}

              {/* File */}
              {selectedSubmission.file_url && (
                <div>
                  <a
                    href={selectedSubmission.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-400"
                  >
                    <FileText size={17} />
                    View Submitted File
                  </a>
                </div>
              )}

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

              {/* Grade */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Grade
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={grade}
                  onChange={(event) =>
                    setGrade(event.target.value)
                  }
                  placeholder="Enter marks"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Feedback */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <MessageSquare size={16} />
                  Feedback
                </label>

                <textarea
                  value={feedback}
                  onChange={(event) =>
                    setFeedback(event.target.value)
                  }
                  placeholder="Write feedback for the student..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeGradeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveGrade}
                  disabled={saving}
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
                    : "Save Grade & Feedback"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
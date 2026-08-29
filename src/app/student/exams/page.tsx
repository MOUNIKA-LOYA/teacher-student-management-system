"use client";

import { useEffect, useState } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Menu,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type SubjectData = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type ExamData = {
  id: string;
  title: string;
  exam_date: string;
  total_marks: number;
  subjects: SubjectData | SubjectData[] | null;
};

type MarkRow = {
  id: string;
  exam_id: string;
  marks_obtained: number | string;
  remarks: string | null;
  exams: ExamData | ExamData[] | null;
};

type ExamResult = {
  id: string;
  exam_id: string;
  marks_obtained: number;
  remarks: string | null;
  exam: {
    id: string;
    title: string;
    exam_date: string;
    total_marks: number;
    subject: SubjectData | null;
  } | null;
};

export default function StudentExamsPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view your exam results."
          );
          return;
        }

        const { data, error: resultsError } = await supabase
          .from("marks")
          .select(`
            id,
            exam_id,
            marks_obtained,
            remarks,
            exams (
              id,
              title,
              exam_date,
              total_marks,
              subjects (
                id,
                subject_name,
                subject_code
              )
            )
          `)
          .eq("student_id", user.id)
          .order("created_at", {
            ascending: false,
          });

        if (resultsError) {
          console.error(
            "Exam results loading error:",
            resultsError
          );

          setError("Unable to load your exam results.");
          return;
        }

        /*
         * Supabase may infer nested relations as `never`
         * when database TypeScript types are not generated.
         *
         * We know the exact structure from our database schema,
         * so we explicitly type the returned rows here.
         */
        const rows = (data ?? []) as unknown as MarkRow[];

        const formattedResults: ExamResult[] = rows.map(
          (row) => {
            const examValue = row.exams;

            const exam = Array.isArray(examValue)
              ? examValue[0] ?? null
              : examValue;

            let subject: SubjectData | null = null;

            if (exam) {
              const subjectValue = exam.subjects;

              subject = Array.isArray(subjectValue)
                ? subjectValue[0] ?? null
                : subjectValue;
            }

            return {
              id: row.id,
              exam_id: row.exam_id,
              marks_obtained: Number(
                row.marks_obtained
              ),
              remarks: row.remarks,
              exam: exam
                ? {
                    id: exam.id,
                    title: exam.title,
                    exam_date: exam.exam_date,
                    total_marks: Number(
                      exam.total_marks
                    ),
                    subject,
                  }
                : null,
            };
          }
        );

        setResults(formattedResults);
      } catch (err) {
        console.error(
          "Unexpected exam results error:",
          err
        );

        setError(
          "Something went wrong while loading your exam results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  const totalExams = results.length;

  const totalObtained = results.reduce(
    (sum, result) =>
      sum + result.marks_obtained,
    0
  );

  const totalMaximum = results.reduce(
    (sum, result) =>
      sum + (result.exam?.total_marks || 0),
    0
  );

  const averagePercentage =
    totalMaximum > 0
      ? Math.round(
          (totalObtained / totalMaximum) * 100
        )
      : 0;

  const highestPercentage =
    results.length > 0
      ? Math.max(
          ...results.map((result) =>
            result.exam?.total_marks
              ? (result.marks_obtained /
                  result.exam.total_marks) *
                100
              : 0
          )
        )
      : 0;

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
              onClick={() =>
                setSidebarOpen(true)
              }
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
                Exams & Marks
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
                  <Award className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Academic
                  </p>

                  <h2 className="text-2xl font-bold">
                    Exams & Marks
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                View your examination results, marks
                and performance across your subjects.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your exam results...
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

            {/* Results */}
            {!loading && !error && (
              <>
                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Exams"
                    value={String(totalExams)}
                    description="Exams with results"
                    icon={
                      <Award className="h-5 w-5" />
                    }
                  />

                  <StatCard
                    title="Average"
                    value={`${averagePercentage}%`}
                    description="Overall percentage"
                    icon={
                      <Trophy className="h-5 w-5" />
                    }
                  />

                  <StatCard
                    title="Marks Obtained"
                    value={String(totalObtained)}
                    description={`Out of ${totalMaximum}`}
                    icon={
                      <CheckCircle2 className="h-5 w-5" />
                    }
                  />

                  <StatCard
                    title="Best Result"
                    value={`${Math.round(
                      highestPercentage
                    )}%`}
                    description="Highest percentage"
                    icon={
                      <Trophy className="h-5 w-5" />
                    }
                  />
                </div>

                {/* Empty */}
                {results.length === 0 && (
                  <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                      <Award className="h-8 w-8 text-cyan-400" />
                    </div>

                    <h3 className="text-xl font-semibold text-white">
                      No exam results found
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Your examination results will
                      appear here once your teachers
                      publish your marks.
                    </p>
                  </div>
                )}

                {/* Results list */}
                {results.length > 0 && (
                  <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="border-b border-white/10 px-6 py-5">
                      <h3 className="font-semibold text-white">
                        Examination Results
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Your published examination marks.
                      </p>
                    </div>

                    {/* Desktop */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10 text-left">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Exam
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Subject
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Date
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Marks
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Percentage
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Remarks
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {results.map((result) => {
                            const percentage =
                              result.exam?.total_marks
                                ? (result.marks_obtained /
                                    result.exam.total_marks) *
                                  100
                                : 0;

                            return (
                              <tr
                                key={result.id}
                                className="border-b border-white/5 transition hover:bg-white/[0.02]"
                              >
                                <td className="px-6 py-5">
                                  <p className="font-medium text-white">
                                    {result.exam?.title ||
                                      "Unknown Exam"}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  <p className="text-sm font-medium text-slate-300">
                                    {result.exam?.subject
                                      ?.subject_name ||
                                      "Unknown Subject"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-600">
                                    {result.exam?.subject
                                      ?.subject_code || "—"}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <CalendarDays className="h-4 w-4" />

                                    {result.exam?.exam_date
                                      ? formatDate(
                                          result.exam.exam_date
                                        )
                                      : "—"}
                                  </div>
                                </td>

                                <td className="px-6 py-5">
                                  <span className="font-semibold text-white">
                                    {result.marks_obtained}
                                  </span>

                                  <span className="text-slate-600">
                                    {" "}
                                    /{" "}
                                    {result.exam?.total_marks ||
                                      0}
                                  </span>
                                </td>

                                <td className="px-6 py-5">
                                  <PercentageBadge
                                    percentage={percentage}
                                  />
                                </td>

                                <td className="max-w-xs px-6 py-5 text-sm text-slate-500">
                                  {result.remarks || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="space-y-4 p-4 md:hidden">
                      {results.map((result) => {
                        const percentage =
                          result.exam?.total_marks
                            ? (result.marks_obtained /
                                result.exam.total_marks) *
                              100
                            : 0;

                        return (
                          <article
                            key={result.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-semibold text-white">
                                  {result.exam?.title ||
                                    "Unknown Exam"}
                                </h4>

                                <p className="mt-1 text-sm text-cyan-300">
                                  {result.exam?.subject
                                    ?.subject_name ||
                                    "Unknown Subject"}
                                </p>

                                <p className="mt-1 text-xs text-slate-600">
                                  {result.exam?.subject
                                    ?.subject_code || "—"}
                                </p>
                              </div>

                              <PercentageBadge
                                percentage={percentage}
                              />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                  Marks
                                </p>

                                <p className="mt-1 font-semibold text-white">
                                  {result.marks_obtained}

                                  <span className="text-slate-600">
                                    {" "}
                                    /{" "}
                                    {result.exam?.total_marks ||
                                      0}
                                  </span>
                                </p>
                              </div>

                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                  Exam Date
                                </p>

                                <p className="mt-1 text-sm text-slate-300">
                                  {result.exam?.exam_date
                                    ? formatDate(
                                        result.exam.exam_date
                                      )
                                    : "—"}
                                </p>
                              </div>
                            </div>

                            {result.remarks && (
                              <div className="mt-4 border-t border-white/5 pt-4">
                                <p className="text-xs uppercase tracking-wider text-slate-600">
                                  Remarks
                                </p>

                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {result.remarks}
                                </p>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}
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

function PercentageBadge({
  percentage,
}: {
  percentage: number;
}) {
  let className =
    "border-red-400/20 bg-red-400/10 text-red-300";

  if (percentage >= 75) {
    className =
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  } else if (percentage >= 50) {
    className =
      "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {Math.round(percentage)}%
    </span>
  );
}

function formatDate(dateString: string) {
  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
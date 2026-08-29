"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Exam = {
  id: string;
  title: string;
  subject_id: string;
  exam_date: string;
  total_marks: number;
};

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
};

type Student = {
  id: string;
  full_name: string;
  email: string;
};

type Mark = {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type MarkRow = Mark & {
  exam?: Exam;
  subject?: Subject;
  student?: Student;
};

export default function MarksPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<MarkRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    exam_id: "",
    student_id: "",
    marks_obtained: "",
    remarks: "",
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

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      const [
        examsResult,
        subjectsResult,
        studentsResult,
        marksResult,
      ] = await Promise.all([
        supabase
          .from("exams")
          .select(
            "id, title, subject_id, exam_date, total_marks"
          )
          .order("exam_date", {
            ascending: false,
          }),

        supabase
          .from("subjects")
          .select(
            "id, subject_name, subject_code"
          )
          .order("subject_name"),

        supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "student")
          .order("full_name"),

        supabase
          .from("marks")
          .select(
            "id, exam_id, student_id, marks_obtained, remarks, created_at, updated_at"
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (examsResult.error) {
        throw new Error(
          `Failed to load exams: ${examsResult.error.message}`
        );
      }

      if (subjectsResult.error) {
        throw new Error(
          `Failed to load subjects: ${subjectsResult.error.message}`
        );
      }

      if (studentsResult.error) {
        throw new Error(
          `Failed to load students: ${studentsResult.error.message}`
        );
      }

      if (marksResult.error) {
        throw new Error(
          `Failed to load marks: ${marksResult.error.message}`
        );
      }

      const examData = (examsResult.data ??
        []) as Exam[];

      const subjectData = (subjectsResult.data ??
        []) as Subject[];

      const studentData = (studentsResult.data ??
        []) as Student[];

      const markData = (marksResult.data ??
        []) as Mark[];

      setExams(examData);
      setSubjects(subjectData);
      setStudents(studentData);

      const examMap = new Map(
        examData.map((exam) => [
          exam.id,
          exam,
        ])
      );

      const subjectMap = new Map(
        subjectData.map((subject) => [
          subject.id,
          subject,
        ])
      );

      const studentMap = new Map(
        studentData.map((student) => [
          student.id,
          student,
        ])
      );

      const enrichedMarks: MarkRow[] =
        markData.map((mark) => {
          const exam = examMap.get(mark.exam_id);

          return {
            ...mark,
            exam,
            subject: exam
              ? subjectMap.get(
                  exam.subject_id
                )
              : undefined,
            student: studentMap.get(
              mark.student_id
            ),
          };
        });

      setMarks(enrichedMarks);
    } catch (err: unknown) {
      console.error(
        "Failed to load marks:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load marks."
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
      exam_id: exams[0]?.id ?? "",
      student_id: students[0]?.id ?? "",
      marks_obtained: "",
      remarks: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (
    mark: MarkRow
  ) => {
    setEditingId(mark.id);

    setForm({
      exam_id: mark.exam_id,
      student_id: mark.student_id,
      marks_obtained:
        String(mark.marks_obtained),
      remarks: mark.remarks ?? "",
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

  const selectedExam = exams.find(
    (exam) => exam.id === form.exam_id
  );

  const saveMark = async () => {
    setError("");
    setSuccess("");

    if (!form.exam_id) {
      setError("Please select an examination.");
      return;
    }

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }

    if (form.marks_obtained.trim() === "") {
      setError(
        "Please enter the marks obtained."
      );
      return;
    }

    const marksObtained = Number(
      form.marks_obtained
    );

    if (!Number.isFinite(marksObtained)) {
      setError(
        "Marks obtained must be a valid number."
      );
      return;
    }

    if (marksObtained < 0) {
      setError(
        "Marks obtained cannot be negative."
      );
      return;
    }

    if (
      selectedExam &&
      marksObtained >
        Number(selectedExam.total_marks)
    ) {
      setError(
        `Marks cannot exceed ${selectedExam.total_marks}.`
      );
      return;
    }

    const supabase = createClient();

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("marks")
            .update({
              exam_id: form.exam_id,
              student_id:
                form.student_id,
              marks_obtained:
                marksObtained,
              remarks:
                form.remarks.trim() ||
                null,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Marks updated successfully."
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("marks")
            .insert({
              exam_id: form.exam_id,
              student_id:
                form.student_id,
              marks_obtained:
                marksObtained,
              remarks:
                form.remarks.trim() ||
                null,
            });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Marks added successfully."
        );
      }

      setShowModal(false);
      setEditingId(null);

      await loadData();
    } catch (err: unknown) {
      console.error(
        "Failed to save marks:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save marks."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredMarks = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return marks;

    return marks.filter((mark) => {
      const studentName =
        mark.student?.full_name
          ?.toLowerCase() ?? "";

      const studentEmail =
        mark.student?.email
          ?.toLowerCase() ?? "";

      const examTitle =
        mark.exam?.title
          ?.toLowerCase() ?? "";

      const subjectName =
        mark.subject?.subject_name
          ?.toLowerCase() ?? "";

      const subjectCode =
        mark.subject?.subject_code
          ?.toLowerCase() ?? "";

      return (
        studentName.includes(query) ||
        studentEmail.includes(query) ||
        examTitle.includes(query) ||
        subjectName.includes(query) ||
        subjectCode.includes(query)
      );
    });
  }, [marks, search]);

  const averageMarks =
    marks.length > 0
      ? marks.reduce(
          (sum, mark) =>
            sum +
            Number(mark.marks_obtained),
          0
        ) / marks.length
      : 0;

  const passedMarks = marks.filter(
    (mark) => {
      if (!mark.exam) return false;

      return (
        Number(mark.marks_obtained) >=
        Number(mark.exam.total_marks) *
          0.4
      );
    }
  ).length;

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Academic Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Marks
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Record and manage examination marks for students.
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
              disabled={
                exams.length === 0 ||
                students.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Add Marks
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

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Marks"
            value={marks.length}
          />

          <StatCard
            label="Average Marks"
            value={
              marks.length
                ? averageMarks.toFixed(1)
                : "0"
            }
          />

          <StatCard
            label="Passed"
            value={passedMarks}
          />
        </div>

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="relative">
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
              placeholder="Search by student, exam, or subject..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </section>

        {/* Marks table */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading marks...
            </div>
          </div>
        ) : filteredMarks.length === 0 ? (
          <section className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Plus size={28} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
              No marks found
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try changing your search."
                : "Add examination marks to see student results here."}
            </p>

            {!search &&
              exams.length > 0 &&
              students.length > 0 && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  <Plus size={17} />
                  Add Marks
                </button>
              )}
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Exam
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Marks
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Remarks
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredMarks.map(
                    (mark) => {
                      const total =
                        Number(
                          mark.exam
                            ?.total_marks ??
                            0
                        );

                      const obtained =
                        Number(
                          mark.marks_obtained
                        );

                      const percentage =
                        total > 0
                          ? (obtained /
                              total) *
                            100
                          : 0;

                      return (
                        <tr
                          key={mark.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {mark.student
                                ?.full_name ??
                                "Unknown Student"}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {mark.student
                                ?.email ?? ""}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {mark.exam
                                ?.title ??
                                "Unknown Exam"}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {mark.exam
                                ?.exam_date ?? ""}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800 dark:text-slate-200">
                              {mark.subject
                                ?.subject_name ??
                                "Unknown Subject"}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {mark.subject
                                ?.subject_code ??
                                ""}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {obtained}
                              {total
                                ? ` / ${total}`
                                : ""}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {percentage.toFixed(
                                1
                              )}
                              %
                            </div>
                          </td>

                          <td className="max-w-[220px] px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {mark.remarks ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  mark
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                              aria-label="Edit marks"
                            >
                              <Edit3
                                size={17}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </section>
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
                      ? "Edit Marks"
                      : "Add Marks"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Enter the student's examination result.
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

                {/* Exam */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Examination
                  </label>

                  <select
                    value={form.exam_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        exam_id:
                          event.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      Select examination
                    </option>

                    {exams.map((exam) => {
                      const subject =
                        subjects.find(
                          (item) =>
                            item.id ===
                            exam.subject_id
                        );

                      return (
                        <option
                          key={exam.id}
                          value={exam.id}
                        >
                          {exam.title} —{" "}
                          {subject
                            ?.subject_name ??
                            "Subject"}{" "}
                          — Total:{" "}
                          {exam.total_marks}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Student */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Student
                  </label>

                  <select
                    value={form.student_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        student_id:
                          event.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      Select student
                    </option>

                    {students.map(
                      (student) => (
                        <option
                          key={student.id}
                          value={student.id}
                        >
                          {student.full_name}{" "}
                          —{" "}
                          {student.email}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Marks */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Marks Obtained
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={
                      selectedExam?.total_marks ??
                      undefined
                    }
                    step="0.01"
                    value={
                      form.marks_obtained
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        marks_obtained:
                          event.target
                            .value,
                      })
                    }
                    placeholder={
                      selectedExam
                        ? `Maximum ${selectedExam.total_marks}`
                        : "Enter marks"
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  {selectedExam && (
                    <p className="mt-1 text-xs text-slate-400">
                      Maximum marks:{" "}
                      {
                        selectedExam.total_marks
                      }
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Remarks
                  </label>

                  <textarea
                    rows={3}
                    value={form.remarks}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        remarks:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Optional remarks..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer */}
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
                  onClick={saveMark}
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
                      ? "Update Marks"
                      : "Save Marks"}
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
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
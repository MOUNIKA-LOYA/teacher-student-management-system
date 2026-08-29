"use client";

import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Student = {
  id: string;
  full_name: string;
  email: string;
};

type StudentSubject = {
  student_id: string;
  subject_id: string;
  subjects:
    | {
        id: string;
        subject_name: string;
        subject_code: string;
      }
    | {
        id: string;
        subject_name: string;
        subject_code: string;
      }[]
    | null;
};

export default function StudentsPage() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<StudentSubject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      setError("");

      try {
        const { data: studentData, error: studentError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "student")
          .order("full_name");

        if (studentError) {
          console.error("Student loading error:", studentError);
          setError(studentError.message);
          return;
        }

        setStudents(studentData ?? []);

        const { data: subjectData, error: subjectError } = await supabase
          .from("student_subjects")
          .select(`
            student_id,
            subject_id,
            subjects (
              id,
              subject_name,
              subject_code
            )
          `);

        if (subjectError) {
          console.error("Subject loading error:", subjectError);
          return;
        }

        setStudentSubjects((subjectData ?? []) as StudentSubject[]);
      } catch (err) {
        console.error(err);
        setError("Unable to load students.");
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return students;
    }

    return students.filter(
      (student) =>
        student.full_name.toLowerCase().includes(value) ||
        student.email.toLowerCase().includes(value)
    );
  }, [students, search]);

  const getStudentSubjects = (studentId: string) => {
    return studentSubjects.filter(
      (item) => item.student_id === studentId
    );
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* Page heading */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 text-white shadow-xl shadow-indigo-200/50 sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Users className="h-6 w-6" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Student Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                View and manage students enrolled in your academic classes.
              </p>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 backdrop-blur md:flex">
              <GraduationCap className="h-14 w-14 text-white/90" />
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={Users}
            title="Total Students"
            value={students.length}
            description="Registered students"
          />

          <StatCard
            icon={BookOpen}
            title="Student Enrollments"
            value={studentSubjects.length}
            description="Subject enrollments"
          />

          <StatCard
            icon={GraduationCap}
            title="Student Records"
            value={students.length}
            description="Available profiles"
          />
        </section>

        {/* Search + list */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Students
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {filteredStudents.length} student
                  {filteredStudents.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="relative w-full lg:max-w-md">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

              <p className="mt-4 text-sm text-slate-400">
                Loading students...
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="p-8">
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="font-semibold text-red-700">
                  Unable to load students
                </p>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <p className="mt-3 text-xs text-red-500">
                  This may be caused by the existing Supabase RLS policies.
                  Do not change the policies yet.
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-5 font-semibold text-slate-800">
                No students found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Try changing your search.
              </p>
            </div>
          )}

          {/* Desktop table */}
          {!loading && !error && filteredStudents.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Student
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subjects
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const subjects = getStudentSubjects(student.id);

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-0 transition hover:bg-indigo-50/30"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-sm">
                              {student.full_name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-800">
                                {student.full_name}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Student
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {student.email}
                        </td>

                        <td className="px-6 py-5">
                          {subjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subjects.slice(0, 3).map((item) => {
                                const subject = Array.isArray(item.subjects)
                                  ? item.subjects[0]
                                  : item.subjects;

                                if (!subject) return null;

                                return (
                                  <span
                                    key={item.subject_id}
                                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600"
                                  >
                                    {subject.subject_code}
                                  </span>
                                );
                              })}

                              {subjects.length > 3 && (
                                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                  +{subjects.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              No subjects
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                          >
                            View
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof Users;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-50 transition group-hover:scale-125" />

      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>

      <div className="relative mt-5">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-1 text-3xl font-bold text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
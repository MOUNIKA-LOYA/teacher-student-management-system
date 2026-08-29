"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Menu,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string | null;
};

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadSubjects() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view your subjects.");
          return;
        }

        const { data, error: subjectsError } = await supabase
          .from("student_subjects")
          .select(`
            subject_id,
            subjects (
              id,
              subject_name,
              subject_code,
              description
            )
          `)
          .eq("student_id", user.id);

        if (subjectsError) {
          console.error("Subjects loading error:", subjectsError);
          setError("Unable to load your subjects.");
          return;
        }

        const formattedSubjects: Subject[] = [];

        for (const row of data ?? []) {
          const subject = row.subjects;

          if (subject && !Array.isArray(subject)) {
            formattedSubjects.push(subject as Subject);
          }
        }

        setSubjects(formattedSubjects);
      } catch (err) {
        console.error("Unexpected subjects error:", err);
        setError("Something went wrong while loading your subjects.");
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Student Sidebar */}
      <StudentSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile menu */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open student menu"
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <p className="text-sm text-slate-500">
                  Student Portal
                </p>

                <h1 className="text-xl font-bold text-white">
                  Subjects
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Page heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Academic
                  </p>

                  <h2 className="text-2xl font-bold text-white">
                    My Subjects
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                View all subjects you are currently enrolled in.
                Your subjects are assigned through the academic
                management system.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your subjects...
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
            {!loading && !error && subjects.length === 0 && (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                  <BookOpen className="h-8 w-8 text-cyan-400" />
                </div>

                <h3 className="text-xl font-semibold text-white">
                  No subjects found
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  You have not been enrolled in any subjects yet.
                  Once a subject is assigned to you, it will appear
                  here.
                </p>
              </div>
            )}

            {/* Subjects */}
            {!loading && !error && subjects.length > 0 && (
              <>
                {/* Summary */}
                <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-400/5 p-5">
                  <p className="text-sm text-slate-500">
                    Enrolled Subjects
                  </p>

                  <p className="mt-1 text-3xl font-bold text-white">
                    {subjects.length}
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Subjects currently assigned to your account
                  </p>
                </div>

                {/* Subject cards */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {subjects.map((subject) => (
                    <article
                      key={subject.id}
                      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.05]"
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10">
                          <BookOpen className="h-6 w-6 text-cyan-400" />
                        </div>

                        <span className="rounded-lg border border-cyan-400/10 bg-cyan-400/5 px-3 py-1 text-xs font-semibold text-cyan-300">
                          {subject.subject_code}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-white">
                        {subject.subject_name}
                      </h3>

                      <div className="mt-4 h-px bg-white/5" />

                      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-500">
                        {subject.description ||
                          "No description available for this subject."}
                      </p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
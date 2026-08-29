"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Menu,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type Assignment = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  subject: {
    id: string;
    subject_name: string;
    subject_code: string;
  } | null;
};

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadAssignments() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view your assignments."
          );
          return;
        }

        const { data: enrolledSubjects, error: enrollmentError } =
          await supabase
            .from("student_subjects")
            .select("subject_id")
            .eq("student_id", user.id);

        if (enrollmentError) {
          console.error(enrollmentError);
          setError("Unable to load your enrolled subjects.");
          return;
        }

        const subjectIds =
          enrolledSubjects?.map(
            (item) => item.subject_id
          ) ?? [];

        if (subjectIds.length === 0) {
          setAssignments([]);
          return;
        }

        const { data, error: assignmentsError } =
          await supabase
            .from("assignments")
            .select(`
              id,
              title,
              description,
              due_date,
              subjects (
                id,
                subject_name,
                subject_code
              )
            `)
            .in("subject_id", subjectIds)
            .order("due_date", {
              ascending: true,
              nullsFirst: false,
            });

        if (assignmentsError) {
          console.error(assignmentsError);
          setError("Unable to load your assignments.");
          return;
        }

        const formattedAssignments: Assignment[] = [];

        for (const row of data ?? []) {
          const subject = row.subjects;

          formattedAssignments.push({
            id: row.id,
            title: row.title,
            description: row.description,
            due_date: row.due_date,
            subject:
              subject && !Array.isArray(subject)
                ? subject
                : null,
          });
        }

        setAssignments(formattedAssignments);
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong while loading your assignments."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssignments();
  }, []);

  const now = new Date();

  const upcomingAssignments = assignments.filter(
    (assignment) =>
      assignment.due_date &&
      new Date(assignment.due_date) >= now
  );

  const overdueAssignments = assignments.filter(
    (assignment) =>
      assignment.due_date &&
      new Date(assignment.due_date) < now
  );

  const noDueDateAssignments = assignments.filter(
    (assignment) => !assignment.due_date
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
                Assignments
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
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Academic
                  </p>

                  <h2 className="text-2xl font-bold">
                    My Assignments
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                View assignments given for your enrolled subjects
                and keep track of their due dates.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your assignments...
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

            {/* Content */}
            {!loading && !error && (
              <>
                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total"
                    value={String(assignments.length)}
                    description="All assignments"
                    icon={
                      <ClipboardList className="h-5 w-5" />
                    }
                  />

                  <StatCard
                    title="Upcoming"
                    value={String(upcomingAssignments.length)}
                    description="Upcoming assignments"
                    icon={<Clock3 className="h-5 w-5" />}
                  />

                  <StatCard
                    title="Overdue"
                    value={String(overdueAssignments.length)}
                    description="Past due date"
                    icon={
                      <CalendarDays className="h-5 w-5" />
                    }
                  />

                  <StatCard
                    title="No Due Date"
                    value={String(noDueDateAssignments.length)}
                    description="No deadline set"
                    icon={<BookOpen className="h-5 w-5" />}
                  />
                </div>

                {/* Empty */}
                {assignments.length === 0 && (
                  <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                      <ClipboardList className="h-8 w-8 text-cyan-400" />
                    </div>

                    <h3 className="text-xl font-semibold text-white">
                      No assignments found
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Assignments from your enrolled subjects will
                      appear here when your teachers create them.
                    </p>
                  </div>
                )}

                {/* Assignment list */}
                {assignments.length > 0 && (
                  <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="border-b border-white/10 px-6 py-5">
                      <h3 className="font-semibold text-white">
                        Assignment List
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Assignments from your enrolled subjects.
                      </p>
                    </div>

                    <div className="divide-y divide-white/5">
                      {assignments.map((assignment) => {
                        const isOverdue =
                          assignment.due_date &&
                          new Date(assignment.due_date) <
                            new Date();

                        return (
                          <article
                            key={assignment.id}
                            className="p-5 transition hover:bg-white/[0.02] sm:p-6"
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex gap-4">
                                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 sm:flex">
                                  <ClipboardList className="h-5 w-5 text-cyan-400" />
                                </div>

                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-lg font-semibold text-white">
                                      {assignment.title}
                                    </h4>

                                    {isOverdue && (
                                      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-300">
                                        Overdue
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-lg bg-cyan-400/10 px-2.5 py-1 font-medium text-cyan-300">
                                      {assignment.subject
                                        ?.subject_code ||
                                        "Unknown"}
                                    </span>

                                    <span className="text-slate-500">
                                      {assignment.subject
                                        ?.subject_name ||
                                        "Unknown Subject"}
                                    </span>
                                  </div>

                                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
                                    {assignment.description ||
                                      "No description provided."}
                                  </p>
                                </div>
                              </div>

                              <div className="shrink-0 lg:text-right">
                                {assignment.due_date ? (
                                  <>
                                    <p className="text-xs uppercase tracking-wider text-slate-600">
                                      Due Date
                                    </p>

                                    <div
                                      className={`mt-1 flex items-center gap-2 text-sm font-medium ${
                                        isOverdue
                                          ? "text-red-300"
                                          : "text-slate-300"
                                      } lg:justify-end`}
                                    >
                                      <CalendarDays className="h-4 w-4" />

                                      {formatDateTime(
                                        assignment.due_date
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-sm text-slate-600">
                                    No due date
                                  </span>
                                )}
                              </div>
                            </div>
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

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
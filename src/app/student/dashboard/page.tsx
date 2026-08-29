"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Menu,
  Megaphone,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type Profile = {
  full_name: string;
  email: string;
  role: "teacher" | "student";
};

type Assignment = {
  id: string;
  title: string;
  due_date: string | null;
  subject: {
    subject_name: string;
    subject_code: string;
  } | null;
};

type ExamResult = {
  id: string;
  marks_obtained: number;
  exam: {
    title: string;
    exam_date: string;
    total_marks: number;
    subject: {
      subject_name: string;
      subject_code: string;
    } | null;
  } | null;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState<Profile | null>(
    null
  );

  const [subjectCount, setSubjectCount] = useState(0);
  const [attendancePercentage, setAttendancePercentage] =
    useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [averagePercentage, setAveragePercentage] =
    useState(0);

  const [upcomingAssignments, setUpcomingAssignments] =
    useState<Assignment[]>([]);

  const [recentResults, setRecentResults] =
    useState<ExamResult[]>([]);

  const [latestAnnouncements, setLatestAnnouncements] =
    useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view your dashboard."
          );
          return;
        }

        /* --------------------------------
           Profile
        -------------------------------- */

        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, email, role")
            .eq("id", user.id)
            .single();

        if (profileError) {
          console.error(profileError);
          setError("Unable to load your profile.");
          return;
        }

        setProfile(
          profileData as unknown as Profile
        );

        /* --------------------------------
           Student Subjects
        -------------------------------- */

        const {
          data: enrolledSubjects,
          error: subjectsError,
        } = await supabase
          .from("student_subjects")
          .select("subject_id")
          .eq("student_id", user.id);

        if (subjectsError) {
          console.error(subjectsError);
        }

        const subjectIds =
          enrolledSubjects?.map(
            (item) => item.subject_id
          ) ?? [];

        setSubjectCount(subjectIds.length);

        /* --------------------------------
           Attendance
        -------------------------------- */

        const {
          data: attendanceData,
          error: attendanceError,
        } = await supabase
          .from("attendance")
          .select("status")
          .eq("student_id", user.id);

        if (attendanceError) {
          console.error(attendanceError);
        }

        const attendanceRows =
          attendanceData ?? [];

        const presentCount =
          attendanceRows.filter(
            (item) => item.status === "present"
          ).length;

        const attendancePercentage =
          attendanceRows.length > 0
            ? Math.round(
                (presentCount /
                  attendanceRows.length) *
                  100
              )
            : 0;

        setAttendancePercentage(
          attendancePercentage
        );

        /* --------------------------------
           Assignments
        -------------------------------- */

        if (subjectIds.length > 0) {
          const {
            data: assignmentData,
            error: assignmentError,
          } = await supabase
            .from("assignments")
            .select(`
              id,
              title,
              due_date,
              subjects (
                subject_name,
                subject_code
              )
            `)
            .in("subject_id", subjectIds)
            .order("due_date", {
              ascending: true,
              nullsFirst: false,
            });

          if (assignmentError) {
            console.error(assignmentError);
          } else {
            const assignments =
              (assignmentData ??
                []) as unknown as Array<{
                id: string;
                title: string;
                due_date: string | null;
                subjects:
                  | {
                      subject_name: string;
                      subject_code: string;
                    }
                  | {
                      subject_name: string;
                      subject_code: string;
                    }[]
                  | null;
              }>;

            const formattedAssignments: Assignment[] =
              assignments.map((assignment) => {
                const subject =
                  Array.isArray(
                    assignment.subjects
                  )
                    ? assignment.subjects[0] ??
                      null
                    : assignment.subjects;

                return {
                  id: assignment.id,
                  title: assignment.title,
                  due_date:
                    assignment.due_date,
                  subject,
                };
              });

            const now = new Date();

            const upcoming =
              formattedAssignments
                .filter(
                  (assignment) =>
                    assignment.due_date &&
                    new Date(
                      assignment.due_date
                    ) >= now
                )
                .slice(0, 4);

            setUpcomingAssignments(upcoming);

            setAssignmentCount(
              formattedAssignments.length
            );
          }
        } else {
          setAssignmentCount(0);
          setUpcomingAssignments([]);
        }

        /* --------------------------------
           Exam Results
        -------------------------------- */

        const { data: marksData, error: marksError } =
          await supabase
            .from("marks")
            .select(`
              id,
              marks_obtained,
              exams (
                title,
                exam_date,
                total_marks,
                subjects (
                  subject_name,
                  subject_code
                )
              )
            `)
            .eq("student_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (marksError) {
          console.error(marksError);
        } else {
          const marksRows =
            (marksData ??
              []) as unknown as Array<{
              id: string;
              marks_obtained: number | string;
              exams:
                | {
                    title: string;
                    exam_date: string;
                    total_marks: number;
                    subjects:
                      | {
                          subject_name: string;
                          subject_code: string;
                        }
                      | {
                          subject_name: string;
                          subject_code: string;
                        }[]
                      | null;
                  }
                | {
                    title: string;
                    exam_date: string;
                    total_marks: number;
                    subjects:
                      | {
                          subject_name: string;
                          subject_code: string;
                        }
                      | {
                          subject_name: string;
                          subject_code: string;
                        }[]
                      | null;
                  }[]
                | null;
            }>;

          const formattedResults: ExamResult[] =
            marksRows.map((row) => {
              const exam = Array.isArray(row.exams)
                ? row.exams[0] ?? null
                : row.exams;

              if (!exam) {
                return {
                  id: row.id,
                  marks_obtained: Number(
                    row.marks_obtained
                  ),
                  exam: null,
                };
              }

              const subject = Array.isArray(
                exam.subjects
              )
                ? exam.subjects[0] ?? null
                : exam.subjects;

              return {
                id: row.id,
                marks_obtained: Number(
                  row.marks_obtained
                ),
                exam: {
                  title: exam.title,
                  exam_date: exam.exam_date,
                  total_marks: Number(
                    exam.total_marks
                  ),
                  subject,
                },
              };
            });

          setRecentResults(
            formattedResults.slice(0, 4)
          );

          let obtained = 0;
          let maximum = 0;

          for (const result of formattedResults) {
            if (result.exam) {
              obtained +=
                result.marks_obtained;

              maximum +=
                result.exam.total_marks;
            }
          }

          const average =
            maximum > 0
              ? Math.round(
                  (obtained / maximum) * 100
                )
              : 0;

          setAveragePercentage(average);
        }

        /* --------------------------------
           Announcements
        -------------------------------- */

        const {
          data: announcementData,
          error: announcementError,
        } = await supabase
          .from("announcements")
          .select(
            "id, title, message, created_at"
          )
          .in("target_role", [
            "student",
            "all",
          ])
          .order("created_at", {
            ascending: false,
          })
          .limit(3);

        if (announcementError) {
          console.error(announcementError);
        } else {
          setLatestAnnouncements(
            (announcementData ??
              []) as unknown as Announcement[]
          );
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Something went wrong while loading your dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    "Student";

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
                Dashboard
              </h1>
            </div>
          </div>
        </header>

        {/* Page */}
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-7xl">
            {/* Loading */}
            {loading && (
              <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading your dashboard...
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

            {!loading && !error && (
              <>
                {/* Welcome */}
                <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/[0.03] to-cyan-400/10 p-6 sm:p-8">
                  <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

                  <div className="relative">
                    <p className="text-sm font-medium text-cyan-300">
                      Student Dashboard
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                      Welcome back, {firstName}! 👋
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                      Here&apos;s a quick overview of
                      your academic activities and
                      performance.
                    </p>
                  </div>
                </section>

                {/* Statistics */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DashboardStat
                    title="Subjects"
                    value={String(
                      subjectCount
                    )}
                    description="Enrolled subjects"
                    icon={
                      <BookOpen className="h-5 w-5" />
                    }
                  />

                  <DashboardStat
                    title="Attendance"
                    value={`${attendancePercentage}%`}
                    description="Overall attendance"
                    icon={
                      <CheckCircle2 className="h-5 w-5" />
                    }
                  />

                  <DashboardStat
                    title="Assignments"
                    value={String(
                      assignmentCount
                    )}
                    description="Available assignments"
                    icon={
                      <ClipboardList className="h-5 w-5" />
                    }
                  />

                  <DashboardStat
                    title="Average Marks"
                    value={`${averagePercentage}%`}
                    description="Overall exam performance"
                    icon={
                      <Trophy className="h-5 w-5" />
                    }
                  />
                </div>

                {/* Main grid */}
                <div className="mt-6 grid gap-6 xl:grid-cols-3">
                  {/* Assignments */}
                  <section className="xl:col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                      <div>
                        <h3 className="font-semibold text-white">
                          Upcoming Assignments
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Keep track of your upcoming
                          deadlines.
                        </p>
                      </div>

                      <ClipboardList className="h-5 w-5 text-cyan-400" />
                    </div>

                    {upcomingAssignments.length ===
                    0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                        <ClipboardList className="h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm font-medium text-slate-400">
                          No upcoming assignments
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          New assignments will appear
                          here.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {upcomingAssignments.map(
                          (assignment) => (
                            <div
                              key={assignment.id}
                              className="flex flex-col gap-3 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <h4 className="truncate font-medium text-white">
                                  {assignment.title}
                                </h4>

                                <p className="mt-1 text-xs text-cyan-300">
                                  {assignment.subject
                                    ?.subject_name ||
                                    "Unknown Subject"}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                                <Clock3 className="h-4 w-4" />

                                {assignment.due_date
                                  ? formatDate(
                                      assignment.due_date
                                    )
                                  : "No due date"}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </section>

                  {/* Announcements */}
                  <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                    <div className="border-b border-white/10 px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            Announcements
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest updates.
                          </p>
                        </div>

                        <Megaphone className="h-5 w-5 text-cyan-400" />
                      </div>
                    </div>

                    {latestAnnouncements.length ===
                    0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                        <Megaphone className="h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm font-medium text-slate-400">
                          No announcements
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          You&apos;re all caught up.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {latestAnnouncements.map(
                          (announcement) => (
                            <div
                              key={announcement.id}
                              className="p-5 transition hover:bg-white/[0.02]"
                            >
                              <h4 className="line-clamp-1 font-medium text-white">
                                {announcement.title}
                              </h4>

                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                                {announcement.message}
                              </p>

                              <p className="mt-3 text-[11px] text-slate-700">
                                {formatDateTime(
                                  announcement.created_at
                                )}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </section>
                </div>

                {/* Recent Results */}
                <section className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
                  <div className="border-b border-white/10 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          Recent Exam Results
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Your latest published marks.
                        </p>
                      </div>

                      <Award className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>

                  {recentResults.length === 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                      <Award className="h-8 w-8 text-slate-700" />

                      <p className="mt-3 text-sm font-medium text-slate-400">
                        No exam results
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Your results will appear here
                        when marks are published.
                      </p>
                    </div>
                  ) : (
                    <>
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
                                Result
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {recentResults.map(
                              (result) => {
                                const percentage =
                                  result.exam
                                    ?.total_marks
                                    ? (result.marks_obtained /
                                        result.exam
                                          .total_marks) *
                                      100
                                    : 0;

                                return (
                                  <tr
                                    key={result.id}
                                    className="border-b border-white/5"
                                  >
                                    <td className="px-6 py-5 font-medium text-white">
                                      {result.exam
                                        ?.title ||
                                        "Unknown Exam"}
                                    </td>

                                    <td className="px-6 py-5">
                                      <p className="text-sm text-slate-300">
                                        {result.exam
                                          ?.subject
                                          ?.subject_name ||
                                          "Unknown Subject"}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-600">
                                        {result.exam
                                          ?.subject
                                          ?.subject_code ||
                                          "—"}
                                      </p>
                                    </td>

                                    <td className="px-6 py-5 text-sm text-slate-500">
                                      {result.exam
                                        ?.exam_date
                                        ? formatDate(
                                            result.exam
                                              .exam_date
                                          )
                                        : "—"}
                                    </td>

                                    <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <span className="font-semibold text-white">
                                          {
                                            result.marks_obtained
                                          }
                                        </span>

                                        <span className="text-slate-600">
                                          /
                                          {
                                            result
                                              .exam
                                              ?.total_marks
                                          }
                                        </span>

                                        <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                                          {Math.round(
                                            percentage
                                          )}
                                          %
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile */}
                      <div className="space-y-3 p-4 md:hidden">
                        {recentResults.map(
                          (result) => {
                            const percentage =
                              result.exam
                                ?.total_marks
                                ? (result.marks_obtained /
                                    result.exam
                                      .total_marks) *
                                  100
                                : 0;

                            return (
                              <div
                                key={result.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="font-medium text-white">
                                      {result.exam
                                        ?.title ||
                                        "Unknown Exam"}
                                    </h4>

                                    <p className="mt-1 text-sm text-cyan-300">
                                      {result.exam
                                        ?.subject
                                        ?.subject_name ||
                                        "Unknown Subject"}
                                    </p>
                                  </div>

                                  <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                                    {Math.round(
                                      percentage
                                    )}
                                    %
                                  </span>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-xs text-slate-600">
                                    {result.exam
                                      ?.exam_date
                                      ? formatDate(
                                          result.exam
                                            .exam_date
                                        )
                                      : "—"}
                                  </span>

                                  <span className="font-semibold text-white">
                                    {
                                      result.marks_obtained
                                    }
                                    <span className="text-slate-600">
                                      {" "}
                                      /{" "}
                                      {
                                        result.exam
                                          ?.total_marks
                                      }
                                    </span>
                                  </span>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardStat({
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

function formatDate(dateString: string) {
  return new Date(
    `${dateString}T00:00:00`
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Loader2,
  Megaphone,
  Menu,
  MessageSquareText,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type Announcement = {
  id: string;
  title: string;
  message: string;
  target_role: "teacher" | "student" | "all";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadAnnouncements() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view announcements."
          );
          return;
        }

        const { data, error: announcementsError } =
          await supabase
            .from("announcements")
            .select(
              `
                id,
                title,
                message,
                target_role,
                created_by,
                created_at,
                updated_at
              `
            )
            .in("target_role", ["student", "all"])
            .order("created_at", {
              ascending: false,
            });

        if (announcementsError) {
          console.error(
            "Announcements loading error:",
            announcementsError
          );

          setError(
            "Unable to load announcements."
          );

          return;
        }

        const rows =
          (data ?? []) as unknown as Announcement[];

        setAnnouncements(rows);
      } catch (err) {
        console.error(
          "Unexpected announcements error:",
          err
        );

        setError(
          "Something went wrong while loading announcements."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

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
                Announcements
              </h1>
            </div>
          </div>
        </header>

        {/* Page */}
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Communication
                  </p>

                  <h2 className="text-2xl font-bold">
                    Announcements
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Stay updated with the latest announcements
                from your teachers and academic management.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />

                  Loading announcements...
                </div>
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

                  <p className="text-sm font-medium text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Empty */}
            {!loading &&
              !error &&
              announcements.length === 0 && (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <Megaphone className="h-8 w-8 text-cyan-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    No announcements
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    There are no announcements for you at
                    the moment. New announcements from your
                    teachers will appear here.
                  </p>
                </div>
              )}

            {/* Announcement List */}
            {!loading &&
              !error &&
              announcements.length > 0 && (
                <div className="space-y-5">
                  {announcements.map((announcement) => (
                    <article
                      key={announcement.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:border-cyan-400/20 hover:bg-white/[0.045]"
                    >
                      {/* Announcement Header */}
                      <div className="border-b border-white/10 px-6 py-5 sm:px-7">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                              <Megaphone className="h-5 w-5 text-cyan-400" />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold text-white">
                                {announcement.title}
                              </h3>

                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <CalendarDays className="h-3.5 w-3.5" />

                                  {formatDate(
                                    announcement.created_at
                                  )}
                                </div>

                                <span className="h-1 w-1 rounded-full bg-slate-700" />

                                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-cyan-300">
                                  {announcement.target_role ===
                                  "all"
                                    ? "Everyone"
                                    : "Students"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div className="px-6 py-6 sm:px-7">
                        <div className="flex gap-3">
                          <MessageSquareText className="mt-1 h-5 w-5 shrink-0 text-slate-600" />

                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
                            {announcement.message}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}
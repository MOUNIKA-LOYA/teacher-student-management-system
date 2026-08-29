"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Menu,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import StudentSidebar from "@/components/student/StudentSidebar";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadNotifications() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError(
            "You must be logged in to view your notifications."
          );
          return;
        }

        const { data, error: notificationsError } =
          await supabase
            .from("notifications")
            .select(`
              id,
              user_id,
              title,
              message,
              is_read,
              created_at
            `)
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false,
            });

        if (notificationsError) {
          console.error(
            "Notifications loading error:",
            notificationsError
          );

          setError("Unable to load your notifications.");
          return;
        }

        const rows =
          (data ?? []) as unknown as Notification[];

        setNotifications(rows);
      } catch (err) {
        console.error(
          "Unexpected notifications error:",
          err
        );

        setError(
          "Something went wrong while loading your notifications."
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  async function markAsRead(id: string) {
    setUpdatingId(id);

    const supabase = createClient();

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", id);

      if (updateError) {
        console.error(
          "Mark notification as read error:",
          updateError
        );
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) {
      return;
    }

    setUpdatingId("all");

    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "You must be logged in to update notifications."
        );
        return;
      }

      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) {
        console.error(
          "Mark all notifications as read error:",
          updateError
        );
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      );
    } finally {
      setUpdatingId(null);
    }
  }

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
          <div className="flex h-20 items-center justify-between px-5 sm:px-8">
            <div className="flex items-center">
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
                  Notifications
                </h1>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={updatingId === "all"}
                className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updatingId === "all" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4" />
                )}

                <span className="hidden sm:inline">
                  Mark all as read
                </span>

                <span className="sm:hidden">
                  Read all
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page */}
        <section className="p-5 sm:p-8">
          <div className="mx-auto max-w-5xl">
            {/* Heading */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                  <Bell className="h-6 w-6 text-white" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                      {unreadCount > 9
                        ? "9+"
                        : unreadCount}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Communication
                  </p>

                  <h2 className="text-2xl font-bold">
                    Notifications
                  </h2>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Stay informed about important updates,
                assignments, examinations and academic
                activities.
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading notifications...
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
              notifications.length === 0 && (
                <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10">
                    <Bell className="h-8 w-8 text-cyan-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-white">
                    No notifications
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    You&apos;re all caught up. New
                    notifications will appear here when
                    there are updates for your account.
                  </p>
                </div>
              )}

            {/* Notifications */}
            {!loading &&
              !error &&
              notifications.length > 0 && (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`relative overflow-hidden rounded-2xl border transition ${
                        notification.is_read
                          ? "border-white/10 bg-white/[0.025]"
                          : "border-cyan-400/20 bg-cyan-400/[0.04]"
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div className="absolute bottom-0 left-0 top-0 w-1 bg-cyan-400" />
                      )}

                      <div className="flex gap-4 p-5 sm:p-6">
                        {/* Icon */}
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            notification.is_read
                              ? "bg-white/5 text-slate-500"
                              : "bg-cyan-400/10 text-cyan-400"
                          }`}
                        >
                          {notification.is_read ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Bell className="h-5 w-5" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3
                                className={`font-semibold ${
                                  notification.is_read
                                    ? "text-slate-300"
                                    : "text-white"
                                }`}
                              >
                                {notification.title}
                              </h3>

                              <p className="mt-1 text-xs text-slate-600">
                                {formatDate(
                                  notification.created_at
                                )}
                              </p>
                            </div>

                            {!notification.is_read && (
                              <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                                New
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-4 whitespace-pre-wrap text-sm leading-7 ${
                              notification.is_read
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {notification.message}
                          </p>

                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification.id
                                )
                              }
                              disabled={
                                updatingId ===
                                notification.id
                              }
                              className="mt-5 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingId ===
                              notification.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}

                              Mark as read
                            </button>
                          )}
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
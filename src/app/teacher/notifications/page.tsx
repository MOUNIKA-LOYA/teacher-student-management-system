"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Check,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string | null;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const loadNotifications = async () => {
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

      const { data, error: fetchError } =
        await supabase
          .from("notifications")
          .select(
            "id, user_id, title, message, is_read, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(
        (data ?? []) as Notification[]
      );
    } catch (err: unknown) {
      console.error(
        "Failed to load notifications:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (
    notification: Notification
  ) => {
    if (notification.is_read) return;

    const supabase = createClient();

    setMarking(notification.id);
    setError("");
    setSuccess("");

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

      const { error: updateError } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("id", notification.id)
          .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setSuccess("Notification marked as read.");
    } catch (err: unknown) {
      console.error(
        "Failed to mark notification as read:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification."
      );
    } finally {
      setMarking(null);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(
      (item) => !item.is_read
    );

    if (unread.length === 0) return;

    const supabase = createClient();

    setError("");
    setSuccess("");

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

      const { error: updateError } =
        await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );

      setSuccess(
        "All notifications marked as read."
      );
    } catch (err: unknown) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notifications."
      );
    }
  };

  const filteredNotifications = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return notifications;
    }

    return notifications.filter(
      (notification) =>
        notification.title
          .toLowerCase()
          .includes(query) ||
        notification.message
          .toLowerCase()
          .includes(query)
    );
  }, [notifications, search]);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <Bell size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notifications
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              View important notifications and updates.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadNotifications}
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
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={17} />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Total Notifications"
            value={notifications.length}
            icon={<Bell size={21} />}
          />

          <StatCard
            label="Unread"
            value={unreadCount}
            icon={<Bell size={21} />}
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
                setSearch(event.target.value)
              }
              placeholder="Search notifications..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </section>

        {/* Notifications */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading notifications...
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <section className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Bell size={28} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
              No notifications
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try changing your search."
                : "You don't have any notifications yet."}
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredNotifications.map(
                (notification) => (
                  <article
                    key={notification.id}
                    className={`p-5 transition ${
                      notification.is_read
                        ? "bg-white dark:bg-slate-900"
                        : "bg-indigo-50/50 dark:bg-indigo-950/20"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          notification.is_read
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                        }`}
                      >
                        <Bell size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h2
                                className={`text-base ${
                                  notification.is_read
                                    ? "font-semibold"
                                    : "font-bold"
                                } text-slate-900 dark:text-white`}
                              >
                                {notification.title}
                              </h2>

                              {!notification.is_read && (
                                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  New
                                </span>
                              )}
                            </div>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {
                                notification.message
                              }
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              {formatDate(
                                notification.created_at
                              )}
                            </p>
                          </div>

                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(
                                  notification
                                )
                              }
                              disabled={
                                marking ===
                                notification.id
                              }
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                            >
                              {marking ===
                              notification.id ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <Check size={14} />
                              )}
                              Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          {icon}
        </div>
      </div>
    </div>
  );
}
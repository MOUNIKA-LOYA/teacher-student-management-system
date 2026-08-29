"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Announcement = {
  id: string;
  title: string;
  message: string;
  target_role: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const TARGET_ROLES = [
  { value: "student", label: "Students" },
  { value: "teacher", label: "Teachers" },
  { value: "all", label: "Everyone" },
];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    message: "",
    target_role: "student",
  });

  const loadAnnouncements = async () => {
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
          .from("announcements")
          .select(
            "id, title, message, target_role, created_by, created_at, updated_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (fetchError) {
        throw fetchError;
      }

      setAnnouncements(
        (data ?? []) as Announcement[]
      );
    } catch (err: unknown) {
      console.error(
        "Failed to load announcements:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load announcements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);

    setForm({
      title: "",
      message: "",
      target_role: "student",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (
    announcement: Announcement
  ) => {
    setEditingId(announcement.id);

    setForm({
      title: announcement.title,
      message: announcement.message,
      target_role:
        announcement.target_role,
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

  const saveAnnouncement = async () => {
    setError("");
    setSuccess("");

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title) {
      setError("Please enter an announcement title.");
      return;
    }

    if (!message) {
      setError("Please enter an announcement message.");
      return;
    }

    if (!form.target_role) {
      setError("Please select the target audience.");
      return;
    }

    const supabase = createClient();

    setSaving(true);

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

      if (editingId) {
        const { error: updateError } =
          await supabase
            .from("announcements")
            .update({
              title,
              message,
              target_role:
                form.target_role,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", editingId);

        if (updateError) {
          throw updateError;
        }

        setSuccess(
          "Announcement updated successfully."
        );
      } else {
        const { error: insertError } =
          await supabase
            .from("announcements")
            .insert({
              title,
              message,
              target_role:
                form.target_role,
              created_by: user.id,
            });

        if (insertError) {
          throw insertError;
        }

        setSuccess(
          "Announcement created successfully."
        );
      }

      setShowModal(false);
      setEditingId(null);

      await loadAnnouncements();
    } catch (err: unknown) {
      console.error(
        "Failed to save announcement:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save announcement."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteAnnouncement = async (
    id: string
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const supabase = createClient();

    try {
      const { error: deleteError } =
        await supabase
          .from("announcements")
          .delete()
          .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setSuccess(
        "Announcement deleted successfully."
      );

      await loadAnnouncements();
    } catch (err: unknown) {
      console.error(
        "Failed to delete announcement:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete announcement."
      );
    }
  };

  const filteredAnnouncements =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return announcements;
      }

      return announcements.filter(
        (announcement) =>
          announcement.title
            .toLowerCase()
            .includes(query) ||
          announcement.message
            .toLowerCase()
            .includes(query) ||
          announcement.target_role
            .toLowerCase()
            .includes(query)
      );
    }, [announcements, search]);

  const getTargetLabel = (
    role: string
  ) => {
    if (role === "student") {
      return "Students";
    }

    if (role === "teacher") {
      return "Teachers";
    }

    if (role === "all") {
      return "Everyone";
    }

    return role;
  };

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
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <Bell size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Announcements
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create and manage announcements for students and faculty.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadAnnouncements}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5"
            >
              <Plus size={18} />
              New Announcement
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

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Announcements"
            value={announcements.length}
            icon={<Bell size={21} />}
          />

          <StatCard
            label="For Students"
            value={
              announcements.filter(
                (item) =>
                  item.target_role ===
                  "student"
              ).length
            }
            icon={<Users size={21} />}
          />

          <StatCard
            label="For Everyone"
            value={
              announcements.filter(
                (item) =>
                  item.target_role ===
                  "all"
              ).length
            }
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
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search announcements..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </section>

        {/* Content */}
        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading announcements...
            </div>
          </div>
        ) : filteredAnnouncements.length ===
          0 ? (
          <section className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Bell size={28} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
              No announcements yet
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {search
                ? "Try changing your search."
                : "Create your first announcement to communicate with students."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <Plus size={17} />
                Create Announcement
              </button>
            )}
          </section>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map(
              (announcement) => (
                <article
                  key={announcement.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-900"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                        <Bell size={20} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {announcement.title}
                          </h2>

                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                            {getTargetLabel(
                              announcement.target_role
                            )}
                          </span>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {
                            announcement.message
                          }
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          {formatDate(
                            announcement.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            announcement
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                        aria-label="Edit announcement"
                      >
                        <Edit3 size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteAnnouncement(
                            announcement.id
                          )
                        }
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        aria-label="Delete announcement"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              )
            )}
          </div>
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
                      ? "Edit Announcement"
                      : "New Announcement"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Share important information with your audience.
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        title:
                          event.target.value,
                      })
                    }
                    placeholder="Enter announcement title"
                    maxLength={150}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Message
                  </label>

                  <textarea
                    value={form.message}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        message:
                          event.target.value,
                      })
                    }
                    placeholder="Write your announcement..."
                    rows={5}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Target Audience
                  </label>

                  <select
                    value={
                      form.target_role
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        target_role:
                          event.target
                            .value,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    {TARGET_ROLES.map(
                      (role) => (
                        <option
                          key={
                            role.value
                          }
                          value={
                            role.value
                          }
                        >
                          {role.label}
                        </option>
                      )
                    )}
                  </select>
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
                  onClick={
                    saveAnnouncement
                  }
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
                      ? "Update"
                      : "Create"}
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
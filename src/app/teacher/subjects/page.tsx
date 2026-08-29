"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string | null;
};

type SubjectForm = {
  subject_name: string;
  subject_code: string;
  description: string;
};

const emptyForm: SubjectForm = {
  subject_name: "",
  subject_code: "",
  description: "",
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [form, setForm] = useState<SubjectForm>(emptyForm);

  const loadSubjects = async (isRefresh = false) => {
    const supabase = createClient();

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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
        throw new Error("Your session has expired. Please sign in again.");
      }

      const { data, error: subjectsError } = await supabase
        .from("subjects")
        .select("id, subject_name, subject_code, description")
        .order("subject_name", { ascending: true });

      if (subjectsError) {
        throw subjectsError;
      }

      setSubjects(data ?? []);
    } catch (err: unknown) {
      console.error("Failed to load subjects:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load subjects. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return subjects;
    }

    return subjects.filter((subject) => {
      return (
        subject.subject_name.toLowerCase().includes(query) ||
        subject.subject_code.toLowerCase().includes(query) ||
        (subject.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [subjects, search]);

  const openAddModal = () => {
    setEditingSubject(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);

    setForm({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      description: subject.description ?? "",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingSubject(null);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSave = async () => {
    const supabase = createClient();

    setFormError("");

    const subjectName = form.subject_name.trim();
    const subjectCode = form.subject_code.trim();
    const description = form.description.trim();

    if (!subjectName) {
      setFormError("Subject name is required.");
      return;
    }

    if (!subjectCode) {
      setFormError("Subject code is required.");
      return;
    }

    setSaving(true);

    try {
      if (editingSubject) {
        const { data, error: updateError } = await supabase
          .from("subjects")
          .update({
            subject_name: subjectName,
            subject_code: subjectCode,
            description: description || null,
          })
          .eq("id", editingSubject.id)
          .select("id, subject_name, subject_code, description")
          .single();

        if (updateError) {
          throw updateError;
        }

        setSubjects((current) =>
          current
            .map((subject) =>
              subject.id === editingSubject.id ? data : subject
            )
            .sort((a, b) =>
              a.subject_name.localeCompare(b.subject_name)
            )
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("subjects")
          .insert({
            subject_name: subjectName,
            subject_code: subjectCode,
            description: description || null,
          })
          .select("id, subject_name, subject_code, description")
          .single();

        if (insertError) {
          throw insertError;
        }

        setSubjects((current) =>
          [...current, data].sort((a, b) =>
            a.subject_name.localeCompare(b.subject_name)
          )
        );
      }

      closeModal();
    } catch (err: unknown) {
      console.error("Failed to save subject:", err);

      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to save subject. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject: Subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.subject_name}"?`
    );

    if (!confirmed) {
      return;
    }

    const supabase = createClient();

    setError("");

    try {
      const { error: deleteError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subject.id);

      if (deleteError) {
        throw deleteError;
      }

      setSubjects((current) =>
        current.filter((item) => item.id !== subject.id)
      );
    } catch (err: unknown) {
      console.error("Failed to delete subject:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete subject. Please try again."
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <BookOpen size={17} />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Subject Management
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create, view, update and manage academic subjects.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => loadSubjects(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Subjects
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "—" : subjects.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Available academic subjects
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Search Results
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? "—" : filteredSubjects.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Subjects matching your search
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Management
            </p>

            <p className="mt-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">
              Active
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Create and manage subjects
            </p>
          </div>
        </div>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Card header */}
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Subjects
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {search
                  ? `${filteredSubjects.length} subject${
                      filteredSubjects.length === 1 ? "" : "s"
                    } found`
                  : `${subjects.length} subject${
                      subjects.length === 1 ? "" : "s"
                    } found`}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search subjects..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Unable to complete request
                </p>

                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-6">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse rounded-xl border border-slate-100 p-5 dark:border-slate-800"
                  >
                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="mt-3 h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/70" />
                    <div className="mt-3 h-3 w-72 rounded bg-slate-100 dark:bg-slate-800/70" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subject list */}
          {!loading && !error && filteredSubjects.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex flex-col gap-5 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/50"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                      <BookOpen size={21} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {subject.subject_name}
                        </h3>

                        <span className="rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                          {subject.subject_code}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {subject.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(subject)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(subject)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredSubjects.length === 0 && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  {search ? (
                    <Search size={28} />
                  ) : (
                    <BookOpen size={28} />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                  {search
                    ? "No subjects found"
                    : "No subjects registered"}
                </h3>

                <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {search
                    ? "Try changing your search keywords."
                    : "Create your first academic subject to get started."}
                </p>

                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <Plus size={17} />
                    Add Subject
                  </button>
                )}
              </div>
            )}
        </section>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingSubject ? "Edit Subject" : "Add Subject"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingSubject
                    ? "Update the subject information."
                    : "Enter the details for the new subject."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 p-6">
              {formError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject Name
                </label>

                <input
                  type="text"
                  value={form.subject_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject_name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Data Structures"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Subject Code
                </label>

                <input
                  type="text"
                  value={form.subject_code}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subject_code: event.target.value,
                    }))
                  }
                  placeholder="e.g. CS301"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Description
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Brief description of the subject..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-950">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && (
                  <RefreshCw size={16} className="animate-spin" />
                )}

                {saving
                  ? "Saving..."
                  : editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
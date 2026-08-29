"use client";

import {
  BookOpen,
  CalendarDays,
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Subject = {
  id: string;
  subject_name: string;
  subject_code: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function SubjectsPage() {
  const supabase = createClient();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadSubjects();
  }, []);

  async function loadSubjects() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("subjects")
      .select(
        "id, subject_name, subject_code, description, created_at, updated_at"
      )
      .order("subject_name", { ascending: true });

    if (error) {
      console.error("Subject loading error:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubjects(data ?? []);
    setLoading(false);
  }

  const filteredSubjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return subjects;
    }

    return subjects.filter(
      (subject) =>
        subject.subject_name.toLowerCase().includes(value) ||
        subject.subject_code.toLowerCase().includes(value) ||
        subject.description?.toLowerCase().includes(value)
    );
  }, [subjects, search]);

  function openCreateModal() {
    setEditingSubject(null);
    setSubjectName("");
    setSubjectCode("");
    setDescription("");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setSubjectName(subject.subject_name);
    setSubjectCode(subject.subject_code);
    setDescription(subject.description ?? "");
    setError("");
    setSuccess("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingSubject(null);
    setSubjectName("");
    setSubjectCode("");
    setDescription("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name = subjectName.trim();
    const code = subjectCode.trim().toUpperCase();
    const desc = description.trim();

    if (!name) {
      setError("Please enter a subject name.");
      return;
    }

    if (!code) {
      setError("Please enter a subject code.");
      return;
    }

    setSaving(true);

    if (editingSubject) {
      const { data, error } = await supabase
        .from("subjects")
        .update({
          subject_name: name,
          subject_code: code,
          description: desc || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingSubject.id)
        .select(
          "id, subject_name, subject_code, description, created_at, updated_at"
        )
        .single();

      if (error) {
        console.error("Subject update error:", error);
        setError(error.message);
        setSaving(false);
        return;
      }

      setSubjects((current) =>
        current.map((subject) =>
          subject.id === editingSubject.id ? data : subject
        )
      );

      setSuccess("Subject updated successfully.");

      setTimeout(() => {
        closeModal();
      }, 700);
    } else {
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          subject_name: name,
          subject_code: code,
          description: desc || null,
        })
        .select(
          "id, subject_name, subject_code, description, created_at, updated_at"
        )
        .single();

      if (error) {
        console.error("Subject creation error:", error);
        setError(error.message);
        setSaving(false);
        return;
      }

      setSubjects((current) =>
        [...current, data].sort((a, b) =>
          a.subject_name.localeCompare(b.subject_name)
        )
      );

      setSuccess("Subject created successfully.");

      setTimeout(() => {
        closeModal();
      }, 700);
    }

    setSaving(false);
  }

  async function handleDelete(subject: Subject) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.subject_name}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subject.id);

    if (error) {
      console.error("Subject delete error:", error);
      setError(error.message);
      return;
    }

    setSubjects((current) =>
      current.filter((item) => item.id !== subject.id)
    );

    setSuccess("Subject deleted successfully.");

    setTimeout(() => {
      setSuccess("");
    }, 2500);
  }

  return (
    <main className="min-h-[calc(100vh-82px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 text-white shadow-xl shadow-indigo-200/50 sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="absolute -bottom-20 right-40 h-52 w-52 rounded-full bg-white/5" />

          <div className="relative z-10 flex items-center justify-between gap-6">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <BookOpen className="h-6 w-6" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Academic Management
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Subject Management
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                Create, organize and manage the subjects taught by the
                faculty.
              </p>
            </div>

            <div className="hidden h-28 w-28 items-center justify-center rounded-[28px] border border-white/10 bg-white/10 backdrop-blur md:flex">
              <BookOpen className="h-14 w-14 text-white/90" />
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={BookOpen}
            title="Total Subjects"
            value={subjects.length}
            description="Available subjects"
          />

          <StatCard
            icon={CalendarDays}
            title="Academic Subjects"
            value={subjects.length}
            description="Currently managed"
          />

          <StatCard
            icon={Search}
            title="Search Results"
            value={filteredSubjects.length}
            description="Matching subjects"
          />
        </section>

        {/* Main card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Toolbar */}
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  All Subjects
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Manage your subject catalogue
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                {/* Search */}
                <div className="relative sm:w-[300px]">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search subjects..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>

                {/* Add */}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 sm:mx-6">
              {success}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

              <p className="mt-4 text-sm text-slate-400">
                Loading subjects...
              </p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            /* Empty state */
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <BookOpen className="h-7 w-7 text-indigo-500" />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-800">
                {search ? "No subjects found" : "No subjects yet"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
                {search
                  ? "Try searching with a different subject name or code."
                  : "Create your first subject to start managing the academic catalogue."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Subject
                </button>
              )}
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Code
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Description
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Created
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-indigo-50/30"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {subject.subject_name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              Academic Subject
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">
                          {subject.subject_code}
                        </span>
                      </td>

                      <td className="max-w-[320px] px-6 py-5">
                        <p className="truncate text-sm text-slate-500">
                          {subject.description || "No description"}
                        </p>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatDate(subject.created_at)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(subject)}
                            className="rounded-lg p-2.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                            aria-label={`Edit ${subject.subject_name}`}
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(subject)}
                            className="rounded-lg p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${subject.subject_name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  {editingSubject ? "Edit Subject" : "New Subject"}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {editingSubject
                    ? "Update Subject"
                    : "Create Subject"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              )}

              <div>
                <label
                  htmlFor="subjectName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subject Name
                </label>

                <input
                  id="subjectName"
                  type="text"
                  value={subjectName}
                  onChange={(event) =>
                    setSubjectName(event.target.value)
                  }
                  placeholder="e.g. Data Structures"
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="subjectCode"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Subject Code
                </label>

                <input
                  id="subjectCode"
                  type="text"
                  value={subjectCode}
                  onChange={(event) =>
                    setSubjectCode(event.target.value.toUpperCase())
                  }
                  placeholder="e.g. IT301"
                  disabled={saving}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm uppercase text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                  <span className="ml-2 font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Brief description of the subject..."
                  rows={4}
                  disabled={saving}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      {editingSubject ? "Update Subject" : "Create Subject"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: typeof BookOpen;
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

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You must be logged in to view your profile.");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", user.id)
          .single();

        if (profileError || !data) {
          console.error(profileError);

          setError("Unable to load your profile.");
          return;
        }

        setProfile(data);
        setFullName(data.full_name || "");
      } catch (err) {
        console.error(err);
        setError("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Full name cannot be empty.");
      return;
    }

    if (!profile) {
      setError("Profile information is unavailable.");
      return;
    }

    setSaving(true);

    const supabase = createClient();

    try {
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
        .select("id, full_name, email, role")
        .single();

      if (updateError || !data) {
        console.error(updateError);

        setError(
          updateError?.message ||
            "Unable to update your profile."
        );

        return;
      }

      setProfile(data);
      setFullName(data.full_name || "");
      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating your profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setError("");
    setSuccess("");

    setFullName(profile?.full_name || "");
    setEditing(false);
  }

  const displayName =
    profile?.full_name?.trim() || "Student";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Student Portal
              </p>

              <h1 className="text-2xl font-bold text-white">
                My Profile
              </h1>
            </div>
          </div>

          <Link
            href="/student/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-80 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading your profile...
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Success */}
        {!loading && success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Profile */}
        {!loading && profile && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Profile card */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-xl shadow-blue-500/20">
                  <UserCircle className="h-16 w-16 text-white" />
                </div>

                <h2 className="mt-5 text-xl font-bold text-white">
                  {displayName}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {profile.email}
                </p>

                <span className="mt-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Student
                </span>
              </div>
            </section>

            {/* Details */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <h2 className="font-semibold text-white">
                    Personal Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your basic profile information.
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setEditing(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-6">
                {editing ? (
                  <form
                    onSubmit={handleSave}
                    className="space-y-6"
                  >
                    {/* Full name */}
                    <div>
                      <label
                        htmlFor="fullName"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Full Name
                      </label>

                      <div className="relative">
                        <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(event) =>
                            setFullName(event.target.value)
                          }
                          className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50 focus:ring-4 focus:ring-cyan-400/10"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-slate-300"
                      >
                        Email Address
                      </label>

                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                        <input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="h-12 w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.03] pl-12 pr-4 text-slate-500 outline-none"
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-600">
                        Your email address cannot be changed from
                        the student profile.
                      </p>
                    </div>

                    {/* Role */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">
                        Role
                      </label>

                      <div className="flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.03] px-4">
                        <span className="text-sm capitalize text-slate-400">
                          {profile.role}
                        </span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    {/* Name */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                          <UserCircle className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Full Name
                          </p>

                          <p className="mt-1 break-words font-medium text-white">
                            {displayName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                          <Mail className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Email Address
                          </p>

                          <p className="mt-1 break-all font-medium text-white">
                            {profile.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
                          <ShieldCheck className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-600">
                            Account Role
                          </p>

                          <p className="mt-1 font-medium capitalize text-white">
                            {profile.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
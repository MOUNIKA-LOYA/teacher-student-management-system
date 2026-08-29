"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Authenticate with Supabase
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Unable to authenticate user.");
      }

      // Get the user's existing profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        throw new Error(
          "Your profile could not be found. Please contact the administrator."
        );
      }

      // Role-based routing
      if (profile.role === "teacher") {
        router.replace("/teacher/dashboard");
        router.refresh();
        return;
      }

      if (profile.role === "student") {
        router.replace("/student/dashboard");
        router.refresh();
        return;
      }

      await supabase.auth.signOut();

      throw new Error("Your account has an invalid role.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.25),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(6,182,212,0.2),transparent_30%)]" />

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">

        {/* Left panel */}
        <section className="relative hidden items-center justify-center overflow-hidden px-12 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-slate-950/80 to-cyan-950/90" />

          <div className="relative z-10 max-w-xl">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl">
              <GraduationCap className="h-8 w-8 text-cyan-300" />
            </div>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Smart Academic Platform
            </p>

            <h1 className="text-5xl font-bold leading-tight text-white xl:text-6xl">
              Manage your classroom.
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                Inspire your students.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              A modern academic management platform for teachers and
              students.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="h-1 w-16 rounded-full bg-cyan-400" />
              <div className="h-1 w-8 rounded-full bg-blue-400/60" />
              <div className="h-1 w-4 rounded-full bg-white/30" />
            </div>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">

            {/* Brand */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  EduManage
                </h2>

                <p className="text-xs text-slate-400">
                  Academic Management
                </p>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-2xl sm:p-9">

              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-cyan-300">
                  Welcome back
                </p>

                <h1 className="text-3xl font-bold text-white">
                  Sign in to your account
                </h1>

                <p className="mt-2 text-sm text-slate-400">
                  Enter your credentials to continue.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 flex gap-3 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="teacher@example.com"
                      className="h-13 w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>

                  <div className="relative">
                    <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="h-13 w-full rounded-xl border border-white/10 bg-black/20 pl-12 pr-12 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

              </form>

              <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-xs leading-5 text-slate-500">
                  Secure role-based access powered by Supabase.
                </p>
              </div>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
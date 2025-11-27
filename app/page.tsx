"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser as loginUserApi,
  registerUser as registerUserApi,
} from "@/lib/api";
import { loadAuth, saveAuth } from "@/lib/storage";

const stats = [
  { label: "Complaints resolved", value: "2.4k+" },
  { label: "Avg. first response", value: "18h" },
  { label: "Navigators online", value: "63" },
];

const highlights = [
  "USSD-native reporting for persons with disabilities",
  "Navigator tools for rapid escalation and follow-up",
  "Realtime monitoring for districts and ministries",
];

const quickSteps = [
  {
    title: "1. Create an account",
    copy: "Register as a navigator or admin to unlock the secure dashboard.",
  },
  {
    title: "2. Capture complaints",
    copy: "Use the USSD channel or manual entry to log every report from the field.",
  },
  {
    title: "3. Coordinate responses",
    copy: "Assign navigators, escalate blockers, and track resolution in real time.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadAuth();
    if (stored) {
      router.replace("/dashboard");
      return;
    }
    setCheckingSession(false);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authLoading) return;
    setAuthLoading(true);
    setAuthError(null);

    try {
      const payload =
        authMode === "login"
          ? await loginUserApi({
              email: form.email,
              password: form.password,
            })
          : await registerUserApi({
              email: form.email,
              password: form.password,
              fullName: form.fullName,
            });

      saveAuth(payload.token, payload.user);
      router.push("/dashboard");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading Dial4Inclusion…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Dial4Inclusion
            </p>
            <h1 className="text-lg font-bold text-gray-900">
              Inclusive Service Coordination
            </h1>
          </div>
          <button
            onClick={() => {
              const formEl = document.getElementById("auth-card");
              formEl?.scrollIntoView({ behavior: "smooth" });
            }}
            className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Explore the platform
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="space-y-8">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                Civic tech for disability inclusion
              </span>
              <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                Resolve disability complaints faster with a navigator-first dashboard.
              </h2>
              <p className="text-lg text-gray-600">
                Dial4Inclusion blends USSD reporting, navigator workflows, and real-time
                intelligence so assemblies can protect the rights of persons with disabilities.
              </p>
            </div>

            <ul className="space-y-3 text-gray-700">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
                  <p className="text-base">{item}</p>
                </li>
              ))}
            </ul>

            <div className="grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm uppercase tracking-wide text-gray-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="auth-card"
            className="rounded-3xl border border-gray-200 bg-white/90 p-6 shadow-xl backdrop-blur"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">
                  Sign in to continue
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Access the dashboard
                </h3>
              </div>
              <div className="flex gap-2 rounded-full border border-gray-200 p-1">
                {["login", "register"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setAuthMode(mode as "login" | "register")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                      authMode === mode
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {mode === "login" ? "Sign in" : "Register"}
                  </button>
                ))}
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {authMode === "register" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="mt-1 w-full rounded-2xl border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {authError && (
                <p className="text-sm text-red-600">{authError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {authLoading
                  ? "Connecting…"
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <div className="mt-10 space-y-4 rounded-2xl bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">
                How it works
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {quickSteps.map((step) => (
                  <li key={step.title}>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p>{step.copy}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}


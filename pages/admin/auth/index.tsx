// Business Suite – Unified Auth Page
// Route: /admin/auth  (mirrors /vendor/auth pattern)
// Tabs: Login | Register (both vendor + partner welcome)

import React, { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaCheckCircle,
} from "react-icons/fa";
import { login, register, setToken, setUser, getCurrentUser, RegisterData } from "@/services/auth";

type Tab = "login" | "register";

export default function AdminAuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/admin");
    }
  }, [router]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = await login({ email: loginEmail, password: loginPassword });
      setToken(auth.token);
      setUser(auth.user);
      toast.success(`Welcome back, ${auth.user.name || auth.user.email}!`);
      router.push("/admin");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Business Suite is only for vendors
      const auth = await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        role: "VENDOR",
      });
      setToken(auth.token);
      setUser(auth.user);
      toast.success("Account created! Welcome to the Business Suite.");
      router.push("/admin");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* ── Left panel – branding ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <Link href="/" className="flex items-center gap-3 relative z-10">
          <Image
            src="/logo.png"
            alt="Trend360"
            width={120}
            height={40}
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </Link>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-4">
              For agencies &amp; serious vendors
            </p>
            <h1 className="text-3xl font-bold text-white leading-tight">
              The command centre
              <br />
              your campaigns deserve.
            </h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed max-w-sm">
              Multi-brand management, end-to-end campaign tooling, partner curation, and
              advanced analytics — all in one workspace built to scale.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Manage unlimited brands from one workspace",
              "Create, launch, and approve campaigns end-to-end",
              "Browse, invite, and curate partners for each campaign",
              "Email-first communication with your entire network",
              "Advanced analytics to prove ROI to every stakeholder",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-slate-600 relative z-10">
          © {new Date().getFullYear()} Trend360. All rights reserved.
        </p>
      </div>

      {/* ── Right panel – form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Image
              src="/logo.png"
              alt="Trend360"
              width={100}
              height={32}
              className="h-8 w-auto object-contain"
            />
            <span className="text-sm font-bold text-white">Trend360 Business Suite</span>
          </Link>

          {/* Tab toggle */}
          <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-8 border border-white/8">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === "register"
                  ? "bg-gradient-to-r from-emerald-500/30 to-cyan-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Create account
            </button>
          </div>

          {/* ── LOGIN FORM ── */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white mb-0.5">Welcome back</p>
                <p className="text-xs text-slate-400">
                  Log in with your Trend360 credentials — vendors, partners, and agencies all use the
                  same login.
                </p>
              </div>

              <Field
                id="login-email"
                label="Work email"
                type="email"
                value={loginEmail}
                onChange={setLoginEmail}
                placeholder="you@agency.co"
                icon={FaEnvelope}
              />
              <Field
                id="login-password"
                label="Password"
                type="password"
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="••••••••"
                icon={FaLock}
              />

              <div className="flex justify-end">
                <Link
                  href="/admin/auth/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Forgot password?
                </Link>
              </div>

              <SubmitButton loading={isLoading} label="Log in to Business Suite" />

              <p className="text-xs text-slate-400 text-center">
                No account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Create one free →
                </button>
              </p>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white mb-0.5">Get started free</p>
                <p className="text-xs text-slate-400">
                  Create your Business Suite account to manage brands, campaigns, and partners.
                </p>
              </div>

              <Field
                id="reg-name"
                label="Your name"
                type="text"
                value={regName}
                onChange={setRegName}
                placeholder="Ada at Northbridge Studio"
                icon={FaUser}
              />
              <Field
                id="reg-email"
                label="Work email"
                type="email"
                value={regEmail}
                onChange={setRegEmail}
                placeholder="you@agency.co"
                icon={FaEnvelope}
              />
              <Field
                id="reg-password"
                label="Password"
                type="password"
                value={regPassword}
                onChange={setRegPassword}
                placeholder="Min 6 characters"
                icon={FaLock}
              />

              <SubmitButton loading={isLoading} label="Create Business Suite account" />

              <p className="text-xs text-slate-400 text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Log in →
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ElementType;
}

function Field({ id, label, type, value, onChange, placeholder, icon: Icon }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="h-3.5 w-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
          Please wait…
        </span>
      ) : (
        label
      )}
    </button>
  );
}

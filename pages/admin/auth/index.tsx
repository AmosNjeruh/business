// Business Suite – Unified Auth Page
// Route: /admin/auth  (mirrors /vendor/auth pattern)
// Tabs: Login | Register (both vendor + partner welcome)

import React, { FormEvent, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaPhone,
} from "react-icons/fa";
import {
  login,
  register,
  setToken,
  setUser,
  getCurrentUser,
  RegisterData,
} from "@/services/auth";
import { updateVendorProfile } from "@/services/vendor";
import Navbar from "@/components/landing/Navbar";
import GoogleSignIn from "@/components/auth/GoogleSignIn";

type Tab = "login" | "register";

export default function AdminAuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [isLoading, setIsLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state - Account Information
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register state - Business Information
  const [contactPhone, setContactPhone] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (getCurrentUser()) {
      router.replace("/admin");
    }
  }, [router]);

  // ── Login ─────────────────────────────────────────────────────────────────
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

    // Validation
    const errors: string[] = [];
    if (!regName || !regName.trim()) {
      errors.push("Company/Business name is required");
    }
    if (!regEmail || !regEmail.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      errors.push("Please enter a valid email address");
    }
    if (!regPassword || regPassword.length < 6) {
      errors.push("Password must be at least 6 characters");
    }
    if (!contactPhone || !contactPhone.trim()) {
      errors.push("Phone number is required");
    }

    if (errors.length > 0) {
      toast.error(errors[0]);
      setIsLoading(false);
      return;
    }

    try {
      const isAgent = window.confirm("Are you an Agent or a Marketer?");
      // Step 1: Register the user
      const auth = await register({
        email: regEmail,
        password: regPassword,
        name: regName,
        role: "VENDOR",
        ...(isAgent ? { userTypePreference: "AGENT" } : {}),
      });
      setToken(auth.token);
      setUser(auth.user);

      // Step 2: Update vendor settings with business information
      try {
        await updateVendorProfile({
          contactPhone: contactPhone.trim(),
        });
        toast.success("Account created! Welcome to the Business Suite.");
        router.push("/admin");
      } catch (settingsError: any) {
        console.error("Error saving business information:", settingsError);
        toast.error(
          "Account created, but failed to save business information. You can complete it later."
        );
        router.push("/admin");
      }
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
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      {/* ── Form panel ── */}
      <div className="flex-1 pt-24 flex flex-col justify-center px-6 py-12">
        <div className="w-full max-w-md mx-auto">

          <>
              {/* Tab toggle */}
              <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-8 border border-white/8">
                <button
                  onClick={() => { setTab("login"); }}
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
                      Log in with your Trend360 credentials — vendors, partners, and agencies all use
                      the same login.
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

                 

                  <SubmitButton loading={isLoading} label="Continue →" />

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-950 text-slate-400">Or continue with</span>
                    </div>
                  </div>

                  <GoogleSignIn mode="login" />

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

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 mt-4 mb-2">
                      Account Information
                    </h3>

                    <Field
                      id="reg-name"
                      label="Company/Business Name"
                      type="text"
                      value={regName}
                      onChange={setRegName}
                      placeholder="Enter your business name"
                      icon={FaUser}
                    />
                    <Field
                      id="reg-email"
                      label="Email"
                      type="email"
                      value={regEmail}
                      onChange={setRegEmail}
                      placeholder="you@agency.co"
                      icon={FaEnvelope}
                    />
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="block text-xs font-medium text-slate-300 mb-1.5"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                        <input
                          id="reg-password"
                          type={showPassword ? "text" : "password"}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          minLength={6}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Password must be at least 6 characters
                      </p>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-4 border-t border-white/10 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">
                      Business Information
                    </h3>

                    <Field
                      id="reg-phone"
                      label="Phone Number"
                      type="tel"
                      value={contactPhone}
                      onChange={setContactPhone}
                      placeholder="Enter phone number"
                      icon={FaPhone}
                    />
                  </div>

                  <SubmitButton loading={isLoading} label="Create Business Suite account" />

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-950 text-slate-400">Or continue with</span>
                    </div>
                  </div>

                  <GoogleSignIn mode="signup" />

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
          </>
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

function SubmitButton({
  loading,
  label,
  disabled,
}: {
  loading: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
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

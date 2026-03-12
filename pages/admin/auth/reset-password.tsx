// Business Suite – Reset Password
// Route: /admin/auth/reset-password?token=...

import React, { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { FaLock, FaArrowLeft, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";
import Api from "@/services/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Password strength
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isStrong = hasLength && hasUpper && hasNumber;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!isStrong) {
      toast.error("Please use a stronger password.");
      return;
    }
    setIsLoading(true);
    try {
      await Api.post("/auth/reset-password", { token, password });
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/admin/auth"), 2500);
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Reset failed. The link may have expired.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/admin/auth" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-8 transition-colors">
          <FaArrowLeft className="h-3 w-3" /> Back to login
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-indigo-500/10">
          <div className="mb-6">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center mb-4">
              <FaLock className="h-5 w-5 text-indigo-400" />
            </div>
            <h1 className="text-lg font-bold text-white mb-1">Set new password</h1>
            <p className="text-xs text-slate-400">
              Choose a strong password for your Business Suite account.
            </p>
          </div>

          {done ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
              <FaCheckCircle className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-emerald-300 mb-1">Password updated!</p>
              <p className="text-xs text-slate-400">Redirecting you to login…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                  </button>
                </div>

                {/* Strength indicators */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <Indicator ok={hasLength} label="At least 8 characters" />
                    <Indicator ok={hasUpper} label="Contains uppercase letter" />
                    <Indicator ok={hasNumber} label="Contains a number" />
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className={`w-full pl-9 pr-9 py-2.5 rounded-xl border bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 transition-all
                      ${confirmPassword.length > 0 && password !== confirmPassword
                        ? "border-red-500/40 focus:border-red-400/60 focus:ring-red-400/20"
                        : "border-white/10 focus:border-indigo-400/60 focus:ring-indigo-400/20"
                      }`}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showConfirm ? <FaEyeSlash className="h-3.5 w-3.5" /> : <FaEye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="text-[10px] text-red-400 mt-1">Passwords don't match</p>
                )}
              </div>

              <button type="submit" disabled={isLoading || !isStrong}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2">
                {isLoading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Remember your password?{" "}
          <Link href="/admin/auth" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${ok ? "bg-emerald-400" : "bg-slate-600"}`} />
      <span className={`text-[10px] ${ok ? "text-emerald-400" : "text-slate-500"}`}>{label}</span>
    </div>
  );
}

// Business Suite – Forgot Password
// Route: /admin/auth/forgot-password

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import Api from "@/services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await Api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset link sent! Check your inbox.");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to send reset link. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/admin/auth" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-8">
          <FaArrowLeft className="h-3 w-3" /> Back to login
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl shadow-emerald-500/10">
          <div className="mb-6">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-4">
              <FaEnvelope className="h-5 w-5 text-emerald-400" />
            </div>
            <h1 className="text-lg font-bold text-white mb-1">Reset your password</h1>
            <p className="text-xs text-slate-400">
              Enter your email and we'll send a reset link right away.
            </p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-300 mb-1">Email sent!</p>
              <p className="text-xs text-slate-400">Check your inbox for the password reset link. It expires in 1 hour.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@agency.co"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 transition-all" />
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {isLoading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

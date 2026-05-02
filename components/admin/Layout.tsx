// Business Suite – Admin Dashboard Layout
// Mirrors frontend/components/vendor/Layout.tsx but uses localStorage auth (no NextAuth)

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import SideBar from "./SideBar";
import BusinessAssistantPanel from "./BusinessAssistantPanel";
import { useBusinessAssistant } from "@/contexts/BusinessAssistantContext";
import { checkAuth, getCurrentUser, setUser, setUserTypePreference } from "@/services/auth";
import { getVendorProfile } from "@/services/vendor";
import { getPremiumRuleForPath, type PremiumPageRule } from "@/config/premiumPages";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [premiumRule, setPremiumRule] = useState<PremiumPageRule | null>(null);
  const { aiAssistantOpen, setAiAssistantOpen } = useBusinessAssistant();
  const assistantResizeSkipFirst = useRef(true);
  const [showAgentPrompt, setShowAgentPrompt] = useState(false);
  const [agentPromptSaving, setAgentPromptSaving] = useState(false);
  const [showAgentBioPrompt, setShowAgentBioPrompt] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Please log in to access the Business Suite");
      router.replace("/admin/auth");
      return;
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    const maybePrompt = async () => {
      const user = getCurrentUser();
      if (!user || String(user.role) !== "VENDOR") return;
      const key = `t360:agentPrompted:${user.id}`;
      const eligibleKey = `t360:agentPromptEligible:${user.id}`;
      if (window.localStorage.getItem(key) === "1") return;
      // Only prompt once after signup (eligible flag set by signup flow).
      if (window.localStorage.getItem(eligibleKey) !== "1") return;
      try {
        const fresh = await checkAuth();
        if (cancelled) return;
        if (fresh?.user) setUser(fresh.user);
        setShowAgentPrompt(true);
      } catch {
        setShowAgentPrompt(true);
      }
    };
    maybePrompt();
    return () => {
      cancelled = true;
    };
  }, []);

  // One-time prompt after switching to Agent mode (or registering as Agent): nudge portfolio/bio.
  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.id || String(user.role) !== "VENDOR") return;
    try {
      const pending = sessionStorage.getItem("t360:showAgentBioOnLoad");
      if (pending === user.id) {
        sessionStorage.removeItem("t360:showAgentBioOnLoad");
        const key = `t360:agentBioPromptShown:${user.id}`;
        if (window.localStorage.getItem(key) === "1") return;
        setShowAgentBioPrompt(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const onAgentMode = (e: Event) => {
      const ce = e as CustomEvent<{ userId?: string }>;
      const userId = ce.detail?.userId;
      const u = getCurrentUser();
      if (!userId || u?.id !== userId) return;
      const key = `t360:agentBioPromptShown:${userId}`;
      if (window.localStorage.getItem(key) === "1") return;
      setShowAgentBioPrompt(true);
    };
    window.addEventListener("t360:agent-mode-on", onAgentMode as EventListener);
    return () => window.removeEventListener("t360:agent-mode-on", onAgentMode as EventListener);
  }, []);

  const dismissAgentBioPrompt = (goToPortfolio: boolean) => {
    const user = getCurrentUser();
    if (user?.id) {
      try {
        window.localStorage.setItem(`t360:agentBioPromptShown:${user.id}`, "1");
      } catch {
        // ignore
      }
    }
    setShowAgentBioPrompt(false);
    if (goToPortfolio) {
      router.push("/admin/agents-cabin");
    }
  };

  const decideAgent = async (pref: "VENDOR" | "AGENT") => {
    const user = getCurrentUser();
    if (!user) return;
    const key = `t360:agentPrompted:${user.id}`;
    try {
      setAgentPromptSaving(true);
      const res = await setUserTypePreference(pref);
      if (res?.user) setUser(res.user);
      window.localStorage.setItem(key, "1");
      try {
        window.localStorage.removeItem(`t360:agentPromptEligible:${user.id}`);
      } catch {}
      setShowAgentPrompt(false);
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to save preference");
    } finally {
      setAgentPromptSaving(false);
    }
  };

  useEffect(() => {
    setPremiumRule(getPremiumRuleForPath(router.pathname));
  }, [router.pathname]);

  useEffect(() => {
    let cancelled = false;
    const loadPremium = async () => {
      if (!premiumRule) {
        setIsPremium(true);
        return;
      }
      try {
        const profile = await getVendorProfile();
        if (!cancelled) setIsPremium(!!profile?.isPremium);
      } catch {
        if (!cancelled) setIsPremium(false);
      }
    };
    loadPremium();
    return () => {
      cancelled = true;
    };
  }, [premiumRule]);

  // Recharts / other listeners use resize; flex width changes when the AI column toggles.
  useEffect(() => {
    if (assistantResizeSkipFirst.current) {
      assistantResizeSkipFirst.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 350);
    return () => window.clearTimeout(t);
  }, [aiAssistantOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-12 w-12">
            <div className="h-12 w-12 rounded-full border-2 border-slate-200 dark:border-white/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 animate-spin" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading Business Suite…</p>
        </div>
      </div>
    );
  }

  if (premiumRule && isPremium === false) {
    return (
      <div className="relative h-[100dvh] max-h-[100dvh] min-h-0 w-full min-w-0 max-w-[100vw] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <SideBar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="absolute inset-x-0 bottom-0 left-0 top-16 flex min-h-0 flex-col overflow-hidden sm:left-64 sm:top-20">
          <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch overflow-hidden">
            <main className="min-h-0 min-w-0 max-w-full flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-y-contain">
              <div className="box-border min-h-0 min-w-0 max-w-full w-full p-3 sm:p-4 lg:p-6">
                <div className="mx-auto max-w-3xl rounded-2xl border border-amber-300/60 dark:border-amber-500/30 bg-white dark:bg-slate-900/70 p-6 shadow-sm">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vendor Premium Required</h1>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">{premiumRule.featureName}</span> is a premium feature.
                  </p>
                  {premiumRule.description && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{premiumRule.description}</p>
                  )}
                  <button
                    onClick={() => router.push("/admin/settings?premium=1")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Upgrade in Settings
                  </button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] min-h-0 w-full min-w-0 max-w-[100vw] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <SideBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      {showAgentPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Agent or Marketer
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Choose your mode</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Agent or Marketer mode lets you build a portfolio and get hired.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => decideAgent("VENDOR")}
                disabled={agentPromptSaving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => decideAgent("AGENT")}
                disabled={agentPromptSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 text-xs font-semibold hover:opacity-90 disabled:opacity-60"
              >
                Agent
              </button>
            </div>
          </div>
        </div>
      )}
      {showAgentBioPrompt && (
        <div className="fixed inset-0 z-[62] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
              Hiring profile
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">Stand out to clients</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Add a short bio and skills in your Agents portfolio so other vendors can learn what you do and
              hire you with confidence. You only see this reminder once.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => dismissAgentBioPrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Later
              </button>
              <button
                type="button"
                onClick={() => dismissAgentBioPrompt(true)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 text-xs font-semibold hover:opacity-90"
              >
                Open portfolio
              </button>
            </div>
          </div>
        </div>
      )}
      {/*
        Absolute inset (below fixed header, right of sidebar on sm+) gives a definite height so
        <main> overflow-y-auto works. Flex + fixed siblings was collapsing / growing with content.
      */}
      <div className="absolute inset-x-0 bottom-0 left-0 top-16 flex min-h-0 flex-col overflow-hidden sm:left-64 sm:top-20">
        <div className="flex min-h-0 min-w-0 flex-1 flex-row items-stretch overflow-hidden">
          <main className="min-h-0 min-w-0 max-w-full flex-1 basis-0 overflow-y-auto overflow-x-auto overscroll-y-contain">
            <div className="@container/bus-main box-border min-h-0 min-w-0 max-w-full w-full p-3 sm:p-4 lg:p-6 [&>*]:min-w-0 [&>*]:max-w-full">
              {children}
            </div>
          </main>
          {aiAssistantOpen && (
            <BusinessAssistantPanel
              onClose={() => setAiAssistantOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;

// Business Suite – Admin Dashboard Layout
// Mirrors frontend/components/vendor/Layout.tsx but uses localStorage auth (no NextAuth)

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import SideBar from "./SideBar";
import BusinessAssistantPanel from "./BusinessAssistantPanel";
import { getCurrentUser } from "@/services/auth";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const assistantResizeSkipFirst = useRef(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Please log in to access the Business Suite");
      router.replace("/admin/auth");
      return;
    }
    setIsLoading(false);
  }, [router]);

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

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] min-h-0 w-full min-w-0 max-w-[100vw] overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        aiAssistantOpen={aiAssistantOpen}
        onAiAssistantToggle={() => setAiAssistantOpen((o) => !o)}
      />
      <SideBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      {/*
        Absolute inset (below fixed header, right of sidebar on sm+) gives a definite height so
        <main> overflow-y-auto works. Flex + fixed siblings was collapsing / growing with content.
      */}
      <div className="absolute inset-x-0 bottom-0 left-0 top-16 z-0 flex min-h-0 flex-col overflow-hidden sm:left-64 sm:top-20">
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

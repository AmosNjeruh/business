// Business Suite – Admin Dashboard Layout
// Mirrors frontend/components/vendor/Layout.tsx but uses localStorage auth (no NextAuth)

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "./Header";
import SideBar from "./SideBar";
import { getCurrentUser } from "@/services/auth";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      toast.error("Please log in to access the Business Suite");
      router.replace("/admin/auth");
      return;
    }
    setIsLoading(false);
  }, [router]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <SideBar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      {/* Main content area – offset for fixed header (h-20) and fixed sidebar (w-64) */}
      <div className="sm:ml-64 pt-20 min-h-screen">
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;

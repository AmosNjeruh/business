// Business Suite – Admin Sidebar
// Mirrors frontend/components/vendor/SideBar pattern with full light/dark + API Access link

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  FaTachometerAlt,
  FaBullhorn,
  FaTrophy,
  FaUsers,
  FaFileAlt,
  FaCheckSquare,
  FaEnvelope,
  FaChartBar,
  FaCog,
  FaBuilding,
  FaTimes,
  FaCode,
  FaUserShield,
  FaWallet,
  FaPaperPlane,
  FaRocket,
} from "react-icons/fa";

interface SideBarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const navGroups = [
  {
    label: "Workspace",
    items: [
      { href: "/admin", label: "Overview", icon: FaTachometerAlt },
      { href: "/admin/brands", label: "Brands", icon: FaBuilding },
    ],
  },
  {
    label: "Campaigns",
    items: [
      { href: "/admin/campaigns", label: "Campaigns", icon: FaBullhorn },
      { href: "/admin/challenges", label: "Challenges", icon: FaTrophy },
      { href: "/admin/applications", label: "Applications", icon: FaFileAlt },
      {
        href: "/admin/work-validation",
        label: "Work Validation",
        icon: FaCheckSquare,
      },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/admin/partners", label: "Partners", icon: FaUsers },
      { href: "/admin/messages", label: "Messages", icon: FaEnvelope },
      { href: "/admin/emails", label: "Emails", icon: FaPaperPlane },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: FaChartBar },
      { href: "/admin/finance", label: "Finance", icon: FaWallet },
    ],
  },
  {
    label: "Team",
    items: [
      { href: "/admin/team", label: "Team Management", icon: FaUsers },
      { href: "/admin/team/roles", label: "Roles & Permissions", icon: FaUserShield },
    ],
  },
  {
    label: "Developer",
    items: [
      { href: "/admin/api-access", label: "API Access", icon: FaCode },
    ],
  },
  {
    label: "Trend360 Turbo",
    items: [
      { href: "/admin/agents-cabin", label: "Agents Cabin", icon: FaRocket },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/admin/settings", label: "Settings", icon: FaCog },
    ],
  },
];

const SideBar: React.FC<SideBarProps> = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/admin") return router.pathname === "/admin";
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-full w-64
          bg-white dark:bg-slate-950
          border-r border-slate-200 dark:border-white/8
          flex flex-col pt-16 sm:pt-20 pb-6 overflow-y-auto
          transition-all duration-300
          sm:translate-x-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile close */}
        <button
          className="absolute top-4 right-4 sm:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <FaTimes className="h-4 w-4" />
        </button>

        <nav className="flex-1 px-3 space-y-6 pt-4">
          {navGroups.map((group, index) => (
            <div key={group.label} className={index === 0 ? "mt-2" : ""}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all
                          ${
                            active
                              ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/20"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                          }
                        `}
                      >
                        <Icon
                          className={`h-4 w-4 flex-shrink-0 ${
                            active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                        {label}
                        {active && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom brand */}
        <div className="px-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/3 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">
              Trend360
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Business Suite — agency-grade
              <br />
              campaign infrastructure
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;

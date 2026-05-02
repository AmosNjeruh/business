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
    label: "Agents",
    items: [
      { href: "/admin/agents-cabin", label: "Agents", icon: FaRocket },
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
          bg-white dark:bg-[#0c1221]
          border-r border-slate-200/70 dark:border-slate-700/25
          shadow-[1px_0_8px_rgba(0,0,0,0.04)] dark:shadow-[1px_0_12px_rgba(0,0,0,0.25)]
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

        <nav className="flex-1 px-3 space-y-5 pt-4">
          {navGroups.map((group, index) => (
            <div key={group.label} className={index === 0 ? "mt-1" : ""}>
              <div className="flex items-center gap-2 px-3 mb-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400/70 dark:text-slate-600">
                  {group.label}
                </p>
                <div className="flex-1 h-px bg-slate-200/60 dark:bg-slate-700/30" />
              </div>
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`
                          group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                          ${
                            active
                              ? "bg-emerald-50 dark:bg-emerald-500/[0.09] text-emerald-700 dark:text-emerald-300 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)] dark:shadow-[inset_0_0_0_1px_rgba(52,211,153,0.12)]"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]"
                          }
                        `}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        )}
                        <Icon
                          className={`h-[15px] w-[15px] flex-shrink-0 transition-colors ${
                            active
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          }`}
                        />
                        <span className="flex-1 text-[13px]">{label}</span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70 dark:bg-emerald-400/60" />
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
        <div className="px-3 mt-4">
          <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/30 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-800/10 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                Trend360
              </p>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Business Suite
              <br />
              <span className="text-slate-400/70 dark:text-slate-600">Agency-grade infrastructure</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;
